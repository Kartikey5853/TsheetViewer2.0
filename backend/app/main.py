"""
TSheet Viewer 2.0 - FastAPI Application Entry Point

Route map (matches frontend api.js exactly):
  POST /api/upload/current              → upload current semester
  POST /api/upload/previous             → upload previous semester (for comparison)
  GET  /api/dashboard                   → class stats + all chart data
  GET  /api/data                        → unique student list
  GET  /api/student/{roll_no}           → full detail for one student
  GET  /api/visualizations              → SGPA distribution + grade pie chart
  GET  /api/visualizations/grade/{g}   → drill-down: students with a specific grade
  GET  /api/comparison                  → semester-over-semester comparison
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.upload_routes import router as upload_router
from app.routes.dashboard_routes import router as dashboard_router
from app.routes.data_routes import router as data_router
from app.routes.student_routes import router as student_router
from app.routes.visualization_routes import router as viz_router
from app.routes.comparison_routes import router as comparison_router

app = FastAPI(title="TSheet Viewer 2.0", version="2.0.0", redirect_slashes=False)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Route Registration ───────────────────────────────────────────────────────
#  Prefixes are kept in sync with frontend/src/api.js

app.include_router(upload_router,     prefix="/api/upload",         tags=["Upload"])
app.include_router(dashboard_router,  prefix="/api/dashboard",      tags=["Dashboard"])
app.include_router(data_router,       prefix="/api/data",           tags=["Data Viewer"])

app.include_router(student_router,    prefix="/api/student",        tags=["Student Detail"])
app.include_router(viz_router,        prefix="/api/visualizations", tags=["Visualizations"])
app.include_router(comparison_router, prefix="/api",                tags=["Comparison"])

# ─── Health Route ────────────────────────────────────────────────────────────
from fastapi.responses import Response

@app.get("/api/health", tags=["Health"])
@app.head("/api/health", tags=["Health"])
def health():
  return Response(status_code=200)

