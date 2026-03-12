"""
TSheet Viewer 2.0 - FastAPI Backend
Handles Excel upload, analytics, risk scoring, and comparison logic.
"""

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
import io
import json
from typing import Optional

app = FastAPI(title="TSheet Viewer 2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for uploaded data
store = {
    "current": None,
    "previous": None,
}

EXPECTED_COLUMNS = [
    "Roll No", "Name", "Sub Code", "Sub Name",
    "Internal", "External", "Total", "Status",
    "Grade", "Points", "Credits", "SGPA", "CGPA"
]


def parse_excel(file_bytes: bytes) -> pd.DataFrame:
    """Parse uploaded Excel file and validate columns."""
    try:
        df = pd.read_excel(io.BytesIO(file_bytes), engine="openpyxl")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read Excel file: {str(e)}")

    # Normalize column names
    df.columns = df.columns.str.strip()

    # Check for expected columns
    missing = [c for c in EXPECTED_COLUMNS if c not in df.columns]
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Missing columns: {', '.join(missing)}. Found: {', '.join(df.columns.tolist())}"
        )

    # Coerce numeric columns
    for col in ["Internal", "External", "Total", "Points", "Credits", "SGPA", "CGPA"]:
        df[col] = pd.to_numeric(df[col], errors="coerce")

    df["Roll No"] = df["Roll No"].astype(str).str.strip()
    df["Name"] = df["Name"].astype(str).str.strip()
    df["Status"] = df["Status"].astype(str).str.strip()
    df["Grade"] = df["Grade"].astype(str).str.strip()
    df["Sub Name"] = df["Sub Name"].astype(str).str.strip()
    df["Sub Code"] = df["Sub Code"].astype(str).str.strip()

    return df


