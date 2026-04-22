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
    title: str
    description: str
    requirements: str
    employer_id: UUID


class JDResponse(BaseModel):
    id: UUID
    title: str
    description: str
    requirements: str
    created_at: datetime

    class Config:
        from_attributes = True


class JDMatchResponse(BaseModel):
    id          : UUID
    title       : str
    description : str
    requirements: str
    score       : float
    label       : str        # ← "Good Fit" / "Potential Fit" / "No Fit"
    created_at  : datetime

    class Config:
        from_attributes = True


# ── Application Schemas ─────────────────────────────────
class ApplicationResponse(BaseModel):
    id: UUID
    cv_id: UUID
    jd_id: UUID
    score: Optional[float]
    status: str
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