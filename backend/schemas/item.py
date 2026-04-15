import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class ItemCreate(BaseModel):
    name: str
    sku: str
    description: Optional[str] = None


class ItemUpdate(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    description: Optional[str] = None


class ItemResponse(BaseModel):
    id: uuid.UUID
    name: str
    sku: str
    description: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