def safe_json(obj):
    """Convert NaN/Inf to None for JSON serialization."""
    if isinstance(obj, float):
        if np.isnan(obj) or np.isinf(obj):
            return None
        return round(obj, 2)
    if isinstance(obj, (np.integer,)):
        return int(obj)
    if isinstance(obj, (np.floating,)):
        if np.isnan(obj) or np.isinf(obj):
            return None
        return round(float(obj), 2)
    if isinstance(obj, dict):
        return {k: safe_json(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [safe_json(v) for v in obj]
    if isinstance(obj, pd.Series):
        return safe_json(obj.tolist())
    if isinstance(obj, np.ndarray):
        return safe_json(obj.tolist())
    return obj


# ─── UPLOAD ENDPOINTS ───────────────────────────────────────────

@app.post("/api/upload/current")
async def upload_current(file: UploadFile = File(...)):
    data = await file.read()
    df = parse_excel(data)
    store["current"] = df
    return {"message": "Current semester uploaded", "rows": len(df), "students": df["Roll No"].nunique()}


@app.post("/api/upload/previous")
async def upload_previous(file: UploadFile = File(...)):
    data = await file.read()
    df = parse_excel(data)
    store["previous"] = df
    return {"message": "Previous semester uploaded", "rows": len(df), "students": df["Roll No"].nunique()}


# ─── DASHBOARD STATISTICS ───────────────────────────────────────

@app.get("/api/dashboard")
def get_dashboard():
    df = store["current"]
    if df is None:
        raise HTTPException(status_code=400, detail="No data uploaded yet")

    student_df = df.groupby("Roll No").agg({
        "Name": "first",
        "SGPA": "first",
        "CGPA": "first",
    }).reset_index()

    total_students = student_df["Roll No"].nunique()

    # Pass percentage: students with no fails
    fail_rolls = df[df["Status"].str.upper() == "FAIL"]["Roll No"].unique()
    pass_count = total_students - len(fail_rolls)
    pass_pct = round((pass_count / total_students) * 100, 2) if total_students else 0

    # Distinction: SGPA >= 8
    distinction_count = len(student_df[student_df["SGPA"] >= 8])
    distinction_pct = round((distinction_count / total_students) * 100, 2) if total_students else 0

    avg_sgpa = round(student_df["SGPA"].mean(), 2)
    highest_sgpa = round(student_df["SGPA"].max(), 2)
    lowest_sgpa = round(student_df["SGPA"].min(), 2)
    avg_cgpa = round(student_df["CGPA"].mean(), 2)

    # Insights
    insights = []

    # Subject with highest failure rate
    fail_df = df[df["Status"].str.upper() == "FAIL"]
    if len(fail_df) > 0:
        fail_counts = fail_df.groupby("Sub Name").size()
        total_per_sub = df.groupby("Sub Name").size()
        fail_rate = (fail_counts / total_per_sub * 100).dropna()
        if len(fail_rate) > 0:
            worst_sub = fail_rate.idxmax()
            worst_rate = round(fail_rate.max(), 1)
            insights.append(f"{worst_sub} has the highest failure rate at {worst_rate}%")

    # Internal vs External
    internal_avg = df["Internal"].mean()
    external_avg = df["External"].mean()
    if internal_avg and external_avg:
        pct_diff = round(((internal_avg - external_avg) / internal_avg) * 100, 1)
        if abs(pct_diff) > 5:
            if pct_diff > 0:
                insights.append(f"External marks are {abs(pct_diff)}% lower than internals")
            else:
                insights.append(f"Internal marks are {abs(pct_diff)}% lower than externals")

    # At-risk students
    fail_count_per_student = fail_df.groupby("Roll No").size().reset_index(name="Fail_Count")
    risk_students = student_df.merge(fail_count_per_student, on="Roll No", how="left")
    risk_students["Fail_Count"] = risk_students["Fail_Count"].fillna(0)
    at_risk = risk_students[(risk_students["CGPA"] < 6) | (risk_students["Fail_Count"] >= 2)]
    if len(at_risk) > 0:
        insights.append(f"{len(at_risk)} students are at academic risk")

    # Std deviation insight
    std_dev = df.groupby("Sub Name")["Total"].std()
    high_std = std_dev[std_dev > 15]
    for sub in high_std.index[:2]:
        insights.append(f"Performance in {sub} is highly inconsistent (σ={round(std_dev[sub], 1)})")

    # Top performer
    top = student_df.loc[student_df["SGPA"].idxmax()]
    insights.append(f"{top['Name']} is the top performer with SGPA {top['SGPA']}")

    return safe_json({
        "total_students": total_students,
        "pass_percentage": pass_pct,
        "distinction_percentage": distinction_pct,
        "avg_sgpa": avg_sgpa,
        "highest_sgpa": highest_sgpa,
        "lowest_sgpa": lowest_sgpa,
        "avg_cgpa": avg_cgpa,
        "insights": insights,
    })


# ─── VISUALIZATIONS ─────────────────────────────────────────────

@app.get("/api/visualizations")
def get_visualizations():
    df = store["current"]
    if df is None:
        raise HTTPException(status_code=400, detail="No data uploaded yet")

    student_df = df.groupby("Roll No").agg({"SGPA": "first", "CGPA": "first"}).reset_index()

    # SGPA Distribution
    bins = [0, 5, 6, 7, 8, 9, 10.1]
    labels = ["<5", "5-6", "6-7", "7-8", "8-9", "9+"]
    student_df["SGPA_bin"] = pd.cut(student_df["SGPA"], bins=bins, labels=labels, right=False)
    sgpa_dist = student_df["SGPA_bin"].value_counts().reindex(labels, fill_value=0).to_dict()

    sgpa_insights = []
    total = len(student_df)
    if total > 0:
        pct_7_8 = sgpa_dist.get("7-8", 0) / total * 100
        pct_below_6 = (sgpa_dist.get("<5", 0) + sgpa_dist.get("5-6", 0)) / total * 100
        if pct_7_8 > 40:
            sgpa_insights.append("Class performing consistently average-high")
        if pct_below_6 > 20:
            sgpa_insights.append("Significant low-performing segment")

    # Grade Distribution
    grade_dist = df["Grade"].value_counts().to_dict()
    grade_insights = []
    total_entries = len(df)
    if total_entries > 0:
        a_count = sum(v for k, v in grade_dist.items() if k.upper().startswith("A"))
        f_count = sum(v for k, v in grade_dist.items() if k.upper() in ["F", "FAIL"])
        if a_count / total_entries > 0.3:
            grade_insights.append("Strong academic performance")
        if f_count / total_entries > 0.1:
            grade_insights.append("High failure rate detected")
        mode_grade = df["Grade"].mode()
        if len(mode_grade) > 0:
            grade_insights.append(f"Most common grade: {mode_grade.iloc[0]}")

    # Subject Average Comparison
    sub_avg = df.groupby("Sub Name")["Total"].mean().round(2)
    sub_avg_dict = sub_avg.to_dict()
    sub_insights = []
    if len(sub_avg) > 1:
        diff = sub_avg.max() - sub_avg.min()
        if diff > 15:
            sub_insights.append(f"Significant performance gap between subjects ({round(diff, 1)} marks)")
        sub_insights.append(f"Highest avg: {sub_avg.idxmax()} ({round(sub_avg.max(), 1)})")
        sub_insights.append(f"Lowest avg: {sub_avg.idxmin()} ({round(sub_avg.min(), 1)})")

    # Internal vs External per subject
    int_ext = df.groupby("Sub Name")[["Internal", "External"]].mean().round(2)
    int_ext_dict = {
        "subjects": int_ext.index.tolist(),
        "internal": int_ext["Internal"].tolist(),
        "external": int_ext["External"].tolist(),
    }
    int_ext_insights = []
    int_avg = df["Internal"].mean()
    ext_avg = df["External"].mean()
    diff_ie = int_avg - ext_avg
    if diff_ie > 5:
        int_ext_insights.append("Students perform better internally")
    elif diff_ie < -5:
        int_ext_insights.append("Students perform better in externals")

    # Subject pass/fail breakdown
    sub_status = df.groupby(["Sub Name", "Status"]).size().unstack(fill_value=0)
    sub_status_dict = {}
    for sub in sub_status.index:
        sub_status_dict[sub] = {col: int(sub_status.loc[sub, col]) for col in sub_status.columns}

    # Subject difficulty index
    sub_difficulty = {}
    for sub in df["Sub Name"].unique():
        sub_data = df[df["Sub Name"] == sub]
        avg = sub_data["Total"].mean()
        std = sub_data["Total"].std()
        fail_pct = (sub_data["Status"].str.upper() == "FAIL").mean() * 100
        difficulty_score = (100 - avg) + (fail_pct * 0.5) + (std * 0.3)
        sub_difficulty[sub] = round(difficulty_score, 2)

    return safe_json({
        "sgpa_distribution": sgpa_dist,
        "sgpa_insights": sgpa_insights,
        "grade_distribution": grade_dist,
        "grade_insights": grade_insights,
        "subject_averages": sub_avg_dict,
        "subject_insights": sub_insights,
        "internal_vs_external": int_ext_dict,
        "internal_external_insights": int_ext_insights,
        "subject_status": sub_status_dict,
        "subject_difficulty": sub_difficulty,
    })


# ─── DATA TABLE ──────────────────────────────────────────────────

@app.get("/api/data")
def get_data():
    df = store["current"]
    if df is None:
        raise HTTPException(status_code=400, detail="No data uploaded yet")
    return safe_json(df.to_dict(orient="records"))


# ─── RISK & ALERTS ───────────────────────────────────────────────

@app.get("/api/risk")
def get_risk():
    df = store["current"]
    if df is None:
        raise HTTPException(status_code=400, detail="No data uploaded yet")

    student_summary = df.groupby("Roll No").agg({
        "Name": "first",
        "SGPA": "first",
        "CGPA": "first",
        "Sub Code": "count"
    }).rename(columns={"Sub Code": "Total_Subjects"}).reset_index()

    # Fail counts
    fail_counts = df[df["Status"].str.upper() == "FAIL"].groupby("Roll No").size().reset_index(name="Fail_Count")
    student_summary = student_summary.merge(fail_counts, on="Roll No", how="left")
    student_summary["Fail_Count"] = student_summary["Fail_Count"].fillna(0).astype(int)

    # Low external counts
    low_ext = df[df["External"] < 40].groupby("Roll No").size().reset_index(name="Low_External_Count")
    student_summary = student_summary.merge(low_ext, on="Roll No", how="left")
    student_summary["Low_External_Count"] = student_summary["Low_External_Count"].fillna(0).astype(int)

    # SGPA drop (if previous data exists)
    student_summary["SGPA_Drop"] = 0.0
    if store["previous"] is not None:
        prev_df = store["previous"]
        student_prev = prev_df.groupby("Roll No").agg({"SGPA": "first"}).reset_index()
        student_prev.columns = ["Roll No", "SGPA_prev"]
        student_summary = student_summary.merge(student_prev, on="Roll No", how="left")
        student_summary["SGPA_Drop"] = (
            student_summary["SGPA_prev"] - student_summary["SGPA"]
        ).fillna(0)
        student_summary.drop(columns=["SGPA_prev"], inplace=True, errors="ignore")

    # Risk scoring
    def calculate_risk(row):
        score = 0
        if row["CGPA"] < 5:
            score += 3
        elif row["CGPA"] < 6:
            score += 2
        if row["Fail_Count"] >= 3:
            score += 3
        elif row["Fail_Count"] >= 2:
            score += 2
        if row["SGPA_Drop"] > 1.5:
            score += 3
        elif row["SGPA_Drop"] > 1:
            score += 2
        if row["Low_External_Count"] >= 4:
            score += 2
        elif row["Low_External_Count"] >= 2:
            score += 1
        return score

    def classify_severity(score):
        if score >= 7:
            return "Critical"
        elif score >= 4:
            return "Warning"
        elif score >= 1:
            return "Monitor"
        return "Safe"

    def generate_issue(row):
        issues = []
        if row["CGPA"] < 6:
            issues.append("Low CGPA")
        if row["Fail_Count"] >= 2:
            issues.append("Multiple subject failures")
        if row["SGPA_Drop"] > 1:
            issues.append("Significant SGPA drop")
        if row["Low_External_Count"] >= 2:
            issues.append("Weak external exam performance")
        return ", ".join(issues) if issues else "Minor concerns"

    student_summary["Risk_Score"] = student_summary.apply(calculate_risk, axis=1)
    student_summary["Severity"] = student_summary["Risk_Score"].apply(classify_severity)
    student_summary["Issue"] = student_summary.apply(generate_issue, axis=1)

    # Summary counts
    severity_counts = student_summary["Severity"].value_counts().to_dict()

    risk_table = student_summary[student_summary["Severity"] != "Safe"].sort_values("Risk_Score", ascending=False)

    return safe_json({
        "severity_counts": {
            "Critical": severity_counts.get("Critical", 0),
            "Warning": severity_counts.get("Warning", 0),
            "Monitor": severity_counts.get("Monitor", 0),
            "Safe": severity_counts.get("Safe", 0),
        },
        "risk_students": risk_table.to_dict(orient="records"),
        "all_students": student_summary.to_dict(orient="records"),
    })


# ─── STUDENT COMPARISON ─────────────────────────────────────────

@app.get("/api/comparison")
def get_comparison():
    df_curr = store["current"]
    df_prev = store["previous"]

    if df_curr is None:
        raise HTTPException(status_code=400, detail="No current semester data")
    if df_prev is None:
        raise HTTPException(status_code=400, detail="No previous semester data uploaded for comparison")

    # Student summaries
    student_curr = df_curr.groupby("Roll No").agg({
        "Name": "first", "SGPA": "first", "CGPA": "first"
    }).reset_index()
    student_curr["Rank_curr"] = student_curr["SGPA"].rank(ascending=False, method="min").astype(int)

    student_prev = df_prev.groupby("Roll No").agg({
        "Name": "first", "SGPA": "first", "CGPA": "first"
    }).reset_index()
    student_prev["Rank_prev"] = student_prev["SGPA"].rank(ascending=False, method="min").astype(int)

    # Merge
    merged = student_curr.merge(
        student_prev[["Roll No", "SGPA", "CGPA", "Rank_prev"]],
        on="Roll No", how="left", suffixes=("_curr", "_prev")
    )
    merged["SGPA_change"] = (merged["SGPA_curr"] - merged["SGPA_prev"]).round(2)
    merged["CGPA_change"] = (merged["CGPA_curr"] - merged["CGPA_prev"]).round(2)
    merged["Rank_change"] = (merged["Rank_prev"] - merged["Rank_curr"]).fillna(0).astype(int)

    merged["SGPA_percent_change"] = (
        (merged["SGPA_curr"] - merged["SGPA_prev"]) / merged["SGPA_prev"] * 100
    ).round(2)

    def classify(change):
        if pd.isna(change):
            return "New"
        if change > 0.3:
            return "Improved"
        elif change < -0.3:
            return "Dropped"
        return "Stable"

    merged["SGPA_status"] = merged["SGPA_change"].apply(classify)

    # Subject-wise comparison
    subject_merge = df_curr.merge(
        df_prev[["Roll No", "Sub Code", "Total", "Sub Name"]],
        on=["Roll No", "Sub Code"], how="left", suffixes=("_curr", "_prev")
    )
    subject_merge["subject_change"] = (
        subject_merge["Total_curr"] - subject_merge["Total_prev"]
    ).round(2)

    # Class-level subject improvement
    class_sub_change = subject_merge.groupby("Sub Name_curr")["subject_change"].mean().round(2).to_dict()

    # Insights
    insights = []
    improved = len(merged[merged["SGPA_status"] == "Improved"])
    dropped = len(merged[merged["SGPA_status"] == "Dropped"])
    if improved > dropped:
        insights.append("Majority of students improved this semester")
    elif dropped > improved:
        insights.append("Overall performance decline observed")
    else:
        insights.append("Performance remained largely stable")

    # Most improved student
    if merged["SGPA_change"].notna().any():
        best_idx = merged["SGPA_change"].idxmax()
        best = merged.loc[best_idx]
        if pd.notna(best["SGPA_change"]) and best["SGPA_change"] > 0:
            insights.append(f"{best['Name']} shows highest improvement (+{best['SGPA_change']} SGPA)")

    return safe_json({
        "comparison_table": merged.fillna("N/A").to_dict(orient="records"),
        "insights": insights,
        "status_counts": merged["SGPA_status"].value_counts().to_dict(),
        "class_subject_change": class_sub_change,
    })


# ─── STUDENT DETAIL ─────────────────────────────────────────────

@app.get("/api/student/{roll_no}")
def get_student_detail(roll_no: str):
    df_curr = store["current"]
    if df_curr is None:
        raise HTTPException(status_code=400, detail="No data uploaded")

    student_curr = df_curr[df_curr["Roll No"] == roll_no]
    if len(student_curr) == 0:
        raise HTTPException(status_code=404, detail="Student not found")

    info = {
        "roll_no": roll_no,
        "name": student_curr["Name"].iloc[0],
        "sgpa": student_curr["SGPA"].iloc[0],
        "cgpa": student_curr["CGPA"].iloc[0],
        "subjects": student_curr[["Sub Code", "Sub Name", "Internal", "External", "Total", "Status", "Grade", "Points", "Credits"]].to_dict(orient="records"),
    }

    # If previous data exists
    if store["previous"] is not None:
        df_prev = store["previous"]
        student_prev = df_prev[df_prev["Roll No"] == roll_no]
        if len(student_prev) > 0:
            info["prev_sgpa"] = student_prev["SGPA"].iloc[0]
            info["prev_cgpa"] = student_prev["CGPA"].iloc[0]
            info["prev_subjects"] = student_prev[["Sub Code", "Sub Name", "Internal", "External", "Total", "Status", "Grade", "Points", "Credits"]].to_dict(orient="records")

    return safe_json(info)


# ─── CUSTOM VISUALIZATION ───────────────────────────────────────

@app.get("/api/custom-viz")
def custom_visualization(
    dataset: str = "current",
    x_axis: str = "Sub Name",
    y_axis: str = "Average",
    chart_type: str = "Bar",
    subject: Optional[str] = None,
    grade: Optional[str] = None,
    status: Optional[str] = None,
    sgpa_min: Optional[float] = None,
    sgpa_max: Optional[float] = None,
    cgpa_min: Optional[float] = None,
    cgpa_max: Optional[float] = None,
):
    if dataset == "current":
        df = store["current"]
    elif dataset == "previous":
        df = store["previous"]
    elif dataset == "combined" and store["current"] is not None and store["previous"] is not None:
        df = pd.concat([store["current"], store["previous"]], ignore_index=True)
    else:
        df = store["current"]

    if df is None:
        raise HTTPException(status_code=400, detail="No data available for selected dataset")

    df = df.copy()

    # Apply filters
    if subject:
        df = df[df["Sub Name"] == subject]
    if grade:
        df = df[df["Grade"] == grade]
    if status:
        df = df[df["Status"].str.upper() == status.upper()]
    if sgpa_min is not None:
        df = df[df["SGPA"] >= sgpa_min]
    if sgpa_max is not None:
        df = df[df["SGPA"] <= sgpa_max]
    if cgpa_min is not None:
        df = df[df["CGPA"] >= cgpa_min]
    if cgpa_max is not None:
        df = df[df["CGPA"] <= cgpa_max]

    if len(df) == 0:
        return safe_json({"labels": [], "values": [], "chart_type": chart_type})

    # Aggregation
    y_col = "Total"
    if x_axis in ["SGPA", "CGPA"]:
        # For SGPA/CGPA as x-axis, use student-level data
        student_df = df.groupby("Roll No").agg({"SGPA": "first", "CGPA": "first", "Name": "first"}).reset_index()
        if y_axis == "Count":
            # Create bins
            bins = [0, 5, 6, 7, 8, 9, 10.1]
            labels_b = ["<5", "5-6", "6-7", "7-8", "8-9", "9+"]
            student_df["bin"] = pd.cut(student_df[x_axis], bins=bins, labels=labels_b, right=False)
            result = student_df["bin"].value_counts().reindex(labels_b, fill_value=0)
            return safe_json({"labels": result.index.tolist(), "values": result.values.tolist(), "chart_type": chart_type})
        else:
            return safe_json({
                "labels": student_df["Name"].tolist(),
                "values": student_df[x_axis].tolist(),
                "chart_type": chart_type
            })

    if y_axis == "Count":
        result = df.groupby(x_axis).size()
    elif y_axis == "Average":
        result = df.groupby(x_axis)[y_col].mean().round(2)
    elif y_axis == "Sum":
        result = df.groupby(x_axis)[y_col].sum()
    elif y_axis == "Median":
        result = df.groupby(x_axis)[y_col].median()
    elif y_axis == "Std Dev":
        result = df.groupby(x_axis)[y_col].std().round(2)
    elif y_axis == "Percentage":
        count = df.groupby(x_axis).size()
        result = (count / len(df) * 100).round(2)
    else:
        result = df.groupby(x_axis).size()

    return safe_json({
        "labels": result.index.tolist(),
        "values": result.values.tolist(),
        "chart_type": chart_type,
    })


# ─── FILTER OPTIONS ─────────────────────────────────────────────

@app.get("/api/filter-options")
def get_filter_options():
    df = store["current"]
    if df is None:
        raise HTTPException(status_code=400, detail="No data uploaded")

    return {
        "subjects": sorted(df["Sub Name"].unique().tolist()),
        "grades": sorted(df["Grade"].unique().tolist()),
        "statuses": sorted(df["Status"].unique().tolist()),
        "has_previous": store["previous"] is not None,
    }


@app.get("/api/correlation")
def get_correlation():
    df = store["current"]
    if df is None:
        raise HTTPException(status_code=400, detail="No data uploaded")

    corr = df[["Internal", "External", "Total", "SGPA"]].corr().round(3)
    return safe_json({
        "columns": corr.columns.tolist(),
        "data": corr.values.tolist(),
    })


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
