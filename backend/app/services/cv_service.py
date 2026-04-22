import pdfplumber
import pytesseract
import docx
from pathlib import Path
from PIL import Image
from pdf2image import convert_from_path


def extract_text_from_pdf(file_path: str) -> str:
    """
    Trích xuất text từ PDF.
    Thử pdfplumber trước, nếu rỗng thì dùng OCR.
    """
    # Thử pdfplumber trước (nhanh, chính xác với PDF text)
    text = ""
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"

    # Nếu rỗng → PDF dạng ảnh → dùng OCR
    if not text.strip():
        print(f"PDF dang anh, dung OCR: {file_path}")
        text = extract_text_ocr(file_path)

    return text.strip()


def extract_text_ocr(file_path: str) -> str:
    """OCR từng trang PDF thành text"""
    text = ""
    # Chuyển PDF → ảnh từng trang
    images = convert_from_path(
        file_path,
        dpi=300,                    # DPI cao → OCR chính xác hơn
        poppler_path=r"C:\poppler\Library\bin"
    )
    for i, image in enumerate(images):
        print(f"  OCR trang {i+1}/{len(images)}...")
        # OCR với ngôn ngữ tiếng Anh
        page_text = pytesseract.image_to_string(
            image,
            lang="eng",
            config="--psm 6"        # psm 6 = đọc theo block text
        )
        text += page_text + "\n"

    return text.strip()


def extract_text_from_docx(file_path: str) -> str:
    """Trích xuất text từ file Word"""
    doc  = docx.Document(file_path)
    text = "\n".join([para.text for para in doc.paragraphs])
    return text.strip()


def extract_text(file_path: str) -> str:
    """Tự động nhận diện định dạng và trích xuất text"""
    path   = Path(file_path)
    suffix = path.suffix.lower()

    if suffix == ".pdf":
        return extract_text_from_pdf(file_path)
    elif suffix in [".docx", ".doc"]:
        return extract_text_from_docx(file_path)
    else:
        raise ValueError(f"Dinh dang khong ho tro: {suffix}")


def clean_text(text: str) -> str:
    """Làm sạch text"""
    lines = [line.strip() for line in text.splitlines()]
    lines = [line for line in lines if line]
    return "\n".join(lines)