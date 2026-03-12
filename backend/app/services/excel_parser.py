"""
Excel parsing and cleaning logic for TSheet Viewer.

Handles:
- Header rows that don't start at row 0 (logos, banners, etc.)
- Varied column naming via column_mapper
- Missing optional columns (SGPA, CGPA)
- Dirty data (blank rows, mixed types)
"""

import io
import pandas as pd
from ..utils.column_mapper import normalize_columns, REQUIRED_COLUMNS, OPTIONAL_COLUMNS


def find_header_row(raw_df: pd.DataFrame) -> int:
    """
    Scan the first 15 rows to find which row is the actual column header.

    A row qualifies as the header if at least 5 of its values,
    after normalization, match REQUIRED_COLUMNS.

    Returns the row index (0-based).
    """
    for i in range(min(15, len(raw_df))):
        row_values = raw_df.iloc[i].astype(str).str.strip().tolist()
        normalized = [normalize_columns([v]).get(v, v) for v in row_values]
        matched = sum(col in normalized for col in REQUIRED_COLUMNS)
        if matched >= 5:
            return i
    # Fallback: assume row 0
    return 0


def parse_excel(file_bytes: bytes) -> pd.DataFrame:
    """
    Full parse pipeline:
    1. Load raw Excel without header.
    2. Auto-detect header row.
    3. Rename columns using normalization map.
    4. Drop completely empty rows.
    5. Fill missing optional columns with None.
    6. Coerce numeric columns.
    7. Clean string columns.

    Raises ValueError on unreadable files or missing required columns.
    """
    try:
        raw_df = pd.read_excel(io.BytesIO(file_bytes), header=None, engine="openpyxl")
    except Exception as e:
        raise ValueError(f"Cannot read Excel file: {e}")

    # Detect header row
    header_idx = find_header_row(raw_df)
    raw_headers = raw_df.iloc[header_idx].astype(str).str.strip().tolist()
    col_map = normalize_columns(raw_headers)

    # Build dataframe from rows below header
    df = raw_df.iloc[header_idx + 1:].copy()
    df.columns = [col_map.get(col, col) for col in raw_headers]
    df = df.reset_index(drop=True)

    # Drop fully empty rows
    df = df.dropna(how="all").reset_index(drop=True)

    # Validate that key required columns exist after normalization
    missing = [c for c in REQUIRED_COLUMNS if c not in df.columns]
    if len(missing) > 6:
        raise ValueError(
            f"TSheet format not recognized. Missing columns after normalization: {missing}"
        )

    # Add missing optional columns as None
    for col in OPTIONAL_COLUMNS:
        if col not in df.columns:
            df[col] = None

    # Coerce numeric columns (silently convert bad values to NaN)
    for col in ["Internal", "External", "Total", "Points", "Credits", "SGPA", "CGPA"]:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    # Clean string columns - strip whitespace
    for col in ["Roll No", "Name", "Status", "Grade", "Sub Name", "Sub Code"]:
        if col in df.columns:
            df[col] = df[col].astype(str).str.strip()

    # Drop rows where Roll No is blank or 'nan' (artefact rows)
    if "Roll No" in df.columns:
        df = df[df["Roll No"].str.lower() != "nan"].reset_index(drop=True)
        df = df[df["Roll No"].str.strip() != ""].reset_index(drop=True)

    return df
