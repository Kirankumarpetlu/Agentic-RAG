"""
file_router.py – Detects and returns the file type based on extension.

Supported file types: pdf, csv, json.
"""

import os

SUPPORTED_EXTENSIONS = {"pdf", "csv", "json", "txt", "docx"}


def route_file(file_path: str) -> str:
    """
    Accept a file path and return its type based on the extension.

    Args:
        file_path: Path to the file.

    Returns:
        The file type as a lowercase string (e.g. "pdf", "csv", "json").

    Raises:
        ValueError: If the file extension is not supported.
    """
    _, ext = os.path.splitext(file_path)
    ext = ext.lstrip(".").lower()

    if not ext:
        raise ValueError(f"No file extension found in path: '{file_path}'")

    if ext not in SUPPORTED_EXTENSIONS:
        raise ValueError(
            f"Unsupported file type: '.{ext}'. "
            f"Supported types: {', '.join(sorted(SUPPORTED_EXTENSIONS))}"
        )

    return ext
