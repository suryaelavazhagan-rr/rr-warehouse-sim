from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://rr:rr@localhost:5432/warehouse"
    ROBOT_COUNT: int = 3
    BATTERY_DRAIN_RATE: float = 0.001  # % per 5 minutes
    BATTERY_CHARGE_THRESHOLD: float = 20.0  # % threshold
    INVENTORY_SHORTFALL_MODE: str = "partial"  # strict | partial | backorder

    class Config:
        env_file = ".env"


settings = Settings()
