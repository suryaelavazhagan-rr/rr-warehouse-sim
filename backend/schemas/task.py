import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from models.task import TaskStatus


class TaskResponse(BaseModel):
    id: uuid.UUID
    order_id: uuid.UUID
    order_line_id: uuid.UUID
    item_id: uuid.UUID
    quantity: int
    assigned_robot_id: Optional[uuid.UUID]
    status: TaskStatus
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
