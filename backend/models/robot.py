import uuid
from datetime import datetime
from enum import Enum
from sqlalchemy import String, Float, DateTime, ForeignKey, Enum as SAEnum, func
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


class RobotStatus(str, Enum):
    IDLE = "IDLE"
    MOVING_TO_PICK = "MOVING_TO_PICK"
    PICKING_ITEM = "PICKING_ITEM"
    PICKED_ITEM = "PICKED_ITEM"
    MOVING_TO_DROP = "MOVING_TO_DROP"
    DROPPING_ITEM = "DROPPING_ITEM"
    MOVING_TO_CHARGE = "MOVING_TO_CHARGE"
    CHARGING = "CHARGING"
    MOVING_TO_REST = "MOVING_TO_REST"
    RESTING = "RESTING"
    ERROR = "ERROR"


class Robot(Base):
    __tablename__ = "robots"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    battery_level: Mapped[float] = mapped_column(Float, default=100.0)
    status: Mapped[RobotStatus] = mapped_column(
        SAEnum(RobotStatus), default=RobotStatus.IDLE
    )
    current_task_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("tasks.id", use_alter=True, name="fk_robot_current_task"),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
