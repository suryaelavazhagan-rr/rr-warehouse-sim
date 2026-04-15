import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from models.robot import RobotStatus


class RobotResponse(BaseModel):
    id: uuid.UUID
    name: str
    battery_level: float
    status: RobotStatus
    current_task_id: Optional[uuid.UUID]
    created_at: datetime

    model_config = {"from_attributes": True}
