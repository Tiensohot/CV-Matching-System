# CV Matching System

Hệ thống tuyển dụng thông minh tự động so khớp hồ sơ ứng viên (CV) với mô tả công việc (JD) sử dụng Semantic Embedding và Large Language Model.

> **Đồ án tốt nghiệp** — Trường Đại học Công nghiệp Hà Nội (HAUI) — Bùi Đức Tiến — 2022606559 — 2026

---

## Mục lục

- [Giới thiệu](#giới-thiệu)
- [Tính năng chính](#tính-năng-chính)
- [Kiến trúc hệ thống](#kiến-trúc-hệ-thống)
- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [Cài đặt và chạy](#cài-đặt-và-chạy)
- [Cấu trúc thư mục](#cấu-trúc-thư-mục)
- [API Reference](#api-reference)
- [Cơ sở dữ liệu](#cơ-sở-dữ-liệu)
- [Mô hình AI/ML](#mô-hình-aiml)

---

## Giới thiệu

Tuyển dụng truyền thống tốn nhiều thời gian đọc hồ sơ thủ công và dễ bỏ sót ứng viên tiềm năng do giới hạn của keyword matching. Hệ thống này giải quyết bằng cách:

- Sử dụng **Sentence-BERT fine-tuned** để tạo vector embedding 768 chiều cho CV và JD, hiểu ngữ nghĩa thay vì từ khóa đơn thuần
- Lưu vector vào **PostgreSQL + pgvector** để tìm kiếm top-K trong thời gian thực
- Gọi **GPT-4o-mini** phân tích chi tiết từng cặp CV-JD, trả về điểm mạnh, thiếu sót và gợi ý cụ thể
- Hỗ trợ **tìm việc remote toàn cầu** từ RemoteOK.com theo thời gian thực

---

## Tính năng chính

**Dành cho ứng viên:**
- Đăng ký / đăng nhập tài khoản cá nhân (JWT)
- Upload CV (PDF/DOCX), hỗ trợ OCR cho file scan — CV riêng tư theo từng tài khoản
- Tự động tìm top-10 công việc phù hợp nhất theo độ tương đồng ngữ nghĩa
- Phân tích chi tiết CV vs JD bằng GPT-4o-mini: điểm mạnh, kỹ năng còn thiếu, khuyến nghị
- Nộp đơn ứng tuyển kèm cover letter, gửi email tự động tới nhà tuyển dụng
- Xem lịch sử và trạng thái các đơn ứng tuyển cá nhân
- Tab **Remote Jobs**: tìm kiếm việc làm remote toàn cầu từ RemoteOK.com theo thời gian thực

**Dành cho Admin:**
- Quản lý tin tuyển dụng (JD): tạo thủ công hoặc **auto-parse từ text thô** bằng AI
- Quản lý nhà tuyển dụng (employer)
- Theo dõi toàn bộ đơn ứng tuyển và cập nhật trạng thái
- Dashboard thống kê tổng quan

---

## Kiến trúc hệ thống

```
┌─────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                     │
│  ┌──────────────┐        ┌──────────────────────────┐   │
│  │  User App    │        │      Admin Panel          │   │
│  │  (Login /    │        │  (Dashboard / Jobs /      │   │
│  │   Upload /   │        │   Employers / Apps)       │   │
│  │   Remote)    │        │                           │   │
│  └──────┬───────┘        └─────────────┬─────────────┘   │
└─────────┼───────────────────────────────┼───────────────┘
          │ HTTP + JWT (Axios)            │ HTTP + JWT
          ▼                               ▼
┌─────────────────────────────────────────────────────────┐
│                  BACKEND (FastAPI)                        │
│  /auth  /cv  /jobs  /applications  /admin  /remote       │
│                                                          │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │ cv_service  │  │matching_svc  │  │  rag_service   │  │
│  │ (PDF/DOCX   │  │ (SBERT embed │  │ (GPT-4o-mini   │  │
│  │  extract)   │  │  + cosine)   │  │  analysis)     │  │
│  └─────────────┘  └──────────────┘  └────────────────┘  │
│  ┌─────────────┐  ┌──────────────┐                       │
│  │email_service│  │ remote_svc   │                       │
│  │ (SMTP gửi   │  │ (RemoteOK    │                       │
│  │  CV qua     │  │  proxy)      │                       │
│  │  email)     │  │              │                       │
│  └─────────────┘  └──────────────┘                       │
└──────────────────────────┬──────────────────────────────┘
                           │ SQLAlchemy async
                           ▼
┌─────────────────────────────────────────────────────────┐
│              PostgreSQL 16 + pgvector                    │
│  Tables: users, employers, job_descriptions,             │
│          cvs, applications                               │
│  Vector columns: embedding VECTOR(768)                   │
│  Operator: <=> (cosine distance)                         │
└─────────────────────────────────────────────────────────┘
```

**Luồng matching CV-JD:**
1. Ứng viên đăng nhập → upload CV (PDF/DOCX)
2. Backend trích xuất text → làm sạch → SBERT encode → vector 768 chiều → lưu DB
3. pgvector tìm top-10 JD gần nhất (`ORDER BY embedding <=> :cv_vector LIMIT 10`)
4. Trả về danh sách jobs với score + label (Good Fit / Potential Fit / No Fit)
5. Ứng viên chọn JD → GPT-4o-mini phân tích chi tiết
6. Nhận phản hồi JSON: strengths, missing skills, recommendations, verdict
7. Ứng viên nộp đơn → email tự động gửi CV tới nhà tuyển dụng

---

## Công nghệ sử dụng

| Tầng | Công nghệ |
|------|-----------|
| **Backend API** | FastAPI 0.111 (Python async) |
| **Frontend** | React 19 + Vite 8 + Tailwind CSS 3 |
| **Database** | PostgreSQL 16 + pgvector |
| **Embedding Model** | Sentence-BERT fine-tuned (`sbert-cv-jd-hardneg`) |
| **LLM Analysis** | OpenAI GPT-4o-mini / Groq / Gemini (tùy chọn) |
| **ORM** | SQLAlchemy 2.0 (async) |
| **Auth** | JWT (python-jose) + OAuth2 — cả user lẫn admin |
| **Email** | SMTP (smtplib) gửi CV kèm file đính kèm |
| **File Parsing** | pdfplumber, python-docx, pytesseract OCR |
| **Remote Jobs** | RemoteOK.com public API (proxy qua backend) |
| **Containerization** | Docker Compose (3 services) |

---

## Cài đặt và chạy

### Yêu cầu

- Docker & Docker Compose
- OpenAI / Groq / Gemini API Key (tùy chọn — có fallback rule-based)

### Chạy với Docker Compose

**1. Clone repository và tạo file `.env`:**

```bash
git clone <repo-url>
cd cv-matching-system
cp .env.example .env
```

**2. Chỉnh sửa `.env`:**

```env
DATABASE_URL=postgresql+asyncpg://postgres:password@db:5432/cv_matching
POSTGRES_DB=cv_matching
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password

SECRET_KEY=haui-cv-matching-2026
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480

ADMIN_EMAIL=admin@cvmatching.com
ADMIN_PASSWORD=admin123

# Để trống nếu không dùng phân tích AI
OPENAI_API_KEY=
GROQ_API_KEY=
GEMINI_API_KEY=

# Để trống nếu không dùng tính năng gửi email
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_FROM=
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_FROM_NAME=CV Matching System
```

**3. Khởi động toàn bộ hệ thống:**

```bash
docker compose up --build
```

| Service | URL |
|---------|-----|
| Frontend (Ứng viên) | http://localhost:5173 |
| Frontend (Admin) | http://localhost:5173/admin |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |

**4. (Tùy chọn) Khôi phục dữ liệu mẫu:**

```powershell
docker exec -i cv_matching_db psql -U postgres cv_matching < backup.sql
```

**Tạo backup từ database hiện tại:**

```powershell
docker exec cv_matching_db pg_dump -U postgres cv_matching > backup.sql
```

### Chạy thủ công (Development)

**Backend:**

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

**PostgreSQL:** Cần có PostgreSQL 16 với pgvector extension:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

---

## Cấu trúc thư mục

```
cv-matching-system/
├── .env                          # Biến môi trường
├── .env.example                  # Mẫu cấu hình
├── docker-compose.yml            # 3 services: db, backend, frontend
├── backup.sql                    # Dữ liệu mẫu (khôi phục tùy chọn)
│
├── uploads/                      # File CV upload (mount vào host, bền vững)
│
├── backend/
│   ├── requirements.txt
│   └── app/
│       ├── main.py               # FastAPI app entry point
│       ├── core/
│       │   ├── config.py         # Pydantic Settings từ .env
│       │   ├── database.py       # SQLAlchemy async engine
│       │   ├── auth.py           # JWT + password hashing
│       │   └── init_db.py        # Tạo/migrate schema khi startup
│       ├── models/
│       │   ├── models.py         # ORM models
│       │   └── schemas.py        # Pydantic schemas
│       ├── services/
│       │   ├── matching_service.py  # SBERT embed + cosine similarity
│       │   ├── cv_service.py        # PDF/DOCX extract + OCR
│       │   ├── rag_service.py       # GPT-4o-mini / Groq / Gemini analysis
│       │   ├── email_service.py     # Gửi CV qua SMTP
│       │   └── remote.py            # Proxy RemoteOK.com API
│       └── api/routes/
│           ├── auth.py           # Đăng ký / đăng nhập user
│           ├── cv.py             # Upload, xem, xóa CV
│           ├── jobs.py           # Matching + phân tích chi tiết
│           ├── applications.py   # Nộp đơn + lịch sử
│           ├── remote.py         # Remote jobs từ RemoteOK
│           └── admin.py          # Admin CRUD + JD parser
│
└── frontend/
    ├── package.json
    └── src/
        ├── App.jsx               # User app (Login / Upload / Match / Remote)
        ├── services/api.js       # Axios client (user)
        ├── admin/
        │   ├── AdminApp.jsx      # Admin panel
        │   └── api.js            # Admin Axios (JWT interceptor)
        └── components/
            ├── JobCard.jsx
            ├── AnalysisPanel.jsx
            └── UploadCV.jsx
```

---

## API Reference

### Auth — `/auth`

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `POST` | `/auth/register` | Đăng ký tài khoản ứng viên |
| `POST` | `/auth/login` | Đăng nhập, nhận JWT |
| `GET` | `/auth/me` | Thông tin user hiện tại |

### CV — `/cv`

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `POST` | `/cv/upload` | Upload CV (riêng theo user), trích xuất text, tạo embedding |
| `GET` | `/cv/my` | Danh sách CV của user hiện tại |
| `GET` | `/cv/{cv_id}` | Chi tiết một CV |
| `DELETE` | `/cv/{cv_id}` | Xóa CV |

### Jobs — `/jobs`

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET` | `/jobs/match?cv_id=&top_k=10` | **Top-K semantic matching** |
| `POST` | `/jobs/{jd_id}/analyze?cv_id=` | **AI phân tích chi tiết CV vs JD** |
| `GET` | `/jobs/all?page=&limit=` | Danh sách JDs (phân trang) |
| `GET` | `/jobs/{jd_id}` | Chi tiết JD |

### Applications — `/applications`

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `POST` | `/applications/{jd_id}/apply?cv_id=` | Nộp đơn + gửi email CV tới nhà tuyển dụng |
| `GET` | `/applications/my` | Lịch sử ứng tuyển của user hiện tại |
| `PATCH` | `/applications/{app_id}/status` | Cập nhật trạng thái |

### Remote Jobs — `/remote`

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET` | `/remote/jobs?search=&limit=` | Tìm việc remote từ RemoteOK.com |

### Admin — `/admin` *(yêu cầu JWT admin)*

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `POST` | `/admin/login` | Đăng nhập admin, nhận JWT |
| `GET` | `/admin/stats` | Thống kê tổng quan |
| `GET/POST` | `/admin/employers` | Quản lý employers |
| `GET/POST` | `/admin/jobs` | Quản lý JDs |
| `PUT` | `/admin/jobs/{id}` | Cập nhật JD (tự re-embed) |
| `POST` | `/admin/jobs/parse-jd` | **Auto-parse raw JD text bằng AI** |
| `GET` | `/admin/applications` | Danh sách tất cả applications |

---

## Cơ sở dữ liệu

**ERD:**
```
User (1) ──── (N) CV (1) ──── (N) Application (N) ──── (1) JobDescription (N) ──── (1) Employer
```

**Bảng chính:**

| Bảng | Cột quan trọng |
|------|---------------|
| `users` | `id` (UUID), `email`, `hashed_password`, `full_name`, `is_admin` |
| `employers` | `id` (UUID), `name`, `email`, `company_info` |
| `job_descriptions` | `id`, `employer_id` (FK), `title`, `description`, `requirements`, `email`, `embedding VECTOR(768)` |
| `cvs` | `id`, `user_id` (FK), `filename`, `raw_text`, `embedding VECTOR(768)`, `uploaded_at` |
| `applications` | `id`, `cv_id` (FK), `jd_id` (FK), `user_id` (FK), `score`, `status`, `applicant_name`, `applicant_email`, `employer_email`, `cover_message`, `source`, `job_title`, `company_name` |

**Trạng thái application:** `pending` → `sent` → `viewed` → `interview` → `accepted` / `rejected`

**Lưu trữ file CV:**
- **Database**: metadata, nội dung text, vector embedding
- **Filesystem**: file gốc tại `./uploads/` (mount vào host, bền vững qua các lần restart)

**Vector search:**
```sql
SELECT id, title, 1 - (embedding <=> :cv_embedding) AS score
FROM job_descriptions
ORDER BY embedding <=> :cv_embedding
LIMIT :top_k;
```

---

## Mô hình AI/ML

### Sentence-BERT (Embedding)

- **Model:** `sbert-cv-jd-hardneg` (fine-tuned từ `all-mpnet-base-v2`)
- **Kỹ thuật:** Hard negative mining — 3 giai đoạn huấn luyện
- **Output:** Vector 768 chiều, L2 normalized
- **Device:** CUDA nếu có GPU, fallback CPU

**Ngưỡng phân loại:**

| Score | Nhãn |
|-------|------|
| ≥ 0.70 | Good Fit |
| ≥ 0.40 | Potential Fit |
| < 0.40 | No Fit |

### AI Analysis (GPT-4o-mini / Groq / Gemini)

- Temperature: `0.3`, Max tokens: `1500`
- Response format: `json_object` (enforced JSON)
- Retry: 3 lần, exponential backoff
- Fallback rule-based khi không cấu hình API key

**Output mẫu:**
```json
{
  "overall_assessment": "Ứng viên phù hợp tốt với vị trí...",
  "match_percentage": 75.5,
  "strengths": [
    { "skill": "Python", "detail": "3 năm kinh nghiệm thực tế" }
  ],
  "missing_skills": [
    { "skill": "Kubernetes", "importance": "high", "suggestion": "Học qua khóa CKA" }
  ],
  "recommendations": ["Bổ sung chứng chỉ AWS"],
  "verdict": "Good Fit"
}
```

### OCR Pipeline (CV scan)

`pdf2image` (300 DPI) → `pytesseract` → clean text → SBERT encode

---


