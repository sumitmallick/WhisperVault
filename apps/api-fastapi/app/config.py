from pydantic import BaseModel
import os


class Settings(BaseModel):
    app_name: str = "Confessions API"
    environment: str = os.getenv("ENV", "local")
    database_url: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./confessions.db")
    redis_url: str | None = os.getenv("REDIS_URL")
    prefer_async_moderation: bool = os.getenv("PREFER_ASYNC_MODERATION", "true").lower() == "true"
    assets_dir: str = os.getenv("ASSETS_DIR", os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "assets")))


settings = Settings()
