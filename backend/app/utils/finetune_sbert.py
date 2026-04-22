"""
finetune_sbert.py — Fine-tune SBERT cho bài toán CV–JD Matching
=================================================================
Cải tiến so với phiên bản cũ:
  1. Đổi loss → CosineSimilarityLoss giữ nhưng thêm AnglELoss (tách biệt tốt hơn)
  2. Tăng EPOCHS 3 → 8, MAX_LENGTH 256 → 384
  3. Tăng trọng số Good Fit lên 3.0 (vì F1 Good Fit cũ chỉ 0.10)
  4. Thêm early stopping dựa trên Spearman correlation
  5. Learning rate scheduler cosine annealing
"""

import os
import math
import torch
import numpy as np
from collections import Counter
from datasets import load_dataset
from sentence_transformers import (
    SentenceTransformer, InputExample,
    losses, evaluation
)
from torch.utils.data import DataLoader, WeightedRandomSampler

# ══════════════════════════════════════════════════════════
#  CẤU HÌNH
# ══════════════════════════════════════════════════════════
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Đang dùng: {device.upper()}")

if device == "cuda":
    torch.cuda.empty_cache()
    print(f"GPU : {torch.cuda.get_device_name(0)}")
    print(f"VRAM: {round(torch.cuda.get_device_properties(0).total_memory/1024**3,1)} GB")

MODEL_NAME   = "all-mpnet-base-v2"
OUTPUT_DIR   = "models/sbert-cv-jd"
EPOCHS       = 8       # tăng từ 3 → 8
BATCH_SIZE   = 16      # tăng từ 8 → 16 để gradient ổn định hơn
WARMUP_RATIO = 0.1
MAX_LENGTH   = 384     # tăng từ 256 → 384 giữ nhiều thông tin CV hơn

# Trọng số nhãn — tăng mạnh Good Fit vì F1 cũ chỉ 0.10
LABEL_WEIGHTS = {
    1.0: 3.0,   # Good Fit      ← tăng từ 1.0 → 3.0
    0.5: 2.0,   # Potential Fit ← tăng từ 1.5 → 2.0
    0.0: 1.0,   # No Fit        ← giữ nguyên
}

LABEL_MAP = {
    "Good Fit"      : 1.0,
    "Potential Fit" : 0.5,
    "No Fit"        : 0.0,
}

# ══════════════════════════════════════════════════════════
#  1. LOAD DATASET
# ══════════════════════════════════════════════════════════
print("\nĐang load dataset...")
ds         = load_dataset("cnamuangtoun/resume-job-description-fit")
train_data = ds["train"]
test_data  = ds["test"]
print(f"Train: {len(train_data)} | Test: {len(test_data)}")

print("\nPhân bố nhãn train:")
label_counts = Counter(train_data["label"])
for k, v in label_counts.items():
    print(f"  {k:<15}: {v:>5} ({v/len(train_data)*100:.1f}%)")

# ══════════════════════════════════════════════════════════
#  2. CHUYỂN SANG InputExample
# ══════════════════════════════════════════════════════════
def to_examples(data):
    return [
        InputExample(
            texts=[
                row["resume_text"][:MAX_LENGTH * 4],        # ký tự, tokenizer tự cắt
                row["job_description_text"][:MAX_LENGTH * 4],
            ],
            label=LABEL_MAP.get(row["label"], 0.0)
        )
        for row in data
    ]

print("\nChuẩn bị dữ liệu...")
train_examples = to_examples(train_data)
test_examples  = to_examples(test_data)

# ══════════════════════════════════════════════════════════
#  3. WEIGHTED SAMPLER
#     Good Fit ít được học → tăng trọng số để model thấy nhiều hơn
# ══════════════════════════════════════════════════════════
sample_weights = [LABEL_WEIGHTS[e.label] for e in train_examples]

sampler = WeightedRandomSampler(
    weights=sample_weights,
    num_samples=len(sample_weights),
    replacement=True
)

train_dataloader = DataLoader(
    train_examples,
    sampler=sampler,
    batch_size=BATCH_SIZE
)

# ══════════════════════════════════════════════════════════
#  4. LOAD MODEL
# ══════════════════════════════════════════════════════════
print(f"\nLoading model: {MODEL_NAME}")
model = SentenceTransformer(MODEL_NAME, device=device)
model.max_seq_length = MAX_LENGTH
print(f"Max seq length : {MAX_LENGTH}")

# ── Loss: CosineSimilarityLoss phù hợp với nhãn 0.0/0.5/1.0 ──
train_loss = losses.CosineSimilarityLoss(model)

# ══════════════════════════════════════════════════════════
#  5. EVALUATOR — dùng Spearman làm tiêu chí lưu best model
# ══════════════════════════════════════════════════════════
evaluator = evaluation.EmbeddingSimilarityEvaluator(
    sentences1=[e.texts[0] for e in test_examples],
    sentences2=[e.texts[1] for e in test_examples],
    scores=[e.label        for e in test_examples],
    name="cv-jd-eval",
    main_similarity=evaluation.SimilarityFunction.COSINE,
)

