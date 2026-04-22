import asyncio
from app.core.database import AsyncSessionLocal
from app.models.models import CV

async def check():
    async with AsyncSessionLocal() as db:
        result = await db.execute(__import__('sqlalchemy').select(CV))
        cvs = result.scalars().all()
        for cv in cvs:
            print(f"File: {cv.filename}")
            print(f"Text (200 chars): {cv.raw_text[:200] if cv.raw_text else 'RONG'}")
            print()

asyncio.run(check())
