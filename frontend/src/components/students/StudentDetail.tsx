import type { StudentDetailResponse } from "@/types/apiTypes";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface StudentDetailProps {
  student: StudentDetailResponse;
}

export default function StudentDetail({ student }: StudentDetailProps) {
  const subjectLabels = student.subjects.map((subject) => subject.subject_name || subject.subject_code);

  const parseMark = (value: number | string): number => {
    if (typeof value === "number") return value;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  return (
    <section className="grid gap-5">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <article className="rounded-2xl border border-border bg-card p-4 shadow-sm lg:col-span-2">
          <h3 className="mb-1 text-base font-semibold">Internal vs External vs Total</h3>
          <p className="mb-3 text-xs text-muted-foreground">Subject-wise marks comparison</p>
          <div className="h-[280px]">
            <Bar
              data={{
                labels: subjectLabels,
                datasets: [
                  {
                    label: "Internal",
                    data: student.subjects.map((s) => parseMark(s.internal)),
                    backgroundColor: "rgba(30,157,241,0.75)",
                    borderRadius: 6,
                  },
                  {
                    label: "External",
                    data: student.subjects.map((s) => parseMark(s.external)),
                    backgroundColor: "rgba(0,184,122,0.75)",
                    borderRadius: 6,
                  },
                  {
                    label: "Total",
                    data: student.subjects.map((s) => parseMark(s.total)),
                    backgroundColor: "rgba(247,185,40,0.75)",
                    borderRadius: 6,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: "bottom" } },
              }}
            />
          </div>
        </article>

        <div className="grid gap-3">
          <article className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">Student Name</p>
            <h2 className="mt-1 text-lg font-semibold">{student.name}</h2>
          </article>
          <article className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">Roll No</p>
            <h3 className="mt-1 text-lg font-semibold">{student.roll_no}</h3>
          </article>
          <article className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">SGPA / CGPA</p>
            <h3 className="mt-1 text-lg font-semibold">
              {student.sgpa.toFixed(2)} / {student.cgpa.toFixed(2)}
            </h3>
          </article>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/60 text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Subject Code</th>
              <th className="px-4 py-3">Subject Name</th>
              <th className="px-4 py-3">Internal</th>
              <th className="px-4 py-3">External</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Grade</th>
            </tr>
          </thead>
          <tbody>
            {student.subjects.map((subject) => (
              <tr key={`${subject.subject_code}-${subject.subject_name}`} className="border-t border-border">
                <td className="px-4 py-3 font-medium">{subject.subject_code}</td>
                <td className="px-4 py-3">{subject.subject_name}</td>
                <td className="px-4 py-3">{subject.internal}</td>
                <td className="px-4 py-3">{subject.external}</td>
                <td className="px-4 py-3">{subject.total}</td>
                <td className="px-4 py-3">{subject.status}</td>
                <td className="px-4 py-3">{subject.grade}</td>
              </tr>
            ))}
            {student.subjects.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">
                  No subject data available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
