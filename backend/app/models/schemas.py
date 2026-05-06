from uuid import UUID
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


# ── CV Schemas ──────────────────────────────────────────
class CVResponse(BaseModel):
    id: UUID
    filename: str
    uploaded_at: datetime
    raw_text   : Optional[str] = None
    class Config:
        from_attributes = True


# ── Job Description Schemas ─────────────────────────────
class JDCreate(BaseModel):
    title       : str
    description : str
    requirements: str
    employer_id : UUID
    email       : Optional[str] = ""   # email nhà tuyển dụng (tùy chọn)


class JDResponse(BaseModel):
    id          : UUID
    title       : str
    description : str
    requirements: str
    email       : Optional[str] = None
    created_at  : datetime

    class Config:
        from_attributes = True


class JDMatchResponse(BaseModel):
    id          : UUID
    title       : str
    description : str
    requirements: str
    email       : Optional[str] = None   # auto-fill cho ApplyModal
    score       : float
    label       : str                    # "Good Fit" / "Potential Fit" / "No Fit"
    created_at  : datetime

    class Config:
        from_attributes = True


# ── Application Schemas ─────────────────────────────────
class ApplicationResponse(BaseModel):
    id        : UUID
    cv_id     : UUID
    jd_id     : Optional[UUID] = None
    score     : Optional[float]
    status    : str
    applied_at: datetime

    class Config:
        from_attributes = True


class StrengthItem(BaseModel):
    skill : str
    detail: str


class MissingSkillItem(BaseModel):
    skill      : str
    importance : str
    suggestion : str


class AnalysisResponse(BaseModel):
    overall_assessment: str
    match_percentage  : float
    strengths         : list[StrengthItem]
    missing_skills    : list[MissingSkillItem]
    recommendations   : list[str]
    verdict           : str
