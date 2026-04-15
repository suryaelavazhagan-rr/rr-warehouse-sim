import asyncio
import random
import uuid
from datetime import datetime, timezone
from typing import Dict

from database import AsyncSessionLocal
from models.robot import Robot, RobotStatus
from models.task import Task, TaskStatus
from models.order_line import OrderLine, OrderLineStatus
from config import settings
from websocket.manager import manager
from sse.order_events import publish_order_event
from services.task_queue import get_next_task, queue_size

# Per-robot operator override signals
_charge_signals: Dict[str, asyncio.Event] = {}
_reset_signals: Dict[str, asyncio.Event] = {}

# Simulation timing constants (seconds)
PICK_TIME = 2.0
DROP_TIME = 1.5
CHARGE_RATE = 1.0  # % per 10 seconds
TRAVEL_MIN = 2.0
TRAVEL_MAX = 4.0


async def signal_charge(robot_id: uuid.UUID):
    key = str(robot_id)
    if key not in _charge_signals:
        _charge_signals[key] = asyncio.Event()
    _charge_signals[key].set()


async def signal_reset(robot_id: uuid.UUID):
    key = str(robot_id)
    if key not in _reset_signals:
        _reset_signals[key] = asyncio.Event()
    _reset_signals[key].set()


async def _broadcast_transition(robot: Robot, from_state: RobotStatus, task_id=None):
    await manager.broadcast(
        {
            "robot_id": str(robot.id),
            "robot_name": robot.name,
            "from_state": from_state.value,
            "to_state": robot.status.value,
            "battery_level": round(robot.battery_level, 3),
            "task_id": str(task_id) if task_id else None,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    )


async def _transition(robot_id: uuid.UUID, new_status: RobotStatus, task_id=None):
    async with AsyncSessionLocal() as db:
        robot = await db.get(Robot, robot_id)
        old_status = robot.status
        robot.status = new_status
        await db.commit()
        await db.refresh(robot)
        await _broadcast_transition(robot, old_status, task_id)


async def _simulate_travel():
    """Simulate robot travel time between positions."""
    normal_time = random.uniform(TRAVEL_MIN, TRAVEL_MAX)
    if random.random() < 0.20:
        await asyncio.sleep(normal_time * random.uniform(3, 5))
    else:
        await asyncio.sleep(normal_time)


async def _go_to_charge(robot_id: uuid.UUID):
    await _transition(robot_id, RobotStatus.MOVING_TO_CHARGE)
    await asyncio.sleep(random.uniform(TRAVEL_MIN, TRAVEL_MAX))
    await _transition(robot_id, RobotStatus.CHARGING)

    while True:
        await asyncio.sleep(10)
        async with AsyncSessionLocal() as db:
            robot = await db.get(Robot, robot_id)
            if robot.status != RobotStatus.CHARGING:
                return
            new_level = min(100.0, robot.battery_level + CHARGE_RATE)
            robot.battery_level = new_level
            old_status = robot.status
            if new_level >= 100.0:
                robot.status = RobotStatus.IDLE
            await db.commit()
            await db.refresh(robot)
            await _broadcast_transition(robot, old_status)
            if new_level >= 100.0:
                return


async def _go_to_rest(robot_id: uuid.UUID):
    await _transition(robot_id, RobotStatus.MOVING_TO_REST)
    await asyncio.sleep(random.uniform(1, 3))
    await _transition(robot_id, RobotStatus.RESTING)


async def _check_battery_and_route(robot_id: uuid.UUID):
    """Route robot after completing a task — charge if needed, rest if queue is empty."""
    async with AsyncSessionLocal() as db:
        robot = await db.get(Robot, robot_id)
        battery = robot.battery_level
        threshold = settings.BATTERY_CHARGE_THRESHOLD

        should_charge = (battery < threshold) or (
            battery % threshold < 2.0 and battery < 99.0
        )

    if should_charge:
        await _go_to_charge(robot_id)
    elif queue_size() == 0:
        await _go_to_rest(robot_id)
    # else: fall through — run_robot loop will pick up next task immediately


async def run_robot(robot_id: uuid.UUID):
    """
    Main per-robot simulation loop. Runs as an asyncio background task.
    Waits for tasks from the FIFO queue, executes full pick-and-drop cycle,
    then routes to charge/rest/next-task based on battery.
    """
    key = str(robot_id)
    _charge_signals[key] = asyncio.Event()
    _reset_signals[key] = asyncio.Event()

    while True:
        # Check for operator charge signal
        if _charge_signals[key].is_set():
            _charge_signals[key].clear()
            await _go_to_charge(robot_id)
            continue

        # Set robot to IDLE and wait for next task
        await _transition(robot_id, RobotStatus.IDLE)

        # Wait for either a task or a charge signal
        task_coro = asyncio.ensure_future(get_next_task())
        charge_wait = asyncio.ensure_future(_charge_signals[key].wait())

        done, pending = await asyncio.wait(
            [task_coro, charge_wait],
            return_when=asyncio.FIRST_COMPLETED,
        )
        for p in pending:
            p.cancel()
            try:
                await p
            except asyncio.CancelledError:
                pass

        if _charge_signals[key].is_set():
            _charge_signals[key].clear()
            task_coro.cancel()
            await _go_to_charge(robot_id)
            continue

        task_data = task_coro.result()
        task_id = uuid.UUID(task_data["task_id"])
        order_id = uuid.UUID(task_data["order_id"])
        order_line_id = uuid.UUID(task_data["order_line_id"])

        # Assign robot to task
        async with AsyncSessionLocal() as db:
            task = await db.get(Task, task_id)
            task.status = TaskStatus.IN_PROGRESS
            task.assigned_robot_id = robot_id
            robot = await db.get(Robot, robot_id)
            robot.current_task_id = task_id
            await db.commit()

            line = await db.get(OrderLine, order_line_id)
            line.status = OrderLineStatus.IN_PROGRESS
            # Update order status to PICKING
            from models.order import Order, OrderStatus

            order = await db.get(Order, order_id)
            if order.status == OrderStatus.PENDING:
                order.status = OrderStatus.PICKING
            await db.commit()

        await publish_order_event(
            order_id, "TASK_STARTED", "Robot assigned to task", order_line_id, task_id
        )

        # Execute: MOVING_TO_PICK → PICKING_ITEM → PICKED_ITEM → MOVING_TO_DROP → DROPPING_ITEM
        await _transition(robot_id, RobotStatus.MOVING_TO_PICK, task_id)
        await _simulate_travel()

        await _transition(robot_id, RobotStatus.PICKING_ITEM, task_id)
        await asyncio.sleep(PICK_TIME)

        await _transition(robot_id, RobotStatus.PICKED_ITEM, task_id)
        await _transition(robot_id, RobotStatus.MOVING_TO_DROP, task_id)
        await _simulate_travel()

        await _transition(robot_id, RobotStatus.DROPPING_ITEM, task_id)
        await asyncio.sleep(DROP_TIME)

        # Mark task complete
        async with AsyncSessionLocal() as db:
            task = await db.get(Task, task_id)
            task.status = TaskStatus.COMPLETE
            robot = await db.get(Robot, robot_id)
            robot.current_task_id = None
            line = await db.get(OrderLine, order_line_id)
            line.status = OrderLineStatus.FULFILLED
            line.fulfilled_qty = task.quantity
            await db.commit()

        await publish_order_event(
            order_id,
            "TASK_COMPLETE",
            f"Task complete — {task_data['quantity']} unit(s) delivered",
            order_line_id,
            task_id,
        )

        # Check if the whole order is done
        async with AsyncSessionLocal() as db:
            from services.order_service import finalize_order

            await finalize_order(order_id, db)

        # Battery routing after task
        await _check_battery_and_route(robot_id)


async def drain_battery(robot_id: uuid.UUID):
    """
    Drains battery at BATTERY_DRAIN_RATE% every 5 minutes.
    Only drains when robot is in an active working state.
    Emits a WebSocket event after each drain so clients see battery updates.
    """
    inactive_states = {RobotStatus.RESTING, RobotStatus.CHARGING, RobotStatus.ERROR}
    drain_interval = 300  # 5 minutes in seconds

    while True:
        await asyncio.sleep(drain_interval)
        async with AsyncSessionLocal() as db:
            robot = await db.get(Robot, robot_id)
            if robot and robot.status not in inactive_states:
                old_status = robot.status
                robot.battery_level = max(
                    0.0, robot.battery_level - settings.BATTERY_DRAIN_RATE
                )
                await db.commit()
                await db.refresh(robot)
                await _broadcast_transition(robot, old_status)


async def start_robots():
    """
    Called during app lifespan startup.
    Creates robots in DB (if none exist) and launches simulation loops.
    """
    from sqlalchemy import select

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Robot))
        existing = result.scalars().all()

        if not existing:
            for i in range(1, settings.ROBOT_COUNT + 1):
                robot = Robot(
                    name=f"Robot-{i}",
                    battery_level=100.0,
                    status=RobotStatus.IDLE,
                )
                db.add(robot)
            await db.commit()
            result = await db.execute(select(Robot))
            existing = result.scalars().all()

    for robot in existing:
        asyncio.create_task(run_robot(robot.id))
        asyncio.create_task(drain_battery(robot.id))

    print(f"[robots] Started {len(existing)} robot simulation loop(s)")
