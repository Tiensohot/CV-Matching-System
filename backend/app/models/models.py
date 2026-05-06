import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Float, ForeignKey, DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector

from app.core.database import Base


class User(Base):
    """Người dùng đăng ký qua email."""
    __tablename__ = "users"

    id              = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name            = Column(String(255), nullable=False)
    email           = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    created_at      = Column(DateTime, default=datetime.utcnow)

    cvs          = relationship("CV",          back_populates="user")
    applications = relationship("Application", back_populates="user")


class Employer(Base):
    __tablename__ = "employers"

    id           = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name         = Column(String(255), nullable=False)
    email        = Column(String(255), unique=True, nullable=False)
    company_info = Column(Text)
    created_at   = Column(DateTime, default=datetime.utcnow)

    job_descriptions = relationship("JobDescription", back_populates="employer")


class JobDescription(Base):
    __tablename__ = "job_descriptions"

    id           = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    employer_id  = Column(UUID(as_uuid=True), ForeignKey("employers.id"))
    title        = Column(String(255), nullable=False)
    description  = Column(Text)
    requirements = Column(Text)
    email        = Column(String(255), nullable=True)   # email nhà tuyển dụng
    embedding    = Column(Vector(768))
    created_at   = Column(DateTime, default=datetime.utcnow)

    employer     = relationship("Employer", back_populates="job_descriptions")
    applications = relationship("Application", back_populates="job_description")


class CV(Base):
    __tablename__ = "cvs"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id     = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    filename    = Column(String(255), nullable=False)
    raw_text    = Column(Text)
    embedding   = Column(Vector(768))
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    user         = relationship("User", back_populates="cvs", foreign_keys=[user_id])
    applications = relationship("Application", back_populates="cv")


class Application(Base):
    __tablename__ = "applications"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id    = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    cv_id      = Column(UUID(as_uuid=True), ForeignKey("cvs.id"))
    jd_id      = Column(UUID(as_uuid=True), ForeignKey("job_descriptions.id"), nullable=True)
    score      = Column(Float)
    status     = Column(String(50), default="pending")
    applied_at = Column(DateTime, default=datetime.utcnow)

    # Fields cho chức năng gửi email ứng tuyển
    applicant_name  = Column(String(255), nullable=True)
    applicant_email = Column(String(255), nullable=True)
    employer_email  = Column(String(255), nullable=True)
    cover_message   = Column(Text, nullable=True)
    source          = Column(String(50), default="database")  # database | remoteok
    remote_job_url  = Column(String(512), nullable=True)
    job_title       = Column(String(255), nullable=True)
    company_name    = Column(String(255), nullable=True)

    user            = relationship("User", back_populates="applications", foreign_keys=[user_id])
    cv              = relationship("CV",  back_populates="applications")
    job_description = relationship("JobDescription", back_populates="applications")
