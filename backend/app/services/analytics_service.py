"""Analytics and drill-down helpers for dashboard and visualizer."""

import pandas as pd
import numpy as np
from ..utils.helpers import safe_val


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _student_summary(df: pd.DataFrame) -> pd.DataFrame:
    """Deduplicate to one row per student using first occurrence of GPA fields."""
    agg = {"Name": "first"}
    if "SGPA" in df.columns:
        agg["SGPA"] = "first"
    if "CGPA" in df.columns:
        agg["CGPA"] = "first"
    return df.groupby("Roll No").agg(agg).reset_index()


# ─── Dashboard Stats ─────────────────────────────────────────────────────────

def compute_dashboard_stats(df: pd.DataFrame) -> dict:
    """
    Returns top-level class statistics:
    - total_students (unique Roll No)
    - pass_percentage (students with zero failures)
    - avg_sgpa, highest_sgpa, lowest_sgpa
    - avg_cgpa, highest_cgpa, lowest_cgpa
    """
    student_df = _student_summary(df)
    total = student_df["Roll No"].nunique()

    # Pass = no FAIL status for any subject
    fail_rolls = set(df[df["Status"].str.upper() == "FAIL"]["Roll No"].unique())
    pass_count = total - len(fail_rolls)
    pass_pct = round((pass_count / total) * 100, 2) if total else 0

    def _stat(series, fn):
        try:
            val = fn(series.dropna())
            return None if pd.isna(val) else round(float(val), 2)
        except Exception:
            return None

    sgpa_col = student_df.get("SGPA") if "SGPA" in student_df.columns else None
    cgpa_col = student_df.get("CGPA") if "CGPA" in student_df.columns else None

    return safe_val({
        "total_students": total,
        "pass_percentage": pass_pct,
        "avg_sgpa":     _stat(sgpa_col, pd.Series.mean) if sgpa_col is not None else None,
        "highest_sgpa": _stat(sgpa_col, pd.Series.max)  if sgpa_col is not None else None,
        "lowest_sgpa":  _stat(sgpa_col, pd.Series.min)  if sgpa_col is not None else None,
        "avg_cgpa":     _stat(cgpa_col, pd.Series.mean) if cgpa_col is not None else None,
        "highest_cgpa": _stat(cgpa_col, pd.Series.max)  if cgpa_col is not None else None,
        "lowest_cgpa":  _stat(cgpa_col, pd.Series.min)  if cgpa_col is not None else None,
    })


# ─── SGPA Distribution Chart ─────────────────────────────────────────────────

def sgpa_distribution(df: pd.DataFrame) -> dict:
    """
    Returns SGPA bucket counts for a bar/column chart.
    Buckets: <5, 5-6, 6-7, 7-8, 8-9, 9+
    """
    student_df = _student_summary(df)
    if "SGPA" not in student_df.columns or student_df["SGPA"].isna().all():
        return {"labels": [], "values": []}

    bins   = [0, 5, 6, 7, 8, 9, 10.1]
    labels = ["<5", "5-6", "6-7", "7-8", "8-9", "9+"]
    student_df["bin"] = pd.cut(student_df["SGPA"], bins=bins, labels=labels, right=False)
    dist = student_df["bin"].value_counts().reindex(labels, fill_value=0)
    return {"labels": labels, "values": dist.values.tolist()}


# ─── Subject Average Chart ────────────────────────────────────────────────────

def subject_average(df: pd.DataFrame) -> dict:
    """
    Returns mean Total marks per subject.
    """
    avg = df.groupby("Sub Name")["Total"].mean().round(2)
    return safe_val({
        "labels": avg.index.tolist(),
        "values": avg.values.tolist(),
    })


# ─── Subject Pass/Fail Chart ─────────────────────────────────────────────────

def subject_pass_fail(df: pd.DataFrame) -> dict:
    """
    Returns pass and fail student counts per subject.
    Normalizes Status to uppercase before grouping.
    """
    tmp = df.copy()
    tmp["Status"] = tmp["Status"].str.upper().str.strip()
    pivot = tmp.groupby(["Sub Name", "Status"]).size().unstack(fill_value=0)
    labels = pivot.index.tolist()
    return safe_val({
        "labels":      labels,
        "pass_counts": [int(pivot.loc[s].get("PASS", 0)) for s in labels],
        "fail_counts": [int(pivot.loc[s].get("FAIL", 0)) for s in labels],
    })


# ─── Grade Distribution (Pie Chart) ─────────────────────────────────────────

