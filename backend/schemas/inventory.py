import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class InventoryCreate(BaseModel):
    item_id: uuid.UUID
    quantity: int
    location: str  # required in schema — Bug 2 is frontend-only (shows as optional)


class InventoryUpdate(BaseModel):
    quantity: Optional[int] = None
    location: Optional[str] = None


class InventoryResponse(BaseModel):
    id: uuid.UUID
    item_id: uuid.UUID
    quantity: int
    location: str
    updated_at: datetime

    model_config = {"from_attributes": True}
