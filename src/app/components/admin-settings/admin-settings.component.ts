import { Component, OnInit, NgZone, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AssessmentService } from '../../services/assessment.service';
import { DiscriminationThresholds, SystemSettings } from '../../models/models';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-settings.component.html',
})
export class AdminSettingsComponent implements OnInit, OnDestroy {
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

  private messageTimer?: ReturnType<typeof setTimeout>;

  constructor(
    private assessmentService: AssessmentService,
    private ngZone: NgZone // Injected NgZone for reliable UI updates
  ) {}

  ngOnInit() {
    this.assessmentService.getSystemSettings().subscribe({
      next: (s) => {
        this.settings = s;
        this.percentage = s.upper_lower_percentage;
        this.thresholds = { ...s.thresholds };
        this.schoolsText = s.schools.join(', ');
        this.typesText = s.assessment_types.join(', ');
      },
      error: () => this.showMessage('error', 'Failed to load system settings.'),
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

  round(val: number): number {
    return Math.round(val);
  }

  saveSettings() {
    this.saving = true;

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
        this.showMessage('success', 'System settings updated successfully!');
      },
      error: (err) => {
        this.saving = false;
        this.showMessage('error', err.error?.error || 'Failed to save settings.');
      },
    });
  }
}
