"""
Student detail route for TSheet Viewer.

GET /api/student/{roll_no}
Returns full detail for a single student:
  - roll_no, name, sgpa, cgpa
  - subjects: list of all subject entries (missing columns shown as '-')
"""

from fastapi import APIRouter, HTTPException
from .upload_routes import store
from ..services.student_service import get_student_detail

router = APIRouter()


@router.get("/{roll_no}")
def student_detail(roll_no: str):
    """Return complete subject-level detail for one student."""
    df = store["current"]
    previous_df = store["previous"]
    if df is None:
        raise HTTPException(status_code=400, detail="No T-Sheet uploaded yet")

    detail = get_student_detail(df, roll_no, previous_df)
    if detail is None:
        raise HTTPException(status_code=404, detail=f"Student '{roll_no}' not found")

    return detail

