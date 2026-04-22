import os
import numpy as np
import torch
from sentence_transformers import SentenceTransformer

# ── Chọn model theo môi trường ───────────────────────────
# Ưu tiên model fine-tuned 3 giai đoạn nếu có
_FINETUNED_PATH = "models/sbert-cv-jd-hardneg"
_BASELINE_PATH  = "all-mpnet-base-v2"

_model_path = _FINETUNED_PATH if os.path.exists(_FINETUNED_PATH) else _BASELINE_PATH
_device     = "cuda" if torch.cuda.is_available() else "cpu"

print(f"Loading SBERT model: {_model_path}")
print(f"Device: {_device.upper()}")

model = SentenceTransformer(_model_path, device=_device)
model.max_seq_length = 384

print(f"SBERT ready!")


def get_embedding(text: str) -> list[float]:
    """Tạo vector embedding 768 chiều từ text"""
    embedding = model.encode(
        text,
        normalize_embeddings=True,
        show_progress_bar=False
    )
    return embedding.tolist()


def batch_get_embeddings(texts: list[str]) -> list[list[float]]:
    """Tạo embedding cho nhiều text cùng lúc — dùng khi seed JD"""
    embeddings = model.encode(
        texts,
        normalize_embeddings=True,
        show_progress_bar=True,
        batch_size=32
    )
    return embeddings.tolist()


def cosine_similarity(vec1: list[float], vec2: list[float]) -> float:
    """
    Tính cosine similarity giữa 2 vector.
    Vì đã normalize khi encode nên chỉ cần dot product.
    Kết quả: 0.0 → 1.0
    """
    a = np.array(vec1)
    b = np.array(vec2)
    return float(np.dot(a, b))


def score_to_label(score: float) -> str:
    """
    Chuyển similarity score → nhãn dựa trên ngưỡng tối ưu
    từ kết quả fine-tune 3 giai đoạn
    """
    if   score >= 0.70: return "Good Fit"
    elif score >= 0.40: return "Potential Fit"
    else:               return "No Fit"


def get_model_info() -> dict:
    """Trả về thông tin model đang dùng"""
    return {
        "model_path"    : _model_path,
        "device"        : _device,
        "max_seq_length": model.max_seq_length,
        "embedding_dim" : 768,
        "is_finetuned"  : os.path.exists(_FINETUNED_PATH)
    }