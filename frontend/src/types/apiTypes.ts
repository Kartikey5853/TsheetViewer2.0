export interface DashboardResponse {
  total_students: number;
  pass_percentage: number;
  average_sgpa: number;
  highest_sgpa: number;
  lowest_sgpa: number;
  average_cgpa: number;
  highest_cgpa: number;
  lowest_cgpa: number;
}

export interface SgpaDistributionItem {
  label: string;
  count: number;
}

export interface SubjectAverageItem {
  subject_code: string;
  subject_name: string;
  average_marks: number;
}

export interface SubjectPassFailItem {
  subject_code: string;
  subject_name: string;
  pass_count: number;
  fail_count: number;
}

export interface VisualizationsResponse {
  sgpa_distribution: SgpaDistributionItem[];
  subject_averages: SubjectAverageItem[];
  subject_pass_fail: SubjectPassFailItem[];
  grade_distribution: GradeDistributionItem[];
  performers: TopBottomPerformers;
}

export interface GradeDistributionItem {
  grade: string;
  count: number;
}

export interface PerformerItem {
  rank: number;
  roll_no: string;
  name: string;
  sgpa: number;
  cgpa: number;
}

export interface TopBottomPerformers {
  top: PerformerItem[];
  bottom: PerformerItem[];
}

export interface StudentSummary {
  roll_no: string;
  name: string;
  sgpa: number;
  cgpa: number;
  status: string;
}

export interface StudentSubject {
  subject_code: string;
  subject_name: string;
  internal: number | string;
  external: number | string;
  total: number | string;
  status: string;
  grade: string;
}

export interface StudentDetailResponse {
  roll_no: string;
  name: string;
  sgpa: number;
  cgpa: number;
  subjects: StudentSubject[];
  previous?: {
    available: boolean;
    sgpa: number | string;
    cgpa: number | string;
    status: string;
    total_subjects: number;
    subjects: StudentSubject[];
  };
}

export interface UploadResponse {
  message: string;
}

export interface DrilldownRecord {
  roll_no: string;
  name: string;
  sub_name?: string;
  status?: string;
  grade?: string;
  total?: number | string;
  sgpa?: number;
  cgpa?: number;
}

export interface DrilldownResponse {
  title: string;
  count: number;
  records: DrilldownRecord[];
}

export interface ComparisonSummaryItem {
  roll_no: string;
  name: string;
  sgpa_curr: number;
  sgpa_prev: number;
  sgpa_change: number;
  sgpa_percent_change: number;
  cgpa_curr: number;
  cgpa_prev: number;
  cgpa_change: number;
  status: string;
  rank_curr: number;
  rank_prev: number;
  rank_change: number;
}

export interface ComparisonResponse {
  summary: ComparisonSummaryItem[];
  status_counts: Record<string, number>;
  overview: {
    current_students: number;
    matched_students: number;
    new_students: number;
    avg_sgpa_change: number;
  };
}
