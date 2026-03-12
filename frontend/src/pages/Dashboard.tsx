import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import GradeDistributionChart from "@/components/dashboard/GradeDistributionChart";
import SGPAChart from "@/components/dashboard/SGPAChart";
import StatCard from "@/components/dashboard/StatCard";
import { tsheetService } from "@/services/tsheetService";
import type { DashboardResponse, VisualizationsResponse } from "@/types/apiTypes";

const emptyStats: DashboardResponse = {
  total_students: 0,
  pass_percentage: 0,
  average_sgpa: 0,
  highest_sgpa: 0,
  lowest_sgpa: 0,
  average_cgpa: 0,
  highest_cgpa: 0,
  lowest_cgpa: 0,
};

const emptyVisualizations: VisualizationsResponse = {
  sgpa_distribution: [],
  subject_averages: [],
  subject_pass_fail: [],
  grade_distribution: [],
  performers: { top: [], bottom: [] },
};

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardResponse>(emptyStats);
  const [visuals, setVisuals] = useState<VisualizationsResponse>(emptyVisualizations);
  const [loading, setLoading] = useState(true);
  const [activeGraph, setActiveGraph] = useState<"sgpa" | "grade">("sgpa");

  useEffect(() => {
    const load = async (): Promise<void> => {
      try {
        const [dashboardData, visualData] = await Promise.all([
          tsheetService.getDashboard(),
          tsheetService.getVisualizations(),
        ]);
        setStats(dashboardData);
        setVisuals(visualData);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const cardValues = useMemo(
    () => [
      { title: "Total Students", value: String(stats.total_students), tone: "primary" as const },
      { title: "Pass Percentage", value: `${stats.pass_percentage.toFixed(2)}%` },
      { title: "Highest SGPA", value: stats.highest_sgpa.toFixed(2) },
      { title: "Highest CGPA", value: stats.highest_cgpa.toFixed(2) },
      { title: "Lowest SGPA", value: stats.lowest_sgpa.toFixed(2) },
      { title: "Lowest CGPA", value: stats.lowest_cgpa.toFixed(2) },
      { title: "Average SGPA", value: stats.average_sgpa.toFixed(2) },
      { title: "Average CGPA", value: stats.average_cgpa.toFixed(2) },
    ],
    [stats],
  );

  if (loading) {
    return <p className="rounded-xl border border-border bg-card p-6 text-sm">Loading dashboard...</p>;
  }

  return (
    <div className="grid min-h-[calc(100vh-150px)] gap-5">
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <article className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/25 via-accent/35 to-card p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl lg:col-span-7">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-xl font-bold">
                <span className="logo-gradient">TSheet</span> Performance Graph
              </h3>
              <p className="text-xs text-muted-foreground">Toggle SGPA or Grade distribution</p>
            </div>
            <div className="inline-flex rounded-lg border border-border bg-card/70 p-1">
              <button
                type="button"
                onClick={() => setActiveGraph("sgpa")}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                  activeGraph === "sgpa" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                SGPA
              </button>
              <button
                type="button"
                onClick={() => setActiveGraph("grade")}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                  activeGraph === "grade" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                Grade
              </button>
            </div>
          </div>

          <div className="h-[520px]">
            {activeGraph === "sgpa" ? (
              <SGPAChart data={visuals.sgpa_distribution} title="Class Performance Distribution" className="h-[520px]" />
            ) : (
              <GradeDistributionChart data={visuals.grade_distribution} title="Class Grade Distribution" className="h-[520px]" />
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <Link to="/visualizations" className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
              Open Visualizations
            </Link>
            <Link to="/data-viewer" className="rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold hover:bg-accent">
              Open Data Viewer
            </Link>
          </div>
        </article>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:col-span-5">
          {cardValues.map((card) => (
            <div key={card.title}>
            <StatCard title={card.title} value={card.value} tone={card.tone} />
          </div>
          ))}
        </div>
      </section>
    </div>
  );
}
