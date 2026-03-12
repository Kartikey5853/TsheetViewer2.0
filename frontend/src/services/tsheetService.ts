import apiClient from "@/api/axios";
import type {
  ComparisonResponse,
  DashboardResponse,
  DrilldownResponse,
  GradeDistributionItem,
  StudentDetailResponse,
  StudentSummary,
  StudentSubject,
  SubjectAverageItem,
  SubjectPassFailItem,
  TopBottomPerformers,
  UploadResponse,
  VisualizationsResponse,
} from "@/types/apiTypes";

const asNumber = (value: unknown): number => {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

const asOptionalNumber = (value: unknown): number | undefined => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
};

const mapDashboard = (raw: Record<string, unknown>): DashboardResponse => ({
  total_students: asNumber(raw.total_students ?? raw.totalStudents),
  pass_percentage: asNumber(raw.pass_percentage ?? raw.passPercentage),
  average_sgpa: asNumber(raw.average_sgpa ?? raw.averageSgpa ?? raw.avg_sgpa),
  highest_sgpa: asNumber(raw.highest_sgpa ?? raw.highestSgpa),
  lowest_sgpa: asNumber(raw.lowest_sgpa ?? raw.lowestSgpa),
  average_cgpa: asNumber(raw.average_cgpa ?? raw.averageCgpa ?? raw.avg_cgpa),
  highest_cgpa: asNumber(raw.highest_cgpa ?? raw.highestCgpa),
  lowest_cgpa: asNumber(raw.lowest_cgpa ?? raw.lowestCgpa),
});

const asNumberOrText = (value: unknown): number | string => {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? value : parsed;
  }
  return "-";
};

const mapSubject = (item: Record<string, unknown>): StudentSubject => ({
  subject_code: String(item.subject_code ?? item.subjectCode ?? item.sub_code ?? ""),
  subject_name: String(item.subject_name ?? item.subjectName ?? item.sub_name ?? ""),
  internal: asNumberOrText(item.internal),
  external: asNumberOrText(item.external),
  total: asNumberOrText(item.total),
  status: String(item.status ?? "-"),
  grade: String(item.grade ?? "-"),
});

const mapStudent = (item: Record<string, unknown>): StudentSummary => ({
  roll_no: String(item.roll_no ?? item.rollNo ?? ""),
  name: String(item.name ?? "Unknown"),
  sgpa: asNumber(item.sgpa),
  cgpa: asNumber(item.cgpa),
  status: String(item.status ?? "-"),
});

const mapPerformers = (raw: Record<string, unknown>): TopBottomPerformers => {
  const mapRows = (rows: unknown): TopBottomPerformers["top"] => {
    if (!Array.isArray(rows)) return [];
    return rows.map((entry) => {
      const row = entry as Record<string, unknown>;
      return {
        rank: asNumber(row.rank),
        roll_no: String(row.roll_no ?? ""),
        name: String(row.name ?? "-"),
        sgpa: asNumber(row.sgpa),
        cgpa: asNumber(row.cgpa),
      };
    });
  };

  return {
    top: mapRows(raw.top),
    bottom: mapRows(raw.bottom),
  };
};

