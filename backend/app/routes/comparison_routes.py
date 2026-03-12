"""
Comparison route for TSheet Viewer.

GET /api/comparison
Compares current semester vs previous semester.
Requires both files to be uploaded first.

Returns:
- summary:        per-student SGPA change + status (Improved / Dropped / Stable / New)
- status_counts:  aggregate count of each status
- subject_changes: per-student, per-subject score diff between semesters
"""

from fastapi import APIRouter, HTTPException
from .upload_routes import store
from ..services.comparison_service import compare_semesters

router = APIRouter()


@router.get("/comparison")
def comparison():
    """Compare current vs previous semester data."""
    df_curr = store["current"]
    df_prev = store["previous"]

    if df_curr is None:
        raise HTTPException(status_code=400, detail="Current semester T-Sheet not uploaded")
    if df_prev is None:
        raise HTTPException(
            status_code=400,
            detail="Previous semester T-Sheet not uploaded. Upload it to use comparison."
        )

    return compare_semesters(df_curr, df_prev)
