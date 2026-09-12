import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AssessmentService } from '../../services/assessment.service';
import { AuthService } from '../../services/auth.service';
import {
  Assessment,
  AssessmentReport,
  AssessmentStatus,
  FullAnalysisResult,
  QuestionInput,
  QuestionItem,
  SystemSettings,
} from '../../models/models';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-assessment-wizard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header" *ngIf="assessment">
      <div>
        <h1 class="page-title">
          {{ assessment.title || 'New Assessment Item Analysis' }}
        </h1>
        <p class="page-subtitle">
          {{ assessment.subject }} | {{ assessment.assessment_type }} |
          {{ assessment.date }}
          <span
            [class]="getStatusBadgeClass(assessment.status)"
            style="margin-left: 0.5rem;"
          >
            {{ assessment.status }}
          </span>
        </p>
      </div>

      <div style="display: flex; gap: 0.5rem;">
        <button class="btn btn-secondary btn-sm" (click)="goBack()">
          Back to List
        </button>
        <button
          *ngIf="currentStep === 5"
          class="btn btn-primary btn-sm"
          (click)="downloadPDF()"
          [disabled]="pdfGenerating"
        >
          {{ pdfGenerating ? 'Generating PDF...' : 'Download PDF Report' }}
        </button>
      </div>
    </div>

    <!-- Multi-Step Progress Bar -->
    <div class="card" style="padding: 1rem 1.5rem; margin-bottom: 1.5rem;">
      <div class="steps-container">
        <div
          class="step-item"
          [class.active]="currentStep === 1"
          [class.completed]="currentStep > 1"
          (click)="setStep(1)"
        >
          <div class="step-number">1</div>
          <span class="step-title">Details</span>
        </div>

        <div
          class="step-item"
          [class.active]="currentStep === 2"
          [class.completed]="currentStep > 2"
          (click)="setStep(2)"
        >
          <div class="step-number">2</div>
          <span class="step-title">Question Entry</span>
        </div>

        <div
          class="step-item"
          [class.active]="currentStep === 3"
          [class.completed]="currentStep > 3"
          (click)="setStep(3)"
        >
          <div class="step-number">3</div>
          <span class="step-title">Item Analysis</span>
        </div>

        <div
          class="step-item"
          [class.active]="currentStep === 4"
          [class.completed]="currentStep > 4"
          (click)="setStep(4)"
        >
          <div class="step-number">4</div>
          <span class="step-title">Verification</span>
        </div>

        <div
          class="step-item"
          [class.active]="currentStep === 5"
          [class.completed]="currentStep > 5"
          (click)="setStep(5)"
        >
          <div class="step-number">5</div>
          <span class="step-title">PDF Report</span>
        </div>
      </div>
    </div>

    <!-- Alert Messages -->
    <div *ngIf="successMessage" class="alert alert-success">
      {{ successMessage }}
    </div>
    <div *ngIf="errorMessage" class="alert alert-danger">
      {{ errorMessage }}
    </div>

    <!-- STEP 1: Assessment Info Form -->
    <div *ngIf="currentStep === 1" class="card">
      <div class="card-header">
        <h2 class="card-title">Step 1: Assessment Information</h2>
        <span style="font-size: 0.85rem; color: var(--text-muted);">
          Configured Upper/Lower Percentage:
          <strong>{{ settings?.upper_lower_percentage || 27 }}%</strong>
        </span>
      </div>

      <form (ngSubmit)="saveAssessmentInfo()">
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Subject / Course Name *</label>
            <input
              type="text"
              class="form-control"
              [(ngModel)]="subject"
              name="subject"
              required
              placeholder="e.g. CS301 - Data Structures & Algorithms"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Assessment Type *</label>
            <select
              class="form-control"
              [(ngModel)]="assessmentType"
              name="assessmentType"
              required
            >
              <option *ngFor="let t of assessmentTypes" [value]="t">
                {{ t }}
              </option>
            </select>
          </div>
        </div>

        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Assessment Title *</label>
            <input
              type="text"
              class="form-control"
              [(ngModel)]="title"
              name="title"
              required
              placeholder="e.g. End of Semester Final Examination"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Assessment Date *</label>
            <input
              type="date"
              class="form-control"
              [(ngModel)]="date"
              name="date"
              required
            />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Total Number of Students (N) *</label>
          <input
            type="number"
            class="form-control"
            [(ngModel)]="numStudents"
            (ngModelChange)="recalculateGroups()"
            name="numStudents"
            min="1"
            required
            placeholder="e.g. 100"
          />
        </div>

        <!-- Calculated Group Sizes Callout -->
        <div
          class="alert alert-info"
          style="display: flex; justify-content: space-between; align-items: center;"
        >
          <div>
            <strong
              >Calculated Student Groups (at
              {{ settings?.upper_lower_percentage || 27 }}%):</strong
            >
            <div style="margin-top: 0.25rem;">
              • Upper Group Size:
              <strong>{{ calculatedUpper }}</strong> students<br />
              • Lower Group Size:
              <strong>{{ calculatedLower }}</strong> students<br />
              • Middle Group Size:
              <strong>{{ calculatedMiddle }}</strong> students
            </div>
          </div>
        </div>

        <div
          style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem;"
        >
          <button type="submit" class="btn btn-primary" [disabled]="saving">
            {{ saving ? 'Saving...' : 'Save & Proceed to Questions' }}
          </button>
        </div>
      </form>
    </div>

    <!-- STEP 2: Question Entry (Sequential / Tabular Fast Entry) -->
    <div *ngIf="currentStep === 2" class="card">
      <div class="card-header">
        <div>
          <h2 class="card-title">Step 2: Question / Item Data Entry</h2>
          <p
            style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.25rem;"
          >
            Group Size =
            <strong>{{ assessment?.upper_group_size }}</strong> students (Upper
            & Lower). Correct count must not exceed
            {{ assessment?.upper_group_size }}.
          </p>
        </div>

        <div style="display: flex; gap: 0.5rem;">
          <button class="btn btn-secondary btn-sm" (click)="addQuestionRow()">
            + Add Question
          </button>
          <button
            class="btn btn-secondary btn-sm"
            (click)="addMultipleQuestions(5)"
          >
            + Add 5 Questions
          </button>
        </div>
      </div>

      <div class="table-responsive" style="margin-bottom: 1.5rem;">
        <table class="table">
          <thead>
            <tr>
              <th style="width: 70px;">Q#</th>
              <th>Question Prompt / Identifier</th>
              <th style="width: 140px;">Upper Correct (Uc)</th>
              <th style="width: 120px;">Upper Wrong</th>
              <th style="width: 140px;">Lower Correct (Lc)</th>
              <th style="width: 120px;">Lower Wrong</th>
              <th style="width: 60px;">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let q of questionInputs; let i = index">
              <td style="font-weight: 700; text-align: center;">
                {{ q.question_number }}
              </td>
              <td>
                <input
                  type="text"
                  class="form-control"
                  style="padding: 0.35rem 0.5rem;"
                  [(ngModel)]="q.prompt"
                  placeholder="e.g. Question {{
                    q.question_number
                  }} description"
                />
              </td>
              <td>
                <input
                  type="number"
                  class="form-control"
                  style="padding: 0.35rem 0.5rem;"
                  [(ngModel)]="q.upper_correct"
                  [max]="assessment?.upper_group_size || 0"
                  min="0"
                  (ngModelChange)="validateQuestion(q)"
                />
              </td>
              <td
                style="color: var(--text-muted); font-size: 0.85rem; vertical-align: middle;"
              >
                {{
                  (assessment?.upper_group_size || 0) - (q.upper_correct || 0)
                }}
              </td>
              <td>
                <input
                  type="number"
                  class="form-control"
                  style="padding: 0.35rem 0.5rem;"
                  [(ngModel)]="q.lower_correct"
                  [max]="assessment?.lower_group_size || 0"
                  min="0"
                  (ngModelChange)="validateQuestion(q)"
                />
              </td>
              <td
                style="color: var(--text-muted); font-size: 0.85rem; vertical-align: middle;"
              >
                {{
                  (assessment?.lower_group_size || 0) - (q.lower_correct || 0)
                }}
              </td>
              <td>
                <button
                  class="btn btn-danger btn-sm"
                  style="padding: 0.2rem 0.5rem;"
                  (click)="removeQuestionRow(i)"
                  title="Delete question"
                >
                  X
                </button>
              </td>
            </tr>
            <tr *ngIf="questionInputs.length === 0">
              <td
                colspan="7"
                style="text-align: center; color: var(--text-muted); padding: 2rem;"
              >
                No questions added. Click "+ Add Question" to begin.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        style="display: flex; justify-content: space-between; align-items: center;"
      >
        <button class="btn btn-secondary" (click)="setStep(1)">
          Back to Details
        </button>
        <button
          class="btn btn-primary"
          (click)="saveQuestionsAndAnalyze()"
          [disabled]="saving"
        >
          {{
            saving
              ? 'Calculating Analysis...'
              : 'Save & Calculate Item Analysis'
          }}
        </button>
      </div>
    </div>

    <!-- STEP 3: Item Analysis Results -->
    <div *ngIf="currentStep === 3" class="card">
      <div class="card-header">
        <h2 class="card-title">Step 3: Item Analysis Calculations</h2>
        <div style="display: flex; gap: 0.5rem;">
          <button
            class="btn btn-secondary btn-sm"
            (click)="showAllGraphs = !showAllGraphs"
          >
            {{ showAllGraphs ? 'Hide All 2PL Graphs' : 'Show All 2PL Graphs' }}
          </button>
          <button class="btn btn-secondary btn-sm" (click)="loadAnalysis()">
            Recalculate
          </button>
        </div>
      </div>

      <!-- Analysis Summary Banner -->
      <div
        *ngIf="analysisResult"
        class="card"
        style="background: var(--bg-slate); margin-bottom: 1.5rem;"
      >
        <div
          style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1rem;"
        >
          <div>
            <div style="font-size: 0.8rem; color: var(--text-muted);">
              Total Items Analyzed
            </div>
            <div style="font-size: 1.5rem; font-weight: 800;">
              {{ analysisResult.summary.total_questions }}
            </div>
          </div>
          <div>
            <div style="font-size: 0.8rem; color: var(--text-muted);">
              Mean Difficulty Index (P)
            </div>
            <div
              style="font-size: 1.5rem; font-weight: 800; color: var(--primary);"
            >
              {{ analysisResult.summary.mean_difficulty | number: '1.3-3' }}
            </div>
          </div>
          <div>
            <div style="font-size: 0.8rem; color: var(--text-muted);">
              Mean Discrimination Index (D)
            </div>
            <div
              style="font-size: 1.5rem; font-weight: 800; color: var(--success);"
            >
              {{ analysisResult.summary.mean_discrimination | number: '1.3-3' }}
            </div>
          </div>
        </div>

        <div
          [class]="
            getRecommendationAlertClass(
              analysisResult.summary.overall_recommendation
            )
          "
        >
          <strong>Overall Summary:</strong>
          {{ analysisResult.summary.overall_recommendation }}
        </div>
      </div>

      <!-- Question Items Table -->
      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th style="width: 50px;">Q#</th>
              <th>Upper</th>
              <th>Lower</th>
              <th>Diff index</th>
              <th>Discrimination index</th>
              <th>Interpretation</th>
              <th>Decision</th>
              <th style="text-align: center;">2PL IRT Model</th>
            </tr>
          </thead>
          <tbody>
            <ng-container *ngFor="let q of analysisResult?.questions">
              <tr>
                <td style="font-weight: 700; text-align: center;">
                  {{ q.question_number }}
                </td>
                <td>
                  <span style="color: var(--success); font-weight: 600;">{{
                    q.upper_correct
                  }}</span>
                  /
                  <span style="color: var(--danger);">{{ q.upper_wrong }}</span>
                </td>
                <td>
                  <span style="color: var(--success); font-weight: 600;">{{
                    q.lower_correct
                  }}</span>
                  /
                  <span style="color: var(--danger);">{{ q.lower_wrong }}</span>
                </td>
                <td>
                  <strong>{{ q.difficulty_index | number: '1.3-3' }}</strong>
                </td>
                <td>
                  <strong
                    [style.color]="
                      q.discrimination_index < 0 ? 'red' : 'inherit'
                    "
                    >{{ q.discrimination_index | number: '1.3-3' }}</strong
                  >
                </td>
                <td>
                  <span
                    [class]="
                      getInterpretationBadgeClass(
                        q.interpretation || q.classification
                      )
                    "
                  >
                    {{ q.interpretation || q.classification }}
                  </span>
                </td>
                <td style="font-size: 0.85rem;">
                  {{ q.decision || q.recommendation }}
                </td>
                <td style="text-align: center;">
                  <button
                    class="btn btn-secondary btn-sm"
                    (click)="toggleGraph(q.question_number)"
                  >
                    {{
                      isGraphVisible(q.question_number)
                        ? 'Hide Graph'
                        : 'View 2PL Curve'
                    }}
                  </button>
                </td>
              </tr>

              <!-- Expandable 2PL IRT Model Characteristic Curve -->
              <tr *ngIf="isGraphVisible(q.question_number)">
                <td
                  colspan="8"
                  style="background: #f8fafc; padding: 1.25rem; border-bottom: 2px solid var(--border-color);"
                >
                  <div
                    style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; align-items: start;"
                  >
                    <!-- Parameter & Data Table -->
                    <div>
                      <h4 style="font-weight: 700; margin-bottom: 0.5rem;">
                        Question {{ q.question_number }} - 2PL Model Parameters
                      </h4>
                      <div
                        style="font-size: 0.85rem; margin-bottom: 0.75rem; background: #ffffff; padding: 0.75rem; border-radius: 6px; border: 1px solid var(--border-color);"
                      >
                        <div>
                          <strong>a (Discrimination):</strong>
                          {{ q.discrimination_index | number: '1.3-3' }}
                        </div>
                        <div>
                          <strong>b (Rasch Difficulty):</strong>
                          {{ q.rasch_difficulty | number: '1.3-3' }}
                        </div>
                        <div
                          style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;"
                        >
                          Formula: b = LN((1 - Diff)/Diff) = LN((1 -
                          {{ q.difficulty_index }}) / {{ q.difficulty_index }})
                        </div>
                      </div>

                      <table
                        class="table"
                        style="font-size: 0.8rem; background: #ffffff;"
                      >
                        <thead>
                          <tr>
                            <th>Ability (θ)</th>
                            <th>Probability P(θ)</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr
                            *ngFor="
                              let pt of get2PLPoints(
                                q.discrimination_index,
                                q.rasch_difficulty
                              )
                            "
                          >
                            <td>{{ pt.ability }}</td>
                            <td>
                              <strong>{{
                                pt.probability | number: '1.2-2'
                              }}</strong>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <!-- 2PL Model Curve Chart (SVG) -->
                    <div
                      style="text-align: center; background: #ffffff; padding: 1rem; border: 1px solid var(--border-color); border-radius: 8px;"
                    >
                      <h4
                        style="font-weight: 700; font-size: 1rem; margin-bottom: 0.75rem;"
                      >
                        2PL Model Characteristic Curve
                      </h4>
                      <svg
                        width="340"
                        height="200"
                        viewBox="0 0 340 200"
                        style="max-width: 100%; height: auto;"
                      >
                        <!-- Axes -->
                        <line
                          x1="45"
                          y1="160"
                          x2="310"
                          y2="160"
                          stroke="#64748b"
                          stroke-width="1.5"
                        />
                        <line
                          x1="45"
                          y1="20"
                          x2="45"
                          y2="160"
                          stroke="#64748b"
                          stroke-width="1.5"
                        />

                        <!-- Y Axis Ticks & Gridlines -->
                        <g style="font-size: 10px; fill: #64748b;">
                          <text x="38" y="163" text-anchor="end">0.00</text>
                          <line
                            x1="45"
                            y1="160"
                            x2="310"
                            y2="160"
                            stroke="#e2e8f0"
                          />

                          <text x="38" y="135" text-anchor="end">0.20</text>
                          <line
                            x1="45"
                            y1="132"
                            x2="310"
                            y2="132"
                            stroke="#e2e8f0"
                            stroke-dasharray="3,3"
                          />

                          <text x="38" y="107" text-anchor="end">0.40</text>
                          <line
                            x1="45"
                            y1="104"
                            x2="310"
                            y2="104"
                            stroke="#e2e8f0"
                            stroke-dasharray="3,3"
                          />

                          <text x="38" y="79" text-anchor="end">0.60</text>
                          <line
                            x1="45"
                            y1="76"
                            x2="310"
                            y2="76"
                            stroke="#e2e8f0"
                            stroke-dasharray="3,3"
                          />

                          <text x="38" y="51" text-anchor="end">0.80</text>
                          <line
                            x1="45"
                            y1="48"
                            x2="310"
                            y2="48"
                            stroke="#e2e8f0"
                            stroke-dasharray="3,3"
                          />

                          <text x="38" y="23" text-anchor="end">1.00</text>
                          <line
                            x1="45"
                            y1="20"
                            x2="310"
                            y2="20"
                            stroke="#e2e8f0"
                            stroke-dasharray="3,3"
                          />

                          <text
                            x="12"
                            y="90"
                            text-anchor="middle"
                            font-weight="bold"
                            transform="rotate(-90 12 90)"
                          >
                            Probability
                          </text>
                        </g>

                        <!-- X Axis Ticks & Gridlines -->
                        <g style="font-size: 10px; fill: #64748b;">
                          <text x="45" y="175" text-anchor="middle">-5</text>
                          <text x="98" y="175" text-anchor="middle">-3</text>
                          <text x="151" y="175" text-anchor="middle">-1</text>
                          <text x="177.5" y="175" text-anchor="middle">0</text>
                          <text x="204" y="175" text-anchor="middle">1</text>
                          <text x="257" y="175" text-anchor="middle">3</text>
                          <text x="310" y="175" text-anchor="middle">5</text>

                          <text
                            x="177.5"
                            y="192"
                            text-anchor="middle"
                            font-weight="bold"
                          >
                            Ability
                          </text>
                        </g>

                        <!-- Smooth 2PL Curve Line -->
                        <path
                          [attr.d]="
                            get2PLSvgPath(
                              q.discrimination_index,
                              q.rasch_difficulty
                            )
                          "
                          stroke="#2563eb"
                          stroke-width="2.5"
                          fill="none"
                        />

                        <!-- Plot Points -->
                        <circle
                          *ngFor="
                            let pt of get2PLPointCoordinates(
                              q.discrimination_index,
                              q.rasch_difficulty
                            )
                          "
                          [attr.cx]="pt.x"
                          [attr.cy]="pt.y"
                          r="3"
                          fill="#2563eb"
                        />
                      </svg>
                    </div>
                  </div>
                </td>
              </tr>
            </ng-container>
          </tbody>
        </table>
      </div>

      <div
        style="display: flex; justify-content: space-between; align-items: center; margin-top: 1.5rem;"
      >
        <button class="btn btn-secondary" (click)="setStep(2)">
          Back to Questions
        </button>
        <button class="btn btn-primary" (click)="setStep(4)">
          Proceed to Verification
        </button>
      </div>
    </div>

    <!-- STEP 4: Verification Workflow -->
    <div *ngIf="currentStep === 4" class="card">
      <div class="card-header">
        <h2 class="card-title">Step 4: Assessment Verification Workflow</h2>
        <span [class]="getStatusBadgeClass(assessment?.status || '')">{{
          assessment?.status
        }}</span>
      </div>

      <div
        class="card"
        style="background: var(--bg-slate); margin-bottom: 1.5rem;"
      >
        <h3 style="font-size: 1rem; font-weight: 700; margin-bottom: 0.5rem;">
          Assessment Status Trail
        </h3>
        <p
          style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 1rem;"
        >
          Current Status: <strong>{{ assessment?.status }}</strong>
        </p>

        <div *ngIf="assessment?.admin_feedback" class="alert alert-info">
          <strong>Admin Feedback / Review Notes:</strong><br />
          {{ assessment?.admin_feedback }}
        </div>
      </div>

      <!-- Lecturer Submission Section -->
      <div
        *ngIf="
          assessment?.status === 'Draft' || assessment?.status === 'Rejected'
        "
        style="margin-bottom: 1.5rem;"
      >
        <h3>Submit Assessment for Verification</h3>
        <p
          style="font-size: 0.875rem; color: var(--text-muted); margin-bottom: 1rem;"
        >
          Once submitted, the assessment will enter verification queue for Admin
          review.
        </p>
        <button class="btn btn-success" (click)="submitForVerification()">
          Submit Assessment to Admin
        </button>
      </div>

      <!-- Admin Verification Review Controls -->
      <div
        *ngIf="authService.isAdmin() || authService.isSuperadmin()"
        class="card"
        style="border-color: var(--primary);"
      >
        <h3
          style="font-size: 1.1rem; font-weight: 700; color: var(--primary); margin-bottom: 1rem;"
        >
          Admin Verification Controls
        </h3>

        <div class="form-group">
          <label class="form-label">Review Feedback / Comments</label>
          <textarea
            class="form-control"
            rows="3"
            [(ngModel)]="adminFeedback"
            placeholder="Add comments or suggestions for the lecturer..."
          ></textarea>
        </div>

        <div style="display: flex; gap: 0.75rem;">
          <button
            class="btn btn-warning btn-sm"
            (click)="updateStatus('Under Verification')"
          >
            Mark Under Verification
          </button>
          <button
            class="btn btn-success btn-sm"
            (click)="updateStatus('Verified')"
          >
            Approve & Verify
          </button>
          <button
            class="btn btn-danger btn-sm"
            (click)="updateStatus('Rejected')"
          >
            Reject Assessment
          </button>
        </div>
      </div>

      <div
        style="display: flex; justify-content: space-between; align-items: center; margin-top: 1.5rem;"
      >
        <button class="btn btn-secondary" (click)="setStep(3)">
          Back to Analysis
        </button>
        <button class="btn btn-primary" (click)="setStep(5)">
          View & Generate PDF Report
        </button>
      </div>
    </div>

    <!-- STEP 5: PDF Report Generation & Preview -->
    <div *ngIf="currentStep === 5">
      <div
        style="display: flex; justify-content: flex-end; margin-bottom: 1rem;"
      >
        <button
          class="btn btn-primary btn-lg"
          (click)="downloadPDF()"
          [disabled]="pdfGenerating"
        >
          {{ pdfGenerating ? 'Generating PDF...' : 'Download PDF Report' }}
        </button>
      </div>

      <!-- Printable Report Container -->
      <div
        id="pdf-report-content"
        class="card"
        style="padding: 2.5rem; background: #ffffff;"
      >
        <!-- Header -->
        <div
          style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1e293b; padding-bottom: 1rem; margin-bottom: 1.5rem;"
        >
          <div>
            <h1
              style="font-size: 1.6rem; font-weight: 800; color: #1e293b; margin-bottom: 0.25rem;"
            >
              ASSESSMENT ITEM ANALYSIS REPORT
            </h1>
            <div
              style="font-size: 1rem; font-weight: 600; color: var(--primary);"
            >
              {{ reportData?.assessment?.school }}
            </div>
          </div>
          <div
            style="text-align: right; font-size: 0.85rem; color: var(--text-muted);"
          >
            <div><strong>Date:</strong> {{ reportData?.assessment?.date }}</div>
            <div>
              <strong>Status:</strong> {{ reportData?.assessment?.status }}
            </div>
            <div>
              <strong>Generated:</strong>
              {{ reportData?.generated_at | date: 'short' }}
            </div>
          </div>
        </div>

        <!-- Meta Info Grid -->
        <div
          style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; background: #f8fafc; padding: 1.25rem; border-radius: 8px; margin-bottom: 1.5rem; font-size: 0.9rem;"
        >
          <div>
            <p>
              <strong>Subject / Course:</strong>
              {{ reportData?.assessment?.subject }}
            </p>
            <p>
              <strong>Assessment Title:</strong>
              {{ reportData?.assessment?.title }}
            </p>
            <p>
              <strong>Assessment Type:</strong>
              {{ reportData?.assessment?.assessment_type }}
            </p>
          </div>
          <div>
            <p>
              <strong>Lecturer Name:</strong>
              {{ reportData?.assessment?.lecturer_name }}
            </p>
            <p>
              <strong>Total Students (N):</strong>
              {{ reportData?.assessment?.num_students }}
            </p>
            <p>
              <strong>Upper/Lower Group Size:</strong>
              {{ reportData?.assessment?.upper_group_size }} ({{
                reportData?.assessment?.upper_percentage
              }}%)
            </p>
          </div>
        </div>

        <!-- Summary Metrics -->
        <div
          style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1.5rem; text-align: center;"
        >
          <div
            style="border: 1px solid #e2e8f0; padding: 1rem; border-radius: 8px;"
          >
            <div style="font-size: 0.8rem; color: var(--text-muted);">
              Total Question Items
            </div>
            <div style="font-size: 1.5rem; font-weight: 800;">
              {{ reportData?.summary?.total_questions }}
            </div>
          </div>
          <div
            style="border: 1px solid #e2e8f0; padding: 1rem; border-radius: 8px;"
          >
            <div style="font-size: 0.8rem; color: var(--text-muted);">
              Mean Difficulty Index (P)
            </div>
            <div
              style="font-size: 1.5rem; font-weight: 800; color: var(--primary);"
            >
              {{ reportData?.summary?.mean_difficulty | number: '1.3-3' }}
            </div>
          </div>
          <div
            style="border: 1px solid #e2e8f0; padding: 1rem; border-radius: 8px;"
          >
            <div style="font-size: 0.8rem; color: var(--text-muted);">
              Mean Discrimination Index (D)
            </div>
            <div
              style="font-size: 1.5rem; font-weight: 800; color: var(--success);"
            >
              {{ reportData?.summary?.mean_discrimination | number: '1.3-3' }}
            </div>
          </div>
        </div>

        <!-- Recommendations Callout -->
        <div
          [class]="
            getRecommendationAlertClass(
              reportData?.summary?.overall_recommendation || ''
            )
          "
          style="margin-bottom: 1.5rem;"
        >
          <strong>Summary Recommendations:</strong><br />
          {{ reportData?.summary?.overall_recommendation }}
        </div>

        <!-- Question-by-Question Analysis Table -->
        <h3
          style="font-size: 1.1rem; font-weight: 700; margin-bottom: 0.75rem;"
        >
          Question-by-Question Analysis
        </h3>
        <table class="table" style="font-size: 0.85rem; margin-bottom: 1.5rem;">
          <thead>
            <tr>
              <th style="width: 50px;">Q#</th>
              <th>Upper</th>
              <th>Lower</th>
              <th>Diff index</th>
              <th>Discrimination index</th>
              <th>Interpretation</th>
              <th>Decision</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let q of reportData?.questions">
              <td style="font-weight: 700;">{{ q.question_number }}</td>
              <td>{{ q.upper_correct }} / {{ q.upper_wrong }}</td>
              <td>{{ q.lower_correct }} / {{ q.lower_wrong }}</td>
              <td>{{ q.difficulty_index | number: '1.3-3' }}</td>
              <td>
                <strong>{{ q.discrimination_index | number: '1.3-3' }}</strong>
              </td>
              <td>
                <span
                  [class]="
                    getInterpretationBadgeClass(
                      q.interpretation || q.classification
                    )
                  "
                >
                  {{ q.interpretation || q.classification }}
                </span>
              </td>
              <td>{{ q.decision || q.recommendation }}</td>
            </tr>
          </tbody>
        </table>

        <!-- Signatures & Verification footer -->
        <div
          style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 2rem; margin-top: 3rem; padding-top: 1rem; border-top: 1px dashed #cbd5e1; font-size: 0.85rem;"
        >
          <div>
            <p><strong>Prepared By (Lecturer):</strong></p>
            <br /><br />
            <p>___________________________</p>
            <p>{{ reportData?.assessment?.lecturer_name }}</p>
          </div>
          <div>
            <p><strong>Verified By (Academic Admin):</strong></p>
            <br /><br />
            <p>___________________________</p>
            <p>Status: {{ reportData?.assessment?.status }}</p>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AssessmentWizardComponent implements OnInit {
  assessmentId: string | null = null;
  assessment: Assessment | null = null;
  settings: SystemSettings | null = null;
  analysisResult: FullAnalysisResult | null = null;
  reportData: AssessmentReport | null = null;

  currentStep = 1;
  saving = false;
  pdfGenerating = false;
  successMessage = '';
  errorMessage = '';

  // 2PL Graph visibility states
  selectedGraphQuestion: number | null = null;
  showAllGraphs = false;

  // Step 1 fields
  subject = '';
  assessmentType = 'Examination';
  numStudents = 100;
  title = '';
  date = new Date().toISOString().split('T')[0];

  calculatedUpper = 27;
  calculatedLower = 27;
  calculatedMiddle = 46;

  assessmentTypes: string[] = [
    'Examination',
    'Test',
    'UE',
    'Assignment',
    'Quiz',
  ];

  // Step 2 fields
  questionInputs: QuestionInput[] = [];

  // Step 4 fields
  adminFeedback = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private assessmentService: AssessmentService,
    public authService: AuthService,
  ) {}

  ngOnInit() {
    this.assessmentService.getSystemSettings().subscribe({
      next: (s) => {
        this.settings = s;
        if (s.assessment_types.length)
          this.assessmentTypes = s.assessment_types;
        this.recalculateGroups();
      },
      error: () => this.recalculateGroups(),
    });

    this.route.params.subscribe((params) => {
      if (params['id'] && params['id'] !== 'new') {
        this.assessmentId = params['id'];
        this.loadAssessment(this.assessmentId!);
      } else {
        this.initDefaultQuestions(5);
      }
    });
  }

  toggleGraph(qNum: number) {
    if (this.selectedGraphQuestion === qNum) {
      this.selectedGraphQuestion = null;
    } else {
      this.selectedGraphQuestion = qNum;
    }
  }

  isGraphVisible(qNum: number): boolean {
    return this.showAllGraphs || this.selectedGraphQuestion === qNum;
  }

  get2PLPoints(
    a: number,
    b: number,
  ): { ability: number; probability: number }[] {
    const abilities = [-4, -3, -2, -1, 0, 1, 2, 3, 4];
    return abilities.map((theta) => {
      const prob = 1 / (1 + Math.exp(-a * (theta - b)));
      return {
        ability: theta,
        probability: Math.round(prob * 100) / 100,
      };
    });
  }

  get2PLSvgPath(a: number, b: number): string {
    const points: string[] = [];
    for (let theta = -5; theta <= 5; theta += 0.2) {
      const prob = 1 / (1 + Math.exp(-a * (theta - b)));
      const x = 45 + (theta + 5) * 26.5; // x range: 45 to 310
      const y = 160 - prob * 140; // y range: 160 to 20
      points.push(
        `${theta === -5 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`,
      );
    }
    return points.join(' ');
  }

  get2PLPointCoordinates(a: number, b: number) {
    const abilities = [-4, -3, -2, -1, 0, 1, 2, 3, 4];
    return abilities.map((theta) => {
      const prob = 1 / (1 + Math.exp(-a * (theta - b)));
      const x = 45 + (theta + 5) * 26.5;
      const y = 160 - prob * 140;
      return {
        x,
        y,
        theta,
        prob: Math.round(prob * 100) / 100,
      };
    });
  }

  loadAssessment(id: string) {
    this.assessmentService.getAssessment(id).subscribe({
      next: (asm) => {
        this.assessment = asm;
        this.subject = asm.subject;
        this.assessmentType = asm.assessment_type;
        this.numStudents = asm.num_students;
        this.title = asm.title;
        this.date = asm.date;
        this.adminFeedback = asm.admin_feedback || '';
        this.recalculateGroups();

        this.loadQuestions();
        this.loadAnalysis();
      },
      error: () => (this.errorMessage = 'Failed to load assessment.'),
    });
  }

  loadQuestions() {
    if (!this.assessmentId) return;
    this.assessmentService.getQuestions(this.assessmentId).subscribe({
      next: (qs) => {
        if (qs.length > 0) {
          this.questionInputs = qs.map((q) => ({
            question_number: q.question_number,
            prompt: q.prompt,
            upper_correct: q.upper_correct,
            lower_correct: q.lower_correct,
          }));
        } else {
          this.initDefaultQuestions(5);
        }
      },
    });
  }

  loadAnalysis() {
    if (!this.assessmentId) return;
    this.assessmentService.analyzeAssessment(this.assessmentId).subscribe({
      next: (res) => {
        this.analysisResult = res;
      },
    });

    this.assessmentService.getAssessmentReport(this.assessmentId).subscribe({
      next: (rep) => {
        this.reportData = rep;
      },
    });
  }

  initDefaultQuestions(count: number) {
    this.questionInputs = [];
    for (let i = 1; i <= count; i++) {
      this.questionInputs.push({
        question_number: i,
        prompt: `Question ${i}`,
        upper_correct: Math.min(20, this.calculatedUpper),
        lower_correct: Math.min(10, this.calculatedLower),
      });
    }
  }

  recalculateGroups() {
    const pct = this.settings?.upper_lower_percentage || 27.0;
    this.calculatedUpper = Math.round((this.numStudents * pct) / 100.0);
    this.calculatedLower = this.calculatedUpper;
    this.calculatedMiddle = Math.max(
      0,
      this.numStudents - (this.calculatedUpper + this.calculatedLower),
    );
  }

  setStep(step: number) {
    this.currentStep = step;
    this.successMessage = '';
    this.errorMessage = '';

    if (step === 3 || step === 5) {
      this.loadAnalysis();
    }
  }

  saveAssessmentInfo() {
    if (!this.subject || !this.title || !this.date || this.numStudents <= 0) {
      this.errorMessage = 'Please complete all required assessment details.';
      return;
    }

    this.saving = true;
    this.errorMessage = '';

    const payload = {
      subject: this.subject,
      assessment_type: this.assessmentType,
      num_students: this.numStudents,
      title: this.title,
      date: this.date,
    };

    if (this.assessmentId) {
      this.assessmentService
        .updateAssessment(this.assessmentId, payload)
        .subscribe({
          next: (asm) => {
            this.saving = false;
            this.assessment = asm;
            this.successMessage = 'Assessment info updated.';
            this.setStep(2);
          },
          error: (err) => {
            this.saving = false;
            this.errorMessage =
              err.error?.error || 'Failed to update assessment.';
          },
        });
    } else {
      this.assessmentService.createAssessment(payload).subscribe({
        next: (asm) => {
          this.saving = false;
          this.assessment = asm;
          this.assessmentId = asm.id;
          this.successMessage = 'Assessment created successfully.';
          this.router.navigate(['/assessment', asm.id]);
          this.setStep(2);
        },
        error: (err) => {
          this.saving = false;
          this.errorMessage =
            err.error?.error || 'Failed to create assessment.';
        },
      });
    }
  }

  addQuestionRow() {
    const nextNum = this.questionInputs.length + 1;
    this.questionInputs.push({
      question_number: nextNum,
      prompt: `Question ${nextNum}`,
      upper_correct: 0,
      lower_correct: 0,
    });
  }

  addMultipleQuestions(count: number) {
    const start = this.questionInputs.length;
    for (let i = 1; i <= count; i++) {
      const qNum = start + i;
      this.questionInputs.push({
        question_number: qNum,
        prompt: `Question ${qNum}`,
        upper_correct: 0,
        lower_correct: 0,
      });
    }
  }

  removeQuestionRow(index: number) {
    this.questionInputs.splice(index, 1);
    this.questionInputs.forEach((q, i) => (q.question_number = i + 1));
  }

  validateQuestion(q: QuestionInput) {
    const maxGroup = this.assessment?.upper_group_size || this.calculatedUpper;
    if (q.upper_correct > maxGroup) q.upper_correct = maxGroup;
    if (q.lower_correct > maxGroup) q.lower_correct = maxGroup;
  }

  saveQuestionsAndAnalyze() {
    if (!this.assessmentId) return;

    this.saving = true;
    this.errorMessage = '';

    this.assessmentService
      .batchSaveQuestions(this.assessmentId, this.questionInputs)
      .subscribe({
        next: () => {
          this.saving = false;
          this.successMessage = 'Question data saved.';
          this.setStep(3);
        },
        error: (err) => {
          this.saving = false;
          this.errorMessage =
            err.error?.error || 'Failed to save question data.';
        },
      });
  }

  submitForVerification() {
    if (!this.assessmentId) return;
    this.assessmentService.submitAssessment(this.assessmentId).subscribe({
      next: (asm) => {
        this.assessment = asm;
        this.successMessage = 'Assessment submitted for verification!';
      },
      error: () => (this.errorMessage = 'Failed to submit assessment.'),
    });
  }

  updateStatus(status: AssessmentStatus) {
    if (!this.assessmentId) return;
    this.assessmentService
      .verifyAssessment(this.assessmentId, status, this.adminFeedback)
      .subscribe({
        next: (asm) => {
          this.assessment = asm;
          this.successMessage = `Assessment status updated to ${status}.`;
        },
        error: () => (this.errorMessage = 'Failed to update status.'),
      });
  }

  downloadPDF() {
    const element = document.getElementById('pdf-report-content');
    if (!element) return;

    this.pdfGenerating = true;

    html2canvas(element, { scale: 2 }).then((canvas: HTMLCanvasElement) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(
        `Item_Analysis_Report_${this.assessment?.subject || 'Assessment'}.pdf`,
      );
      this.pdfGenerating = false;
    });
  }

  goBack() {
    this.router.navigate(['/assessments']);
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Draft':
        return 'badge badge-draft';
      case 'Submitted':
        return 'badge badge-submitted';
      case 'Under Verification':
        return 'badge badge-under-verification';
      case 'Verified':
        return 'badge badge-verified';
      case 'Rejected':
        return 'badge badge-rejected';
      default:
        return 'badge';
    }
  }

  getInterpretationBadgeClass(interp: string): string {
    switch (interp) {
      case 'Very Good Item':
      case 'Excellent':
        return 'badge badge-excellent';
      case 'Good Item':
      case 'Good':
        return 'badge badge-good';
      case 'Acceptable Item':
      case 'Fair':
        return 'badge badge-fair';
      case 'Poor Item':
      case 'Poor':
        return 'badge badge-poor';
      case 'Very poor Item':
      case 'Negative':
        return 'badge badge-negative';
      default:
        return 'badge';
    }
  }

  getRecommendationAlertClass(rec: string): string {
    if (rec.includes('CRITICAL')) return 'alert alert-danger';
    if (rec.includes('EXCELLENT')) return 'alert alert-success';
    if (rec.includes('GOOD')) return 'alert alert-info';
    return 'alert alert-warning';
  }
}
