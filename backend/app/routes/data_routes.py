"""
Data Viewer routes for TSheet Viewer.

GET /api/data              → unique student list [{roll_no, name, sgpa, cgpa}]
GET /api/data/filter-options → distinct subjects, grades, statuses for filter dropdowns
"""

from fastapi import APIRouter, HTTPException
from .upload_routes import store
from ..services.student_service import get_student_list

router = APIRouter()


@router.get("")
def get_data():
    """Return one record per unique student (Roll No, Name, SGPA, CGPA)."""
    df = store["current"]
    if df is None:
        raise HTTPException(status_code=400, detail="No T-Sheet uploaded yet")
    return get_student_list(df)


@router.get("/filter-options")
def filter_options():
    """
    Return distinct values used to populate filter dropdowns in the Data Viewer.
    Also indicates whether a previous semester file has been loaded.
    """
    df = store["current"]
    if df is None:
        raise HTTPException(status_code=400, detail="No T-Sheet uploaded yet")
    return {
        "subjects": sorted(df["Sub Name"].dropna().unique().tolist()),
        "grades":   sorted(df["Grade"].dropna().unique().tolist()),
        "statuses": sorted(df["Status"].dropna().unique().tolist()),
        "has_previous": store["previous"] is not None,
    }


