from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base
from .config import settings

engine = create_async_engine(settings.database_url, echo=False, future=True)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

Base = declarative_base()


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session


async def init_db():
    from . import models  # noqa: F401 ensure models imported
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
