"""
Upload routes for TSheet Viewer.

POST /api/upload/current  - Upload current semester TSheet
POST /api/upload/previous - Upload previous semester TSheet (for comparison)

Parsed DataFrames are stored in the module-level `store` dict
and imported by all other route files.
"""

from fastapi import APIRouter, UploadFile, File, HTTPException
from ..services.excel_parser import parse_excel

router = APIRouter()

# Shared in-memory store - imported by all other route modules
store = {
    "current":  None,  # pd.DataFrame | None
    "previous": None,  # pd.DataFrame | None
}


@router.post("/current")
async def upload_current(file: UploadFile = File(...)):
    """Accept current semester Excel TSheet and store it."""
    try:
        data = await file.read()
        df = parse_excel(data)
        store["current"] = df
        return {
            "message":  "Current semester T-Sheet uploaded successfully",
            "rows":     len(df),
            "students": int(df["Roll No"].nunique()),
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {e}")


@router.post("/previous")
async def upload_previous(file: UploadFile = File(...)):
    """Accept previous semester Excel TSheet for comparison."""
    try:
        data = await file.read()
        df = parse_excel(data)
        store["previous"] = df
        return {
            "message":  "Previous semester T-Sheet uploaded successfully",
            "rows":     len(df),
            "students": int(df["Roll No"].nunique()),
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {e}")

