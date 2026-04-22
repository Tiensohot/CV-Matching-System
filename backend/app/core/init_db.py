from sqlalchemy import text
from app.core.database import engine, Base
from app.models import models  # noqa: F401 — import để Base nhận diện các bảng


async def init_db():
    async with engine.begin() as conn:
        # Bật extension pgvector
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        # Tạo tất cả bảng
        await conn.run_sync(Base.metadata.create_all)
    print("Database initialized successfully!")