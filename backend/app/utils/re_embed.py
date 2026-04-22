import asyncio
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.models import JobDescription, CV
from app.services.matching_service import get_embedding

async def re_embed_all():
    async with AsyncSessionLocal() as db:
        # Re-embed tất cả JD
        result = await db.execute(select(JobDescription))
        jobs   = result.scalars().all()
        print(f'Re-embedding {len(jobs)} JDs...')
        for i, job in enumerate(jobs):
            text = f'{job.title}\n{job.description}\n{job.requirements}'
            job.embedding = get_embedding(text)
            print(f'  [{i+1}/{len(jobs)}] {job.title}')
        await db.commit()
        print('JD re-embedding xong!')

        # Re-embed tất cả CV
        result = await db.execute(select(CV))
        cvs    = result.scalars().all()
        print(f'\nRe-embedding {len(cvs)} CVs...')
        for i, cv in enumerate(cvs):
            if cv.raw_text:
                cv.embedding = get_embedding(cv.raw_text)
                print(f'  [{i+1}/{len(cvs)}] {cv.filename}')
        await db.commit()
        print('CV re-embedding xong!')

asyncio.run(re_embed_all())
