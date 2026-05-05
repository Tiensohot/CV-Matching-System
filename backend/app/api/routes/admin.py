import json
import math
import re
import httpx
from uuid import UUID, uuid4
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete as sql_delete
from pydantic import BaseModel
from typing import Optional

from app.core.database import get_db
from app.core.auth import create_access_token, verify_token, pwd_context
from app.core.config import settings
from app.models.models import (
    JobDescription, CV, Application, Employer
)
from app.services.matching_service import get_embedding

router = APIRouter(prefix="/admin", tags=["Admin"])


# ── Auth ─────────────────────────────────────────────────
@router.post("/login")
async def login(form: OAuth2PasswordRequestForm = Depends()):
    if (form.username != settings.ADMIN_EMAIL or
        form.password != settings.ADMIN_PASSWORD):
        raise HTTPException(status_code=401,
                            detail="Invalid credentials")
    token = create_access_token({"sub": form.username})
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me")
async def get_me(email: str = Depends(verify_token)):
    return {"email": email, "role": "admin"}


# ── Dashboard Stats ───────────────────────────────────────
@router.get("/stats")
async def get_stats(
    db   : AsyncSession = Depends(get_db),
    email: str          = Depends(verify_token)
):
    total_jds   = (await db.execute(
        select(func.count()).select_from(JobDescription))).scalar()
    total_cvs   = (await db.execute(
        select(func.count()).select_from(CV))).scalar()
    total_apps  = (await db.execute(
        select(func.count()).select_from(Application))).scalar()
    total_emp   = (await db.execute(
        select(func.count()).select_from(Employer))).scalar()

    # Applications by status
    status_rows = await db.execute(
        select(Application.status, func.count())
        .group_by(Application.status)
    )
    by_status = {row[0]: row[1] for row in status_rows}

    # Avg match score
    avg_score = (await db.execute(
        select(func.avg(Application.score))
        .where(Application.score.isnot(None))
    )).scalar()

    return {
        "total_jds"        : total_jds,
        "total_cvs"        : total_cvs,
        "total_applications": total_apps,
        "total_employers"  : total_emp,
        "by_status"        : by_status,
        "avg_match_score"  : round(float(avg_score or 0) * 100, 1),
    }


# ── Employers ─────────────────────────────────────────────
class EmployerCreate(BaseModel):
    name        : str
    email       : str
    company_info: Optional[str] = ""

@router.get("/employers")
async def get_employers(
    db   : AsyncSession = Depends(get_db),
    email: str          = Depends(verify_token)
):
    result = await db.execute(
        select(Employer).order_by(Employer.created_at.desc())
    )
    employers = result.scalars().all()
    return [
        {
            "id"          : str(e.id),
            "name"        : e.name,
            "email"       : e.email,
            "company_info": e.company_info,
            "created_at"  : e.created_at.isoformat() if e.created_at else None,
        }
        for e in employers
    ]

@router.post("/employers")
async def create_employer(
    data : EmployerCreate,
    db   : AsyncSession = Depends(get_db),
    email: str          = Depends(verify_token)
):
    employer = Employer(
        id          =uuid4(),
        name        =data.name,
        email       =data.email,
        company_info=data.company_info
    )
    db.add(employer)
    await db.commit()
    await db.refresh(employer)
    return {"id": str(employer.id), "name": employer.name}

@router.delete("/employers/{employer_id}")
async def delete_employer(
    employer_id: UUID,
    db         : AsyncSession = Depends(get_db),
    email      : str          = Depends(verify_token)
):
    employer = await db.get(Employer, employer_id)
    if not employer:
        raise HTTPException(status_code=404, detail="Employer not found")
    await db.delete(employer)
    await db.commit()
    return {"message": "Deleted successfully"}


# ── JD Text Parser ────────────────────────────────────────
# Tiền tố số/chữ số La Mã tùy chọn: "1.", "2)", "I.", "II."
_NUM_PFX = r'(?:(?:\d+|I{1,3}V?|VI{0,3}|IX|IV|XI{0,3})[.)。]\s*)?'

