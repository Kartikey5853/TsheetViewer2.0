"""
Shared utility helpers for TSheet Viewer backend.
"""

import math
import numpy as np
import pandas as pd


def safe_val(obj):
    """
    Recursively sanitize values for JSON serialization.

    - float NaN / Inf  → None
    - numpy int/float  → Python native int/float
    - dict / list      → recursively cleaned
    - pandas Series / ndarray → list, then cleaned
    """
    if isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return None
        return round(obj, 2)
    if isinstance(obj, (np.integer,)):
        return int(obj)
    if isinstance(obj, (np.floating,)):
        if np.isnan(obj) or np.isinf(obj):
            return None
        return round(float(obj), 2)
    if isinstance(obj, dict):
        return {k: safe_val(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [safe_val(v) for v in obj]
    if isinstance(obj, pd.Series):
        return safe_val(obj.tolist())
    if isinstance(obj, np.ndarray):
        return safe_val(obj.tolist())
    return obj


def dash_if_missing(value):
    """
    Return '-' if a value is NaN, None, or the string 'nan'.
    Used in student detail to show placeholder for missing data.
    """
    if value is None:
        return "-"
    if isinstance(value, float) and (math.isnan(value) or math.isinf(value)):
        return "-"
    if str(value).strip().lower() in ("nan", "none", ""):
        return "-"
    return value
