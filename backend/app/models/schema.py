"""
Pydantic schemas for API responses.
"""
from typing import List, Optional
from pydantic import BaseModel

class StudentSummary(BaseModel):
    roll_no: str
    name: str
    sgpa: Optional[float] = None
    cgpa: Optional[float] = None

class SubjectEntry(BaseModel):
    sub_code: str
    sub_name: str
    internal: Optional[float]
    external: Optional[float]
    total: Optional[float]
    status: str
    grade: str
    points: Optional[float]
    credits: Optional[float]

class StudentDetail(BaseModel):
    roll_no: str
    name: str
    sgpa: Optional[float]
    cgpa: Optional[float]
    subjects: List[SubjectEntry]

class DashboardStats(BaseModel):
    total_students: int
    pass_percentage: float
    avg_sgpa: Optional[float]
    highest_sgpa: Optional[float]
    lowest_sgpa: Optional[float]

class SGPAChart(BaseModel):
    labels: List[str]
    values: List[int]

class SubjectAverageChart(BaseModel):
    labels: List[str]
    values: List[float]

class SubjectPassFailChart(BaseModel):
    labels: List[str]
    pass_counts: List[int]
    fail_counts: List[int]
