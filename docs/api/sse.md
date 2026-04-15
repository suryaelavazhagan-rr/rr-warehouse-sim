# SSE — Per-Order Event Stream

**Endpoint**: `http://localhost:8000/api/orders/{order_id}/events`

This endpoint implements the W3C Server-Sent Events (SSE) specification
(`text/event-stream`). It streams lifecycle events for a specific order from creation
through to its terminal state.

---

## Connection

Connect using the browser's native `EventSource` API or any SSE-capable HTTP client:

```javascript
// Browser
const source = new EventSource(`http://localhost:8000/api/orders/${orderId}/events`);

source.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(data);
};

source.onerror = (err) => {
  console.error('SSE error', err);
};
```

```python
# Python — sseclient-py or httpx with stream
import httpx, json

with httpx.Client() as client:
    with client.stream('GET', f'http://localhost:8000/api/orders/{order_id}/events') as r:
        for line in r.iter_lines():
            if line.startswith('data:'):
                data = json.loads(line[5:].strip())
                print(data)
```

---

## Event Schema

Every event payload is a JSON object sent as the `data` field of the SSE frame:

```json
{
  "order_id":      "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "order_line_id": "a1b2c3d4-0000-0000-0000-000000000001",
  "task_id":       "a1b2c3d4-0000-0000-0000-000000000002",
  "event_type":    "LINE_FULFILLED",
  "detail":        "Line for Widget A fulfilled: 5/5 units picked",
  "timestamp":     "2026-04-14T12:05:30.000Z"
}
```

### Field Reference

| Field | Type | Description |
|---|---|---|
| `order_id` | UUID string | The order this event belongs to |
| `order_line_id` | UUID string or `null` | Affected order line (null for order-level events) |
| `task_id` | UUID string or `null` | Causative task (null for order-level events) |
| `event_type` | string | One of the event types below |
| `detail` | string | Human-readable description of the event |
| `timestamp` | ISO 8601 string | UTC time the event was generated |

---

## Event Types

| `event_type` | Trigger | Terminal? |
|---|---|---|
| `ORDER_CREATED` | Order successfully created | No |
| `LINE_ASSIGNED` | A robot has been assigned a task for an order line | No |
| `LINE_FULFILLED` | A task completed successfully; line fully picked | No |
| `ORDER_COMPLETE` | All lines fulfilled; order is `COMPLETE` | ✅ Yes |
| `ORDER_FAILED` | All tasks failed; no lines fulfilled; order is `FAILED` | ✅ Yes |
| `ORDER_PARTIAL` | Picking finished; some lines `UNFULFILLED`; order is `PARTIAL` | ✅ Yes |
| `ORDER_CANCELLED` | Order was cancelled via `PUT /api/orders/{id}/cancel` | ✅ Yes |

---

## Stream Lifecycle

1. Client connects to `/api/orders/{id}/events`.
2. Server immediately emits `ORDER_CREATED` (or the current state if connecting after
   creation).
3. As the simulation progresses, the server emits `LINE_ASSIGNED` and `LINE_FULFILLED`
   events in real time.
4. When the order reaches a terminal state, the server emits the corresponding terminal
   event (`ORDER_COMPLETE`, `ORDER_FAILED`, `ORDER_PARTIAL`, or `ORDER_CANCELLED`) and
   then **closes the SSE stream**.
5. The `EventSource` object fires `onerror` after the server closes; this is normal
   and expected — it does not indicate a failure.

```
CLIENT connects
    │
    ◄── ORDER_CREATED
    ◄── LINE_ASSIGNED  (repeated per line as robots pick them up)
    ◄── LINE_FULFILLED (repeated per line as tasks complete)
    │
    ◄── ORDER_COMPLETE / ORDER_PARTIAL / ORDER_FAILED / ORDER_CANCELLED
    │
 (stream closed by server)
```

---

## Error Responses

| Condition | Behaviour |
|---|---|
| `order_id` does not exist | HTTP `404` before the stream is opened |
| Order already in terminal state at connect time | Server emits the terminal event immediately and closes the stream |

---

## Testing Notes

- **Subscribe before creating the order** where possible to capture the `ORDER_CREATED`
  event; or subscribe immediately after creation.
- Assert that events arrive in logical order: `ORDER_CREATED` → `LINE_ASSIGNED` →
  `LINE_FULFILLED` → terminal event.
- Assert `event_type` values are from the documented enum — no undocumented event types
  should appear.
- Assert the stream closes after a terminal event (the `EventSource` should enter
  `readyState = 2` / `CLOSED`).
- Test `ORDER_CANCELLED` by subscribing to a `PENDING` order's stream and then calling
  the cancel endpoint in a separate request.
- Test subscribing to a non-existent `order_id` and verify the HTTP `404` response.