const mapVisualization = (raw: Record<string, unknown>): VisualizationsResponse => {
  const sgpaObj = (raw.sgpa_distribution ?? raw.sgpaDistribution ?? {}) as Record<string, unknown>;
  const sgpaLabels = Array.isArray(sgpaObj.labels) ? (sgpaObj.labels as unknown[]) : [];
  const sgpaValues = Array.isArray(sgpaObj.values) ? (sgpaObj.values as unknown[]) : [];

  const avgObj = (raw.subject_averages ?? raw.subjectAverages ?? raw.subject_average ?? {}) as Record<string, unknown>;
  const avgLabels = Array.isArray(avgObj.labels) ? (avgObj.labels as unknown[]) : [];
  const avgValues = Array.isArray(avgObj.values) ? (avgObj.values as unknown[]) : [];

  const passFailObj = (raw.subject_pass_fail ?? raw.subjectPassFail ?? {}) as Record<string, unknown>;
  const pfLabels = Array.isArray(passFailObj.labels) ? (passFailObj.labels as unknown[]) : [];
  const passCounts = Array.isArray(passFailObj.pass_counts) ? (passFailObj.pass_counts as unknown[]) : [];
  const failCounts = Array.isArray(passFailObj.fail_counts) ? (passFailObj.fail_counts as unknown[]) : [];

  const gradeObj = (raw.grade_distribution ?? raw.gradeDistribution ?? {}) as Record<string, unknown>;
  const gradeLabels = Array.isArray(gradeObj.labels) ? (gradeObj.labels as unknown[]) : [];
  const gradeValues = Array.isArray(gradeObj.values) ? (gradeObj.values as unknown[]) : [];

  const gradeDistribution: GradeDistributionItem[] = gradeLabels.map((grade, idx) => ({
    grade: String(grade ?? "-"),
    count: asNumber(gradeValues[idx]),
  }));

  return {
    sgpa_distribution: sgpaLabels.map((label, idx) => {
      return {
        label: String(label ?? "N/A"),
        count: asNumber(sgpaValues[idx]),
      };
    }),
    subject_averages: avgLabels.map((label, idx) => {
      return {
        subject_code: String(label ?? ""),
        subject_name: String(label ?? "Subject"),
        average_marks: asNumber(avgValues[idx]),
      } satisfies SubjectAverageItem;
    }),
    subject_pass_fail: pfLabels.map((label, idx) => {
      return {
        subject_code: String(label ?? ""),
        subject_name: String(label ?? "Subject"),
        pass_count: asNumber(passCounts[idx]),
        fail_count: asNumber(failCounts[idx]),
      } satisfies SubjectPassFailItem;
    }),
    grade_distribution: gradeDistribution,
    performers: mapPerformers((raw.performers ?? {}) as Record<string, unknown>),
  };
};

const mapDrilldown = (raw: Record<string, unknown>, title: string): DrilldownResponse => ({
  title,
  count: asNumber(raw.count),
  records: Array.isArray(raw.records)
    ? raw.records.map((entry) => {
        const row = entry as Record<string, unknown>;
        return {
          roll_no: String(row.roll_no ?? ""),
          name: String(row.name ?? ""),
          sub_name: String(row.sub_name ?? ""),
          status: String(row.status ?? ""),
          grade: String(row.grade ?? ""),
          total: asNumberOrText(row.total),
          sgpa: asOptionalNumber(row.sgpa),
          cgpa: asOptionalNumber(row.cgpa),
        };
      })
    : [],
});

const mapComparison = (raw: Record<string, unknown>): ComparisonResponse => {
  const summary = Array.isArray(raw.summary)
    ? raw.summary.map((entry) => {
        const row = entry as Record<string, unknown>;
        return {
          roll_no: String(row.roll_no ?? ""),
          name: String(row.name ?? ""),
          sgpa_curr: asNumber(row.sgpa_curr),
          sgpa_prev: asNumber(row.sgpa_prev),
          sgpa_change: asNumber(row.sgpa_change),
          sgpa_percent_change: asNumber(row.sgpa_percent_change),
          cgpa_curr: asNumber(row.cgpa_curr),
          cgpa_prev: asNumber(row.cgpa_prev),
          cgpa_change: asNumber(row.cgpa_change),
          status: String(row.status ?? "Stable"),
          rank_curr: asNumber(row.rank_curr),
          rank_prev: asNumber(row.rank_prev),
          rank_change: asNumber(row.rank_change),
        };
      })
    : [];

  const statusCountsRaw = (raw.status_counts ?? {}) as Record<string, unknown>;
  const status_counts = Object.fromEntries(
    Object.entries(statusCountsRaw).map(([key, value]) => [key, asNumber(value)]),
  );

  const overviewRaw = (raw.overview ?? {}) as Record<string, unknown>;

  return {
    summary,
    status_counts,
    overview: {
      current_students: asNumber(overviewRaw.current_students),
      matched_students: asNumber(overviewRaw.matched_students),
      new_students: asNumber(overviewRaw.new_students),
      avg_sgpa_change: asNumber(overviewRaw.avg_sgpa_change),
    },
  };
};

