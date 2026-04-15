# Tasks API

Base path: `/api/tasks`

Tasks are the atomic units of work that robots execute. Each task corresponds to one
order line and instructs a robot to pick a specific quantity of an item and deliver it.
Tasks are created automatically by the order system when an order is submitted — they
cannot be created or deleted via the API.

---

## Endpoints

### `GET /api/tasks`

List all tasks in the system.

**Request**: no parameters.

**Response `200 OK`**

```json
[
  {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "order_id": "a1b2c3d4-0000-0000-0000-000000000001",
    "order_line_id": "a1b2c3d4-0000-0000-0000-000000000002",
    "item_id": "a1b2c3d4-0000-0000-0000-000000000003",
    "quantity": 5,
    "robot_id": "a1b2c3d4-0000-0000-0000-000000000004",
    "status": "IN_PROGRESS",
    "created_at": "2026-04-14T10:00:00.000Z",
    "updated_at": "2026-04-14T10:00:15.000Z"
  }
]
```

Returns an empty array `[]` when no tasks exist.

---

### `GET /api/tasks/{id}`

Get a single task by its UUID.

**Path parameter**: `id` — UUID of the task.

**Response `200 OK`**: single task object (same schema as list entry above).

**Error responses**

| Status | Condition |
|---|---|
| `404 Not Found` | No task with the given `id` |
| `422 Unprocessable Entity` | `id` is not a valid UUID |

---

## Task Object Schema

```json
{
  "id":            "uuid",
  "order_id":      "uuid — references the parent order",
  "order_line_id": "uuid — references the specific order line",
  "item_id":       "uuid — item to be picked",
  "quantity":      "integer — number of units to pick",
  "robot_id":      "uuid or null — assigned robot (null if still QUEUED)",
  "status":        "QUEUED | IN_PROGRESS | COMPLETE | FAILED",
  "created_at":    "ISO8601 timestamp",
  "updated_at":    "ISO8601 timestamp"
}
```

---

## Task Statuses

| Status | Description |
|---|---|
| `QUEUED` | Waiting for an available robot; `robot_id` is `null` |
| `IN_PROGRESS` | Assigned to a robot currently executing the pick-and-drop cycle; `robot_id` is set |
| `COMPLETE` | Robot delivered the item; inventory decremented |
| `FAILED` | Robot entered `ERROR` state mid-task; task could not complete |

---

## Task Lifecycle

```
Order created
    │
    ▼
Task: QUEUED (robot_id = null)
    │
    ▼  (simulation assigns next available IDLE robot)
Task: IN_PROGRESS (robot_id = <uuid>)
    │
    ├─► COMPLETE   (robot successfully dropped item)
    └─► FAILED     (robot hit ERROR state during execution)
```

### Relationship to Order Lines

When a task reaches `COMPLETE`:
- The parent `order_line` status advances to `FULFILLED`
- Inventory quantity is decremented

When all lines of an order are resolved (either `FULFILLED` or `UNFULFILLED`),
the order transitions to its terminal status (`COMPLETE`, `PARTIAL`, or `FAILED`).

---

## Notes

- Tasks are dispatched to robots in FIFO order (by `created_at`).
- A failed task does **not** automatically retry. The order line will remain
  `IN_PROGRESS` until the robot is reset and the simulation re-evaluates.
- Use the `order_id` and `order_line_id` fields to correlate tasks back to their
  parent objects.
