```mermaid
erDiagram

    USERS ||--o{ CVS : "tải lên"
    USERS ||--o{ APPLICATIONS : "thực hiện"
    EMPLOYERS ||--o{ JOB_DESCRIPTIONS : "đăng tuyển"
    CVS ||--o{ APPLICATIONS : "được sử dụng trong"
    JOB_DESCRIPTIONS ||--o{ APPLICATIONS : "nhận đơn"

    USERS {
        uuid id PK
        string email "Unique"
        string hashed_password
        string full_name
        boolean is_admin
    }

    CVS {
        uuid id PK
        uuid user_id FK "Liên kết Users"
        string filename
        text raw_text "Nội dung trích xuất"
        vector embedding "768 chiều (pgvector)"
        timestamp uploaded_at
    }

    EMPLOYERS {
        uuid id PK
        string name
        string email
        text company_info
    }

    JOB_DESCRIPTIONS {
        uuid id PK
        uuid employer_id FK "Liên kết Employers"
        string title
        text description
        text requirements
        string email "Email nhận hồ sơ"
        vector embedding "768 chiều (pgvector)"
    }

    APPLICATIONS {
        uuid id PK
        uuid cv_id FK "Liên kết CVs"
        uuid jd_id FK "Liên kết JobDescriptions"
        uuid user_id FK "Liên kết Users"
        float score "Độ tương đồng ngữ nghĩa"
        string status "pending, sent, viewed, interview, accepted, rejected"
        string applicant_name
        string applicant_email
        string employer_email
        text cover_message
        string job_title
        string company_name
    }