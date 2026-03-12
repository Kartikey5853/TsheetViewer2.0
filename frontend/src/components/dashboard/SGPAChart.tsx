import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import type { SgpaDistributionItem } from "@/types/apiTypes";
import type { ActiveElement, ChartEvent } from "chart.js";
import { cn } from "@/lib/utils";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface SGPAChartProps {
  data: SgpaDistributionItem[];
  title?: string;
  onBucketSelect?: (bucket: string) => void;
  className?: string;
}

export default function SGPAChart({ data, title = "Class Performance Distribution", onBucketSelect, className }: SGPAChartProps) {
  const labels = data.map((item) => item.label);
  return (
    <div className={cn("h-[420px] rounded-2xl border border-border bg-card p-4 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg", className)}>
      <h3 className="mb-1 text-base font-semibold">{title}</h3>
      <p className="mb-4 text-xs text-muted-foreground">Student count per SGPA range</p>
      <div className="h-[320px] overflow-hidden">
        <Bar
          data={{
            labels,
            datasets: [
              {
                label: "Students",
                data: data.map((item) => item.count),
                backgroundColor: "rgba(30,157,241,0.7)",
                borderRadius: 8,
              },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            onClick: (event: ChartEvent, elements: ActiveElement[]) => {
              if (!onBucketSelect || elements.length === 0) return;
              const index = elements[0].index;
              const bucket = labels[index];
              if (bucket) {
                onBucketSelect(bucket);
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
