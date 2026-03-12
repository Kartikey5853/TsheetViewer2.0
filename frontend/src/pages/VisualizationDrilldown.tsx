import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { Input } from "@/components/ui/input";
import { tsheetService } from "@/services/tsheetService";
import type { DrilldownResponse } from "@/types/apiTypes";

const PAGE_SIZE = 25;

const emptyDrilldown: DrilldownResponse = {
  title: "",
  count: 0,
  records: [],
};

export default function VisualizationDrilldown() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [gradeFilter, setGradeFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [drilldown, setDrilldown] = useState<DrilldownResponse>(emptyDrilldown);

  const type = searchParams.get("type") ?? "";
  const bucket = searchParams.get("bucket") ?? "";
  const subject = searchParams.get("subject") ?? "";
  const status = searchParams.get("status") ?? "";
  const grade = searchParams.get("grade") ?? "";

  useEffect(() => {
    const load = async (): Promise<void> => {
      setLoading(true);
      try {
        if (type === "sgpa" && bucket) {
          setDrilldown(await tsheetService.getSgpaBucketDrilldown(bucket));
        } else if (type === "subject" && subject) {
          setDrilldown(await tsheetService.getSubjectDrilldown(subject));
        } else if (type === "subjectStatus" && subject && status) {
          setDrilldown(await tsheetService.getSubjectStatusDrilldown(subject, status));
        } else if (type === "grade" && grade) {
          setDrilldown(await tsheetService.getGradeDrilldown(grade));
        } else {
          setDrilldown({ ...emptyDrilldown, title: "Invalid drilldown query" });
        }
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [type, bucket, subject, status, grade]);

  const filteredRecords = useMemo(() => {
    const q = query.trim().toLowerCase();

    return drilldown.records.filter((record) => {
      const matchesSearch =
        q.length === 0 ||
        record.roll_no.toLowerCase().includes(q) ||
        record.name.toLowerCase().includes(q) ||
        (record.sub_name ?? "").toLowerCase().includes(q);

      const matchesStatus = statusFilter === "ALL" || (record.status ?? "").toUpperCase() === statusFilter;
      const matchesGrade = gradeFilter === "ALL" || (record.grade ?? "").toUpperCase() === gradeFilter;

      return matchesSearch && matchesStatus && matchesGrade;
    });
  }, [drilldown.records, query, statusFilter, gradeFilter]);

  useEffect(() => {
    setPage(1);
  }, [query, statusFilter, gradeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));
  const paginated = filteredRecords.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const availableGrades = Array.from(new Set(drilldown.records.map((record) => (record.grade ?? "").toUpperCase()).filter(Boolean))).sort();

  if (loading) {
    return <p className="rounded-xl border border-border bg-card p-6 text-sm">Loading drilldown data...</p>;
  }

  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => navigate("/visualizations")}
          className="rounded-md border border-border px-3 py-2 text-sm hover:bg-accent"
        >
          Back to Visualizations
        </button>
        <div>
          <h2 className="text-2xl font-semibold">{drilldown.title}</h2>
          <p className="text-sm text-muted-foreground">{drilldown.count} records from visualization click</p>
        </div>
      </div>

      <div className="grid gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-3">
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search roll, name, subject" />
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
          value={gradeFilter}
          onChange={(event) => setGradeFilter(event.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="ALL">All Grades</option>
          {availableGrades.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>

      <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/60 text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Roll No</th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Subject</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Grade</th>
              <th className="px-3 py-2">Total</th>
              <th className="px-3 py-2">SGPA</th>
              <th className="px-3 py-2">CGPA</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((record) => (
              <tr
                key={`${record.roll_no}-${record.sub_name}-${record.grade}`}
                onClick={() => navigate(`/student/${record.roll_no}`)}
                className="cursor-pointer border-t border-border hover:bg-accent/40"
              >
                <td className="px-3 py-2">{record.roll_no}</td>
                <td className="px-3 py-2">{record.name}</td>
                <td className="px-3 py-2">{record.sub_name ?? "-"}</td>
                <td className="px-3 py-2">{record.status ?? "-"}</td>
                <td className="px-3 py-2">{record.grade ?? "-"}</td>
                <td className="px-3 py-2">{record.total ?? "-"}</td>
                <td className="px-3 py-2">{record.sgpa?.toFixed(2) ?? "-"}</td>
                <td className="px-3 py-2">{record.cgpa?.toFixed(2) ?? "-"}</td>
              </tr>
            ))}
            {paginated.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-muted-foreground">
                  No records found for current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </article>

      <div className="flex flex-wrap items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
        <p className="text-sm text-muted-foreground">
          Showing {(page - 1) * PAGE_SIZE + 1} - {Math.min(page * PAGE_SIZE, filteredRecords.length)} of {filteredRecords.length}
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
    </section>
  );
}
