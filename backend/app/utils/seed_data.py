import asyncio
from uuid import uuid4
from app.core.database import AsyncSessionLocal
from app.models.models import Employer, JobDescription
from app.services.matching_service import get_embedding


SAMPLE_JOBS = [
    {
        "title": "Python Backend Developer",
        "description": "Build and maintain scalable backend systems using Python and FastAPI. Design RESTful APIs and integrate with databases.",
        "requirements": "Python, FastAPI, PostgreSQL, Docker, REST API, Git. 2+ years experience. Knowledge of async programming."
    },
    {
        "title": "Frontend Developer ReactJS",
        "description": "Develop modern user interfaces using ReactJS and Tailwind CSS. Collaborate with UX/UI designers to implement responsive designs.",
        "requirements": "ReactJS, JavaScript, HTML, CSS, Tailwind, Git, Redux. 1+ years experience. Experience with REST API integration."
    },
    {
        "title": "Data Scientist",
        "description": "Analyze large datasets and build machine learning models to drive business insights and product decisions.",
        "requirements": "Python, Pandas, Scikit-learn, TensorFlow, SQL, Statistics. 2+ years experience. Strong mathematical background."
    },
    {
        "title": "DevOps Engineer",
        "description": "Manage cloud infrastructure, CI/CD pipelines, and ensure system reliability and scalability across environments.",
        "requirements": "Docker, Kubernetes, AWS, CI/CD, Linux, Terraform, Jenkins. 3+ years experience. Experience with monitoring tools."
    },
    {
        "title": "AI/ML Engineer",
        "description": "Research and deploy state-of-the-art AI models into production systems. Optimize model performance and scalability.",
        "requirements": "Python, PyTorch, NLP, Computer Vision, MLOps, CUDA. 2+ years experience. Strong research background."
    },
    {
        "title": "Full Stack Developer",
        "description": "Design and develop both frontend and backend components for web applications. Own features end-to-end.",
        "requirements": "ReactJS, NodeJS, Python, PostgreSQL, Docker, REST API. 2+ years experience. Strong problem-solving skills."
    },
    {
        "title": "Mobile Developer Flutter",
        "description": "Build cross-platform mobile applications using Flutter and Dart. Integrate with backend APIs and Firebase services.",
        "requirements": "Flutter, Dart, Firebase, REST API, Git, iOS/Android. 1+ years experience. Experience with state management."
    },
    {
        "title": "Database Administrator",
        "description": "Manage, optimize and maintain database systems. Ensure high availability, performance tuning and data integrity.",
        "requirements": "PostgreSQL, MySQL, MongoDB, backup/restore, query optimization, replication. 3+ years experience."
    },
    {
        "title": "Cybersecurity Engineer",
        "description": "Protect systems and networks from cyber threats. Conduct vulnerability assessments and implement security solutions.",
        "requirements": "Network security, Penetration testing, SIEM, Python, Linux, OWASP. 3+ years experience. Security certifications preferred."
    },
    {
        "title": "Business Analyst",
        "description": "Gather and analyze business requirements, create functional specifications, and act as a bridge between stakeholders and engineering teams.",
        "requirements": "Business analysis, SQL, Power BI, Agile, JIRA, strong communication, English proficiency. 2+ years experience."
    },
]


async def seed():
    async with AsyncSessionLocal() as db:
        # Tạo employer mẫu
        employer = Employer(
            id=uuid4(),
            name="Tech Demo Company",
            email="hr@techdemo.com",
            company_info="A leading technology company in Vietnam"
        )
        db.add(employer)
        await db.flush()

        print("Creating embeddings for JDs... (first time may take 1-2 mins)")

        for i, job_data in enumerate(SAMPLE_JOBS):
            text = f"{job_data['title']}\n{job_data['description']}\n{job_data['requirements']}"
            embedding = get_embedding(text)

            job = JobDescription(
                employer_id=employer.id,
                title=job_data["title"],
                description=job_data["description"],
                requirements=job_data["requirements"],
                embedding=embedding
            )
            db.add(job)
            print(f"  [{i+1}/{len(SAMPLE_JOBS)}] {job_data['title']} ✓")

        await db.commit()
        print("\nSeed data successful! Created 10 JDs.")


if __name__ == "__main__":
    asyncio.run(seed())