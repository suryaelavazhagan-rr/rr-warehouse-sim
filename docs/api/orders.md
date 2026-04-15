# Orders API

Base path: `/api/orders`

Manages customer orders. An order contains one or more **order lines**, each requesting
a quantity of a specific item. On creation, the system evaluates stock availability and
creates **tasks** for the robot fleet based on the active `INVENTORY_SHORTFALL_MODE`.

---

## Shortfall Mode Behaviour

The `INVENTORY_SHORTFALL_MODE` environment variable controls what happens when requested
quantity exceeds available stock:

| Mode | Behaviour |
|---|---|
| `strict` | Any line with insufficient stock causes the entire order to be rejected with `422`. No tasks are created. |
| `partial` | Tasks are created for available quantity only. Lines that cannot be fulfilled are marked `UNFULFILLED`. Order reaches `PARTIAL` status. |
| `backorder` | Tasks are created for available quantity. The unfulfilled remainder is queued as a backorder and fulfilled when new stock arrives. |

---

## Endpoints

### `GET /api/orders`

List all orders.

**Request**: no parameters.

**Response `200 OK`**

```json
[
  {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "name": "Order-001",
    "status": "PICKING",
    "shortfall_mode": "partial",
    "created_at": "2026-04-14T10:00:00.000Z",
    "updated_at": "2026-04-14T10:00:05.000Z"
  }
]
```

---

### `POST /api/orders`

Create a new order.

**Request body** (`application/json`)

| Field | Type | Required | Constraints |
|---|---|---|---|
| `name` | string | ✅ | Free text order label |
| `lines` | array | ✅ | At least one line required |
| `lines[].item_id` | UUID string | ✅ | Must reference an existing item |
| `lines[].requested_qty` | integer | ✅ | Must be > 0 |

```json
{
  "name": "Order-001",
  "lines": [
    { "item_id": "a1b2c3d4-0000-0000-0000-000000000001", "requested_qty": 5 },
    { "item_id": "a1b2c3d4-0000-0000-0000-000000000002", "requested_qty": 2 }
  ]
}
```

**Response `201 Created`**: the created order object with all lines embedded
(see Order Detail Schema below).

**Error responses**

| Status | Condition |
|---|---|
| `422 Unprocessable Entity` | Missing or invalid fields |
| `422 Unprocessable Entity` | `INVENTORY_SHORTFALL_MODE=strict` and any line has insufficient stock |
| `404 Not Found` | An `item_id` in a line does not exist |

---

### `GET /api/orders/{id}`

Get a single order with all its lines and current status.

**Path parameter**: `id` — UUID of the order.

**Response `200 OK`**: full order detail object (see schema below).

**Error responses**

| Status | Condition |
|---|---|
| `404 Not Found` | No order with the given `id` |

---

### `PUT /api/orders/{id}/cancel`

Cancel an order. Only orders in `PENDING` or `PICKING` status can be cancelled.

**Path parameter**: `id` — UUID of the order.

**Request body**: none required.

**Response `200 OK`**: updated order object with `status: "CANCELLED"`.

**Error responses**

| Status | Condition |
|---|---|
| `404 Not Found` | No order with the given `id` |
| `422 Unprocessable Entity` | Order is in a terminal state (`COMPLETE`, `PARTIAL`, `FAILED`, `CANCELLED`) |

---

### `GET /api/orders/{id}/events`

Subscribe to a live event stream for a specific order.

**Content-Type**: `text/event-stream` (Server-Sent Events)

See [sse.md](sse.md) for full documentation of this endpoint.

---

## Order Statuses

| Status | Description |
|---|---|
| `PENDING` | Order created; waiting for a robot to pick up the first task |
| `PICKING` | At least one task is currently in progress |
| `COMPLETE` | All lines fully fulfilled |
| `PARTIAL` | Picking complete; some lines were `UNFULFILLED` (partial mode only) |
| `FAILED` | All tasks failed without fulfilling any lines |
| `CANCELLED` | Cancelled by API call before completion |

---

## Order Line Statuses

| Status | Description |
|---|---|
| `PENDING` | No task assigned yet |
| `IN_PROGRESS` | A task is currently executing for this line |
| `FULFILLED` | Line fully picked and delivered |
| `UNFULFILLED` | Line could not be fulfilled (insufficient stock, partial mode) |

---

## Order Detail Schema

```json
{
  "id":             "uuid",
  "name":           "string",
  "status":         "PENDING | PICKING | COMPLETE | PARTIAL | FAILED | CANCELLED",
  "shortfall_mode": "strict | partial | backorder",
  "created_at":     "ISO8601 timestamp",
  "updated_at":     "ISO8601 timestamp",
  "lines": [
    {
      "id":            "uuid",
      "item_id":       "uuid",
      "requested_qty": "integer",
      "fulfilled_qty": "integer",
      "status":        "PENDING | IN_PROGRESS | FULFILLED | UNFULFILLED"
    }
  ]
}
```
