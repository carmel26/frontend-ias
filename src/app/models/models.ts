export type UserRole = 'Superadmin' | 'Admin' | 'Lecturer';

export interface User {
  id: string;
  first_name: string;
  middle_name?: string;
  surname: string;
  school: string;
  profession: string;
  specialization: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export type AssessmentStatus =
  | 'Draft'
  | 'Submitted'
  | 'Under Verification'
  | 'Verified'
  | 'Rejected';

export interface Assessment {
  id: string;
  user_id: string;
  lecturer_name: string;
  school: string;
  subject: string;
  assessment_type: string;
  num_students: number;
  title: string;
  date: string;
  upper_percentage: number;
  upper_group_size: number;
  lower_group_size: number;
  middle_group_size: number;
  status: AssessmentStatus;
  admin_feedback?: string;
  created_at: string;
  updated_at: string;
}

export interface QuestionItem {
  id: string;
  assessment_id: string;
  question_number: number;
  prompt?: string;
  upper_correct: number;
  upper_wrong: number;
  lower_correct: number;
  lower_wrong: number;
  difficulty_index: number;
  discrimination_index: number;
  rasch_difficulty: number;
  interpretation: string;
  decision: string;
  classification: string;
  recommendation: string;
}

export interface QuestionInput {
  question_number: number;
  prompt?: string;
  upper_correct: number;
  lower_correct: number;
}

export interface ClassificationCount {
  excellent: number;
  good: number;
  fair: number;
  poor: number;
  negative: number;
}

export interface ItemAnalysisSummary {
  total_questions: number;
  mean_difficulty: number;
  mean_discrimination: number;
  classification_counts: ClassificationCount;
  overall_recommendation: string;
}

export interface FullAnalysisResult {
  summary: ItemAnalysisSummary;
  questions: QuestionItem[];
}

export interface AssessmentReport {
  assessment: Assessment;
  summary: ItemAnalysisSummary;
  questions: QuestionItem[];
  generated_at: string;
}

export interface DashboardStats {
  total_assessments: number;
  submitted: number;
  under_verification: number;
  verified: number;
  rejected: number;
  draft: number;
  recent_assessments: Assessment[];
}

export interface DiscriminationThresholds {
  excellent: number;
  good: number;
  fair: number;
  poor: number;
}

export interface SystemSettings {
  id: string;
  upper_lower_percentage: number;
  thresholds: DiscriminationThresholds;
  schools: string[];
  assessment_types: string[];
  updated_at: string;
}
