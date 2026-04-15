# Robots API

Base path: `/api/robots`

Provides read access to the robot fleet and allows operators to manually trigger
charging or reset robots that have entered an error state.

Robots are created automatically at system startup based on the `ROBOT_COUNT`
environment variable. They cannot be created or deleted via the API.

---

## Robot State Machine

```
IDLE
 └─► MOVING_TO_PICK
       └─► PICKING_ITEM
             └─► PICKED_ITEM
                   └─► MOVING_TO_DROP
                         └─► DROPPING_ITEM
                               ├─► MOVING_TO_CHARGE ─► CHARGING ─► IDLE
                               └─► MOVING_TO_REST   ─► RESTING  ─► IDLE

Any active state ─► ERROR   (random fault injection by simulation)
ERROR            ─► IDLE    (via PUT /api/robots/{id}/reset)
IDLE or RESTING  ─► MOVING_TO_CHARGE (via PUT /api/robots/{id}/charge, or automatic
                                       when battery < BATTERY_CHARGE_THRESHOLD)
```

---

## Endpoints

### `GET /api/robots`

List all robots in the fleet.

**Request**: no parameters.

**Response `200 OK`**

```json
[
  {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "name": "Robot-1",
    "battery_level": 87.4,
    "status": "IDLE",
    "current_task_id": null,
    "created_at": "2026-04-14T09:00:00.000Z"
  }
]
```

The array always contains exactly `ROBOT_COUNT` entries.

---

### `GET /api/robots/{id}`

Get a single robot by its UUID.

**Path parameter**: `id` — UUID of the robot.

**Response `200 OK`**: single robot object (same schema as list entry above).

**Error responses**

| Status | Condition |
|---|---|
| `404 Not Found` | No robot with the given `id` |
| `422 Unprocessable Entity` | `id` is not a valid UUID |

---

### `PUT /api/robots/{id}/charge`

Instruct a robot to proceed to a charging station. The robot must currently be `IDLE`
or `RESTING`. If the robot is in any other state this call is rejected.

**Path parameter**: `id` — UUID of the robot.

**Request body**: none.

**Response `200 OK`**: updated robot object. The `status` field will reflect
`MOVING_TO_CHARGE` (transition happens asynchronously — the simulation loop processes
it on its next tick).

**Error responses**

| Status | Condition |
|---|---|
| `404 Not Found` | No robot with the given `id` |
| `422 Unprocessable Entity` | Robot is not in `IDLE` or `RESTING` state |

---

### `PUT /api/robots/{id}/reset`

Reset a robot that is stuck in `ERROR` state back to `IDLE` so it can resume accepting
tasks.

**Path parameter**: `id` — UUID of the robot.

**Request body**: none.

**Response `200 OK`**: updated robot object with `status: "IDLE"`.

**Error responses**

| Status | Condition |
|---|---|
| `404 Not Found` | No robot with the given `id` |
| `422 Unprocessable Entity` | Robot is not in `ERROR` state |

---

## Robot Object Schema

```json
{
  "id":              "uuid",
  "name":            "string — e.g. Robot-1",
  "battery_level":   "float — 0.0 to 100.0",
  "status":          "see statuses below",
  "current_task_id": "uuid or null",
  "created_at":      "ISO8601 timestamp"
}
```

---

## Robot Statuses

| Status | Description |
|---|---|
| `IDLE` | Available for task assignment |
| `MOVING_TO_PICK` | Travelling to item pick location |
| `PICKING_ITEM` | Actively picking the item |
| `PICKED_ITEM` | Item secured; about to move to drop location |
| `MOVING_TO_DROP` | Travelling to drop location |
| `DROPPING_ITEM` | Depositing item at drop location |
| `MOVING_TO_CHARGE` | Travelling to charging station |
| `CHARGING` | Battery recharging at station |
| `MOVING_TO_REST` | Travelling to rest position (no pending tasks) |
| `RESTING` | Idle at rest position; no pending tasks |
| `ERROR` | Fault condition — robot requires manual reset |

---

## Notes

- `battery_level` is a float between `0.0` and `100.0`.
- Battery drains only while a robot is in an active working state
  (`MOVING_TO_PICK` through `DROPPING_ITEM`).
- When `battery_level` drops below `BATTERY_CHARGE_THRESHOLD`, the robot will
  automatically queue for charging after completing its current drop — it will not
  abandon a task mid-execution.
- All robot state transitions are broadcast over the WebSocket stream at
  `ws://localhost:8000/ws/robots`. See [websocket.md](websocket.md).
