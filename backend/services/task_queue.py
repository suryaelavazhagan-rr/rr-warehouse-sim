import asyncio
from typing import List


# Global FIFO task queue
_queue: asyncio.Queue = asyncio.Queue()


async def enqueue_tasks(tasks: List) -> None:
    """Push tasks onto the FIFO queue. Called by order_service after order creation."""
    for task in tasks:
        await _queue.put(
            {
                "task_id": str(task.id),
                "order_id": str(task.order_id),
                "order_line_id": str(task.order_line_id),
                "item_id": str(task.item_id),
                "quantity": task.quantity,
            }
        )


async def get_next_task() -> dict:
    """Blocks until a task is available. Called by robot worker loops."""
    return await _queue.get()


def queue_size() -> int:
    return _queue.qsize()
