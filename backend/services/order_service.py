import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException
from config import settings
from models.order import Order, OrderStatus, ShortfallMode
from models.order_line import OrderLine, OrderLineStatus
from models.inventory import Inventory
from models.task import Task, TaskStatus
from schemas.order import OrderCreate
from sse.order_events import publish_order_event


async def create_order(data: OrderCreate, db: AsyncSession) -> Order:
    mode = ShortfallMode(settings.INVENTORY_SHORTFALL_MODE)

    order = Order(
        name=data.name,
        status=OrderStatus.PENDING,
        shortfall_mode=mode,
    )
    db.add(order)
    await db.flush()  # get order.id

    tasks_to_create = []

    for line_data in data.lines:
        # Get available inventory
        result = await db.execute(
            select(Inventory).where(Inventory.item_id == line_data.item_id)
        )
        inv = result.scalar_one_or_none()
        available = inv.quantity if inv else 0
        shortfall = line_data.requested_qty - available

        if shortfall > 0:
            if mode == ShortfallMode.strict:
                raise HTTPException(
                    422,
                    f"Insufficient stock for item {line_data.item_id}. "
                    f"Requested: {line_data.requested_qty}, Available: {available}",
                )
            task_qty = available
        else:
            task_qty = line_data.requested_qty

        line = OrderLine(
            order_id=order.id,
            item_id=line_data.item_id,
            requested_qty=line_data.requested_qty,
            fulfilled_qty=0,
            status=OrderLineStatus.PENDING,
        )
        db.add(line)
        await db.flush()  # get line.id

        if task_qty > 0:
            task = Task(
                order_id=order.id,
                order_line_id=line.id,
                item_id=line_data.item_id,
                quantity=task_qty,
                status=TaskStatus.QUEUED,
            )
            db.add(task)
            tasks_to_create.append(task)
        else:
            # No stock at all — mark line unfulfilled immediately
            line.status = OrderLineStatus.UNFULFILLED

    await db.commit()
    await db.refresh(order)

    await publish_order_event(
        order.id,
        "ORDER_PENDING",
        f"Order '{order.name}' created with {len(tasks_to_create)} tasks",
    )

    # Push tasks to the global task queue
    if tasks_to_create:
        from services.task_queue import enqueue_tasks

        await enqueue_tasks(tasks_to_create)

    return order


async def finalize_order(order_id: uuid.UUID, db: AsyncSession):
    """Called after each task completes. Checks if order is done. BUG 3 lives here."""
    result = await db.execute(select(OrderLine).where(OrderLine.order_id == order_id))
    lines = result.scalars().all()

    all_fulfilled = all(l.status == OrderLineStatus.FULFILLED for l in lines)
    any_fulfilled = any(l.status == OrderLineStatus.FULFILLED for l in lines)
    any_unfulfilled = any(l.status == OrderLineStatus.UNFULFILLED for l in lines)
    any_in_progress = any(l.status == OrderLineStatus.IN_PROGRESS for l in lines)
    any_pending = any(l.status == OrderLineStatus.PENDING for l in lines)

    if any_in_progress or any_pending:
        return  # Order still being worked on

    order = await db.get(Order, order_id)
    if order.status in (OrderStatus.COMPLETE, OrderStatus.FAILED, OrderStatus.PARTIAL):
        return  # Already finalised

    if all_fulfilled:
        order.status = OrderStatus.COMPLETE
        await db.commit()
        await publish_order_event(order_id, "ORDER_COMPLETE", "All items fulfilled")
    elif any_fulfilled and any_unfulfilled:
        # BUG 3: Should be PARTIAL — intentionally set to FAILED
        order.status = OrderStatus.FAILED
        await db.commit()
        await publish_order_event(
            order_id, "ORDER_FAILED", "Order failed (partial fill)"
        )
    else:
        order.status = OrderStatus.FAILED
        await db.commit()
        await publish_order_event(
            order_id, "ORDER_FAILED", "All items failed to fulfil"
        )
