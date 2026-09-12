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
  templateUrl: './assessment-list.component.html',
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
