import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AssessmentService } from '../../services/assessment.service';
import { Assessment } from '../../models/models';

@Component({
  selector: 'app-assessment-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">Assessment Management</h1>
        <p class="page-subtitle">
          View, edit, review, and track item analysis assessments
        </p>
      </div>

      <a routerLink="/assessment/new" class="btn btn-primary btn-lg">
        + Create New Assessment
      </a>
    </div>

    <!-- Filters & Search Bar -->
    <div class="card" style="padding: 1rem 1.25rem;">
      <div
        style="display: flex; gap: 1rem; flex-wrap: wrap; align-items: center;"
      >
        <div style="flex: 1; min-width: 240px;">
          <input
            type="text"
            class="form-control"
            [(ngModel)]="searchQuery"
            placeholder="Search by subject, title, or lecturer..."
          />
        </div>

        <div>
          <select class="form-control" [(ngModel)]="statusFilter">
            <option value="All">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Submitted">Submitted</option>
            <option value="Under Verification">Under Verification</option>
            <option value="Verified">Verified</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Assessment Table -->
    <div class="card">
      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>Title & Subject</th>
              <th>Lecturer & School</th>
              <th>Type</th>
              <th>Students</th>
              <th>Group Size (27%)</th>
              <th>Date</th>
              <th>Status</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let asm of filteredAssessments">
              <td>
                <div style="font-weight: 700; color: var(--text-main);">
                  {{ asm.title }}
                </div>
                <div style="font-size: 0.8rem; color: var(--text-muted);">
                  {{ asm.subject }}
                </div>
              </td>
              <td>
                <div style="font-weight: 600;">{{ asm.lecturer_name }}</div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">
                  {{ asm.school }}
                </div>
              </td>
              <td>
                <span class="badge badge-draft" style="background: #e2e8f0;">{{
                  asm.assessment_type
                }}</span>
              </td>
              <td>{{ asm.num_students }}</td>
              <td>
                <strong>{{ asm.upper_group_size }}</strong>
              </td>
              <td>{{ asm.date }}</td>
              <td>
                <span [class]="getStatusBadgeClass(asm.status)">{{
                  asm.status
                }}</span>
              </td>
              <td style="text-align: right;">
                <div style="display: inline-flex; gap: 0.35rem;">
                  <a
                    [routerLink]="['/assessment', asm.id]"
                    class="btn btn-primary btn-sm"
                  >
                    Open Workflow
                  </a>
                  <button
                    class="btn btn-danger btn-sm"
                    (click)="deleteAssessment(asm.id, asm.title)"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="filteredAssessments.length === 0">
              <td
                colspan="8"
                style="text-align: center; color: var(--text-muted); padding: 2.5rem;"
              >
                No matching assessments found.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class AssessmentListComponent implements OnInit {
  assessments: Assessment[] = [];
  searchQuery = '';
  statusFilter = 'All';

  constructor(private assessmentService: AssessmentService) {}

  ngOnInit() {
    this.loadAssessments();
  }

  loadAssessments() {
    this.assessmentService.getAssessments().subscribe({
      next: (data) => (this.assessments = data),
      error: (err) => console.error(err),
    });
  }

  get filteredAssessments(): Assessment[] {
    return this.assessments.filter((a) => {
      const matchesSearch =
        a.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        a.subject.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        a.lecturer_name.toLowerCase().includes(this.searchQuery.toLowerCase());

      const matchesStatus =
        this.statusFilter === 'All' || a.status === this.statusFilter;

      return matchesSearch && matchesStatus;
    });
  }

  deleteAssessment(id: string, title: string) {
    if (confirm(`Are you sure you want to delete assessment "${title}"?`)) {
      this.assessmentService.deleteAssessment(id).subscribe({
        next: () => this.loadAssessments(),
        error: (err) =>
          alert(err.error?.error || 'Failed to delete assessment.'),
      });
    }
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
