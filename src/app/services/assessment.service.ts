import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Assessment,
  AssessmentReport,
  AssessmentStatus,
  DashboardStats,
  FullAnalysisResult,
  QuestionInput,
  QuestionItem,
  SystemSettings,
  User,
} from '../models/models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AssessmentService {
  // private apiUrl = 'http://127.0.0.1:3000/api';
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Dashboard Stats
  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/dashboard/stats`);
  }

  // System Settings
  getSystemSettings(): Observable<SystemSettings> {
    return this.http.get<SystemSettings>(`${this.apiUrl}/admin/settings`);
  }

  updateSystemSettings(
    settings: Partial<SystemSettings>,
  ): Observable<SystemSettings> {
    return this.http.put<SystemSettings>(
      `${this.apiUrl}/admin/settings`,
      settings,
    );
  }

  // Users & Admin
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/admin/users`);
  }

  createAdminUser(data: any): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/admin/users`, data);
  }

  updateUserRole(id: string, role: string): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/admin/users/${id}/role`, {
      role,
    });
  }

  deleteUser(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/admin/users/${id}`);
  }

  // Assessments CRUD
  getAssessments(): Observable<Assessment[]> {
    return this.http.get<Assessment[]>(`${this.apiUrl}/assessments`);
  }

  getAssessment(id: string): Observable<Assessment> {
    return this.http.get<Assessment>(`${this.apiUrl}/assessments/${id}`);
  }

  createAssessment(data: {
    subject: string;
    assessment_type: string;
    num_students: number;
    title: string;
    date: string;
  }): Observable<Assessment> {
    return this.http.post<Assessment>(`${this.apiUrl}/assessments`, data);
  }

  updateAssessment(id: string, data: any): Observable<Assessment> {
    return this.http.put<Assessment>(`${this.apiUrl}/assessments/${id}`, data);
  }

  deleteAssessment(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/assessments/${id}`);
  }

  submitAssessment(id: string): Observable<Assessment> {
    return this.http.post<Assessment>(
      `${this.apiUrl}/assessments/${id}/submit`,
      {},
    );
  }

  verifyAssessment(
    id: string,
    status: AssessmentStatus,
    feedback?: string,
  ): Observable<Assessment> {
    return this.http.post<Assessment>(
      `${this.apiUrl}/assessments/${id}/verify`,
      {
        status,
        feedback,
      },
    );
  }

  // Questions / Item Entry
  getQuestions(assessmentId: string): Observable<QuestionItem[]> {
    return this.http.get<QuestionItem[]>(
      `${this.apiUrl}/assessments/${assessmentId}/questions`,
    );
  }

  addQuestion(
    assessmentId: string,
    question: {
      question_number: number;
      prompt?: string;
      upper_correct: number;
      lower_correct: number;
    },
  ): Observable<QuestionItem> {
    return this.http.post<QuestionItem>(
      `${this.apiUrl}/assessments/${assessmentId}/questions`,
      question,
    );
  }

  batchSaveQuestions(
    assessmentId: string,
    questions: QuestionInput[],
  ): Observable<QuestionItem[]> {
    return this.http.put<QuestionItem[]>(
      `${this.apiUrl}/assessments/${assessmentId}/questions/batch`,
      {
        questions,
      },
    );
  }

  deleteQuestion(questionId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/questions/${questionId}`);
  }

  // Item Analysis & Reports
  analyzeAssessment(assessmentId: string): Observable<FullAnalysisResult> {
    return this.http.get<FullAnalysisResult>(
      `${this.apiUrl}/assessments/${assessmentId}/analyze`,
    );
  }

  getAssessmentReport(assessmentId: string): Observable<AssessmentReport> {
    return this.http.get<AssessmentReport>(
      `${this.apiUrl}/assessments/${assessmentId}/report`,
    );
  }
}
