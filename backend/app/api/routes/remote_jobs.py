from uuid import UUID
from typing import Optional, List

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.models import CV
from app.models.schemas import AnalysisResponse
from app.services.remote_job_service import fetch_remote_jobs, match_cv_with_remote_jobs
from app.services.rag_service import analyze_cv_vs_jd

router = APIRouter(prefix="/remote-jobs", tags=["Remote Jobs"])

POPULAR_COUNTRIES = [
    "USA", "UK", "Germany", "Canada",
    "Australia", "Worldwide", "Europe",
]


class RemoteMatchRequest(BaseModel):
    cv_id  : UUID
    country: Optional[str] = None


@router.post("/match")
async def match_remote_jobs(
    body: RemoteMatchRequest,
    db  : AsyncSession = Depends(get_db),
):
    cv = await db.get(CV, body.cv_id)
    if not cv:
        raise HTTPException(status_code=404, detail="CV not found")
    if cv.embedding is None:
        raise HTTPException(status_code=400, detail="CV embedding not available")

    try:
        remote_jobs = await fetch_remote_jobs(country=body.country)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))

    results = match_cv_with_remote_jobs(list(cv.embedding), remote_jobs, top_k=10)

    return {
        "source"        : "remoteok",
        "country_filter": body.country,
        "total_fetched" : len(remote_jobs),
        "results"       : results,
    }


class RemoteAnalyzeRequest(BaseModel):
    cv_id            : UUID
    position         : str
    description_clean: str
    tags             : List[str] = []
    score            : float
    language         : str = "en"   # "en" | "vi"


@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_remote_job(
    body: RemoteAnalyzeRequest,
    db  : AsyncSession = Depends(get_db),
):
    cv = await db.get(CV, body.cv_id)
    if not cv:
        raise HTTPException(status_code=404, detail="CV not found")
    if not cv.raw_text:
        raise HTTPException(status_code=400, detail="CV text not available")

    # Dùng tags làm requirements; fallback về description nếu không có tags
    requirements = ", ".join(body.tags) if body.tags else body.description_clean[:600]

    try:
        result = analyze_cv_vs_jd(
            cv_text        =cv.raw_text,
            jd_title       =body.position,
            jd_description =body.description_clean[:1500],
            jd_requirements=requirements,
            match_score    =body.score,
            language       =body.language,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis error: {str(e)}")


@router.get("/countries")
async def get_countries():
    return POPULAR_COUNTRIES
