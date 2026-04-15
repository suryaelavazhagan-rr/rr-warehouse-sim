# Items API

Base path: `/api/items`

Manages the item catalogue. Items represent the types of goods stored in the warehouse.
Each item must exist in the catalogue before inventory records or order lines can
reference it.

---

## Endpoints

### `GET /api/items`

List all items in the catalogue.

**Request**: no parameters.

**Response `200 OK`**

```json
[
  {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "name": "Widget A",
    "sku": "WGT-001",
    "description": "Standard widget, blue",
    "created_at": "2026-04-14T09:00:00.000Z",
    "updated_at": "2026-04-14T09:00:00.000Z"
  }
]
```

Returns an empty array `[]` when no items exist.

---

### `POST /api/items`

Create a new item.

**Request body** (`application/json`)

| Field | Type | Required | Constraints |
|---|---|---|---|
| `name` | string | ✅ | Max 50 characters |
| `sku` | string | ✅ | Must be unique |
| `description` | string | ❌ | No length constraint |

```json
{
  "name": "Widget A",
  "sku": "WGT-001",
  "description": "Standard widget, blue"
}
```

**Response `201 Created`**

Returns the created item object (same schema as list entry above).

**Error responses**

| Status | Condition |
|---|---|
| `422 Unprocessable Entity` | `name` missing or exceeds 50 characters |
| `422 Unprocessable Entity` | `sku` missing |
| `409 Conflict` | `sku` already exists |

---

### `GET /api/items/{id}`

Get a single item by its UUID.

**Path parameter**: `id` — UUID of the item.

**Response `200 OK`**: single item object (same schema as above).

**Error responses**

| Status | Condition |
|---|---|
| `404 Not Found` | No item with the given `id` |
| `422 Unprocessable Entity` | `id` is not a valid UUID |

---

### `PUT /api/items/{id}`

Update one or more fields on an existing item. All fields are optional — only supplied
fields are changed.

**Path parameter**: `id` — UUID of the item.

**Request body** (`application/json`): any subset of `{name, sku, description}`.

```json
{
  "description": "Updated description"
}
```

**Response `200 OK`**: the updated item object.

**Error responses**

| Status | Condition |
|---|---|
| `404 Not Found` | No item with the given `id` |
| `422 Unprocessable Entity` | `name` exceeds 50 characters |
| `409 Conflict` | Updated `sku` already used by another item |

---

## Item Object Schema

```json
{
  "id":          "uuid",
  "name":        "string (max 50 chars)",
  "sku":         "string (unique)",
  "description": "string or null",
  "created_at":  "ISO8601 timestamp",
  "updated_at":  "ISO8601 timestamp"
}
```
