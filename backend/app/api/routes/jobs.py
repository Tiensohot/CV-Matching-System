from uuid import UUID
from typing import List
from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from app.services.rag_service import analyze_cv_vs_jd
from app.models.schemas import AnalysisResponse
from app.core.database import get_db
from app.models.models import JobDescription, CV
from sqlalchemy import select, text, func
import math
from app.models.schemas import JDResponse, JDMatchResponse, JDCreate
from app.services.matching_service import (
    get_embedding, cosine_similarity,
    score_to_label, get_model_info
)

router = APIRouter(prefix="/jobs", tags=["Jobs"])


@router.get("/model-info")
async def model_info():
    """Xem thông tin model đang dùng"""
    return get_model_info()


@router.post("/", response_model=JDResponse)
async def create_job(jd: JDCreate, db: AsyncSession = Depends(get_db)):
    content   = f"{jd.title}\n{jd.description}\n{jd.requirements}"
    embedding = get_embedding(content)

    job = JobDescription(
        employer_id=jd.employer_id,
        title=jd.title,
        description=jd.description,
        requirements=jd.requirements,
        embedding=embedding
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)
    return job


@router.get("/match", response_model=List[JDMatchResponse])
async def match_jobs(
    cv_id: UUID = Query(...),
    top_k: int  = Query(10),
    db   : AsyncSession = Depends(get_db)
):
    try:
        cv = await db.get(CV, cv_id)
        if not cv:
            raise HTTPException(status_code=404, detail="CV not found")
        if cv.embedding is None:
            raise HTTPException(status_code=400, detail="CV has no embedding")

        query = text("""
            SELECT id, title, description, requirements, created_at,
                   1 - (embedding <=> CAST(:embedding AS vector)) AS score
            FROM job_descriptions
            WHERE embedding IS NOT NULL
            ORDER BY embedding <=> CAST(:embedding AS vector)
            LIMIT :top_k
        """)

        embedding_str = "[" + ",".join(map(str, cv.embedding)) + "]"
        result = await db.execute(query, {
            "embedding": embedding_str,
            "top_k"    : top_k
        })
        rows = result.fetchall()

        return [
            JDMatchResponse(
                id          =row.id,
                title       =row.title,
                description =row.description,
                requirements=row.requirements,
                score       =round(float(row.score), 4),
                label       =score_to_label(float(row.score)),
                created_at  =row.created_at
            )
            for row in rows
        ]

    except HTTPException:
        raise
    except Exception as e:
        # In lỗi rõ ràng ra terminal
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/all")
async def get_all_jobs(
    page  : int = Query(1,  ge=1),
    limit : int = Query(20, ge=1, le=100),
    db    : AsyncSession = Depends(get_db)
):
    offset = (page - 1) * limit

    result = await db.execute(
        select(JobDescription)
        .order_by(JobDescription.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    jobs = result.scalars().all()

    count = await db.execute(
        select(func.count()).select_from(JobDescription)
    )
    total = count.scalar()

    jobs_list = [
        {
            "id"          : str(job.id),
            "title"       : job.title,
            "description" : job.description,
            "requirements": job.requirements,
            "created_at"  : job.created_at.isoformat() if job.created_at else None,
        }
        for job in jobs
    ]

    return {
        "jobs" : jobs_list,
        "total": total,
        "page" : page,
        "limit": limit,
        "pages": math.ceil(total / limit) if total > 0 else 1
    }
@router.get("/{jd_id}", response_model=JDResponse)
async def get_job(jd_id: UUID, db: AsyncSession = Depends(get_db)):
    job = await db.get(JobDescription, jd_id)
    if not job:
        raise HTTPException(status_code=404, detail="Không tìm thấy JD")
    return job

@router.post("/{jd_id}/analyze", response_model=AnalysisResponse)
async def analyze_job(
    jd_id : UUID,
    cv_id : UUID,
    db    : AsyncSession = Depends(get_db)
):
    cv = await db.get(CV, cv_id)
    if not cv:
        raise HTTPException(status_code=404, detail="CV not found")
    if not cv.raw_text:
        raise HTTPException(status_code=400, detail="CV has no text")

    job = await db.get(JobDescription, jd_id)
    if not job:
        raise HTTPException(status_code=404, detail="JD not found")

    # Tự tính score nếu cả 2 đều có embedding
    score = 0.0
    if cv.embedding is not None and job.embedding is not None:
        score = cosine_similarity(cv.embedding, job.embedding)

    try:
        result = analyze_cv_vs_jd(
            cv_text        =cv.raw_text,
            jd_title       =job.title,
            jd_description =job.description,
            jd_requirements=job.requirements,
            match_score    =score
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis error: {str(e)}")
    
