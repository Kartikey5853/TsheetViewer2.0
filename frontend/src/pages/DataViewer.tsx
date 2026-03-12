import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import StudentTable from "@/components/students/StudentTable";
import { Input } from "@/components/ui/input";
import { tsheetService } from "@/services/tsheetService";
import type { StudentSummary } from "@/types/apiTypes";

const PAGE_SIZE = 25;

export default function DataViewer() {
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [cgpaFilter, setCgpaFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async (): Promise<void> => {
      try {
        const data = await tsheetService.getStudents();
        setStudents(data);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const groupedStudents = useMemo(() => {
    const seen = new Set<string>();
    const unique = students.filter((student) => {
      if (seen.has(student.roll_no)) return false;
      seen.add(student.roll_no);
      return true;
    });

    const queryTerm = query.trim().toLowerCase();

    return unique.filter((student) => {
      const searchMatch =
        queryTerm.length === 0 ||
        student.roll_no.toLowerCase().includes(queryTerm) ||
        student.name.toLowerCase().includes(queryTerm);

      const statusMatch = statusFilter === "ALL" || student.status.toUpperCase() === statusFilter;

      let cgpaMatch = true;
      if (cgpaFilter === "GE_9") cgpaMatch = student.cgpa >= 9;
      if (cgpaFilter === "R_8_9") cgpaMatch = student.cgpa >= 8 && student.cgpa < 9;
      if (cgpaFilter === "R_7_8") cgpaMatch = student.cgpa >= 7 && student.cgpa < 8;
      if (cgpaFilter === "LT_7") cgpaMatch = student.cgpa < 7;

      return searchMatch && statusMatch && cgpaMatch;
    });
  }, [students, query, statusFilter, cgpaFilter]);

  useEffect(() => {
    setPage(1);
  }, [query, statusFilter, cgpaFilter]);

  const totalPages = Math.max(1, Math.ceil(groupedStudents.length / PAGE_SIZE));
  const paginatedStudents = groupedStudents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (loading) {
    return <p className="rounded-xl border border-border bg-card p-6 text-sm">Loading student list...</p>;
  }

  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-xl font-semibold">Student List</h2>
        <p className="text-sm text-muted-foreground">Search and filter by CGPA and pass/fail.</p>
      </div>

      <div className="grid gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-3">
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search roll number or name" />
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="ALL">All Status</option>
          <option value="PASS">Pass</option>
          <option value="FAIL">Fail</option>
        </select>
        <select
          value={cgpaFilter}
          onChange={(event) => setCgpaFilter(event.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="ALL">All CGPA</option>
          <option value="GE_9">CGPA ≥ 9</option>
          <option value="R_8_9">CGPA 8-9</option>
          <option value="R_7_8">CGPA 7-8</option>
          <option value="LT_7">CGPA {'<'} 7</option>
        </select>
      </div>

      <div className="grid gap-4">
        <StudentTable
          students={paginatedStudents}
          onSelect={(rollNo) => {
            navigate(`/student/${rollNo}`);
          }}
        />

        <div className="flex flex-wrap items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * PAGE_SIZE + 1} - {Math.min(page * PAGE_SIZE, groupedStudents.length)} of {groupedStudents.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page === 1}
              className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm font-medium">
              Page {page} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page >= totalPages}
              className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
