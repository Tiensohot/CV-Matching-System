import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Float, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector

from app.core.database import Base


class Employer(Base):
    __tablename__ = "employers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    company_info = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Quan hệ: 1 employer có nhiều JD
    job_descriptions = relationship("JobDescription", back_populates="employer")


class JobDescription(Base):
    __tablename__ = "job_descriptions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    employer_id = Column(UUID(as_uuid=True), ForeignKey("employers.id"))
    title = Column(String(255), nullable=False)
    description = Column(Text)
    requirements = Column(Text)
    embedding = Column(Vector(768))   # Vector 768 chiều của SBERT
    created_at = Column(DateTime, default=datetime.utcnow)

    employer = relationship("Employer", back_populates="job_descriptions")
    applications = relationship("Application", back_populates="job_description")


class CV(Base):
    __tablename__ = "cvs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    filename = Column(String(255), nullable=False)
    raw_text = Column(Text)
    embedding = Column(Vector(768))   # Vector 768 chiều của SBERT
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    applications = relationship("Application", back_populates="cv")


class Application(Base):
    __tablename__ = "applications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cv_id = Column(UUID(as_uuid=True), ForeignKey("cvs.id"))
    jd_id = Column(UUID(as_uuid=True), ForeignKey("job_descriptions.id"))
    score = Column(Float)             # Điểm matching 0.0 - 1.0
    status = Column(String(50), default="pending")  # pending/sent/viewed
    applied_at = Column(DateTime, default=datetime.utcnow)

    cv = relationship("CV", back_populates="applications")
    job_description = relationship("JobDescription", back_populates="applications")