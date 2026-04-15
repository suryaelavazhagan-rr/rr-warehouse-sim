# RR Warehouse Sim

A self-contained warehouse simulation for QA automation assignments.

---

## Quick Start

```bash
git clone <repo-url>
cd rr-warehouse-sim
cp .env.example .env
docker compose up --build
# Frontend:   http://localhost:3001
# Backend API: http://localhost:8000
# API Docs:   http://localhost:8000/docs
```

---

## Configuration

All values are set in `.env` (copy from `.env.example`). Docker Compose reads them at startup.

| Variable | Default | Description |
|---|---|---|
| `ROBOT_COUNT` | `3` | Number of robots spawned at startup |
| `BATTERY_DRAIN_RATE` | `0.001` | Battery % drained per 5 minutes (active robots only) |
| `BATTERY_CHARGE_THRESHOLD` | `20` | Battery % at which a robot automatically queues for charging |
| `INVENTORY_SHORTFALL_MODE` | `partial` | How order creation handles stock shortfalls: `strict` / `partial` / `backorder` |
| `FRONTEND_PORT` | `3001` | Host port the React frontend is served on |

---

## Architecture

### Services

| Service | Tech | Port | Description |
|---|---|---|---|
| `postgres` | PostgreSQL 15 | 5432 (internal) | Persistent storage for all simulation state |
| `backend` | FastAPI (Python 3.11) | 8000 | REST API, WebSocket hub, simulation engine |
| `frontend` | React 18 + TypeScript | 3001 (configurable) | Browser UI for observing and driving the simulation |

### Tech Stack

- **Backend**: Python 3.11, FastAPI, SQLAlchemy (async), Alembic, asyncpg
- **Frontend**: React 18, TypeScript, Vite
- **Database**: PostgreSQL 15
- **Containerisation**: Docker Compose v2

### Data Flow

```
Browser ──── REST / SSE ────► FastAPI backend ──── SQLAlchemy ────► PostgreSQL
           WebSocket ◄────────── Robot simulation loop
```

The backend runs a background simulation loop that drives robot state transitions,
battery drain, and task dispatch. All state changes are persisted to Postgres and
broadcast over WebSocket / SSE in real time.

---

## API Overview

Full interactive docs are available at `http://localhost:8000/docs` (Swagger UI) and
`http://localhost:8000/redoc` (ReDoc) once the stack is running.

| Group | Endpoints | Docs |
|---|---|---|
| Items | `GET/POST /api/items`, `GET/PUT /api/items/{id}` | [docs/api/items.md](docs/api/items.md) |
| Inventory | `GET/POST /api/inventory`, `GET/PUT /api/inventory/{id}` | [docs/api/inventory.md](docs/api/inventory.md) |
| Orders | `GET/POST /api/orders`, `GET /api/orders/{id}`, `PUT /api/orders/{id}/cancel`, `GET /api/orders/{id}/events` | [docs/api/orders.md](docs/api/orders.md) |
| Robots | `GET /api/robots`, `GET /api/robots/{id}`, `PUT /api/robots/{id}/charge`, `PUT /api/robots/{id}/reset` | [docs/api/robots.md](docs/api/robots.md) |
| Tasks | `GET /api/tasks`, `GET /api/tasks/{id}` | [docs/api/tasks.md](docs/api/tasks.md) |

---

## WebSocket & SSE

### WebSocket — Robot State Stream

```
ws://localhost:8000/ws/robots
```

Broadcasts a JSON message on every robot state transition. Multiple clients can connect
simultaneously. No authentication required. See [docs/api/websocket.md](docs/api/websocket.md).

### SSE — Per-Order Event Stream

```
http://localhost:8000/api/orders/{order_id}/events
```

Standard `text/event-stream` endpoint. Emits events for every order state change,
line fulfillment, and task assignment. Stream closes automatically once the order
reaches a terminal state. See [docs/api/sse.md](docs/api/sse.md).

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

Any active state ─► ERROR   (random fault injection)
ERROR            ─► IDLE    (via PUT /api/robots/{id}/reset)
```

- Robots below `BATTERY_CHARGE_THRESHOLD` automatically transition to `MOVING_TO_CHARGE`
  after completing a task drop.
- A robot in `IDLE` or `RESTING` can be manually sent to charge via
  `PUT /api/robots/{id}/reset`.

---

## Shortfall Modes

Controlled by `INVENTORY_SHORTFALL_MODE`:

| Mode | Behaviour on insufficient stock |
|---|---|
| `strict` | The entire order is rejected with HTTP 422. No tasks are created. |
| `partial` | Tasks are created for available quantity. Remaining lines are marked `UNFULFILLED`. Order status becomes `PARTIAL`. |
| `backorder` | Tasks are created for available quantity. Remaining quantity is queued as a backorder and fulfilled once stock is replenished. |

---

## For QA Engineers

Test the full system — REST APIs, WebSocket, SSE streams, robot simulation, inventory
management, and order processing. The system has various configuration modes that should
all be tested.

Key areas to exercise:

- All three `INVENTORY_SHORTFALL_MODE` values with varying stock levels
- Robot state machine completeness: every valid transition and every invalid one
- Battery drain behaviour at different `BATTERY_DRAIN_RATE` and `BATTERY_CHARGE_THRESHOLD` settings
- Concurrent order submission and FIFO task queue fairness
- Real-time stream correctness: WebSocket schema, SSE event sequencing, reconnection
- Input validation and error response shapes across all endpoints

See [ASSIGNMENT.md](ASSIGNMENT.md) for the full candidate brief and [UI_GUIDE.md](UI_GUIDE.md)
for a walkthrough of the browser interface.
