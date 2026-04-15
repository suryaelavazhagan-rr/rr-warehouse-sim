# Inventory API

Base path: `/api/inventory`

Manages stock levels. Each inventory record links a quantity of a specific item to a
warehouse location. Multiple records can exist for the same item (e.g. different
storage locations). Picking tasks deduct from the available quantity when fulfilled.

---

## Endpoints

### `GET /api/inventory`

List all inventory records.

**Request**: no parameters.

**Response `200 OK`**

```json
[
  {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "item_id": "a1b2c3d4-0000-0000-0000-000000000001",
    "quantity": 50,
    "location": "Aisle-3-Shelf-B",
    "updated_at": "2026-04-14T09:30:00.000Z"
  }
]
```

Returns an empty array `[]` when no records exist.

---

### `POST /api/inventory`

Create a new inventory record.

**Request body** (`application/json`)

| Field | Type | Required | Constraints |
|---|---|---|---|
| `item_id` | UUID string | ✅ | Must reference an existing item |
| `quantity` | integer | ✅ | Must be ≥ 0 |
| `location` | string | ✅ | Free text; e.g. `"Aisle-3-Shelf-B"` |

```json
{
  "item_id": "a1b2c3d4-0000-0000-0000-000000000001",
  "quantity": 50,
  "location": "Aisle-3-Shelf-B"
}
```

**Response `201 Created`**: the created inventory record object.

**Error responses**

| Status | Condition |
|---|---|
| `422 Unprocessable Entity` | Any required field missing or invalid type |
| `404 Not Found` | `item_id` does not reference an existing item |

---

### `GET /api/inventory/{id}`

Get a single inventory record by its UUID.

**Path parameter**: `id` — UUID of the inventory record.

**Response `200 OK`**: single inventory record object (same schema as list entry above).

**Error responses**

| Status | Condition |
|---|---|
| `404 Not Found` | No record with the given `id` |
| `422 Unprocessable Entity` | `id` is not a valid UUID |

---

### `PUT /api/inventory/{id}`

Update an existing inventory record. Both fields are optional — only supplied fields
are changed.

**Path parameter**: `id` — UUID of the inventory record.

**Request body** (`application/json`): any subset of `{quantity, location}`.

```json
{
  "quantity": 75
}
```

**Response `200 OK`**: the updated inventory record object.

**Error responses**

| Status | Condition |
|---|---|
| `404 Not Found` | No record with the given `id` |
| `422 Unprocessable Entity` | `quantity` is negative |

---

## Inventory Record Schema

```json
{
  "id":         "uuid",
  "item_id":    "uuid — references an item",
  "quantity":   "integer ≥ 0",
  "location":   "string",
  "updated_at": "ISO8601 timestamp"
}
```

---

## Notes

- When a robot fulfils a task, the corresponding inventory record's `quantity` is
  decremented by the task quantity. If multiple inventory records exist for the same
  item, the system selects one to deduct from (implementation-defined).
- Inventory is not locked during order creation — concurrent orders may compete for
  the same stock. This is an area to exercise in load tests.
