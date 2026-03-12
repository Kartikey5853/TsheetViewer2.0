"""Semester comparison helpers."""

import pandas as pd
from ..utils.helpers import safe_val


def compare_semesters(df_curr: pd.DataFrame, df_prev: pd.DataFrame) -> dict:
    """Compare students across semesters by roll number."""

    # ─── Student-level SGPA comparison ──────────────────────────────────────
    def _build_student_gpa(df):
        agg = {"Name": "first"}
        if "SGPA" in df.columns:
            agg["SGPA"] = "first"
        if "CGPA" in df.columns:
            agg["CGPA"] = "first"
        return df.groupby("Roll No").agg(agg).reset_index()

    curr_students = _build_student_gpa(df_curr)
    prev_students = _build_student_gpa(df_prev)

    if "SGPA" in curr_students.columns:
        curr_students["rank_curr"] = curr_students["SGPA"].rank(method="dense", ascending=False)
    else:
        curr_students["rank_curr"] = None

    if "SGPA" in prev_students.columns:
        prev_students["rank_prev"] = prev_students["SGPA"].rank(method="dense", ascending=False)
    else:
        prev_students["rank_prev"] = None

    merged = curr_students.merge(
        prev_students[["Roll No"] + [c for c in ["SGPA", "CGPA", "rank_prev"] if c in prev_students.columns]],
        on="Roll No",
        how="left",
        suffixes=("_curr", "_prev"),
    )

    # Rename unambiguous columns (when only in curr)
    for col in ["SGPA", "CGPA"]:
        if col + "_curr" not in merged.columns and col in merged.columns:
            merged.rename(columns={col: col + "_curr"}, inplace=True)

    def _change(row, field):
        curr = row.get(f"{field}_curr")
        prev = row.get(f"{field}_prev")
        if pd.isna(prev):
            return None
        if pd.isna(curr):
            return None
        return round(float(curr) - float(prev), 2)

    def _status(change):
        if change is None:
            return "New"
        if change > 0.3:
            return "Improved"
        if change < -0.3:
            return "Dropped"
        return "Stable"

    def _pct_change(change, prev):
        if change is None or pd.isna(prev) or not prev:
            return None
        return round((float(change) / float(prev)) * 100, 2)

    merged["sgpa_change"] = merged.apply(lambda row: _change(row, "SGPA"), axis=1)
    merged["cgpa_change"] = merged.apply(lambda row: _change(row, "CGPA"), axis=1)
    merged["status"] = merged["sgpa_change"].apply(_status)
    merged["sgpa_percent_change"] = merged.apply(
        lambda row: _pct_change(row.get("sgpa_change"), row.get("SGPA_prev")), axis=1
    )
    merged["rank_change"] = merged.apply(
        lambda row: None if pd.isna(row.get("rank_prev")) or pd.isna(row.get("rank_curr")) else int(row.get("rank_prev") - row.get("rank_curr")),
        axis=1,
    )

    summary = []
    for _, row in merged.iterrows():
        summary.append(safe_val({
            "roll_no": row["Roll No"],
            "name": row.get("Name", "-"),
            "sgpa_curr": row.get("SGPA_curr"),
            "sgpa_prev": row.get("SGPA_prev"),
            "sgpa_change": row.get("sgpa_change"),
            "sgpa_percent_change": row.get("sgpa_percent_change"),
            "cgpa_curr": row.get("CGPA_curr"),
            "cgpa_prev": row.get("CGPA_prev"),
            "cgpa_change": row.get("cgpa_change"),
            "status": row["status"],
            "rank_curr": row.get("rank_curr"),
            "rank_prev": row.get("rank_prev"),
            "rank_change": row.get("rank_change"),
        }))

    status_counts = merged["status"].value_counts().to_dict()

    return {
        "summary": summary,
        "status_counts": safe_val(status_counts),
        "overview": safe_val({
            "current_students": int(len(curr_students)),
            "matched_students": int(merged["SGPA_prev"].notna().sum()) if "SGPA_prev" in merged.columns else 0,
            "new_students": int((merged["status"] == "New").sum()),
            "avg_sgpa_change": round(float(merged["sgpa_change"].dropna().mean()), 2) if merged["sgpa_change"].dropna().shape[0] else None,
        }),
    }
