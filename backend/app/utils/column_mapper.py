"""
Column mapping and normalization utilities for TSheet Viewer.

Handles varied column naming across different TSheet formats by defining
a comprehensive alias map and flexible normalization logic.
"""

# All known aliases mapped to a single standard column name
COLUMN_ALIASES = {
    # Roll No variants
    "roll no": "Roll No",
    "roll number": "Roll No",
    "rollno": "Roll No",
    "roll_no": "Roll No",
    "enrollment": "Roll No",
    "enrollment no": "Roll No",
    "enroll no": "Roll No",
    "student id": "Roll No",
    "student no": "Roll No",

    # Name variants
    "name": "Name",
    "student name": "Name",
    "student's name": "Name",
    "full name": "Name",

    # Subject Code variants
    "sub code": "Sub Code",
    "subject code": "Sub Code",
    "subcode": "Sub Code",
    "sub_code": "Sub Code",
    "course code": "Sub Code",

    # Subject Name variants
    "sub name": "Sub Name",
    "subject name": "Sub Name",
    "subname": "Sub Name",
    "subject": "Sub Name",
    "course name": "Sub Name",
    "course": "Sub Name",

    # Marks variants
    "internal": "Internal",
    "internal marks": "Internal",
    "int": "Internal",
    "ia": "Internal",
    "cie": "Internal",

    "external": "External",
    "external marks": "External",
    "ext": "External",
    "see": "External",

    "total": "Total",
    "total marks": "Total",
    "marks": "Total",

    # Status variants
    "status": "Status",
    "result": "Status",
    "pass/fail": "Status",
    "p/f": "Status",

    # Grade variants
    "grade": "Grade",
    "letter grade": "Grade",

    # Points / Credits
    "points": "Points",
    "grade points": "Points",
    "credit points": "Points",

    "credits": "Credits",
    "credit": "Credits",
    "credit hours": "Credits",

    # Optional: SGPA / CGPA
    "sgpa": "SGPA",
    "sem gpa": "SGPA",
    "semester gpa": "SGPA",

    "cgpa": "CGPA",
    "cumulative gpa": "CGPA",
}

# Minimum required columns to consider the sheet valid
REQUIRED_COLUMNS = [
    "Roll No", "Name", "Sub Code", "Sub Name",
    "Internal", "External", "Total", "Status",
    "Grade", "Points", "Credits"
]

# Optional columns - will be added as None if missing
OPTIONAL_COLUMNS = ["SGPA", "CGPA"]

# All standard column names (required + optional)
ALL_STANDARD_COLUMNS = REQUIRED_COLUMNS + OPTIONAL_COLUMNS


def normalize_column_name(raw: str) -> str:
    """
    Normalize a single raw column name to its standard equivalent.
    Falls back to the original stripped name if no match found.
    """
    lookup = raw.strip().lower()
    return COLUMN_ALIASES.get(lookup, raw.strip())


def normalize_columns(raw_columns: list) -> dict:
    """
    Map a list of raw column names to standardized names.
    Returns {raw_col: standard_col} dict.
    """
    return {col: normalize_column_name(col) for col in raw_columns}

