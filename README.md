# RR Warehouse Sim

A self-contained warehouse simulation for QA automation assignments at Rapyuta Robotics.

---

## Quick Start

```bash
git clone https://github.com/suryaelavazhagan-rr/rr-warehouse-sim.git
cd rr-warehouse-sim
cp .env.example .env
docker compose up --build
# Frontend:    http://localhost:3001
# Backend API: http://localhost:8000
# API Docs:    http://localhost:8000/docs
```

---

## Documentation

Full documentation is in the [GitHub Wiki](https://github.com/suryaelavazhagan-rr/rr-warehouse-sim/wiki):

| Page | Description |
|---|---|
| [Quick Start](https://github.com/suryaelavazhagan-rr/rr-warehouse-sim/wiki/Quick-Start) | Detailed setup steps and configuration |
| [Assignment](https://github.com/suryaelavazhagan-rr/rr-warehouse-sim/wiki/Assignment) | Full candidate brief and deliverables |
| [UI Guide](https://github.com/suryaelavazhagan-rr/rr-warehouse-sim/wiki/UI-Guide) | Browser interface walkthrough |
| [API — Items](https://github.com/suryaelavazhagan-rr/rr-warehouse-sim/wiki/API-Items) | Item catalogue endpoints |
| [API — Inventory](https://github.com/suryaelavazhagan-rr/rr-warehouse-sim/wiki/API-Inventory) | Stock management endpoints |
| [API — Orders](https://github.com/suryaelavazhagan-rr/rr-warehouse-sim/wiki/API-Orders) | Order lifecycle endpoints |
| [API — Robots](https://github.com/suryaelavazhagan-rr/rr-warehouse-sim/wiki/API-Robots) | Robot fleet and state machine |
| [API — Tasks](https://github.com/suryaelavazhagan-rr/rr-warehouse-sim/wiki/API-Tasks) | Task queue and lifecycle |
| [API — WebSocket](https://github.com/suryaelavazhagan-rr/rr-warehouse-sim/wiki/API-WebSocket) | Real-time robot event stream |
| [API — SSE](https://github.com/suryaelavazhagan-rr/rr-warehouse-sim/wiki/API-SSE) | Per-order Server-Sent Events stream |

Interactive API docs (Swagger UI) are available at `http://localhost:8000/docs` once the stack is running.
