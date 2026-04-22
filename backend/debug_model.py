import torch
import numpy as np
from sentence_transformers import SentenceTransformer

# Test model fine-tuned
print("=== TEST MODEL FINE-TUNED ===")
model = SentenceTransformer("models/sbert-cv-jd-hardneg")
print(f"Model loaded: models/sbert-cv-jd-hardneg")

# Test encode đơn giản
cv_text  = "Python developer with 3 years experience in FastAPI, PostgreSQL, Docker, REST API"
jd_fit   = "Python Backend Developer: FastAPI, PostgreSQL, Docker, REST API, Git. 2+ years"
jd_nofit = "Marketing Manager with social media and content creation experience"

emb_cv     = model.encode(cv_text,   normalize_embeddings=True)
emb_jd_fit = model.encode(jd_fit,    normalize_embeddings=True)
emb_jd_no  = model.encode(jd_nofit,  normalize_embeddings=True)

score_fit  = float(np.dot(emb_cv, emb_jd_fit))
score_no   = float(np.dot(emb_cv, emb_jd_no))

print(f"CV vs JD phu hop   : {score_fit:.4f}  (nen > 0.5)")
print(f"CV vs JD khong phu : {score_no:.4f}   (nen < 0.3)")
print(f"Chenh lech         : {score_fit - score_no:.4f}")
print()

# Kiểm tra vector
print(f"Embedding dim : {len(emb_cv)}")
print(f"Embedding norm: {np.linalg.norm(emb_cv):.4f}  (phai = 1.0 neu normalize)")
print(f"Min value     : {emb_cv.min():.4f}")
print(f"Max value     : {emb_cv.max():.4f}")
print()

# So sánh với baseline
print("=== SO SANH BASELINE ===")
baseline = SentenceTransformer("all-mpnet-base-v2")
emb_cv_b     = baseline.encode(cv_text,  normalize_embeddings=True)
emb_jd_fit_b = baseline.encode(jd_fit,   normalize_embeddings=True)
emb_jd_no_b  = baseline.encode(jd_nofit, normalize_embeddings=True)

score_fit_b = float(np.dot(emb_cv_b, emb_jd_fit_b))
score_no_b  = float(np.dot(emb_cv_b, emb_jd_no_b))

print(f"Baseline CV vs JD phu hop   : {score_fit_b:.4f}")
print(f"Baseline CV vs JD khong phu : {score_no_b:.4f}")
print(f"Baseline chenh lech         : {score_fit_b - score_no_b:.4f}")
