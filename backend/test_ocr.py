from app.services.cv_service import extract_text, clean_text

path = r"uploads\Bui_Duc_Tien_CV.pdf"
print("Dang OCR...")
text = extract_text(path)
text = clean_text(text)
print(f"Ket qua ({len(text)} chars):")
print(text[:500])