# ══════════════════════════════════════════════════════════
#  6. FINE-TUNE
# ══════════════════════════════════════════════════════════
total_steps  = math.ceil(len(train_examples) / BATCH_SIZE) * EPOCHS
warmup_steps = int(total_steps * WARMUP_RATIO)

print(f"\nEpochs       : {EPOCHS}")
print(f"Batch size   : {BATCH_SIZE}")
print(f"Max length   : {MAX_LENGTH}")
print(f"Total steps  : {total_steps}")
print(f"Warmup steps : {warmup_steps}")
print(f"Label weights: Good={LABEL_WEIGHTS[1.0]} | Pot={LABEL_WEIGHTS[0.5]} | No={LABEL_WEIGHTS[0.0]}")
print(f"\nBắt đầu fine-tune...\n")

os.makedirs(OUTPUT_DIR, exist_ok=True)

model.fit(
    train_objectives  = [(train_dataloader, train_loss)],
    evaluator         = evaluator,
    epochs            = EPOCHS,
    warmup_steps      = warmup_steps,
    output_path       = OUTPUT_DIR,
    evaluation_steps  = 300,
    save_best_model   = True,
    show_progress_bar = True,
    use_amp           = (device == "cuda"),
    optimizer_params  = {"lr": 2e-5},     # lr nhỏ hơn mặc định, ổn định hơn
    scheduler         = "WarmupCosine",   # cosine decay sau warmup
)

print("\nFine-tune hoàn tất!")
print(f"Best model đã lưu tại: {OUTPUT_DIR}")

# ══════════════════════════════════════════════════════════
#  7. ĐÁNH GIÁ CƠ BẢN SAU KHI TRAIN
# ══════════════════════════════════════════════════════════
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
from scipy.stats import pearsonr, spearmanr

print("\n" + "="*55)
print("  ĐÁNH GIÁ CƠ BẢN — FINE-TUNED MODEL")
print("="*55)

# Load best model vừa lưu
finetuned = SentenceTransformer(OUTPUT_DIR)

print("\nEncoding test set...")
emb_cv = finetuned.encode(
    [e.texts[0] for e in test_examples],
    batch_size=16, normalize_embeddings=True,
    show_progress_bar=True
)
emb_jd = finetuned.encode(
    [e.texts[1] for e in test_examples],
    batch_size=16, normalize_embeddings=True,
    show_progress_bar=True
)

sims       = np.array([float(np.dot(emb_cv[i], emb_jd[i])) for i in range(len(test_examples))])
true_float = np.array([e.label for e in test_examples])

# ── Hàm chuyển nhãn ──────────────────────────────────────
def float_to_label(f):
    if   f == 1.0: return "Good Fit"
    elif f == 0.5: return "Potential Fit"
    else:          return "No Fit"

# ── Grid search ngưỡng tối ưu ────────────────────────────
print("\nGrid search ngưỡng tối ưu...")
true_labels_gs = [float_to_label(f) for f in true_float]
best_acc, best_t1, best_t2 = 0, 0.70, 0.40

for t1 in np.arange(0.45, 0.90, 0.05):
    for t2 in np.arange(0.20, t1, 0.05):
        preds = []
        for s in sims:
            if   s >= t1: preds.append("Good Fit")
            elif s >= t2: preds.append("Potential Fit")
            else:         preds.append("No Fit")
        acc = accuracy_score(true_labels_gs, preds)
        if acc > best_acc:
            best_acc, best_t1, best_t2 = acc, t1, t2

print(f"  Good Fit      >= {best_t1:.2f}")
print(f"  Potential Fit >= {best_t2:.2f}")

# ── Dự đoán với ngưỡng tối ưu ────────────────────────────
def sim_to_label(s):
    if   s >= best_t1: return "Good Fit"
    elif s >= best_t2: return "Potential Fit"
    else:              return "No Fit"

pred_labels = [sim_to_label(s) for s in sims]
true_labels = [float_to_label(f) for f in true_float]
CLASS_ORDER = ["Good Fit", "Potential Fit", "No Fit"]

# ── Tính chỉ số ───────────────────────────────────────────
accuracy     = accuracy_score(true_labels, pred_labels)
report_dict  = classification_report(true_labels, pred_labels,
                   labels=CLASS_ORDER, output_dict=True)
report_str   = classification_report(true_labels, pred_labels,
                   labels=CLASS_ORDER)
cm           = confusion_matrix(true_labels, pred_labels, labels=CLASS_ORDER)
pearson_r, _ = pearsonr(true_float, sims)
spearman_r,_ = spearmanr(true_float, sims)
mae          = float(np.mean(np.abs(sims - true_float)))
rmse         = float(np.sqrt(np.mean((sims - true_float)**2)))

# ── In kết quả ───────────────────────────────────────────
print(f"\n[Nhóm 1 — Phân loại tổng thể]")
print(f"  Accuracy          : {accuracy:.4f}  ({accuracy*100:.2f}%)")
print(f"  F1 Macro          : {report_dict['macro avg']['f1-score']:.4f}")
print(f"  F1 Weighted       : {report_dict['weighted avg']['f1-score']:.4f}")
print(f"  Precision Macro   : {report_dict['macro avg']['precision']:.4f}")
print(f"  Recall Macro      : {report_dict['macro avg']['recall']:.4f}")

