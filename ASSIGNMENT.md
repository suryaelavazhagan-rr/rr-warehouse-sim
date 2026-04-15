# Senior SDET Assignment — RR Warehouse Sim

## Overview

You are given a running warehouse simulation system. Your task is to design and implement
a comprehensive test suite that validates the system's correctness across all configuration
modes.

This is an open-ended assignment. There is no single correct answer — we are evaluating
your thinking, your thoroughness, and the quality of your test design.

---

## Setup

```bash
git clone <repo-url>
cd rr-warehouse-sim
cp .env.example .env
docker compose up --build
# Frontend:    http://localhost:3001
# Backend API: http://localhost:8000
# API Docs:    http://localhost:8000/docs
```

The system should be fully operational within ~30 seconds of `docker compose up`.
Swagger UI at `http://localhost:8000/docs` is the quickest way to explore the API.

---

## System Overview

RR Warehouse Sim models a small automated warehouse:

- A **robot fleet** (configurable size, default 3) picks and drops inventory items to
  fulfil orders. Each robot has a battery level that drains during active work and
  must periodically recharge.
- An **inventory** of items with stock levels stored per location.
- An **order system** that creates pick tasks for robots based on incoming orders. How
  the system handles insufficient stock is controlled by the `INVENTORY_SHORTFALL_MODE`
  environment variable.
- A **real-time event layer**: a WebSocket stream for all robot state changes, and a
  per-order SSE stream for order lifecycle events.

### Configuration Variables

| Variable | Default | Description |
|---|---|---|
| `ROBOT_COUNT` | `3` | Number of robots |
| `BATTERY_DRAIN_RATE` | `0.001` | Battery % per 5 minutes (active robots only) |
| `BATTERY_CHARGE_THRESHOLD` | `20` | % at which robot queues for charge |
| `INVENTORY_SHORTFALL_MODE` | `partial` | `strict` / `partial` / `backorder` |
| `FRONTEND_PORT` | `3001` | Host port for frontend |

---

## What to Test

### 1. REST API Tests

#### Items
- Create an item (valid payload)
- Create an item with missing required fields → expect 422
- Create an item with `name` exceeding 50 characters → expect 422
- Read item by ID
- Read item with non-existent ID → expect 404
- Update item fields (partial update)

#### Inventory
- Create inventory record (valid payload)
- Create inventory with invalid `item_id` → expect 422 or 404
- Create inventory with negative quantity → document actual behaviour
- Read and update inventory records

#### Orders
- Create order with full stock available (all three shortfall modes)
- Create order with partial stock shortage (all three shortfall modes)
- Create order with zero stock for one line (all three shortfall modes)
- Create order with entirely empty lines array
- Cancel a `PENDING` order
- Cancel a `PICKING` order
- Attempt to cancel a `COMPLETE` order → expect failure
- Verify order status transitions: `PENDING → PICKING → COMPLETE / PARTIAL / FAILED`
- Verify order line statuses: `PENDING → IN_PROGRESS → FULFILLED / UNFULFILLED`

#### Robots
- List robots, verify count matches `ROBOT_COUNT`
- Send `IDLE` robot to charge → expect success
- Send `RESTING` robot to charge → expect success
- Send `PICKING_ITEM` robot to charge → expect 422
- Reset an `ERROR` robot to `IDLE`
- Attempt to reset a non-`ERROR` robot → expect 422

#### Tasks
- List tasks after order creation
- Verify task fields: `order_id`, `order_line_id`, `item_id`, `quantity`, `status`

### 2. Real-Time Streams

#### WebSocket `/ws/robots`
- Connect and receive at least one state transition message
- Validate message schema: all required fields present and correctly typed
- Verify `from_state` → `to_state` transitions are valid per the state machine
- Disconnect and reconnect — verify stream resumes
- Connect multiple clients simultaneously — all should receive identical messages

#### SSE `/api/orders/{id}/events`
- Subscribe immediately after order creation
- Receive `ORDER_CREATED` event
- Receive `LINE_ASSIGNED` as tasks are picked up
- Receive `LINE_FULFILLED` as tasks complete
- Receive terminal event: `ORDER_COMPLETE`, `ORDER_PARTIAL`, or `ORDER_FAILED`
- Verify stream closes after terminal event
- Verify `event_type` values match the documented enum
- Subscribe to a non-existent order ID → document behaviour

### 3. Robot Simulation

- Observe a full pick-and-drop cycle (IDLE → … → DROPPING_ITEM → IDLE/RESTING)
- Confirm every state transition in the cycle is reflected in the WebSocket stream
- Allow battery to drain below `BATTERY_CHARGE_THRESHOLD`; verify robot enters
  `MOVING_TO_CHARGE` automatically after completing its current drop
- Trigger a manual charge while robot is `IDLE`; observe `MOVING_TO_CHARGE → CHARGING → IDLE`
- Wait for or trigger an `ERROR` state; verify robot is stuck until reset
- Test with a low `BATTERY_DRAIN_RATE` and high `BATTERY_CHARGE_THRESHOLD` to observe
  frequent charging
- Confirm robots with very low battery still finish their in-progress task before charging

### 4. Configuration Modes

Restart the stack with each mode and verify the expected behaviour:

| Mode | Scenario | Expected |
|---|---|---|
| `strict` | Order with any line exceeding stock | HTTP 422, no tasks created |
| `strict` | Order with all lines fully stocked | Order created, tasks queued |
| `partial` | Order with one line exceeding stock | Order created; excess lines `UNFULFILLED`; order ends `PARTIAL` |
| `partial` | Order fully stocked | Same as strict success |
| `backorder` | Order with one line exceeding stock | Available qty picked; remainder queued; order may complete later |
| `backorder` | Stock replenished after backorder | Queued remainder eventually fulfilled |

### 5. Concurrent Load

- Submit 10+ orders in rapid succession; verify all tasks are queued correctly
- Verify FIFO ordering: tasks created first should be picked up first
- Verify no order is silently dropped under concurrent load
- Verify inventory is decremented atomically (no double-deduction for same stock)

---

## Deliverables

1. **Test code** in a language/framework of your choice
   (pytest, Jest, Postman Collections, Robot Framework, etc.)
2. **Test plan document** — your overall strategy: scope, risk areas, coverage approach
3. **Bug report** — document every bug you found with:
   - Steps to reproduce
   - Expected behaviour
   - Actual behaviour
   - Severity assessment
4. **README** for your test project — how to install dependencies and run the suite

---

## Evaluation Criteria

| Area | What we look at |
|---|---|
| **Coverage depth** | Do tests exercise happy paths, edge cases, and failure modes? |
| **Bug discovery** | There are known issues in the system — find them. |
| **Test design quality** | Clarity, maintainability, meaningful assertions |
| **Real-time stream testing** | Approach to async / streaming validation |
| **Configuration matrix** | Are all three shortfall modes exercised systematically? |
| **Concurrency** | Is concurrent behaviour tested, not just sequential? |

---

## Notes & Hints

- The system intentionally contains bugs. Some are subtle. Read the API docs carefully
  and compare documented behaviour to actual behaviour.
- The simulation runs continuously in the background. You may need to poll or use
  real-time streams to observe asynchronous state changes.
- Environment variables take effect on container restart. Use
  `docker compose down && docker compose up --build` when changing config.
- The Swagger UI (`/docs`) lets you fire requests manually before automating them —
  use it to understand the system first.

---

## Time Expectation

This assignment is designed to take **4–6 hours**. Focus on quality over quantity.
A well-reasoned test plan and 20 focused tests outweigh 100 shallow ones.
