import asyncio
import uuid
from datetime import datetime, timezone
from typing import Dict


# Per-order asyncio Queues for SSE streaming
_order_queues: Dict[str, asyncio.Queue] = {}


def get_or_create_queue(order_id: str) -> asyncio.Queue:
    if order_id not in _order_queues:
        _order_queues[order_id] = asyncio.Queue()
    return _order_queues[order_id]


async def publish_order_event(
    order_id: uuid.UUID,
    event_type: str,
    detail: str,
    order_line_id=None,
    task_id=None,
):
    queue = get_or_create_queue(str(order_id))
    await queue.put(
        {
            "order_id": str(order_id),
            "order_line_id": str(order_line_id) if order_line_id else None,
            "task_id": str(task_id) if task_id else None,
            "event_type": event_type,
            "detail": detail,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    )
