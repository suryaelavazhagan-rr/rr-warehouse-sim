import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models.robot import Robot, RobotStatus
from schemas.robot import RobotResponse

router = APIRouter(prefix="/api/robots", tags=["robots"])


@router.get("", response_model=list[RobotResponse])
async def list_robots(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Robot).order_by(Robot.name))
    return result.scalars().all()


@router.get("/{robot_id}", response_model=RobotResponse)
async def get_robot(robot_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    robot = await db.get(Robot, robot_id)
    if not robot:
        raise HTTPException(404, "Robot not found")
    return robot


@router.put("/{robot_id}/charge", response_model=RobotResponse)
async def send_to_charge(robot_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    robot = await db.get(Robot, robot_id)
    if not robot:
        raise HTTPException(404, "Robot not found")
    if robot.status not in (RobotStatus.IDLE, RobotStatus.RESTING):
        raise HTTPException(422, "Robot must be IDLE or RESTING to send to charge")
    robot.status = RobotStatus.MOVING_TO_CHARGE
    await db.commit()
    await db.refresh(robot)
    from services.robot_service import signal_charge

    await signal_charge(robot_id)
    return robot


@router.put("/{robot_id}/reset", response_model=RobotResponse)
async def reset_robot(robot_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    robot = await db.get(Robot, robot_id)
    if not robot:
        raise HTTPException(404, "Robot not found")
    if robot.status != RobotStatus.ERROR:
        raise HTTPException(422, "Only ERROR robots can be reset")
    robot.status = RobotStatus.IDLE
    robot.current_task_id = None
    await db.commit()
    await db.refresh(robot)
    from services.robot_service import signal_reset

    await signal_reset(robot_id)
    return robot
