# WebSocket — Robot Event Stream

**Endpoint**: `ws://localhost:8000/ws/robots`
(use `wss://` in TLS-terminated production environments)

The WebSocket stream broadcasts a message every time any robot undergoes a state
transition. It is the primary mechanism for observing the robot simulation in real time.

---

## Connection

No authentication is required. Connect with any standard WebSocket client:

```javascript
// Browser
const ws = new WebSocket('ws://localhost:8000/ws/robots');

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  console.log(msg);
};
```

```python
# Python — websockets library
import asyncio, json, websockets

async def main():
    async with websockets.connect('ws://localhost:8000/ws/robots') as ws:
        async for raw in ws:
            msg = json.loads(raw)
            print(msg)

asyncio.run(main())
```

---

## Message Schema

Every message is a JSON object:

```json
{
  "robot_id":     "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "robot_name":   "Robot-1",
  "from_state":   "IDLE",
  "to_state":     "MOVING_TO_PICK",
  "battery_level": 95.3,
  "task_id":      "a1b2c3d4-0000-0000-0000-000000000001",
  "timestamp":    "2026-04-14T12:00:00.000Z"
}
```

### Field Reference

| Field | Type | Description |
|---|---|---|
| `robot_id` | UUID string | Unique identifier of the robot |
| `robot_name` | string | Human-readable robot label (e.g. `Robot-1`) |
| `from_state` | string | State the robot was in before the transition |
| `to_state` | string | State the robot has entered |
| `battery_level` | float | Battery percentage at the time of transition (0.0–100.0) |
| `task_id` | UUID string or `null` | Currently assigned task, or `null` if no task |
| `timestamp` | ISO 8601 string | UTC time the transition occurred |

### Valid State Values

`IDLE`, `MOVING_TO_PICK`, `PICKING_ITEM`, `PICKED_ITEM`, `MOVING_TO_DROP`,
`DROPPING_ITEM`, `MOVING_TO_CHARGE`, `CHARGING`, `MOVING_TO_REST`, `RESTING`, `ERROR`

---

## Behaviour

- **Broadcast**: every connected client receives every transition message for every robot.
- **No history**: the stream begins from the moment of connection. Past events are not
  replayed on connect.
- **Frequency**: messages are sent as transitions occur. Under normal load with 3 robots
  you can expect several messages per second.
- **Multiple clients**: any number of clients may be connected simultaneously; they all
  receive identical messages.
- **Server-initiated close**: the server does not close the connection proactively. It
  remains open indefinitely.

---

## Reconnection

The server does not send ping/pong frames. If the connection drops (e.g. due to a
container restart or network interruption), the client must reconnect manually.

Recommended pattern:

```javascript
function connect() {
  const ws = new WebSocket('ws://localhost:8000/ws/robots');

  ws.onclose = () => {
    console.warn('WebSocket closed — reconnecting in 3s');
    setTimeout(connect, 3000);
  };

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    // handle msg
  };
}

connect();
```

---

## Testing Notes

- To validate schema, assert that all seven fields (`robot_id`, `robot_name`,
  `from_state`, `to_state`, `battery_level`, `task_id`, `timestamp`) are present in
  every received message.
- To validate state machine correctness, assert that each `(from_state, to_state)` pair
  is a valid edge in the documented state machine graph.
- To test reconnection, close the WebSocket connection deliberately and verify that
  reconnecting receives new messages normally.
- To test multi-client behaviour, open two connections and assert both receive the same
  sequence of messages.