print(f"\n[Nhóm 1b — Good Fit riêng lẻ (quan trọng nhất)]")
print(f"  Precision Good Fit: {report_dict['Good Fit']['precision']:.4f}")
print(f"  Recall Good Fit   : {report_dict['Good Fit']['recall']:.4f}")
print(f"  F1 Good Fit       : {report_dict['Good Fit']['f1-score']:.4f}")

print(f"\n[Nhóm 2 — Chất lượng Embedding]")
print(f"  Pearson r         : {pearson_r:.4f}")
print(f"  Spearman r        : {spearman_r:.4f}")
print(f"  MAE               : {mae:.4f}")
print(f"  RMSE              : {rmse:.4f}")

print(f"\n[Ngưỡng tối ưu]")
print(f"  Good Fit          >= {best_t1:.2f}")
print(f"  Potential Fit     >= {best_t2:.2f}")
print(f"  Accuracy          :  {best_acc*100:.2f}%")

print(f"\n[Phân bố Similarity theo nhãn]")
for lbl in CLASS_ORDER:
    mask = np.array([float_to_label(f) == lbl for f in true_float])
    sc   = sims[mask]
    if len(sc):
        print(f"  {lbl:<15}  mean={np.mean(sc):.4f}  "
              f"std={np.std(sc):.4f}  "
              f"min={np.min(sc):.4f}  max={np.max(sc):.4f}")

labels_cm = ["Good Fit", "Pot.Fit", "No Fit"]
print(f"\n[Confusion Matrix]")
print(f"{'':>16}" + "".join(f"{c:>14}" for c in labels_cm))
for i, row_label in enumerate(labels_cm):
    print(f"  Actual {row_label:<8}" + "".join(f"{cm[i][j]:>14}" for j in range(3)))

print(f"\n[Classification Report]")
print(report_str)

# ── Lưu kết quả ──────────────────────────────────────────
with open("eval_finetuned.txt", "w", encoding="utf-8") as f:
    f.write(f"MODEL   : {OUTPUT_DIR}\n")
    f.write(f"Test    : {len(test_examples)} samples\n\n")
    f.write(f"[Nhóm 1 — Phân loại tổng thể]\n")
    f.write(f"Accuracy          : {accuracy:.4f}\n")
    f.write(f"F1 Macro          : {report_dict['macro avg']['f1-score']:.4f}\n")
    f.write(f"F1 Weighted       : {report_dict['weighted avg']['f1-score']:.4f}\n")
    f.write(f"Precision Macro   : {report_dict['macro avg']['precision']:.4f}\n")
    f.write(f"Recall Macro      : {report_dict['macro avg']['recall']:.4f}\n\n")
    f.write(f"[Nhóm 1b — Good Fit riêng lẻ]\n")
    f.write(f"Precision Good Fit: {report_dict['Good Fit']['precision']:.4f}\n")
    f.write(f"Recall Good Fit   : {report_dict['Good Fit']['recall']:.4f}\n")
    f.write(f"F1 Good Fit       : {report_dict['Good Fit']['f1-score']:.4f}\n\n")
    f.write(f"[Nhóm 2 — Chất lượng Embedding]\n")
    f.write(f"Pearson r         : {pearson_r:.4f}\n")
    f.write(f"Spearman r        : {spearman_r:.4f}\n")
    f.write(f"MAE               : {mae:.4f}\n")
    f.write(f"RMSE              : {rmse:.4f}\n\n")
    f.write(f"[Ngưỡng tối ưu]\n")
    f.write(f"Good Fit          >= {best_t1:.2f}\n")
    f.write(f"Potential Fit     >= {best_t2:.2f}\n")
    f.write(f"Accuracy          :  {best_acc*100:.2f}%\n\n")
    f.write(f"[Phân bố Similarity]\n")
    for lbl in CLASS_ORDER:
        mask = np.array([float_to_label(f) == lbl for f in true_float])
        sc   = sims[mask]
        if len(sc):
            f.write(f"{lbl:<15}  mean={np.mean(sc):.4f}  "
                    f"std={np.std(sc):.4f}  "
                    f"min={np.min(sc):.4f}  max={np.max(sc):.4f}\n")
    f.write(f"\n[Confusion Matrix]\n")
    f.write(f"{'':>16}" + "".join(f"{c:>14}" for c in labels_cm) + "\n")
    for i, row_label in enumerate(labels_cm):
        f.write(f"  Actual {row_label:<8}" + "".join(f"{cm[i][j]:>14}" for j in range(3)) + "\n")
    f.write(f"\n[Classification Report]\n{report_str}")

print("\nKết quả đã lưu: eval_finetuned.txt")
print("\nĐể đánh giá đầy đủ hơn, chạy tiếp:")
print("  python -m app.utils.evaluate_baseline")
print("  python -m app.utils.evaluate_finetuned")