def grade_distribution(df: pd.DataFrame) -> dict:
    """
    Returns count of each grade across all subject entries.
    Used for pie chart display.
    """
    counts = df["Grade"].str.upper().value_counts().to_dict()
    return safe_val({
        "labels": list(counts.keys()),
        "values": list(counts.values()),
    })


# ─── Top / Bottom Performers ─────────────────────────────────────────────────

def top_bottom_performers(df: pd.DataFrame, n: int = 5) -> dict:
    """
    Return top N and bottom N students ranked by SGPA.
    Falls back to CGPA if SGPA is unavailable.
    Each entry: {rank, roll_no, name, sgpa, cgpa}
    """
    student_df = _student_summary(df)
    rank_col = "SGPA" if "SGPA" in student_df.columns else "CGPA"

    ranked = student_df.dropna(subset=[rank_col]).sort_values(rank_col, ascending=False).reset_index(drop=True)

    def _row(i, row):
        return safe_val({
            "rank":    i + 1,
            "roll_no": row["Roll No"],
            "name":    row.get("Name", "-"),
            "sgpa":    row.get("SGPA"),
            "cgpa":    row.get("CGPA"),
        })

    top    = [_row(i, r) for i, r in ranked.head(n).iterrows()]
    bottom = [_row(i, r) for i, r in ranked.tail(n).sort_values(rank_col).reset_index(drop=True).iterrows()]

    return {"top": top, "bottom": bottom}


def students_by_grade(df: pd.DataFrame, grade: str) -> list:
    """
    Returns list of students (roll_no, name, sub_name, total) who have
    the specified grade.  Used when a user clicks a slice of the pie chart.
    """
    filtered = df[df["Grade"].str.upper() == grade.upper()]
    cols = ["Roll No", "Name", "Sub Name", "Total", "Grade"]
    available = [c for c in cols if c in filtered.columns]
    records = filtered[available].rename(columns={
        "Roll No": "roll_no",
        "Name": "name",
        "Sub Name": "sub_name",
        "Total": "total",
        "Grade": "grade",
    }).to_dict(orient="records")
    return safe_val(records)


def students_by_sgpa_bucket(df: pd.DataFrame, bucket: str) -> list:
    """Return students whose SGPA falls into the selected bucket."""
    student_df = _student_summary(df)
    if "SGPA" not in student_df.columns or student_df["SGPA"].isna().all():
        return []

    bins = [0, 5, 6, 7, 8, 9, 10.1]
    labels = ["<5", "5-6", "6-7", "7-8", "8-9", "9+"]
    student_df["bucket"] = pd.cut(student_df["SGPA"], bins=bins, labels=labels, right=False)
    matched = student_df[student_df["bucket"].astype(str) == bucket]
    normalized = matched.rename(columns={
        "Roll No": "roll_no",
        "Name": "name",
        "SGPA": "sgpa",
        "CGPA": "cgpa",
    })
    records = normalized[[c for c in ["roll_no", "name", "sgpa", "cgpa"] if c in normalized.columns]]
    return safe_val(records.to_dict(orient="records"))


def students_by_subject(df: pd.DataFrame, subject: str) -> list:
    """Return all student records for a given subject."""
    filtered = df[df["Sub Name"].astype(str) == subject]
    cols = ["Roll No", "Name", "Sub Name", "Total", "Grade", "Status"]
    available = [c for c in cols if c in filtered.columns]
    normalized = filtered[available].rename(columns={
        "Roll No": "roll_no",
        "Name": "name",
        "Sub Name": "sub_name",
        "Total": "total",
        "Grade": "grade",
        "Status": "status",
    })
    if "total" in normalized.columns:
        normalized = normalized.sort_values(by="total", ascending=False)
    records = normalized.to_dict(orient="records")
    return safe_val(records)


def students_by_subject_status(df: pd.DataFrame, subject: str, status: str) -> list:
    """Return all students who passed or failed a selected subject."""
    filtered = df[
        (df["Sub Name"].astype(str) == subject)
        & (df["Status"].fillna("").astype(str).str.upper().str.strip() == status.upper())
    ]
    cols = ["Roll No", "Name", "Sub Name", "Total", "Grade", "Status"]
    available = [c for c in cols if c in filtered.columns]
    records = filtered[available].rename(columns={
        "Roll No": "roll_no",
        "Name": "name",
        "Sub Name": "sub_name",
        "Total": "total",
        "Grade": "grade",
        "Status": "status",
    }).to_dict(orient="records")
    return safe_val(records)

