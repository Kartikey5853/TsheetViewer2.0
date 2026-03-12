import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import UploadPanel from "@/components/upload/UploadPanel";
import { tsheetService } from "@/services/tsheetService";
import type { ComparisonResponse } from "@/types/apiTypes";

const emptyComparison: ComparisonResponse = {
  summary: [],
  status_counts: {},
  overview: {
    current_students: 0,
    matched_students: 0,
    new_students: 0,
    avg_sgpa_change: 0,
  },
};

const PAGE_SIZE = 20;

export default function Compare() {
  const [comparison, setComparison] = useState<ComparisonResponse>(emptyComparison);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  const loadComparison = async (): Promise<void> => {
    setLoading(true);
    try {
      const data = await tsheetService.getComparison();
      setComparison(data);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file: File): Promise<void> => {
    await tsheetService.uploadPrevious(file);
    await loadComparison();
  };

  const statusBadges = useMemo(() => Object.entries(comparison.status_counts), [comparison.status_counts]);
  const totalPages = Math.max(1, Math.ceil(comparison.summary.length / PAGE_SIZE));
  const rows = comparison.summary.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <section className="grid gap-4">
      <div>
        <h2 className="text-2xl font-semibold">Compare Semesters</h2>
        <p className="text-sm text-muted-foreground">Upload previous semester sheet and compare student changes.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <UploadPanel
            title="Upload Previous Semester"
            endpoint="previous"
            onUpload={async (file) => {
              await handleUpload(file);
            }}
          />
        </div>

        <article className="rounded-2xl border border-border bg-card p-4 shadow-sm lg:col-span-8">
          <h3 className="text-base font-semibold">Comparison Overview</h3>
          <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-xl bg-muted/40 p-3 text-sm">Current: {comparison.overview.current_students}</div>
            <div className="rounded-xl bg-muted/40 p-3 text-sm">Matched: {comparison.overview.matched_students}</div>
            <div className="rounded-xl bg-muted/40 p-3 text-sm">New: {comparison.overview.new_students}</div>
            <div className="rounded-xl bg-muted/40 p-3 text-sm">Avg SGPA Change: {comparison.overview.avg_sgpa_change.toFixed(2)}</div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {statusBadges.map(([status, count]) => (
              <span key={status} className="rounded-full border border-border px-3 py-1 text-xs">
                {status}: {count}
              </span>
            ))}
          </div>
        </article>
      </div>

      <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-base font-semibold">Comparison Data Viewer</h3>
          <button
            type="button"
            onClick={() => {
              void loadComparison();
            }}
            className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-accent"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <p className="p-4 text-sm text-muted-foreground">Loading comparison...</p>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/60 text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Roll No</th>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">SGPA Prev</th>
                  <th className="px-3 py-2">SGPA Curr</th>
                  <th className="px-3 py-2">SGPA Δ</th>
                  <th className="px-3 py-2">CGPA Prev</th>
                  <th className="px-3 py-2">CGPA Curr</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.roll_no}
                    className="cursor-pointer border-t border-border hover:bg-accent/40"
                    onClick={() => navigate(`/compare/student/${row.roll_no}`)}
                  >
                    <td className="px-3 py-2">{row.roll_no}</td>
                    <td className="px-3 py-2">{row.name}</td>
                    <td className="px-3 py-2">{row.sgpa_prev.toFixed(2)}</td>
                    <td className="px-3 py-2">{row.sgpa_curr.toFixed(2)}</td>
                    <td className="px-3 py-2">{row.sgpa_change.toFixed(2)}</td>
                    <td className="px-3 py-2">{row.cgpa_prev.toFixed(2)}</td>
                    <td className="px-3 py-2">{row.cgpa_curr.toFixed(2)}</td>
                    <td className="px-3 py-2">{row.status}</td>
                  </tr>
                ))}
                {comparison.summary.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-3 py-6 text-center text-muted-foreground">
                      Upload previous semester data to compare.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </article>

      <div className="flex flex-wrap items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
        <p className="text-sm text-muted-foreground">
          Showing {(page - 1) * PAGE_SIZE + 1} - {Math.min(page * PAGE_SIZE, comparison.summary.length)} of {comparison.summary.length}
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
