import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import type { SubjectPassFailItem } from "@/types/apiTypes";
import type { ActiveElement, ChartEvent } from "chart.js";
import { cn } from "@/lib/utils";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface PassFailChartProps {
  data: SubjectPassFailItem[];
  onSubjectStatusSelect?: (subject: string, status: "PASS" | "FAIL") => void;
  className?: string;
}

export default function PassFailChart({ data, onSubjectStatusSelect, className }: PassFailChartProps) {
  const labels = data.map((item) => item.subject_name || item.subject_code);

  return (
    <div className={cn("h-[440px] rounded-2xl border border-border bg-card p-4 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg", className)}>
      <h3 className="mb-1 text-base font-semibold">Subject Pass/Fail Breakdown</h3>
      <p className="mb-4 text-xs text-muted-foreground">Click a bar to view failed or passed students per subject</p>
      <div className="h-[340px] overflow-hidden">
        <Bar
          data={{
            labels,
            datasets: [
              {
                label: "Pass",
                data: data.map((item) => item.pass_count),
                backgroundColor: "rgba(23,191,99,0.8)",
                borderRadius: 6,
              },
              {
                label: "Fail",
                data: data.map((item) => item.fail_count),
                backgroundColor: "rgba(224,36,94,0.8)",
                borderRadius: 6,
              },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            onClick: (event: ChartEvent, elements: ActiveElement[]) => {
              if (!onSubjectStatusSelect || elements.length === 0) return;
              const firstPoint = elements[0];
              const subject = labels[firstPoint.index];
              const status = firstPoint.datasetIndex === 0 ? "PASS" : "FAIL";
              if (subject) {
                onSubjectStatusSelect(subject, status);
              }
            },
            plugins: {
              legend: { position: "bottom" },
            },
          }}
        />
      </div>
    </div>
  );
}