_TITLE_RE = re.compile(
    r'^(?:job\s*title|position|role|vị\s*trí|chức\s*danh|tên\s*vị\s*trí)\s*[:：]\s*(.+)',
    re.IGNORECASE,
)
_DESC_RE = re.compile(
    r'^' + _NUM_PFX +
    r'(?:mô\s*tả(?:\s*công\s*việc)?|nhiệm\s*vụ(?:\s*chính)?|'
    r'công\s*việc(?:\s*cụ\s*thể)?|trách\s*nhiệm(?:\s*chính)?|'
    r'job\s*description|key\s*responsibilities?|responsibilities?|'
    r'about\s*(?:the\s*)?role|what\s*you(?:\'?ll)?\s*do|overview|duties)',
    re.IGNORECASE,
)
_REQ_RE = re.compile(
    r'^' + _NUM_PFX +
    r'(?:yêu\s*cầu(?:\s*(?:ứng\s*viên|công\s*việc|chung))?|'
    r'kỹ\s*năng(?:\s*yêu\s*cầu)?|tiêu\s*chuẩn|'
    r'requirements?|job\s*requirements?|qualifications?|'
    r'skills?\s*(?:required|needed)?|'
    r'what\s*you(?:\'?ll)?\s*(?:need|bring|have)|who\s*you\s*are)',
    re.IGNORECASE,
)
# _STOP_RE: yêu cầu keyword phải là TOÀN BỘ nội dung dòng (+ dấu : / - tuỳ chọn)
# → tránh "we offer training" hay "contact us at..." bên trong requirements bị cắt sớm
_STOP_RE = re.compile(
    r'^' + _NUM_PFX +
    r'(?:quyền\s*lợi|phúc\s*lợi|đãi\s*ngộ|mức\s*lương|lương\s*thưởng|'
    r'benefits?|what\s*we\s*offer|we\s*offer|perks?|compensation|'
    r'về\s*công\s*ty|thông\s*tin\s*(?:công\s*ty|liên\s*hệ)|thông\s*tin\s*tuyển\s*dụng|'
    r'about\s*(?:the\s*)?company|contact\s*(?:us|info(?:rmation)?)?|liên\s*hệ|'
    r'địa\s*điểm|hình\s*thức\s*làm\s*việc|môi\s*trường\s*làm\s*việc)'
    r'\s*[:\-]?\s*$',          # ← phải kết thúc dòng, không có nội dung phía sau
    re.IGNORECASE,
)


