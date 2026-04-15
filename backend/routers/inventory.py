import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models.inventory import Inventory
from schemas.inventory import InventoryCreate, InventoryUpdate, InventoryResponse

router = APIRouter(prefix="/api/inventory", tags=["inventory"])


@router.get("", response_model=list[InventoryResponse])
async def list_inventory(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Inventory))
    return result.scalars().all()


@router.get("/{inv_id}", response_model=InventoryResponse)
async def get_inventory(inv_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    inv = await db.get(Inventory, inv_id)
    if not inv:
        raise HTTPException(404, "Inventory record not found")
    return inv


@router.post("", response_model=InventoryResponse, status_code=201)
async def create_inventory(data: InventoryCreate, db: AsyncSession = Depends(get_db)):
    inv = Inventory(**data.model_dump())
    db.add(inv)
    await db.commit()
    await db.refresh(inv)
    return inv


@router.put("/{inv_id}", response_model=InventoryResponse)
async def update_inventory(
    inv_id: uuid.UUID, data: InventoryUpdate, db: AsyncSession = Depends(get_db)
):
    inv = await db.get(Inventory, inv_id)
    if not inv:
        raise HTTPException(404, "Inventory record not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(inv, field, value)
    await db.commit()
    await db.refresh(inv)
    return inv
