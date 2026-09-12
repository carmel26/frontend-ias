import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AssessmentService } from '../../services/assessment.service';
import { DiscriminationThresholds, SystemSettings } from '../../models/models';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">Admin System Settings</h1>
        <p class="page-subtitle">
          Configure group percentages, discrimination thresholds, schools, and
          assessment types
        </p>
      </div>
    </div>

    <div *ngIf="successMessage" class="alert alert-success">
      {{ successMessage }}
    </div>
    <div *ngIf="errorMessage" class="alert alert-danger">
      {{ errorMessage }}
    </div>

    <div class="card" *ngIf="settings">
      <div class="card-header">
        <h2 class="card-title">
          1. Configurable Upper & Lower Group Percentage
        </h2>
      </div>

      <div class="form-group" style="max-width: 400px;">
        <label class="form-label">Upper / Lower Group Percentage (%) *</label>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <input
            type="number"
            class="form-control"
            [(ngModel)]="percentage"
            step="0.5"
            min="1"
            max="50"
            required
          />
          <span style="font-weight: 700;">%</span>
        </div>
        <p
          style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.35rem;"
        >
          Default is <strong>27.0%</strong>. For 100 students: Upper =
          {{ round((100 * percentage) / 100) }}, Lower =
          {{ round((100 * percentage) / 100) }}, Middle =
          {{ 100 - 2 * round((100 * percentage) / 100) }}.
        </p>
      </div>
    </div>

    <div class="card" *ngIf="settings">
      <div class="card-header">
        <h2 class="card-title">
          2. Discrimination Index Classification Thresholds ($D$)
        </h2>
      </div>

      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Excellent Item Threshold ($D ge$)</label>
          <input
            type="number"
            class="form-control"
            [(ngModel)]="thresholds.excellent"
            step="0.05"
          />
        </div>

        <div class="form-group">
          <label class="form-label">Good Item Threshold ($D ge$)</label>
          <input
            type="number"
            class="form-control"
            [(ngModel)]="thresholds.good"
            step="0.05"
          />
        </div>

        <div class="form-group">
          <label class="form-label">Fair Item Threshold ($D ge$)</label>
          <input
            type="number"
            class="form-control"
            [(ngModel)]="thresholds.fair"
            step="0.05"
          />
        </div>

        <div class="form-group">
          <label class="form-label">Poor Item Threshold ($D ge$)</label>
          <input
            type="number"
            class="form-control"
            [(ngModel)]="thresholds.poor"
            step="0.05"
          />
        </div>
      </div>
      <p style="font-size: 0.8rem; color: var(--text-muted);">
        Items with $D < 0.00$ are classified as <strong>Negative</strong>.
      </p>
    </div>

    <div class="card" *ngIf="settings">
      <div class="card-header">
        <h2 class="card-title">3. Managed Schools & Assessment Types</h2>
      </div>

      <div class="form-grid">
        <div class="form-group">
          <label class="form-label"
            >Schools / Institutions (comma separated)</label
          >
          <textarea
            class="form-control"
            rows="3"
            [(ngModel)]="schoolsText"
          ></textarea>
        </div>

        <div class="form-group">
          <label class="form-label">Assessment Types (comma separated)</label>
          <textarea
            class="form-control"
            rows="3"
            [(ngModel)]="typesText"
          ></textarea>
        </div>
      </div>
    </div>

    <div style="display: flex; justify-content: flex-end; margin-bottom: 2rem;">
      <button
        class="btn btn-primary btn-lg"
        (click)="saveSettings()"
        [disabled]="saving"
      >
        {{ saving ? 'Saving Settings...' : 'Save All Settings' }}
      </button>
    </div>
  `,
})
export class AdminSettingsComponent implements OnInit {
  settings: SystemSettings | null = null;
  percentage = 27.0;
  thresholds: DiscriminationThresholds = {
    excellent: 0.4,
    good: 0.3,
    fair: 0.2,
    poor: 0.0,
  };
  schoolsText = '';
  typesText = '';

  saving = false;
  successMessage = '';
  errorMessage = '';

  constructor(private assessmentService: AssessmentService) {}

  ngOnInit() {
    this.assessmentService.getSystemSettings().subscribe({
      next: (s) => {
        this.settings = s;
        this.percentage = s.upper_lower_percentage;
        this.thresholds = { ...s.thresholds };
        this.schoolsText = s.schools.join(', ');
        this.typesText = s.assessment_types.join(', ');
      },
      error: (err) => (this.errorMessage = 'Failed to load system settings.'),
    });
  }

  round(val: number): number {
    return Math.round(val);
  }

  saveSettings() {
    this.saving = true;
    this.successMessage = '';
    this.errorMessage = '';

    const schools = this.schoolsText
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    const assessment_types = this.typesText
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const payload = {
      upper_lower_percentage: this.percentage,
      thresholds: this.thresholds,
      schools,
      assessment_types,
    };

    this.assessmentService.updateSystemSettings(payload).subscribe({
      next: (updated) => {
        this.saving = false;
        this.settings = updated;
        this.successMessage = 'System settings updated successfully!';
      },
      error: (err) => {
        this.saving = false;
        this.errorMessage = err.error?.error || 'Failed to save settings.';
      },
    });
  }
}
