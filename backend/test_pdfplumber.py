import pdfplumber
import os

# Cập nhật đường dẫn chính xác từ database của bạn
path = r"uploads\Bui_Duc_Tien_CV.pdf"

if not os.path.exists(path):
    print(f"LOI: Khong tim thay file tai {path}")
else:
    with pdfplumber.open(path) as pdf:
        print(f"Ket qua kiem tra file: {os.path.basename(path)}")
        print(f"So trang: {len(pdf.pages)}")
        for i, page in enumerate(pdf.pages):
            text = page.extract_text()
            char_count = len(text) if text else 0
            print(f"\n=== Trang {i+1} ({char_count} chars) ===")
            if char_count > 0:
                print(text[:500]) # In 500 ky tu dau tien
            else:
                print("CANH BAO: Trang nay khong co chu (co the la file anh)")
