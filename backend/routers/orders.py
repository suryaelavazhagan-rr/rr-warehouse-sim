import asyncio
import json
import uuid
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from database import get_db
from models.order import Order, OrderStatus
from schemas.order import OrderCreate, OrderResponse
from services.order_service import create_order
from sse.order_events import get_or_create_queue

router = APIRouter(prefix="/api/orders", tags=["orders"])


@router.get("", response_model=list[OrderResponse])
async def list_orders(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Order).order_by(Order.created_at.desc()))
    return result.scalars().all()


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(order_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Order).options(selectinload(Order.lines)).where(Order.id == order_id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(404, "Order not found")
    return order


@router.post("", response_model=OrderResponse, status_code=201)
async def create_order_endpoint(data: OrderCreate, db: AsyncSession = Depends(get_db)):
    return await create_order(data, db)


@router.put("/{order_id}/cancel", response_model=OrderResponse)
async def cancel_order(order_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    order = await db.get(Order, order_id)
    if not order:
        raise HTTPException(404, "Order not found")
    if order.status != OrderStatus.PENDING:
        raise HTTPException(422, "Only PENDING orders can be cancelled")
    order.status = OrderStatus.FAILED
    await db.commit()
    await db.refresh(order)
    return order


@router.get("/{order_id}/events")
async def stream_order_events(order_id: uuid.UUID):
    queue = get_or_create_queue(str(order_id))

    async def event_generator():
        while True:
            try:
                event = await asyncio.wait_for(queue.get(), timeout=30.0)
                yield f"data: {json.dumps(event)}\n\n"
                if event["event_type"] in ("ORDER_COMPLETE", "ORDER_FAILED"):
                    break
            except asyncio.TimeoutError:
                yield ": keepalive\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