def _parse_jd_text(raw: str) -> dict:
    """Parse raw JD text into title, description, requirements using regex headings."""
    text = raw.strip().replace('\r\n', '\n').replace('\r', '\n')
    lines = [l.rstrip() for l in text.split('\n')]

    def _match_heading(pattern: re.Pattern, line: str):
        m = pattern.match(line)
        if not m:
            return False, ""
        rest = line[m.end():].lstrip(":：- \t")
        return True, rest

    # --- Extract title ---
    title = ""
    for line in lines[:15]:
        s = line.strip()
        if not s:
            continue
        m = _TITLE_RE.match(s)
        if m:
            title = m.group(1).strip()
            break
        # Bỏ qua các dòng là section heading (không phải title)
        if _DESC_RE.match(s) or _REQ_RE.match(s) or _STOP_RE.match(s):
            continue
        if not title and len(s) < 120:
            title = s   # dòng ngắn đầu tiên không phải heading

    # --- Section parsing ---
    current: Optional[str] = None
    buckets: dict = {"description": [], "requirements": []}

    for line in lines:
        s = line.strip()
        if re.match(r'^[-=*#_]{3,}$', s):   # decoration separator
            continue

        is_desc, desc_rest = _match_heading(_DESC_RE, s)
        is_req,  req_rest  = _match_heading(_REQ_RE,  s)
        is_stop, _         = _match_heading(_STOP_RE, s)

        if is_desc:
            current = "description"
            if desc_rest:
                buckets["description"].append(desc_rest)
            continue
        if is_req:
            current = "requirements"
            if req_rest:
                buckets["requirements"].append(req_rest)
            continue
        if is_stop:
            current = None
            continue

        if current in buckets:
            # Bỏ qua blank lines đầu section, giữ lại blank lines giữa nội dung
            if s or buckets[current]:
                buckets[current].append(s)

    description  = re.sub(r'\n{3,}', '\n\n',
                           '\n'.join(buckets["description"])).strip()
    requirements = re.sub(r'\n{3,}', '\n\n',
                           '\n'.join(buckets["requirements"])).strip()

    # Fallback: no sections found → rough 2/3 + 1/3 split
    if not description and not requirements:
        body = [l.strip() for l in lines if l.strip() and l.strip() != title]
        mid  = max(1, len(body) * 2 // 3)
        description  = '\n'.join(body[:mid])
        requirements = '\n'.join(body[mid:])

    return {"title": title, "description": description, "requirements": requirements}


async def _parse_jd_groq(raw: str) -> dict:
    """
    Dùng Groq LLM để parse JD thành dữ liệu sạch tối ưu cho SBERT matching.
    requirements trả về dạng comma-separated skills thuần túy — không có noise token.
    """
    prompt = f"""You are a job description parser for an AI resume matching system.
Extract structured data from the job posting below and return ONLY a JSON object with exactly 3 keys:

"title": The job title (concise string, e.g. "AI/ML Engineer")

"description": 2–4 sentence summary of key responsibilities.
  - Dense, factual prose — no bullet points, no headers
  - Focus on what the person will actually do

"requirements": Comma-separated technical skills and tools ONLY.
  INCLUDE: programming languages, frameworks, libraries, platforms, methodologies, tools
  EXCLUDE: years of experience, soft skills, degree requirements, company benefits, filler phrases
  FORMAT EXAMPLE: "Python, PyTorch, NLP, Computer Vision, MLOps, CUDA, SQL"
  Maximum 15 items. Each item max 3 words.

Job posting (first 3000 chars):
{raw[:3000]}

Return valid JSON only. No markdown, no explanation."""

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.GROQ_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": "llama-3.1-8b-instant",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.1,
                "max_tokens": 512,
            },
        )
        resp.raise_for_status()
        data = resp.json()
    raw_content = data["choices"][0]["message"]["content"].strip()

    # Strip markdown code fences nếu model trả về ```json ... ```
    raw_content = re.sub(r"^```(?:json)?\s*", "", raw_content)
    raw_content = re.sub(r"\s*```$", "", raw_content)

    parsed = json.loads(raw_content)

    if not all(k in parsed for k in ("title", "description", "requirements")):
        raise ValueError(f"Groq response missing required fields: {list(parsed.keys())}")

    return {
        "title"       : str(parsed["title"]).strip(),
        "description" : str(parsed["description"]).strip(),
        "requirements": str(parsed["requirements"]).strip(),
    }


class JDParseRequest(BaseModel):
    raw_text: str


@router.post("/jobs/parse-jd")
async def parse_jd_text(
    data : JDParseRequest,
    email: str = Depends(verify_token)
):
    """
    Parse raw JD text → title, description, requirements.
    Ưu tiên Groq LLM (dữ liệu sạch hơn cho matching).
    Fallback về regex nếu Groq lỗi hoặc chưa cấu hình API key.
    """
    if not data.raw_text.strip():
        raise HTTPException(status_code=400, detail="raw_text is empty")

    if settings.GROQ_API_KEY:
        try:
            result = await _parse_jd_groq(data.raw_text)
            return {**result, "parser": "groq"}
        except Exception as e:
            print(f"[parse-jd] Groq failed ({e}), falling back to regex")

    result = _parse_jd_text(data.raw_text)
    return {**result, "parser": "regex"}


# ── Job Descriptions ──────────────────────────────────────
class JDCreate(BaseModel):
    title       : str
    description : str
    requirements: str
    employer_id : UUID

class JDUpdate(BaseModel):
    title       : Optional[str] = None
    description : Optional[str] = None
    requirements: Optional[str] = None

