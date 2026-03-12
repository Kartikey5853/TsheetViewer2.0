import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import StudentDetail from "@/components/students/StudentDetail";
import { tsheetService } from "@/services/tsheetService";
import type { StudentDetailResponse } from "@/types/apiTypes";

const emptyStudent: StudentDetailResponse = {
  roll_no: "",
  name: "",
  sgpa: 0,
  cgpa: 0,
  subjects: [],
};

export default function StudentPage() {
  const { rollNo = "" } = useParams();
  const [student, setStudent] = useState<StudentDetailResponse>(emptyStudent);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async (): Promise<void> => {
      if (!rollNo) {
        setLoading(false);
        return;
      }

      try {
        const data = await tsheetService.getStudentByRoll(rollNo);
        setStudent(data);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [rollNo]);

  if (loading) {
    return <p className="rounded-xl border border-border bg-card p-6 text-sm">Loading student details...</p>;
  }

  return (
    <section className="grid gap-4">
      <div className="flex items-center gap-3">
        <Link to="/data-viewer" className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent">
          Back to List
        </Link>
        <h2 className="text-xl font-semibold">Student Details</h2>
      </div>
      <StudentDetail student={student} />
    </section>
  );
}
