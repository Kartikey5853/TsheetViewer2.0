import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import GradeDistributionChart from "@/components/dashboard/GradeDistributionChart";
import PassFailChart from "@/components/dashboard/PassFailChart";
import SGPAChart from "@/components/dashboard/SGPAChart";
import SubjectAverageChart from "@/components/dashboard/SubjectAverageChart";
import { tsheetService } from "@/services/tsheetService";
import type { VisualizationsResponse } from "@/types/apiTypes";

const emptyVisualizations: VisualizationsResponse = {
  sgpa_distribution: [],
  subject_averages: [],
  subject_pass_fail: [],
  grade_distribution: [],
  performers: { top: [], bottom: [] },
};

export default function Visualizations() {
  const [visuals, setVisuals] = useState<VisualizationsResponse>(emptyVisualizations);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async (): Promise<void> => {
      try {
        const data = await tsheetService.getVisualizations();
        setVisuals(data);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  if (loading) {
    return <p className="rounded-xl border border-border bg-card p-6 text-sm">Loading visualizations...</p>;
  }

  return (
    <section className="grid grid-cols-1 gap-4">
      <div>
        <h2 className="text-2xl font-semibold">Visualization Center</h2>
        <p className="text-sm text-muted-foreground">Click any chart section to open drilldown page.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <SGPAChart
          data={visuals.sgpa_distribution}
          onBucketSelect={(bucket) => {
            navigate(`/visualizations/drilldown?type=sgpa&bucket=${encodeURIComponent(bucket)}`);
          }}
          className="min-w-0 overflow-hidden"
        />
        <SubjectAverageChart
          data={visuals.subject_averages}
          onSubjectSelect={(subject) => {
            navigate(`/visualizations/drilldown?type=subject&subject=${encodeURIComponent(subject)}`);
          }}
          className="min-w-0 overflow-hidden"
        />

        <PassFailChart
          data={visuals.subject_pass_fail}
          onSubjectStatusSelect={(subject, status) => {
            navigate(
              `/visualizations/drilldown?type=subjectStatus&subject=${encodeURIComponent(subject)}&status=${encodeURIComponent(status)}`,
            );
          }}
          className="min-w-0 overflow-hidden"
        />

        <GradeDistributionChart
          data={visuals.grade_distribution}
          onGradeSelect={(grade) => {
            navigate(`/visualizations/drilldown?type=grade&grade=${encodeURIComponent(grade)}`);
          }}
          className="min-w-0 overflow-hidden"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-border bg-card p-4 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg">
          <h3 className="mb-3 text-base font-semibold">Top 5 Students</h3>
          <div className="space-y-2">
            {visuals.performers.top.slice(0, 5).map((student) => (
              <button
                key={`top-${student.roll_no}`}
                type="button"
                onClick={() => navigate(`/student/${student.roll_no}`)}
                className="flex w-full items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-left text-sm hover:bg-accent"
              >
                <span>{student.name}</span>
                <span className="font-semibold">SGPA {student.sgpa.toFixed(2)}</span>
              </button>
            ))}
          </div>
        </article>

        <article className="rounded-2xl border border-border bg-card p-4 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg">
          <h3 className="mb-3 text-base font-semibold">Bottom 5 Students</h3>
          <div className="space-y-2">
            {visuals.performers.bottom.slice(0, 5).map((student) => (
              <button
                key={`bottom-${student.roll_no}`}
                type="button"
                onClick={() => navigate(`/student/${student.roll_no}`)}
                className="flex w-full items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-left text-sm hover:bg-accent"
              >
                <span>{student.name}</span>
                <span className="font-semibold">SGPA {student.sgpa.toFixed(2)}</span>
              </button>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
