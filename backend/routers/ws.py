from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from websocket.manager import manager

router = APIRouter()


@router.websocket("/ws/robots")
async def robot_websocket(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Backend pushes; client just keeps connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        await manager.disconnect(websocket)
    except Exception:
        await manager.disconnect(websocket)
