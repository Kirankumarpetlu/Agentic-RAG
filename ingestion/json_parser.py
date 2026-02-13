"""
json_parser.py – Loads a JSON file, flattens nested keys, and converts to structured text.
"""

import json


def _flatten(obj: dict | list, parent_key: str = "", sep: str = ".") -> dict:
    """
    Recursively flatten a nested dict/list into a single-level dict
    with dot-separated keys.
    """
    items: list[tuple[str, object]] = []

    if isinstance(obj, dict):
        for key, value in obj.items():
            new_key = f"{parent_key}{sep}{key}" if parent_key else key
            if isinstance(value, (dict, list)):
                items.extend(_flatten(value, new_key, sep).items())
            else:
                items.append((new_key, value))
    elif isinstance(obj, list):
        for idx, value in enumerate(obj):
            new_key = f"{parent_key}[{idx}]"
            if isinstance(value, (dict, list)):
                items.extend(_flatten(value, new_key, sep).items())
            else:
                items.append((new_key, value))

    return dict(items)


def parse_json(file_path: str) -> tuple[str, dict | list]:
    """
    Load a JSON file, flatten nested structures, and return readable text
    along with the original parsed data.

    Args:
        file_path: Path to the JSON file.

    Returns:
        A tuple of (text_representation, raw_data).
        - text_representation: Flattened key-value pairs as "key: value" lines.
          For top-level lists, each item is separated by a blank line.
        - raw_data: The original parsed JSON object for future use.

    Raises:
        FileNotFoundError: If the file does not exist.
        ValueError: If the file cannot be parsed as JSON.
    """
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            raw_data = json.load(f)
    except json.JSONDecodeError as exc:
        raise ValueError(f"Failed to parse JSON: {file_path}") from exc

    # Handle top-level list: flatten each item separately
    if isinstance(raw_data, list):
        blocks = []
        for idx, item in enumerate(raw_data):
            flat = _flatten(item) if isinstance(item, (dict, list)) else {f"[{idx}]": item}
            lines = [f"{k}: {v}" for k, v in flat.items()]
            blocks.append("\n".join(lines))
        text = "\n\n".join(blocks)
    else:
        flat = _flatten(raw_data)
        text = "\n".join(f"{k}: {v}" for k, v in flat.items())

    return text, raw_data
