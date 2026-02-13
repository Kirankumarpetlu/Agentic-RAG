"""
pdf_parser.py – Extracts and cleans text from a PDF file using PyMuPDF.
"""

import re
import fitz  # PyMuPDF


def parse_pdf(file_path: str) -> str:
    """
    Extract text from a PDF file and return it as a single cleaned string.

    Args:
        file_path: Path to the PDF file.

    Returns:
        Extracted text with normalised whitespace.

    Raises:
        FileNotFoundError: If the file does not exist.
        ValueError: If the file cannot be opened as a PDF.
    """
    try:
        doc = fitz.open(file_path)
    except Exception as exc:
        raise ValueError(f"Failed to open PDF: {file_path}") from exc

    pages_text = []
    for page in doc:
        pages_text.append(page.get_text())
    doc.close()

    raw_text = "\n".join(pages_text)

    # Collapse multiple whitespace / blank lines into single spaces / newlines
    cleaned = re.sub(r"[^\S\n]+", " ", raw_text)   # horizontal whitespace → single space
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)    # 3+ newlines → double newline
    cleaned = cleaned.strip()

    return cleaned
