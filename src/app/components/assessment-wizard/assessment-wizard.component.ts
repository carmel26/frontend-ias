import { Component, OnInit, NgZone, OnDestroy } from '@angular/core';
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
  templateUrl: './assessment-wizard.component.html',
  styleUrls: ['./assessment-wizard.component.css'],
})
export class AssessmentWizardComponent implements OnInit, OnDestroy {
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

  private messageTimer?: ReturnType<typeof setTimeout>;

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
    private ngZone: NgZone // Injected NgZone for reliable UI updates
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

  ngOnDestroy() {
    if (this.messageTimer) {
      clearTimeout(this.messageTimer);
    }
  }

  // Helper method to display messages and auto-clear after delay (default 4 seconds)
  private showMessage(type: 'success' | 'error', message: string, durationMs = 4000) {
    if (this.messageTimer) {
      clearTimeout(this.messageTimer);
    }

    if (type === 'success') {
      this.successMessage = message;
      this.errorMessage = '';
    } else {
      this.errorMessage = message;
      this.successMessage = '';
    }

    this.messageTimer = setTimeout(() => {
      this.ngZone.run(() => {
        this.successMessage = '';
        this.errorMessage = '';
        this.messageTimer = undefined;
      });
    }, durationMs);
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
      error: () => this.showMessage('error', 'Failed to load assessment.'),
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
      this.showMessage('error', 'Please complete all required assessment details.');
      return;
    }

    this.saving = true;

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
            this.showMessage('success', 'Assessment info updated.');
            this.setStep(2);
          },
          error: (err) => {
            this.saving = false;
            this.showMessage('error', err.error?.error || 'Failed to update assessment.');
          },
        });
    } else {
      this.assessmentService.createAssessment(payload).subscribe({
        next: (asm) => {
          this.saving = false;
          this.assessment = asm;
          this.assessmentId = asm.id;
          this.showMessage('success', 'Assessment created successfully.');
          this.router.navigate(['/assessment', asm.id]);
          this.setStep(2);
        },
        error: (err) => {
          this.saving = false;
          this.showMessage('error', err.error?.error || 'Failed to create assessment.');
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

    this.assessmentService
      .batchSaveQuestions(this.assessmentId, this.questionInputs)
      .subscribe({
        next: () => {
          this.saving = false;
          this.showMessage('success', 'Question data saved.');
          this.setStep(3);
        },
        error: (err) => {
          this.saving = false;
          this.showMessage('error', err.error?.error || 'Failed to save question data.');
        },
      });
  }

  submitForVerification() {
    if (!this.assessmentId) return;
    this.assessmentService.submitAssessment(this.assessmentId).subscribe({
      next: (asm) => {
        this.assessment = asm;
        this.showMessage('success', 'Assessment submitted for verification!');
      },
      error: () => this.showMessage('error', 'Failed to submit assessment.'),
    });
  }

  updateStatus(status: AssessmentStatus) {
    if (!this.assessmentId) return;
    this.assessmentService
      .verifyAssessment(this.assessmentId, status, this.adminFeedback)
      .subscribe({
        next: (asm) => {
          this.assessment = asm;
          this.showMessage('success', `Assessment status updated to ${status}.`);
        },
        error: (err) =>
          this.showMessage('error', err.error?.error || 'Failed to update status.'),
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
