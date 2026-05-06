import smtplib
import logging
import asyncio
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from functools import partial
from pathlib import Path

from app.core.config import settings

logger = logging.getLogger(__name__)


def _send_sync(
    to_email       : str,
    applicant_name : str,
    applicant_email: str,
    job_title      : str,
    company_name   : str,
    matching_score : float,
    cv_file_path   : str,
    cover_message  : str = "",
) -> dict:
    from_name = getattr(settings, "MAIL_FROM_NAME", "CV Matching System")

    msg = MIMEMultipart("mixed")
    msg["From"]    = f"{from_name} <{settings.MAIL_USERNAME}>"
    msg["To"]      = to_email
    msg["Subject"] = f"Ứng tuyển vị trí {job_title} - {applicant_name}"

    pct   = round(matching_score * 100, 1)
    color = "#15803d" if pct >= 70 else "#a16207" if pct >= 40 else "#b91c1c"
    bg    = "#dcfce7" if pct >= 70 else "#fef9c3" if pct >= 40 else "#fee2e2"
    cover_html = (
        f"<blockquote style='border-left:3px solid #e5e7eb;margin:16px 0;"
        f"padding:8px 16px;color:#6b7280'>{cover_message}</blockquote>"
        if cover_message else ""
    )

    body_html = f"""
<html><body style="font-family:Arial,sans-serif;color:#333;max-width:600px;margin:0 auto">
  <div style="background:linear-gradient(135deg,#0f172a,#1e3a5f);
              padding:24px 32px;border-radius:8px 8px 0 0">
    <h2 style="color:#fff;margin:0">Hồ sơ ứng tuyển mới</h2>
    <p style="color:#93c5fd;margin:4px 0 0">CV Matching System</p>
  </div>
  <div style="border:1px solid #e5e7eb;border-top:none;
              padding:32px;border-radius:0 0 8px 8px">
    <h3 style="color:#1e3a5f;margin-top:0">Thông tin ứng viên</h3>
    <table style="width:100%;border-collapse:collapse">
      <tr><td style="padding:8px 0;color:#6b7280;width:140px">Họ tên:</td>
          <td style="padding:8px 0;font-weight:600">{applicant_name}</td></tr>
      <tr><td style="padding:8px 0;color:#6b7280">Email:</td>
          <td style="padding:8px 0">
            <a href="mailto:{applicant_email}" style="color:#2563eb">
              {applicant_email}
            </a>
          </td></tr>
      <tr><td style="padding:8px 0;color:#6b7280">Vị trí:</td>
          <td style="padding:8px 0;font-weight:600">{job_title}</td></tr>
      <tr><td style="padding:8px 0;color:#6b7280">Công ty:</td>
          <td style="padding:8px 0">{company_name}</td></tr>
      <tr><td style="padding:8px 0;color:#6b7280">Điểm phù hợp:</td>
          <td style="padding:8px 0">
            <span style="background:{bg};color:{color};
                         padding:3px 12px;border-radius:20px;
                         font-weight:600">{pct}%</span>
          </td></tr>
    </table>
    {cover_html}
    <hr style="border:none;border-top:1px solid #f3f4f6;margin:24px 0">
    <p style="color:#9ca3af;font-size:12px;margin:0">
      Email này được gửi tự động từ hệ thống CV Matching.
      CV đính kèm bên dưới.
    </p>
  </div>
</body></html>
"""
    msg.attach(MIMEText(body_html, "html", "utf-8"))

    if cv_file_path and Path(cv_file_path).exists():
        with open(cv_file_path, "rb") as f:
            part = MIMEBase("application", "octet-stream")
            part.set_payload(f.read())
        encoders.encode_base64(part)
        part.add_header(
            "Content-Disposition",
            f'attachment; filename="{Path(cv_file_path).name}"',
        )
        msg.attach(part)

    with smtplib.SMTP(settings.MAIL_SERVER, settings.MAIL_PORT) as server:
        server.ehlo()
        server.starttls()
        server.login(settings.MAIL_USERNAME, settings.MAIL_PASSWORD)
        server.sendmail(settings.MAIL_USERNAME, to_email, msg.as_string())

    logger.info(
        "Email sent to %s for %s → %s", to_email, applicant_name, job_title
    )
    return {"success": True, "message": "Email sent"}


async def send_application_email(
    to_email       : str,
    applicant_name : str,
    applicant_email: str,
    job_title      : str,
    company_name   : str,
    matching_score : float,
    cv_file_path   : str,
    cover_message  : str = "",
) -> dict:
    if not settings.MAIL_USERNAME or not settings.MAIL_PASSWORD:
        logger.warning("SMTP not configured, skipping email")
        return {"success": False, "message": "SMTP not configured"}

    loop = asyncio.get_event_loop()
    fn = partial(
        _send_sync,
        to_email, applicant_name, applicant_email,
        job_title, company_name, matching_score,
        cv_file_path, cover_message,
    )
    try:
        return await loop.run_in_executor(None, fn)
    except Exception as exc:
        logger.error("Failed to send email: %s", exc)
        return {"success": False, "message": str(exc)}
