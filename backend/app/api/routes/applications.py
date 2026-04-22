from uuid import UUID
from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.models import Application, CV, JobDescription, Employer
from app.models.schemas import ApplicationResponse
from app.services.matching_service import cosine_similarity

router = APIRouter(prefix="/applications", tags=["Applications"])


@router.post("/{jd_id}/apply", response_model=ApplicationResponse)
async def apply_job(
    jd_id         : UUID,
    cv_id         : UUID,
    candidate_name: str = Query("Candidate"),
    db            : AsyncSession = Depends(get_db)
):
    cv = await db.get(CV, cv_id)
    if not cv:
        raise HTTPException(status_code=404, detail="CV not found")

    job = await db.get(JobDescription, jd_id)
    if not job:
        raise HTTPException(status_code=404, detail="JD not found")

    existing = await db.execute(
        select(Application).where(
            Application.cv_id == cv_id,
            Application.jd_id == jd_id
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=400,
            detail="You have already applied for this position"
        )

    # Tính score
    score = 0.0
    if cv.embedding is not None and job.embedding is not None:
        score = cosine_similarity(cv.embedding, job.embedding)

    application = Application(
        cv_id =cv_id,
        jd_id =jd_id,
        score =score,
        status="sent"
    )
    db.add(application)
    await db.commit()
    await db.refresh(application)
    return application


@router.get("/history/{cv_id}")
async def get_application_history(
    cv_id: UUID,
    db   : AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Application, JobDescription)
        .join(JobDescription, Application.jd_id == JobDescription.id)
        .where(Application.cv_id == cv_id)
        .order_by(Application.applied_at.desc())
    )
    rows = result.all()
    return [
        {
            "application_id": str(row.Application.id),
            "status"        : row.Application.status,
            "score"         : row.Application.score,
            "applied_at"    : row.Application.applied_at.isoformat(),
            "job": {
                "id"          : str(row.JobDescription.id),
                "title"       : row.JobDescription.title,
                "description" : row.JobDescription.description,
                "requirements": row.JobDescription.requirements,
            }
        }
        for row in rows
    ]


@router.get("/cv/{cv_id}", response_model=list[ApplicationResponse])
async def get_applications_by_cv(
    cv_id: UUID,
    db   : AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Application).where(Application.cv_id == cv_id)
    )
    return result.scalars().all()


@router.patch("/{application_id}/status")
async def update_application_status(
    application_id: UUID,
    status        : str,
    db            : AsyncSession = Depends(get_db)
):
    app = await db.get(Application, application_id)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    allowed = ["pending","sent","viewed","interview","rejected","accepted"]
    if status not in allowed:
        raise HTTPException(status_code=400,
            detail=f"Status must be one of: {', '.join(allowed)}")

    app.status = status
    await db.commit()
    await db.refresh(app)
    return {"id": str(app.id), "status": app.status}