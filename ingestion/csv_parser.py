"""
csv_parser.py – Loads a CSV file and converts rows into structured text.
"""

import pandas as pd


def parse_csv(file_path: str) -> tuple[str, pd.DataFrame]:
    """
    Load a CSV file, convert each row to a readable text block,
    and return the combined text along with the raw DataFrame.

    Args:
        file_path: Path to the CSV file.

    Returns:
        A tuple of (text_representation, dataframe).
        - text_representation: Each row formatted as "Column: value" lines,
          separated by blank lines.
        - dataframe: The raw pandas DataFrame for later numeric use.

    Raises:
        FileNotFoundError: If the file does not exist.
        ValueError: If the file cannot be parsed as CSV.
    """
    try:
        df = pd.read_csv(file_path)
    except Exception as exc:
        raise ValueError(f"Failed to parse CSV: {file_path}") from exc

    row_blocks = []
    for _, row in df.iterrows():
        lines = [f"{col}: {row[col]}" for col in df.columns]
        row_blocks.append("\n".join(lines))

    text = "\n\n".join(row_blocks)
    return text, df
