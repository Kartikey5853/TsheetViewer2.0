"""
Visualization routes for TSheet Viewer.

GET /api/visualizations
  Returns all data needed for the Visualizer page:
    - sgpa_distribution
    - subject_average
    - subject_pass_fail
    - grade_distribution
    - top_bottom_performers

GET /api/visualizations/grade/{grade}
  Drill-down: returns all student+subject records with a specific grade.
  Called when the user clicks a pie chart slice.
"""

from fastapi import APIRouter, HTTPException
from .upload_routes import store
from ..services.analytics_service import (
    sgpa_distribution,
    subject_average,
    subject_pass_fail,
    grade_distribution,
    students_by_grade,
    students_by_sgpa_bucket,
    students_by_subject,
    students_by_subject_status,
    top_bottom_performers,
)

router = APIRouter()


@router.get("")
def visualizations():
    """
    Returns all chart data for the Visualizer page in one call.
    """
    df = store["current"]
    if df is None:
        raise HTTPException(status_code=400, detail="No T-Sheet uploaded yet")

    return {
        "sgpa_distribution":    sgpa_distribution(df),
        "subject_average":      subject_average(df),
        "subject_pass_fail":    subject_pass_fail(df),
        "grade_distribution":   grade_distribution(df),
        "performers":           top_bottom_performers(df),
    }


@router.get("/grade/{grade}")
def grade_drill_down(grade: str):
    """
    Returns all student+subject records that have the specified grade.
    Called when the user clicks a grade slice on the pie chart.
    """
    df = store["current"]
    if df is None:
        raise HTTPException(status_code=400, detail="No T-Sheet uploaded yet")

    records = students_by_grade(df, grade)
    return {
        "grade":   grade.upper(),
        "count":   len(records),
        "records": records,
    }


@router.get("/sgpa/{bucket}")
def sgpa_drill_down(bucket: str):
    """Return all students that belong to an SGPA bucket."""
    df = store["current"]
    if df is None:
        raise HTTPException(status_code=400, detail="No T-Sheet uploaded yet")

    records = students_by_sgpa_bucket(df, bucket)
    return {
        "bucket": bucket,
        "count": len(records),
        "records": records,
    }


@router.get("/subject/{subject}")
def subject_drill_down(subject: str):
    """Return all student records for a selected subject."""
    df = store["current"]
    if df is None:
        raise HTTPException(status_code=400, detail="No T-Sheet uploaded yet")

    records = students_by_subject(df, subject)
    return {
        "subject": subject,
        "count": len(records),
        "records": records,
    }


@router.get("/subject/{subject}/{status}")
def subject_status_drill_down(subject: str, status: str):
    """Return pass/fail student records for the selected subject."""
    df = store["current"]
    if df is None:
        raise HTTPException(status_code=400, detail="No T-Sheet uploaded yet")

    records = students_by_subject_status(df, subject, status)
    return {
        "subject": subject,
        "status": status.upper(),
        "count": len(records),
        "records": records,
    }
