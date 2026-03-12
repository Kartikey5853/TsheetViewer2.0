import { ArcElement, Chart as ChartJS, Legend, Tooltip } from "chart.js";
import { Doughnut } from "react-chartjs-2";

import type { ActiveElement, ChartEvent } from "chart.js";
import type { GradeDistributionItem } from "@/types/apiTypes";
import { cn } from "@/lib/utils";

ChartJS.register(ArcElement, Tooltip, Legend);

interface GradeDistributionChartProps {
  data: GradeDistributionItem[];
  onGradeSelect?: (grade: string) => void;
  title?: string;
  className?: string;
}

const colors = [
  "rgba(30,157,241,0.85)",
  "rgba(0,184,122,0.85)",
  "rgba(247,185,40,0.85)",
  "rgba(23,191,99,0.85)",
  "rgba(224,36,94,0.85)",
  "rgba(131,86,255,0.85)",
];

export default function GradeDistributionChart({
  data,
  onGradeSelect,
  title = "Grade Distribution",
  className,
}: GradeDistributionChartProps) {
  const labels = data.map((item) => item.grade);

  return (
    <div className={cn("h-[420px] rounded-2xl border border-border bg-card p-4 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg", className)}>
      <h3 className="mb-1 text-base font-semibold">{title}</h3>
      <p className="mb-4 text-xs text-muted-foreground">Click a grade slice to inspect students</p>
      <div className="h-[320px] overflow-hidden">
        <Doughnut
          data={{
            labels,
            datasets: [
              {
                data: data.map((item) => item.count),
                backgroundColor: labels.map((_, idx) => colors[idx % colors.length]),
                borderWidth: 0,
              },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            cutout: "64%",
            onClick: (event: ChartEvent, elements: ActiveElement[]) => {
              if (!onGradeSelect || elements.length === 0) return;
              const grade = labels[elements[0].index];
              if (grade) {
                onGradeSelect(grade);
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