@router.get("/jobs")
async def get_all_jobs(
    page : int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    db   : AsyncSession = Depends(get_db),
    email: str          = Depends(verify_token)
):
    offset = (page - 1) * limit
    result = await db.execute(
        select(JobDescription)
        .order_by(JobDescription.created_at.desc())
        .offset(offset).limit(limit)
    )
    jobs  = result.scalars().all()
    total = (await db.execute(
        select(func.count()).select_from(JobDescription)
    )).scalar()

    return {
        "jobs" : [
            {
                "id"          : str(j.id),
                "title"       : j.title,
                "description" : j.description,
                "requirements": j.requirements,
                "employer_id" : str(j.employer_id) if j.employer_id else None,
                "created_at"  : j.created_at.isoformat() if j.created_at else None,
            }
            for j in jobs
        ],
        "total": total,
        "pages": math.ceil(total / limit)
    }

@router.post("/jobs")
async def create_job(
    data : JDCreate,
    db   : AsyncSession = Depends(get_db),
    email: str          = Depends(verify_token)
):
    content   = f"{data.title}\n{data.description}\n{data.requirements}"
    embedding = get_embedding(content)
    job = JobDescription(
        employer_id =data.employer_id,
        title       =data.title,
        description =data.description,
        requirements=data.requirements,
        embedding   =embedding
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)
    return {"id": str(job.id), "title": job.title}

@router.put("/jobs/{jd_id}")
async def update_job(
    jd_id: UUID,
    data : JDUpdate,
    db   : AsyncSession = Depends(get_db),
    email: str          = Depends(verify_token)
):
    job = await db.get(JobDescription, jd_id)
    if not job:
        raise HTTPException(status_code=404, detail="JD not found")

    if data.title       : job.title        = data.title
    if data.description : job.description  = data.description
    if data.requirements: job.requirements = data.requirements

    # Re-embed nếu có thay đổi
    content      = f"{job.title}\n{job.description}\n{job.requirements}"
    job.embedding = get_embedding(content)

    await db.commit()
    return {"id": str(job.id), "title": job.title}

@router.delete("/jobs/{jd_id}")
async def delete_job(
    jd_id: UUID,
    db   : AsyncSession = Depends(get_db),
    email: str          = Depends(verify_token)
):
    job = await db.get(JobDescription, jd_id)
    if not job:
        raise HTTPException(status_code=404, detail="JD not found")
    await db.execute(
        sql_delete(Application).where(Application.jd_id == jd_id)
    )
    await db.delete(job)
    await db.commit()
    return {"message": "Deleted successfully"}


# ── Applications ──────────────────────────────────────────
@router.get("/applications")
async def get_all_applications(
    page  : int = Query(1, ge=1),
    limit : int = Query(10, ge=1, le=50),
    db    : AsyncSession = Depends(get_db),
    email : str          = Depends(verify_token)
):
    offset = (page - 1) * limit
    result = await db.execute(
        select(Application, JobDescription, CV)
        .join(JobDescription, Application.jd_id == JobDescription.id)
        .join(CV, Application.cv_id == CV.id)
        .order_by(Application.applied_at.desc())
        .offset(offset).limit(limit)
    )
    rows  = result.all()
    total = (await db.execute(
        select(func.count()).select_from(Application)
    )).scalar()

    return {
        "applications": [
            {
                "id"        : str(row.Application.id),
                "status"    : row.Application.status,
                "score"     : round((row.Application.score or 0) * 100, 1),
                "applied_at": row.Application.applied_at.isoformat(),
                "job_title" : row.JobDescription.title,
                "cv_file"   : row.CV.filename,
            }
            for row in rows
        ],
        "total": total,
        "pages": math.ceil(total / limit)
    }

@router.delete("/applications/{app_id}")
async def delete_application(
    app_id: UUID,
    db    : AsyncSession = Depends(get_db),
    email : str          = Depends(verify_token)
):
    app = await db.get(Application, app_id)
    if not app:
        raise HTTPException(status_code=404, detail="Not found")
    await db.delete(app)
    await db.commit()
    return {"message": "Deleted"}