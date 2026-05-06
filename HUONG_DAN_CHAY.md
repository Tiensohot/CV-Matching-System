# Hướng dẫn cài đặt và chạy hệ thống CV Matching

> **Đồ án tốt nghiệp** — Bùi Đức Tiến — 2022606559 — HAUI 2026

---

## Yêu cầu duy nhất: Docker Desktop

Tải và cài đặt **Docker Desktop** tại: https://www.docker.com/products/docker-desktop

Sau khi cài xong, mở Docker Desktop và đảm bảo icon Docker ở thanh taskbar đang chạy (không có dấu hiệu lỗi).

> Không cần cài Python, Node.js, PostgreSQL hay bất kỳ thứ gì khác.

---

## Các bước chạy hệ thống

### Bước 1 — Giải nén project

Giải nén file zip vào một thư mục, ví dụ `C:\cv-matching-system`.

Cấu trúc thư mục sau khi giải nén:

```
cv-matching-system/
├── .env                  ← file cấu hình (cần tạo ở bước 2)
├── .env.example          ← mẫu cấu hình
├── docker-compose.yml
├── backup.sql            ← dữ liệu database sẵn có
├── backend/
├── frontend/
└── ...
```

---

### Bước 2 — Tạo file cấu hình `.env`

Mở thư mục project, sao chép file `.env.example` thành `.env`:

**Trên Windows (PowerShell):**
```powershell
Copy-Item .env.example .env
```

Hoặc dùng File Explorer: copy file `.env.example` → đặt tên lại thành `.env`.

Mở file `.env` bằng Notepad và điền các thông tin sau:

```env
DATABASE_URL=postgresql+asyncpg://postgres:password@db:5432/cv_matching
POSTGRES_DB=cv_matching
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password

SECRET_KEY=haui-cv-matching-2026

ADMIN_EMAIL=admin@cvmatching.com
ADMIN_PASSWORD=admin123

# Để trống nếu không dùng phân tích GPT
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

> **Lưu ý:** `ADMIN_EMAIL` và `ADMIN_PASSWORD` là tài khoản đăng nhập trang quản trị — thầy có thể đặt tùy ý.

---

### Bước 3 — Khởi động hệ thống

Mở **PowerShell** (hoặc Command Prompt), di chuyển vào thư mục project và chạy:

```powershell
cd C:\cv-matching-system
docker compose up --build
```

Lần đầu chạy sẽ mất **5–10 phút** để tải các image và build. Các lần sau chỉ mất khoảng 30 giây.

Khi thấy dòng log tương tự như dưới đây nghĩa là hệ thống đã sẵn sàng:

```
cv_matching_backend   | INFO:     Application startup complete.
cv_matching_frontend  | VITE v6.x.x  ready in ...ms
```

---

### Bước 4 — Khôi phục dữ liệu có sẵn

Mở một cửa sổ **PowerShell mới** (giữ nguyên cửa sổ cũ đang chạy), sau đó chạy:

```powershell
cd C:\cv-matching-system
docker exec -i cv_matching_db psql -U postgres cv_matching < backup.sql
```

Lệnh này khôi phục toàn bộ dữ liệu mẫu (tin tuyển dụng, CV, lịch sử ứng tuyển).

> Chỉ cần chạy lệnh này **một lần duy nhất** khi cài đặt lần đầu.

---

## Truy cập hệ thống

Sau khi hệ thống khởi động, mở trình duyệt và vào các địa chỉ sau:

| Giao diện | Địa chỉ |
|-----------|---------|
| **Ứng dụng chính** (dành cho ứng viên) | http://localhost:5173 |
| **Trang quản trị** (dành cho admin) | http://localhost:5173/admin |
| **API Documentation** (Swagger UI) | http://localhost:8000/docs |

---

## Hướng dẫn sử dụng nhanh

### Giao diện ứng viên — http://localhost:5173

1. **Upload CV**: Kéo thả hoặc click để upload file PDF hoặc DOCX
2. **Xem kết quả matching**: Hệ thống tự động hiển thị top-10 công việc phù hợp nhất, sắp xếp theo độ tương đồng ngữ nghĩa
3. **Phân tích chi tiết**: Click vào một công việc → nhấn "Analyze CV vs JD" để xem phân tích điểm mạnh, kỹ năng còn thiếu và gợi ý từ AI
4. **Tab Remote Jobs**: Tìm kiếm việc làm remote toàn cầu từ RemoteOK.com theo thời gian thực

### Trang quản trị — http://localhost:5173/admin

Đăng nhập bằng `ADMIN_EMAIL` và `ADMIN_PASSWORD` đã cấu hình trong file `.env`.

| Mục | Chức năng |
|-----|-----------|
| **Dashboard** | Thống kê tổng quan: số lượng JD, CV, đơn ứng tuyển, điểm matching trung bình |
| **Jobs** | Thêm/sửa/xóa tin tuyển dụng; tính năng **Auto-parse** — dán text JD thô, AI tự trích xuất cấu trúc |
| **Employers** | Quản lý danh sách nhà tuyển dụng |
| **Applications** | Xem và cập nhật trạng thái toàn bộ đơn ứng tuyển |

---

## Dừng hệ thống

```powershell
docker compose down
```

Dữ liệu sẽ được giữ nguyên cho lần chạy tiếp theo.

---

## Xử lý sự cố thường gặp

**Lỗi "port 5432 is already in use"**

PostgreSQL đang chạy sẵn trên máy. Dừng nó trước:
```powershell
net stop postgresql
```

**Lỗi "port 5173 hoặc 8000 is already in use"**

Có ứng dụng khác đang dùng port đó. Tìm và tắt ứng dụng đó, hoặc khởi động lại máy.

**Container khởi động chậm hoặc lỗi**

Xem log để biết nguyên nhân:
```powershell
docker compose logs backend
docker compose logs frontend
```

**Muốn xóa toàn bộ dữ liệu và bắt đầu lại từ đầu**

```powershell
docker compose down -v
docker compose up --build
```

Sau đó chạy lại lệnh restore `backup.sql` ở Bước 4.

---

## Thông tin kỹ thuật

| Thành phần | Công nghệ |
|------------|-----------|
| Backend API | Python FastAPI |
| Frontend | React + Vite + Tailwind CSS |
| Database | PostgreSQL 16 + pgvector |
| Mô hình embedding | Sentence-BERT fine-tuned (`sbert-cv-jd-hardneg`, 768 chiều) |
| Phân tích AI | OpenAI GPT-4o-mini (tùy chọn) |
| Containerization | Docker Compose (3 services) |

---

*Nếu gặp bất kỳ vấn đề nào, vui lòng liên hệ sinh viên thực hiện.*
