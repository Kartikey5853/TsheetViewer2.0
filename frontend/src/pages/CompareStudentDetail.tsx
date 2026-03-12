import { Link, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";
import { Bar } from "react-chartjs-2";

import { tsheetService } from "@/services/tsheetService";
import type { ComparisonSummaryItem, StudentDetailResponse } from "@/types/apiTypes";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const emptyStudent: StudentDetailResponse = {
  roll_no: "",
  name: "",
  sgpa: 0,
  cgpa: 0,
  subjects: [],
};

const emptyCompareRow: ComparisonSummaryItem = {
  roll_no: "",
  name: "",
  sgpa_curr: 0,
  sgpa_prev: 0,
  sgpa_change: 0,
  sgpa_percent_change: 0,
  cgpa_curr: 0,
  cgpa_prev: 0,
  cgpa_change: 0,
  status: "-",
  rank_curr: 0,
  rank_prev: 0,
  rank_change: 0,
};

export default function CompareStudentDetail() {
  const { rollNo = "" } = useParams();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<StudentDetailResponse>(emptyStudent);
  const [compareRow, setCompareRow] = useState<ComparisonSummaryItem>(emptyCompareRow);

  useEffect(() => {
    const load = async (): Promise<void> => {
      if (!rollNo) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [studentData, comparisonData] = await Promise.all([
          tsheetService.getStudentByRoll(rollNo),
          tsheetService.getComparison(),
        ]);

        setStudent(studentData);
        const row = comparisonData.summary.find((item) => item.roll_no === rollNo);
        if (row) {
          setCompareRow(row);
        }
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [rollNo]);

  const subjectCompare = useMemo(() => {
    const prevMap = new Map<string, number>();
    (student.previous?.subjects ?? []).forEach((s) => {
      const key = (s.subject_name || s.subject_code).toLowerCase();
      const val = typeof s.total === "number" ? s.total : Number(s.total);
      prevMap.set(key, Number.isNaN(val) ? 0 : val);
    });

    return student.subjects.map((s) => {
      const key = (s.subject_name || s.subject_code).toLowerCase();
      const currentVal = typeof s.total === "number" ? s.total : Number(s.total);
      return {
        label: s.subject_name || s.subject_code,
        current: Number.isNaN(currentVal) ? 0 : currentVal,
        previous: prevMap.get(key) ?? 0,
      };
    });
  }, [student]);

  if (loading) {
    return <p className="rounded-xl border border-border bg-card p-6 text-sm">Loading comparison detail...</p>;
  }

  return (
    <section className="grid gap-4">
      <div className="flex items-center gap-3">
        <Link to="/compare" className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent">
          Back to Compare
        </Link>
        <h2 className="text-xl font-semibold">Compare Student Detail</h2>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <h3 className="mb-3 text-base font-semibold">Current Performance</h3>
          <table className="w-full text-sm">
            <tbody>
              <tr>
                <td className="py-1 text-muted-foreground">Name</td>
                <td className="py-1 font-medium">{student.name}</td>
              </tr>
              <tr>
                <td className="py-1 text-muted-foreground">Roll No</td>
                <td className="py-1 font-medium">{student.roll_no}</td>
              </tr>
              <tr>
                <td className="py-1 text-muted-foreground">SGPA</td>
                <td className="py-1 font-medium">{student.sgpa.toFixed(2)}</td>
              </tr>
              <tr>
                <td className="py-1 text-muted-foreground">CGPA</td>
                <td className="py-1 font-medium">{student.cgpa.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </article>

        <article className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <h3 className="mb-3 text-base font-semibold">Previous Semester Performance</h3>
          <table className="w-full text-sm">
            <tbody>
              <tr>
                <td className="py-1 text-muted-foreground">SGPA</td>
                <td className="py-1 font-medium">{String(student.previous?.sgpa ?? "-")}</td>
              </tr>
              <tr>
                <td className="py-1 text-muted-foreground">CGPA</td>
                <td className="py-1 font-medium">{String(student.previous?.cgpa ?? "-")}</td>
              </tr>
              <tr>
                <td className="py-1 text-muted-foreground">Status</td>
                <td className="py-1 font-medium">{student.previous?.status ?? "-"}</td>
              </tr>
              <tr>
                <td className="py-1 text-muted-foreground">Comparison Result</td>
                <td className="py-1 font-medium">{compareRow.status}</td>
              </tr>
            </tbody>
          </table>
        </article>
      </div>

      <article className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <h3 className="mb-2 text-base font-semibold">SGPA / CGPA Comparison</h3>
        <div className="h-[320px]">
          <Bar
            data={{
              labels: ["SGPA", "CGPA"],
              datasets: [
                {
                  label: "Current",
                  data: [compareRow.sgpa_curr, compareRow.cgpa_curr],
                  backgroundColor: "rgba(30,157,241,0.75)",
                  borderRadius: 8,
                },
                {
                  label: "Previous",
                  data: [compareRow.sgpa_prev, compareRow.cgpa_prev],
                  backgroundColor: "rgba(46,125,50,0.75)",
                  borderRadius: 8,
                },
              ],
            }}
            options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom" } } }}
          />
        </div>
      </article>

      <article className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <h3 className="mb-2 text-base font-semibold">Subject Total Marks Comparison</h3>
        <div className="h-[340px]">
          <Bar
            data={{
              labels: subjectCompare.map((s) => s.label),
              datasets: [
                {
                  label: "Current Total",
                  data: subjectCompare.map((s) => s.current),
                  backgroundColor: "rgba(30,157,241,0.75)",
                  borderRadius: 8,
                },
                {
                  label: "Previous Total",
                  data: subjectCompare.map((s) => s.previous),
                  backgroundColor: "rgba(247,185,40,0.75)",
                  borderRadius: 8,
                },
              ],
            }}
            options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom" } } }}
          />
        </div>
      </article>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-4 py-3 text-sm font-semibold">Current Subjects</div>
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/60 text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Subject</th>
                <th className="px-3 py-2">Total</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Grade</th>
              </tr>
            </thead>
            <tbody>
              {student.subjects.map((s) => (
                <tr key={`curr-${s.subject_code}-${s.subject_name}`} className="border-t border-border">
                  <td className="px-3 py-2">{s.subject_name || s.subject_code}</td>
                  <td className="px-3 py-2">{String(s.total)}</td>
                  <td className="px-3 py-2">{s.status}</td>
                  <td className="px-3 py-2">{s.grade}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>

        <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-4 py-3 text-sm font-semibold">Previous Subjects</div>
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/60 text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Subject</th>
                <th className="px-3 py-2">Total</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Grade</th>
              </tr>
            </thead>
            <tbody>
              {(student.previous?.subjects ?? []).map((s) => (
                <tr key={`prev-${s.subject_code}-${s.subject_name}`} className="border-t border-border">
                  <td className="px-3 py-2">{s.subject_name || s.subject_code}</td>
                  <td className="px-3 py-2">{String(s.total)}</td>
                  <td className="px-3 py-2">{s.status}</td>
                  <td className="px-3 py-2">{s.grade}</td>
                </tr>
              ))}
              {(student.previous?.subjects ?? []).length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">
                    No previous semester subject data.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </article>
      </div>
    </section>
  );
}
