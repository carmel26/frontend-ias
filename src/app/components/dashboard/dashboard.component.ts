import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AssessmentService } from '../../services/assessment.service';
import { AuthService } from '../../services/auth.service';
import { DashboardStats, Assessment } from '../../models/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  stats: DashboardStats | null = null;

  constructor(
    public authService: AuthService,
    private assessmentService: AssessmentService,
  ) {}

  ngOnInit() {
    this.assessmentService.getDashboardStats().subscribe({
      next: (data) => (this.stats = data),
      error: (err) => console.error(err),
    });
  }

  getPercent(val: number): number {
    if (!this.stats || this.stats.total_assessments === 0) return 0;
    return (val / this.stats.total_assessments) * 100;
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
}
