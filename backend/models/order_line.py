import uuid
from enum import Enum
from sqlalchemy import Integer, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


class OrderLineStatus(str, Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    FULFILLED = "FULFILLED"
    UNFULFILLED = "UNFULFILLED"


class OrderLine(Base):
    __tablename__ = "order_lines"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    order_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("orders.id"), nullable=False)
    item_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("items.id"), nullable=False)
    requested_qty: Mapped[int] = mapped_column(Integer, nullable=False)
    fulfilled_qty: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[OrderLineStatus] = mapped_column(
        SAEnum(OrderLineStatus), default=OrderLineStatus.PENDING
    )

    order = relationship("Order", back_populates="lines")
