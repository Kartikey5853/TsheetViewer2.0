"""
Dashboard route for TSheet Viewer.

GET /api/dashboard
Returns class-level statistics only (no chart data):
  - total_students, pass_percentage
  - avg_sgpa, highest_sgpa, lowest_sgpa
  - avg_cgpa, highest_cgpa, lowest_cgpa

Chart data is served separately from /api/visualizations.
"""

from fastapi import APIRouter, HTTPException
from .upload_routes import store
from ..services.analytics_service import compute_dashboard_stats

router = APIRouter()


@router.get("")
def dashboard():
    """Return class statistics for the Dashboard stat cards."""
    df = store["current"]
    if df is None:
        raise HTTPException(status_code=400, detail="No T-Sheet uploaded yet")
    return compute_dashboard_stats(df)