export const tsheetService = {
  async uploadCurrent(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append("file", file);

    const { data } = await apiClient.post<UploadResponse>("/api/upload/current", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  async uploadPrevious(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append("file", file);

    const { data } = await apiClient.post<UploadResponse>("/api/upload/previous", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  async getDashboard(): Promise<DashboardResponse> {
    const { data } = await apiClient.get<Record<string, unknown>>("/api/dashboard");
    return mapDashboard(data);
  },

  async getVisualizations(): Promise<VisualizationsResponse> {
    const { data } = await apiClient.get<Record<string, unknown>>("/api/visualizations");
    return mapVisualization(data);
  },

  async getStudents(): Promise<StudentSummary[]> {
    const { data } = await apiClient.get<unknown>("/api/data");
    const rows = Array.isArray(data)
      ? data
      : Array.isArray((data as Record<string, unknown>).students)
        ? ((data as Record<string, unknown>).students as unknown[])
        : [];

    return rows.map((item) => mapStudent(item as Record<string, unknown>));
  },

  async getStudentByRoll(rollNo: string): Promise<StudentDetailResponse> {
    const { data } = await apiClient.get<Record<string, unknown>>(`/api/student/${rollNo}`);
    const subjectsRaw = Array.isArray(data.subjects) ? data.subjects : [];
    const previousRaw = (data.previous ?? null) as Record<string, unknown> | null;
    const previousSubjects = previousRaw && Array.isArray(previousRaw.subjects) ? previousRaw.subjects : [];

    return {
      roll_no: String(data.roll_no ?? data.rollNo ?? rollNo),
      name: String(data.name ?? "Unknown"),
      sgpa: asNumber(data.sgpa),
      cgpa: asNumber(data.cgpa),
      subjects: subjectsRaw.map((item) => mapSubject(item as Record<string, unknown>)),
      previous: previousRaw
        ? {
            available: Boolean(previousRaw.available),
            sgpa: asNumberOrText(previousRaw.sgpa),
            cgpa: asNumberOrText(previousRaw.cgpa),
            status: String(previousRaw.status ?? "-"),
            total_subjects: asNumber(previousRaw.total_subjects),
            subjects: previousSubjects.map((item) => mapSubject(item as Record<string, unknown>)),
          }
        : undefined,
    };
  },

  async getGradeDrilldown(grade: string): Promise<DrilldownResponse> {
    const { data } = await apiClient.get<Record<string, unknown>>(`/api/visualizations/grade/${encodeURIComponent(grade)}`);
    return mapDrilldown(data, `Students with Grade ${grade.toUpperCase()}`);
  },

  async getSgpaBucketDrilldown(bucket: string): Promise<DrilldownResponse> {
    const { data } = await apiClient.get<Record<string, unknown>>(`/api/visualizations/sgpa/${encodeURIComponent(bucket)}`);
    return mapDrilldown(data, `Students in SGPA Bucket ${bucket}`);
  },

  async getSubjectDrilldown(subject: string): Promise<DrilldownResponse> {
    const { data } = await apiClient.get<Record<string, unknown>>(`/api/visualizations/subject/${encodeURIComponent(subject)}`);
    return mapDrilldown(data, `Students in ${subject}`);
  },

  async getSubjectStatusDrilldown(subject: string, status: string): Promise<DrilldownResponse> {
    const { data } = await apiClient.get<Record<string, unknown>>(
      `/api/visualizations/subject/${encodeURIComponent(subject)}/${encodeURIComponent(status)}`,
    );
    return mapDrilldown(data, `${status.toUpperCase()} in ${subject}`);
  },

  async getComparison(): Promise<ComparisonResponse> {
    const { data } = await apiClient.get<Record<string, unknown>>("/api/comparison");
    return mapComparison(data);
  },
};
