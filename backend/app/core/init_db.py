import os
import shutil
from sqlalchemy import text
from app.core.database import engine, Base
from app.models import models  # noqa: F401 — import để Base nhận diện các bảng

UPLOAD_DIR = "uploads"


async def init_db():
    async with engine.begin() as conn:
        # Bật extension pgvector
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))

        # ── Phương án B: Xóa toàn bộ dữ liệu CVs và Applications cũ ────────
        # Xóa applications trước (FK → cvs)
        await conn.execute(text("DELETE FROM applications"))
        # Xóa cvs
        await conn.execute(text("DELETE FROM cvs"))

        # Xóa file vật lý trong thư mục uploads/
        if os.path.isdir(UPLOAD_DIR):
            for fname in os.listdir(UPLOAD_DIR):
                fpath = os.path.join(UPLOAD_DIR, fname)
                if os.path.isfile(fpath):
                    try:
                        os.remove(fpath)
                    except Exception:
                        pass  # Bỏ qua lỗi xóa file

        # ── Tạo / cập nhật schema ────────────────────────────────────────────
        # Tạo tất cả bảng mới (không xóa bảng cũ)
        await conn.run_sync(Base.metadata.create_all)

        # Thêm email cho job_descriptions
        await conn.execute(text(
            "ALTER TABLE job_descriptions "
            "ADD COLUMN IF NOT EXISTS email VARCHAR(255)"
        ))
        # Backfill email từ employers cho các JD chưa có email
        await conn.execute(text("""
            UPDATE job_descriptions jd
            SET email = e.email
            FROM employers e
            WHERE jd.employer_id = e.id
              AND jd.email IS NULL
              AND e.email IS NOT NULL
        """))

        # Thêm cột mới vào bảng applications nếu chưa tồn tại
        new_cols = [
            ("applicant_name",  "VARCHAR(255)"),
            ("applicant_email", "VARCHAR(255)"),
            ("employer_email",  "VARCHAR(255)"),
            ("cover_message",   "TEXT"),
            ("source",          "VARCHAR(50)"),
            ("remote_job_url",  "VARCHAR(512)"),
            ("job_title",       "VARCHAR(255)"),
            ("company_name",    "VARCHAR(255)"),
        ]
        for col, col_type in new_cols:
            await conn.execute(text(
                f"ALTER TABLE applications "
                f"ADD COLUMN IF NOT EXISTS {col} {col_type}"
            ))

        # Thêm cột user_id vào cvs và applications nếu chưa tồn tại
        await conn.execute(text(
            "ALTER TABLE cvs "
            "ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id)"
        ))
        await conn.execute(text(
            "ALTER TABLE applications "
            "ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id)"
        ))

    print("Database initialized successfully! (Old CVs and Applications cleared)")
