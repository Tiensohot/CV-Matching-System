import re
import time
import asyncio
from typing import Optional

import httpx
import numpy as np

from app.services import matching_service

MAX_TEXT_LENGTH = 1024   # MAX_LENGTH * 4
_CACHE_TTL      = 300    # 5 phút

_cache_jobs: list  = []
_cache_time: float = 0.0


def _strip_html(html: str) -> str:
    """Xóa HTML tags, trả về plain text."""
    return re.sub(r"<[^>]+>", " ", html or "", flags=re.DOTALL).strip()


_BAD_EMAIL_DOMAINS = {"example.com", "test.com", "domain.com", "email.com"}
_IMG_EXTS = {".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".ico"}

def _extract_email(html: str, apply_url: str = "") -> str:
    """
    Tìm email nhà tuyển dụng từ:
    1. apply_url dạng mailto:hr@company.com
    2. Nội dung HTML của job description
    """
    # 1. mailto trong apply_url
    if apply_url and apply_url.lower().startswith("mailto:"):
        candidate = apply_url[7:].split("?")[0].strip()
        if "@" in candidate and "." in candidate.split("@")[-1]:
            return candidate

    # 2. Quét email trong HTML
    candidates = re.findall(
        r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}",
        html or "",
    )
    for email in candidates:
        domain = email.split("@")[-1].lower()
        # Lọc false positive
        if domain in _BAD_EMAIL_DOMAINS:
            continue
        if any(email.lower().endswith(ext) for ext in _IMG_EXTS):
            continue
        if len(email) > 100:
            continue
        return email

    return ""


async def fetch_remote_jobs(
    country: Optional[str] = None,
    limit  : int = 100,
) -> list:
    """
    Lấy danh sách job từ RemoteOK API.
    Cache 5 phút để tránh gọi API quá nhiều.
    """
    global _cache_jobs, _cache_time

    now = time.time()
    if _cache_jobs and (now - _cache_time) < _CACHE_TTL:
        raw_jobs = _cache_jobs
    else:
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.get(
                    "https://remoteok.com/api",
                    headers={"User-Agent": "CV-Matching-System/1.0"},
                    follow_redirects=True,
                )
                resp.raise_for_status()
                data = resp.json()
        except Exception as exc:
            raise RuntimeError(f"RemoteOK API không khả dụng: {exc}") from exc

        raw_jobs = []
        for item in data:
            if not isinstance(item, dict) or not item.get("position"):
                continue
            raw_html   = item.get("description", "")
            apply_url  = item.get("apply_url", "")
            desc_clean = _strip_html(raw_html)
            tags       = item.get("tags") or []
            combined   = f"{item.get('position', '')} {desc_clean} {' '.join(tags)}"
            raw_jobs.append({
                "id"               : str(item.get("id", "")),
                "position"         : item.get("position", ""),
                "company"          : item.get("company", ""),
                "description_clean": desc_clean,
                "tags"             : tags,
                "location"         : item.get("location") or "Worldwide",
                "url"              : item.get("url", ""),
                "logo"             : item.get("company_logo", ""),
                "employer_email"   : _extract_email(raw_html, apply_url),
                "combined_text"    : combined[:MAX_TEXT_LENGTH],
            })

        _cache_jobs = raw_jobs
        _cache_time = now

    jobs = _cache_jobs
    if country:
        jobs = [j for j in jobs if country.lower() in j["location"].lower()]

    return jobs[:limit]


def match_cv_with_remote_jobs(
    cv_embedding: list,
    remote_jobs : list,
    top_k       : int = 10,
) -> list:
    """
    Encode combined_text của từng JD bằng model SBERT đã load sẵn,
    tính cosine similarity với CV embedding, trả về top-k.
    """
    if not remote_jobs:
        return []

    texts = [j["combined_text"] for j in remote_jobs]
    jd_embeddings = matching_service.model.encode(
        texts,
        normalize_embeddings=True,
        show_progress_bar=False,
        batch_size=32,
    )

    cv_vec = np.array(cv_embedding)
    scores = [float(np.dot(cv_vec, emb)) for emb in jd_embeddings]

    ranked = sorted(zip(scores, remote_jobs), key=lambda x: x[0], reverse=True)

    results = []
    for score, job in ranked[:top_k]:
        if score >= 0.70:
            label = "Good Fit"
        elif score >= 0.40:
            label = "Potential Fit"
        else:
            label = "No Fit"
        results.append({
            "position"         : job["position"],
            "company"          : job["company"],
            "score"            : round(score, 4),
            "label"            : label,
            "location"         : job["location"],
            "url"              : job["url"],
            "logo"             : job["logo"],
            "tags"             : job["tags"],
            "description_clean": job["description_clean"],
            "employer_email"   : job.get("employer_email", ""),
        })
    return results
