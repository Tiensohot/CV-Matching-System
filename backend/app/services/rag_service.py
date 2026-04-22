import re
import json
import time
import httpx
from openai import OpenAI
from app.core.config import settings


def analyze_cv_vs_jd(cv_text        : str,
                     jd_title       : str,
                     jd_description : str,
                     jd_requirements: str,
                     match_score    : float) -> dict:
    """
    Phân tích CV vs JD bằng OpenAI GPT-4o Mini.
    Fallback rule-based nếu chưa có API key.
    """
    if settings.OPENAI_API_KEY and \
       settings.OPENAI_API_KEY not in ("", "sk-your-key-here"):
        return _analyze_with_openai(
            cv_text, jd_title,
            jd_description, jd_requirements, match_score
        )
    else:
        print("OPENAI_API_KEY chua set — dung rule-based fallback")
        return _analyze_rule_based(
            cv_text, jd_title, jd_requirements, match_score
        )


def _analyze_with_openai(cv_text, jd_title,
                         jd_description, jd_requirements, match_score):
    """Phân tích bằng OpenAI GPT-4o Mini"""

    client = OpenAI(
        api_key=settings.OPENAI_API_KEY,
        http_client=httpx.Client()   # bypass openai 1.30 / httpx 0.28 conflict
    )

    prompt = f"""You are an expert HR consultant and career advisor.
Analyze the candidate CV against the Job Description below.

=== JOB DESCRIPTION ===
Title       : {jd_title}
Description : {jd_description}
Requirements: {jd_requirements}

=== CANDIDATE CV ===
{cv_text[:3000]}

=== CURRENT MATCH SCORE ===
{round(match_score * 100, 1)}%

Respond ONLY with this JSON structure, no extra text:
{{
  "overall_assessment": "2-3 sentence overall assessment of the candidate",
  "match_percentage"  : {round(match_score * 100, 1)},
  "strengths": [
    {{"skill": "skill name", "detail": "why this is a strength for this role"}}
  ],
  "missing_skills": [
    {{
      "skill"     : "skill name",
      "importance": "high or medium or low",
      "suggestion": "specific way to learn this skill"
    }}
  ],
  "recommendations": [
    "Specific actionable recommendation 1",
    "Specific actionable recommendation 2",
    "Specific actionable recommendation 3"
  ],
  "verdict": "Good Fit or Potential Fit or No Fit"
}}"""

    max_retries = 3
    for attempt in range(max_retries):
        try:
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role"   : "system",
                        "content": "You are an expert HR consultant. Respond with valid JSON only, no markdown."
                    },
                    {
                        "role"   : "user",
                        "content": prompt
                    }
                ],
                temperature=0.3,
                max_tokens=1500,
                response_format={"type": "json_object"}
            )

            raw = response.choices[0].message.content.strip()

            # Làm sạch markdown nếu có
            if raw.startswith("```"):
                raw = re.sub(r"```(?:json)?", "", raw).strip().rstrip("```").strip()

            result = json.loads(raw)
            result.setdefault("overall_assessment", "Analysis completed.")
            result.setdefault("match_percentage",   round(match_score * 100, 1))
            result.setdefault("strengths",          [])
            result.setdefault("missing_skills",     [])
            result.setdefault("recommendations",    [])
            result.setdefault("verdict",            "Potential Fit")
            return result

        except Exception as e:
            error_msg = str(e)
            if "429" in error_msg or "rate" in error_msg.lower():
                wait_time = 30 * (attempt + 1)
                print(f"Rate limit — doi {wait_time}s "
                      f"(lan {attempt+1}/{max_retries})...")
                time.sleep(wait_time)
            else:
                raise e

    print("Het retry — dung rule-based fallback")
    return _analyze_rule_based(
        cv_text, jd_title, jd_requirements, match_score
    )


def _analyze_rule_based(cv_text, jd_title, jd_requirements, match_score):
    """Fallback — phân tích bằng keyword matching"""

    cv_lower  = cv_text.lower()
    req_lower = jd_requirements.lower()

    keywords = [
        kw.strip()
        for kw in re.split(r"[,.\n]", req_lower)
        if len(kw.strip()) > 2
    ]

    strengths      = []
    missing_skills = []

    for kw in keywords:
        if not kw:
            continue
        if kw in cv_lower:
            strengths.append({
                "skill" : kw.title(),
                "detail": f"Candidate has hands-on experience with {kw}"
            })
        else:
            missing_skills.append({
                "skill"     : kw.title(),
                "importance": "medium",
                "suggestion": f"Learn {kw} through online courses or projects"
            })

    pct = round(match_score * 100, 1)

    if   pct >= 70: verdict = "Good Fit"
    elif pct >= 40: verdict = "Potential Fit"
    else:           verdict = "No Fit"

    return {
        "overall_assessment": (
            f"Candidate matches {pct}% of requirements for {jd_title}. "
            f"Found {len(strengths)} matching skills and "
            f"{len(missing_skills)} skills to develop."
        ),
        "match_percentage": pct,
        "strengths"       : strengths[:5],
        "missing_skills"  : missing_skills[:5],
        "recommendations" : [
            f"Focus on: "
            f"{', '.join([m['skill'] for m in missing_skills[:3]])}",
            "Add more project experience to demonstrate practical skills",
            "Tailor your CV to highlight relevant experience for this role"
        ],
        "verdict": verdict
    }