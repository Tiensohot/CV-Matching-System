import os
import shutil
from uuid import UUID
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.models import CV, Application, User
from app.models.schemas import CVResponse
from app.services.cv_service import extract_text, clean_text
from app.services.matching_service import get_embedding
from sqlalchemy import delete as sql_delete

router = APIRouter(prefix="/cv", tags=["CV"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload", response_model=CVResponse)
async def upload_cv(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload CV (PDF hoặc Word) và lưu vào database — yêu cầu đăng nhập"""

    # Kiểm tra định dạng file
    allowed = [".pdf", ".docx", ".doc"]
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Chỉ chấp nhận file PDF hoặc Word. File của bạn: {ext}"
        )

    # Lưu file vào thư mục uploads/
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Trích xuất và làm sạch text
    raw_text = extract_text(file_path)
    cleaned_text = clean_text(raw_text)

    # Tạo vector embedding
    embedding = get_embedding(cleaned_text)

    # Lưu vào database — gán user_id của user đang đăng nhập
    cv = CV(
        user_id=current_user.id,
        filename=file.filename,
        raw_text=cleaned_text,
        embedding=embedding,
    )
    db.add(cv)
    await db.commit()
    await db.refresh(cv)

    return cv


@router.get("/all")
async def get_all_cvs(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lấy danh sách CV của user đang đăng nhập"""
    result = await db.execute(
        select(CV)
        .where(CV.user_id == current_user.id)
        .order_by(CV.uploaded_at.desc())
    )
    cvs = result.scalars().all()
    return [
        {
            "id"         : str(cv.id),
            "filename"   : cv.filename,
            "uploaded_at": cv.uploaded_at.isoformat(),
            "has_text"   : bool(cv.raw_text),
        }
        for cv in cvs
    ]


@router.get("/{cv_id}", response_model=CVResponse)
async def get_cv(
    cv_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lấy thông tin CV theo ID — chỉ được xem CV của chính mình"""
    cv = await db.get(CV, cv_id)
    if not cv:
        raise HTTPException(status_code=404, detail="Không tìm thấy CV")
    if cv.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Bạn không có quyền truy cập CV này")
    return cv


@router.delete("/{cv_id}")
async def delete_cv(
    cv_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Xóa CV khỏi database và file uploads — chỉ được xóa CV của chính mình"""

    cv = await db.get(CV, cv_id)
    if not cv:
        raise HTTPException(status_code=404, detail="CV not found")
    if cv.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Bạn không có quyền xóa CV này")

    # Xóa file vật lý nếu có
    file_path = os.path.join("uploads", cv.filename)
    if os.path.exists(file_path):
        os.remove(file_path)

    # Xóa applications liên quan trước
    await db.execute(
        sql_delete(Application).where(Application.cv_id == cv_id)
    )

    # Xóa CV
    await db.delete(cv)
    await db.commit()

    return {"message": f"Deleted {cv.filename} successfully"}