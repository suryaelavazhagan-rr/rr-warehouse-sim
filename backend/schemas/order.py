import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from models.order import OrderStatus, ShortfallMode
from models.order_line import OrderLineStatus


class OrderLineCreate(BaseModel):
    item_id: uuid.UUID
    requested_qty: int


class OrderCreate(BaseModel):
    name: str
    lines: List[OrderLineCreate]


class OrderLineResponse(BaseModel):
    id: uuid.UUID
    order_id: uuid.UUID
    item_id: uuid.UUID
    requested_qty: int
    fulfilled_qty: int
    status: OrderLineStatus

    model_config = {"from_attributes": True}


class OrderResponse(BaseModel):
    id: uuid.UUID
    name: str
    status: OrderStatus
    shortfall_mode: ShortfallMode
    created_at: datetime
    updated_at: datetime
    lines: Optional[List[OrderLineResponse]] = None

    model_config = {"from_attributes": True}
