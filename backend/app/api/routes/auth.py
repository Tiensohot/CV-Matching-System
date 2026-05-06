import bcrypt

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.auth import create_access_token
from app.models.models import User

router = APIRouter(prefix="/auth", tags=["Auth"])


def _hash_pw(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8")[:72], bcrypt.gensalt()).decode("utf-8")


def _verify_pw(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8")[:72], hashed.encode("utf-8"))


class RegisterBody(BaseModel):
    name    : str
    email   : EmailStr
    password: str


class LoginBody(BaseModel):
    email   : EmailStr
    password: str


@router.post("/register")
async def register(body: RegisterBody, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email đã được đăng ký")

    user = User(
        name            = body.name,
        email           = body.email,
        hashed_password = _hash_pw(body.password),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_access_token({"sub": user.email, "user_id": str(user.id)})
    return {
        "token": token,
        "user" : {"id": str(user.id), "name": user.name, "email": user.email},
    }


@router.post("/login")
async def login(body: LoginBody, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    user   = result.scalar_one_or_none()
    if not user or not _verify_pw(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Email hoặc mật khẩu không đúng")

    token = create_access_token({"sub": user.email, "user_id": str(user.id)})
    return {
        "token": token,
        "user" : {"id": str(user.id), "name": user.name, "email": user.email},
    }
