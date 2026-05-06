Frontend                    Backend                      External
   │                           │                            │
   │  POST /remote-jobs/match  │                            │
   │  { cv_id, country }       │                            │
   │──────────────────────────>│                            │
   │                           │                            │
   │                    ┌──────┴───────┐                    │
   │                    │ remote_jobs  │                     │
   │                    │   .py route  │                     │
   │                    └──────┬───────┘                    │
   │                           │                            │
   │                    1. Lấy cv.embedding                 │
   │                    từ PostgreSQL (đã có sẵn khi upload) │
   │                           │                            │
   │                    ┌──────┴───────────────────┐        │
   │                    │ remote_job_service.py     │        │
   │                    │  fetch_remote_jobs()      │        │
   │                    └──────┬───────────────────┘        │
   │                           │                            │
   │                           │  2. Kiểm tra cache         │
   │                           │  (biến global _cache_jobs) │
   │                           │                            │
   │                    ┌──────┴──────────────────┐         │
   │                    │  Cache còn hạn (<5 phút)?│        │
   │                    └──┬──────────────────┬───┘         │
   │                    HIT│                  │MISS          │
   │                       │     GET https://remoteok.com/api│
   │                       │          ──────────────────────>│
   │                       │          JSON array             │
   │                       │          <──────────────────────│
   │                       │                            │
   │                       │  3. Parse JSON:            │
   │                       │  - Bỏ phần tử đầu (metadata)   │
   │                       │  - Lọc item có field "position" │
   │                       │  - Strip HTML tags khỏi desc   │
   │                       │  - Ghép: position+desc+tags    │
   │                       │  - Cắt combined_text ≤1024 ký tự│
   │                       │  - Lưu cache + timestamp       │
   │                       │                            │
   │                    ───┘  (dùng cache nếu HIT)     │
   │                           │                            │
   │                    4. Lọc theo country (nếu có)        │
   │                    location.lower().contains(country)   │
   │                           │                            │
   │                    ┌──────┴──────────────────────┐      │
   │                    │ match_cv_with_remote_jobs()  │      │
   │                    └──────┬──────────────────────┘      │
   │                           │                            │
   │                    5. SBERT encode batch               │
   │                    model.encode([combined_text, ...])   │
   │                    → jd_embeddings (N × 768)           │
   │                           │                            │
   │                    6. Cosine similarity                │
   │                    cv_vec = np.array(cv.embedding)     │
   │                    score  = dot(cv_vec, jd_emb)        │
   │                    (vectors đã normalize → dot = cosine)│
   │                           │                            │
   │                    7. Sort giảm dần, lấy top 10        │
   │                    Gán nhãn:                           │
   │                    ≥0.70 → "Good Fit"                  │
   │                    0.40–0.69 → "Potential Fit"         │
   │                    <0.40 → "No Fit"                    │
   │                           │                            │
   │  { source, results[10] }  │                            │
   │<──────────────────────────│                            │
