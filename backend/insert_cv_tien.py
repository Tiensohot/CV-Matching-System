import asyncio
from app.core.database import AsyncSessionLocal
from app.models.models import CV
from app.services.matching_service import get_embedding

CV_TEXT = """
Bui Duc Tien
Intern AI Engineer
Ha Noi University of Industry (HAUI) - Bachelor of Computer Science - GPA: 2.86/4.0

PERSONAL PROFILE
A passionate and ambitious final-year Computer Science student with hands-on experience
in scientific research and contributions. Possesses a solid foundation in Machine Learning,
Natural Language Processing, and Computer Vision. Skilled in developing and deploying AI
solutions, with a strong desire to apply knowledge to real-world and innovative AI projects.

TECHNICAL SKILLS
Programming Languages: Python, C++, C#, HTML, CSS, JavaScript
Frameworks & Libraries: PyTorch, Scikit-learn, FastAPI, Streamlit, TensorFlow, LangChain, NumPy, Pandas, Django
AI Technologies: Machine Learning Algorithms, CNN, Transformer, RAG, YOLO, GAN
Databases: SQL Server, MySQL, PostgreSQL
Tools & Platforms: Docker, Git/GitHub, Kaggle, Google Colab, Postman, Qdrant

PROJECTS
Chat-Web - AI-Powered Fitness Supplement Store
Technologies: Django, JavaScript, FastAPI, Qdrant, Docker, RAG-based Chatbot Architecture
- Developed an e-commerce website for selling fitness supplements using Django, HTML/CSS/JavaScript
- Integrated an AI chatbot based on Retrieval-Augmented Generation (RAG) for real-time health consultation
- Utilized Qdrant as a vector database for storing and retrieving domain-specific fitness knowledge via semantic search
- Built and served backend chatbot APIs using FastAPI, containerized with Docker

Human Detection & Attribute Classification
Technologies: Python, PyTorch, YOLOv8, ResNet-18, YAML Config, OpenCV
- Built a deep learning system to detect humans in images and videos
- Designed and trained a YOLOv8 model for human detection and ResNet-18 classifier for attribute recognition
- Implemented a multi-stage inference pipeline combining detection and classification with OpenCV
- Optimized model performance via YAML configuration tuning and batch normalization

Vietnamese AI-Generated Text Detection System
Technologies: PhoBERT, PyTorch, Flask, HTML/CSS/JavaScript, NLP, Deep Learning
- Developed a deep learning system to distinguish human-written and AI-generated Vietnamese text
- Fine-tuned PhoBERT using PyTorch for text classification with tokenizer, embedding, deep neural architecture
- Built a Flask-based web application for real-time text input and prediction
- Achieved Accuracy 99.6%, F1-score 0.9963, outperforming TF-IDF + SVM and rule-based approaches
- Processed and labeled a dataset of 1,350 samples for model training and evaluation

LANGUAGES
English: Good command of listening, speaking, reading, and writing skills
"""

async def insert_cv():
    async with AsyncSessionLocal() as db:
        # Xoa CV cu
        from sqlalchemy import delete
        from app.models.models import CV as CVModel
        await db.execute(delete(CVModel))
        await db.commit()
        print("Da xoa CV cu")

        # Tao CV moi
        embedding = get_embedding(CV_TEXT)
        cv = CVModel(
            filename="BuiDucTien_AI_Engineer.pdf",
            raw_text=CV_TEXT.strip(),
            embedding=embedding
        )
        db.add(cv)
        await db.commit()
        await db.refresh(cv)
        print(f"CV da tao thanh cong!")
        print(f"cv_id: {cv.id}")

asyncio.run(insert_cv())
