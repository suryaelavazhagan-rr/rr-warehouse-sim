from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base, AsyncSessionLocal
import models  # noqa: F401 — registers all ORM models with Base.metadata


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Create all tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # 2. Seed data
    async with AsyncSessionLocal() as db:
        from seed import seed

        await seed(db)

    # 3. Start robot simulation loops
    from services.robot_service import start_robots

    await start_robots()

    yield

    await engine.dispose()


app = FastAPI(
    title="RR Warehouse Sim",
    version="1.0.0",
    description="A warehouse simulation system for QA automation assignments.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all routers
from routers import items, inventory, orders, robots, tasks, ws  # noqa: E402

app.include_router(items.router)
app.include_router(inventory.router)
app.include_router(orders.router)
app.include_router(robots.router)
app.include_router(tasks.router)
app.include_router(ws.router)
