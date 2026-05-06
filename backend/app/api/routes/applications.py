import os
from uuid import UUID
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends, Query, BackgroundTasks
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.models import Application, CV, JobDescription, Employer
from app.models.schemas import ApplicationResponse
from app.services.matching_service import cosine_similarity

router = APIRouter(prefix="/applications", tags=["Applications"])

UPLOAD_DIR = "uploads"


# ── Existing endpoint: apply by jd_id (không thay đổi) ───────────────────────
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


# ── New endpoint: apply with email ───────────────────────────────────────────
class ApplyWithEmailBody(BaseModel):
    cv_id          : UUID
    jd_id          : Optional[UUID]  = None
    applicant_name : str
    applicant_email: EmailStr
    employer_email : EmailStr
    job_title      : str
    company_name   : str
    matching_score : float
    cover_message  : str             = ""
    source         : str             = "database"
    remote_job_url : Optional[str]   = None


@router.post("")
async def apply_with_email(
    body            : ApplyWithEmailBody,
    background_tasks: BackgroundTasks,
    db              : AsyncSession = Depends(get_db),
):
    cv = await db.get(CV, body.cv_id)
    if not cv:
        raise HTTPException(status_code=404, detail="CV not found")

    application = Application(
        cv_id          = body.cv_id,
        jd_id          = body.jd_id,
        score          = body.matching_score,
        status         = "pending",
        applicant_name = body.applicant_name,
        applicant_email= body.applicant_email,
        employer_email = body.employer_email,
        cover_message  = body.cover_message,
        source         = body.source,
        remote_job_url = body.remote_job_url,
        job_title      = body.job_title,
        company_name   = body.company_name,
    )
    db.add(application)
    await db.commit()
    await db.refresh(application)

    cv_file_path = os.path.join(UPLOAD_DIR, cv.filename)

    background_tasks.add_task(
        _send_email_and_update,
        application_id = application.id,
        to_email       = str(body.employer_email),
        applicant_name = body.applicant_name,
        applicant_email= str(body.applicant_email),
        job_title      = body.job_title,
        company_name   = body.company_name,
        matching_score = body.matching_score,
        cv_file_path   = cv_file_path,
        cover_message  = body.cover_message,
    )

    return {
        "id"     : str(application.id),
        "status" : "pending",
        "message": "Đã gửi hồ sơ, email sẽ được gửi trong giây lát",
    }


async def _send_email_and_update(
    application_id: UUID,
    to_email      : str,
    applicant_name: str,
    applicant_email: str,
    job_title     : str,
    company_name  : str,
    matching_score: float,
    cv_file_path  : str,
    cover_message : str,
):
    from app.services.email_service import send_application_email
    from app.core.database import AsyncSessionLocal

    result = await send_application_email(
        to_email, applicant_name, applicant_email,
        job_title, company_name, matching_score,
        cv_file_path, cover_message,
    )

    if result.get("success"):
        async with AsyncSessionLocal() as db:
            app = await db.get(Application, application_id)
            if app:
                app.status = "sent"
                await db.commit()


# ── Existing endpoints (không thay đổi) ──────────────────────────────────────
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

    allowed = ["pending", "sent", "viewed", "interview", "rejected", "accepted"]
    if status not in allowed:
        raise HTTPException(status_code=400,
            detail=f"Status must be one of: {', '.join(allowed)}")

    app.status = status
    await db.commit()
    await db.refresh(app)
    return {"id": str(app.id), "status": app.status}
