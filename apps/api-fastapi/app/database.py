from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base
from .config import settings

# Create engine with proper connection pooling and timeouts
engine = create_async_engine(
    settings.database_url,
    echo=False,
    future=True,
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,
    pool_recycle=300,
    connect_args={
        "command_timeout": 10,
    }
)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

Base = declarative_base()


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session


async def init_db():
    """Initialize database - tables will be created if they don't exist"""
    try:
        # Import models to ensure they're registered
        from . import models  # noqa: F401
        
        # Create tables if they don't exist (with timeout)
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    except Exception as e:
        # Log error but don't fail startup - database might already exist
        print(f"Database initialization warning: {e}")
        pass
