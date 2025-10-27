#!/usr/bin/env python3
"""
Database table creation script for WhisperVault API
Run this once to create the required database tables.
"""

import asyncio
import os
import sys

# Add the current directory to Python path so imports work
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.config import settings
from app.models import Base
from app.database import engine


async def create_tables():
    """Create all database tables"""
    print("Creating database tables...")
    
    # Import models to ensure they're registered with Base
    from app import models  # noqa: F401
    
    async with engine.begin() as conn:
        # Create all tables
        await conn.run_sync(Base.metadata.create_all)
    
    print("Database tables created successfully!")


async def main():
    """Main function"""
    try:
        await create_tables()
    except Exception as e:
        print(f"Error creating tables: {e}")
        raise
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())