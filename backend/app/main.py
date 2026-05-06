from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import cv, jobs, applications, admin, remote_jobs, auth
from app.core.init_db import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title="CV Matching System",
    version="1.0.0",
    lifespan=lifespan
)

# Cho phép frontend React gọi API (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Đăng ký các router
app.include_router(cv.router)
app.include_router(jobs.router)
app.include_router(applications.router)
app.include_router(admin.router)
app.include_router(remote_jobs.router)
app.include_router(auth.router)


@app.get("/")
async def root():
    return {"message": "CV Matching API đang chạy!"}


@app.get("/health")
async def health():
    return {"status": "ok"}
