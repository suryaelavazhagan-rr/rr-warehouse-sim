# UI Guide — RR Warehouse Sim

Frontend runs at `http://localhost:3001` after `docker compose up`.

The UI is purely a convenience layer — everything visible here is also accessible via
the REST API and real-time streams documented in `docs/api/`. You do not need to use
the UI to complete the assignment, but it can be useful for quickly observing system
behaviour before automating against it.

---

## Connection Indicator

A coloured dot is displayed in the top-right corner of every page:

| Colour | Meaning |
|---|---|
| 🟢 Green | WebSocket connected — live robot events are flowing |
| 🔴 Red | WebSocket disconnected — auto-reconnect attempt every 3 seconds |

---

## Pages

### Dashboard (`/`)

The home page gives a live at-a-glance view of the warehouse.

- **Robot status cards** — compact cards for every robot showing name, current state,
  and battery level. Updates in real time via WebSocket.
- **Summary stats bar** — total robots, currently active robots, orders created today,
  and robots in ERROR state.
- **Recent orders table** — last 10 orders with status badges. Click a row to open the
  order detail page.
- **Live WebSocket indicator** — reflects the global connection state (see above).

---

### Items (`/items`)

Browse and manage the item catalogue.

- Table listing all items: name, SKU, description, timestamps.
- **Create item** button opens a form (name, SKU, description).
- Click any row to open an inline edit form for that item.

---

### Inventory (`/inventory`)

Browse and manage inventory stock levels.

- Table listing all inventory records: item name, quantity, warehouse location,
  last updated.
- **Add inventory** button opens a form (select item, quantity, location).
- Click any row to update quantity or location for that record.

---

### Orders (`/orders`)

Browse all orders and create new ones.

- Table listing all orders with status badge and creation timestamp.
- **Create order** button opens a form:
  - Order name (free text).
  - Add one or more line items — select an item from the catalogue and enter
    the requested quantity.
- Click any row to open the order detail page.

---

### Order Detail (`/orders/:id`)

Full view of a single order.

- **Header** — order name, current status badge, shortfall mode in effect when the order
  was created.
- **Cancel button** — visible only when order is `PENDING` or `PICKING`. Sends
  `PUT /api/orders/{id}/cancel`.
- **Order lines table** — one row per line: item name, requested qty, fulfilled qty,
  line status badge.
- **Live SSE event feed** — scrolling log at the bottom of the page. Events appear in
  real time as the order progresses. The feed stops automatically once the order reaches
  a terminal state (`COMPLETE`, `PARTIAL`, `FAILED`, or `CANCELLED`).

---

### Robots (`/robots`)

Full robot fleet management view.

- **Robot cards** — one card per robot showing:
  - Name and UUID
  - Current status (colour-coded badge — see below)
  - Battery level (percentage + progress bar)
  - Current task ID (if assigned)
  - Recent state transitions log
- **Charge button** — visible when robot is `IDLE` or `RESTING`. Sends
  `PUT /api/robots/{id}/charge`.
- **Reset button** — visible when robot is `ERROR`. Sends
  `PUT /api/robots/{id}/reset`.
- All cards update live via the WebSocket stream.

---

## Colour Coding

| Colour | States / Contexts |
|---|---|
| Red / bright | `ERROR`, active picking states (`MOVING_TO_PICK`, `PICKING_ITEM`, `PICKED_ITEM`, `MOVING_TO_DROP`, `DROPPING_ITEM`) |
| Orange | `MOVING_TO_CHARGE`, `CHARGING`, warning-level battery |
| Green | `COMPLETE`, `FULFILLED`, full battery |
| Gray | `IDLE`, `RESTING`, `UNFULFILLED` |
| Blue | `PENDING`, `IN_PROGRESS`, `PICKING` (order status) |
