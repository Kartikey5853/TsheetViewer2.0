import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import type { SubjectAverageItem } from "@/types/apiTypes";
import type { ActiveElement, ChartEvent } from "chart.js";
import { cn } from "@/lib/utils";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface SubjectAverageChartProps {
  data: SubjectAverageItem[];
  onSubjectSelect?: (subject: string) => void;
  className?: string;
}

export default function SubjectAverageChart({ data, onSubjectSelect, className }: SubjectAverageChartProps) {
  const labels = data.map((item) => item.subject_code || item.subject_name);
  return (
    <div className={cn("h-[420px] rounded-2xl border border-border bg-card p-4 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg", className)}>
      <h3 className="mb-1 text-base font-semibold">Average Marks per Subject</h3>
      <p className="mb-4 text-xs text-muted-foreground">Helps identify the hardest and easiest subjects</p>
      <div className="h-[320px] overflow-hidden">
        <Bar
          data={{
            labels,
            datasets: [
              {
                label: "Average Marks",
                data: data.map((item) => item.average_marks),
                backgroundColor: "rgba(0,184,122,0.7)",
                borderRadius: 8,
              },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            onClick: (event: ChartEvent, elements: ActiveElement[]) => {
              if (!onSubjectSelect || elements.length === 0) return;
              const index = elements[0].index;
              const subject = labels[index];
              if (subject) {
                onSubjectSelect(subject);
              }
            },
            plugins: {
              legend: { display: false },
            },
          }}
        />
      </div>
    </div>
  );
}
