from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from models.item import Item
from models.inventory import Inventory

SEED_ITEMS = [
    {"name": "Widget A", "sku": "WGT-001", "description": "Standard widget"},
    {"name": "Widget B", "sku": "WGT-002", "description": "Heavy duty widget"},
    {"name": "Gear X", "sku": "GRX-001", "description": "Precision gear"},
    {"name": "Bolt M8", "sku": "BLT-008", "description": "M8 steel bolt"},
    {"name": "Plate C", "sku": "PLT-003", "description": "Mounting plate"},
]

SEED_INVENTORY = [
    {"sku": "WGT-001", "quantity": 100, "location": "A-01"},
    {"sku": "WGT-002", "quantity": 80, "location": "A-02"},
    {"sku": "GRX-001", "quantity": 50, "location": "B-01"},
    {"sku": "BLT-008", "quantity": 200, "location": "B-02"},
    {"sku": "PLT-003", "quantity": 30, "location": "C-01"},
]


async def seed(db: AsyncSession):
    result = await db.execute(select(func.count()).select_from(Item))
    count = result.scalar()
    if count > 0:
        print(f"[seed] Already seeded ({count} items), skipping.")
        return

    sku_to_id = {}
    for item_data in SEED_ITEMS:
        item = Item(**item_data)
        db.add(item)
        await db.flush()
        sku_to_id[item_data["sku"]] = item.id

    for inv_data in SEED_INVENTORY:
        inv = Inventory(
            item_id=sku_to_id[inv_data["sku"]],
            quantity=inv_data["quantity"],
            location=inv_data["location"],
        )
        db.add(inv)

    await db.commit()
    print(
        f"[seed] Seeded {len(SEED_ITEMS)} items and {len(SEED_INVENTORY)} inventory records"
    )
