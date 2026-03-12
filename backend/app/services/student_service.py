"""Student listing and detail helpers."""

import pandas as pd
from typing import Optional
from ..utils.helpers import safe_val, dash_if_missing


SUBJECT_COLUMNS = [
    "Sub Code", "Sub Name", "Internal", "External",
    "Total", "Status", "Grade", "Points", "Credits"
]


def _student_status(rows: pd.DataFrame) -> str:
    statuses = rows.get("Status")
    if statuses is None:
        return "-"
    values = statuses.fillna("").astype(str).str.upper().str.strip()
    return "FAIL" if (values == "FAIL").any() else "PASS"


def _subject_records(rows: pd.DataFrame) -> list:
    records = []
    for _, row in rows.iterrows():
        entry = {}
        for col in SUBJECT_COLUMNS:
            entry[col.lower().replace(" ", "_")] = dash_if_missing(row.get(col, None))
        records.append(entry)
    return safe_val(records)


def _semester_snapshot(rows: pd.DataFrame) -> dict:
    if rows.empty:
        return {
            "available": False,
            "sgpa": "-",
            "cgpa": "-",
            "status": "-",
            "total_subjects": 0,
            "subjects": [],
        }

    first = rows.iloc[0]
    return safe_val({
        "available": True,
        "sgpa": dash_if_missing(first.get("SGPA")),
        "cgpa": dash_if_missing(first.get("CGPA")),
        "status": _student_status(rows),
        "total_subjects": int(len(rows)),
        "subjects": _subject_records(rows),
    })


def get_student_list(df: pd.DataFrame) -> list:
    """Return one summary record per student."""
    agg = {"Name": "first"}
    if "SGPA" in df.columns:
        agg["SGPA"] = "first"
    if "CGPA" in df.columns:
        agg["CGPA"] = "first"

    student_df = df.groupby("Roll No").agg(agg).reset_index()
    fail_rolls = set(
        df[df["Status"].fillna("").astype(str).str.upper().str.strip() == "FAIL"]["Roll No"].unique()
    )
    subject_counts = df.groupby("Roll No").size().to_dict()

    records = []
    for _, row in student_df.iterrows():
        roll_no = row["Roll No"]
        records.append(safe_val({
            "roll_no": roll_no,
            "name": row.get("Name", "-"),
            "sgpa": row.get("SGPA"),
            "cgpa": row.get("CGPA"),
            "status": "FAIL" if roll_no in fail_rolls else "PASS",
            "total_subjects": int(subject_counts.get(roll_no, 0)),
        }))
    return records


def get_student_detail(df: pd.DataFrame, roll_no: str, previous_df: Optional[pd.DataFrame] = None) -> Optional[dict]:
    """Return detailed current and previous semester information for one student."""
    current_rows = df[df["Roll No"] == roll_no]
    if current_rows.empty:
        return None

    first = current_rows.iloc[0]
    previous_rows = previous_df[previous_df["Roll No"] == roll_no] if previous_df is not None else pd.DataFrame()

    return safe_val({
        "roll_no": roll_no,
        "name": first.get("Name", "-"),
        "sgpa": dash_if_missing(first.get("SGPA")),
        "cgpa": dash_if_missing(first.get("CGPA")),
        "status": _student_status(current_rows),
        "total_subjects": int(len(current_rows)),
        "subjects": _subject_records(current_rows),
        "previous": _semester_snapshot(previous_rows),
    })

