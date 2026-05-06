from pathlib import Path
from pydantic_settings import BaseSettings

env_path = Path(__file__).resolve().parents[3] / ".env"

class Settings(BaseSettings):
    DATABASE_URL : str
    SECRET_KEY   : str
    ALGORITHM    : str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    OPENAI_API_KEY : str = ""
    GEMINI_API_KEY : str = ""        # ← thêm dòng này
    GROQ_API_KEY: str = ""
    MAIL_USERNAME: str = ""
    MAIL_PASSWORD: str = ""
    MAIL_FROM      : str = ""
    MAIL_SERVER    : str = "smtp.gmail.com"
    MAIL_PORT      : int = 587
    MAIL_FROM_NAME : str = "CV Matching System"
    ADMIN_EMAIL   : str = "tienvodich456@gmail.com"
    ADMIN_PASSWORD: str = "0946266811"
    class Config:
        env_file = str(env_path)
        extra = "ignore"        # Bỏ qua các field thừa trong .env

settings = Settings()