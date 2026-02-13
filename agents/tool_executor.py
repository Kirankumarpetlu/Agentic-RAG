"""
tool_executor.py – Performs numeric operations on a DataFrame and returns structured JSON.
"""

import pandas as pd


def compute_average(df: pd.DataFrame, column: str) -> dict:
    """
    Compute the average of a numeric column.

    Returns:
        {"operation": "average", "column": ..., "result": ...}
    """
    if column not in df.columns:
        raise ValueError(f"Column '{column}' not found. Available: {list(df.columns)}")

    result = float(df[column].mean())
    return {"operation": "average", "column": column, "result": round(result, 4)}


def compute_sum(df: pd.DataFrame, column: str) -> dict:
    """
    Compute the sum of a numeric column.

    Returns:
        {"operation": "sum", "column": ..., "result": ...}
    """
    if column not in df.columns:
        raise ValueError(f"Column '{column}' not found. Available: {list(df.columns)}")

    result = float(df[column].sum())
    return {"operation": "sum", "column": column, "result": round(result, 4)}


def compute_growth_rate(df: pd.DataFrame, column: str) -> dict:
    """
    Compute the percentage growth rate between the first and last values
    of a numeric column (ordered as they appear in the DataFrame).

    Formula: ((last - first) / first) * 100

    Returns:
        {"operation": "growth_rate", "column": ..., "first": ..., "last": ..., "result_pct": ...}
    """
    if column not in df.columns:
        raise ValueError(f"Column '{column}' not found. Available: {list(df.columns)}")

    series = df[column].dropna()
    if len(series) < 2:
        raise ValueError(f"Need at least 2 non-null values to compute growth rate in '{column}'.")

    first = float(series.iloc[0])
    last = float(series.iloc[-1])

    if first == 0:
        raise ValueError(f"First value in '{column}' is 0; cannot compute growth rate.")

    rate = ((last - first) / first) * 100
    return {
        "operation": "growth_rate",
        "column": column,
        "first": round(first, 4),
        "last": round(last, 4),
        "result_pct": round(rate, 4),
    }


def execute(df: pd.DataFrame, operation: str, column: str) -> dict:
    """
    Dispatch a numeric operation on a DataFrame column.

    Args:
        df: The pandas DataFrame to operate on.
        operation: One of "average", "sum", "growth_rate".
        column: The target column name.

    Returns:
        A dict with operation details and the computed result.

    Raises:
        ValueError: If the operation or column is invalid.
    """
    ops = {
        "average": compute_average,
        "sum": compute_sum,
        "growth_rate": compute_growth_rate,
    }

    if operation not in ops:
        raise ValueError(f"Unsupported operation: '{operation}'. Supported: {list(ops.keys())}")

    return ops[operation](df, column)
