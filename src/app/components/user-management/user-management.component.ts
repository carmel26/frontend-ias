import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AssessmentService } from '../../services/assessment.service';
import { AuthService } from '../../services/auth.service';
import { User, UserRole } from '../../models/models';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">User & Admin Management</h1>
        <p class="page-subtitle">
          Manage system users, create Admin accounts, and assign roles
        </p>
      </div>

      <button class="btn btn-primary" (click)="showCreateModal = true">
        + Create Admin / User Account
      </button>
    </div>

    <div *ngIf="successMessage" class="alert alert-success">
      {{ successMessage }}
    </div>
    <div *ngIf="errorMessage" class="alert alert-danger">
      {{ errorMessage }}
    </div>

    <!-- User Table -->
    <div class="card">
      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>School / Institution</th>
              <th>Profession & Specialization</th>
              <th>Role</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let u of users">
              <td>
                <div style="font-weight: 700; color: var(--text-main);">
                  {{ u.first_name }}
                  {{ u.middle_name ? u.middle_name + ' ' : '' }}{{ u.surname }}
                </div>
              </td>
              <td>{{ u.email }}</td>
              <td>{{ u.school }}</td>
              <td>
                <div style="font-size: 0.85rem;">{{ u.profession }}</div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">
                  {{ u.specialization }}
                </div>
              </td>
              <td>
                <select
                  class="form-control"
                  style="padding: 0.25rem 0.5rem; width: auto;"
                  [ngModel]="u.role"
                  (ngModelChange)="changeRole(u.id, $event)"
                  [disabled]="!authService.isSuperadmin()"
                >
                  <option value="Lecturer">Lecturer</option>
                  <option value="Admin">Admin</option>
                  <option value="Superadmin">Superadmin</option>
                </select>
              </td>
              <td style="text-align: right;">
                <button
                  class="btn btn-danger btn-sm"
                  (click)="deleteUser(u.id, u.email)"
                  [disabled]="
                    !authService.isSuperadmin() ||
                    u.email === authService.currentUser()?.email
                  "
                >
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create Admin Modal -->
    <div
      *ngIf="showCreateModal"
      style="position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 100;"
    >
      <div class="card" style="width: 500px; max-width: 90vw;">
        <div class="card-header">
          <h2 class="card-title">Create Admin / User Account</h2>
          <button
            class="btn btn-secondary btn-sm"
            (click)="showCreateModal = false"
          >
            ✕
          </button>
        </div>

        <form (ngSubmit)="onCreateUser()">
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">First Name *</label>
              <input
                type="text"
                class="form-control"
                [(ngModel)]="newFirstName"
                name="first_name"
                required
              />
            </div>
            <div class="form-group">
              <label class="form-label">Surname *</label>
              <input
                type="text"
                class="form-control"
                [(ngModel)]="newSurname"
                name="surname"
                required
              />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">School *</label>
            <input
              type="text"
              class="form-control"
              [(ngModel)]="newSchool"
              name="school"
              required
            />
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Profession *</label>
              <input
                type="text"
                class="form-control"
                [(ngModel)]="newProfession"
                name="profession"
                required
              />
            </div>
            <div class="form-group">
              <label class="form-label">Specialization *</label>
              <input
                type="text"
                class="form-control"
                [(ngModel)]="newSpecialization"
                name="specialization"
                required
              />
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Email *</label>
              <input
                type="email"
                class="form-control"
                [(ngModel)]="newEmail"
                name="email"
                required
              />
            </div>
            <div class="form-group">
              <label class="form-label">Password *</label>
              <input
                type="password"
                class="form-control"
                [(ngModel)]="newPassword"
                name="password"
                required
              />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Role *</label>
            <select class="form-control" [(ngModel)]="newRole" name="role">
              <option value="Admin">Admin</option>
              <option value="Lecturer">Lecturer</option>
              <option value="Superadmin" *ngIf="authService.isSuperadmin()">
                Superadmin
              </option>
            </select>
          </div>

          <div
            style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1.5rem;"
          >
            <button
              type="button"
              class="btn btn-secondary"
              (click)="showCreateModal = false"
            >
              Cancel
            </button>
            <button type="submit" class="btn btn-primary" [disabled]="creating">
              {{ creating ? 'Creating...' : 'Create Account' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class UserManagementComponent implements OnInit {
  users: User[] = [];
  showCreateModal = false;

  newFirstName = '';
  newSurname = '';
  newSchool = 'School of Science & Technology';
  newProfession = 'Academic Admin';
  newSpecialization = 'Assessment & Evaluation';
  newEmail = '';
  newPassword = '';
  newRole: UserRole = 'Admin';

  creating = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private assessmentService: AssessmentService,
    public authService: AuthService,
  ) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.assessmentService.getUsers().subscribe({
      next: (data) => (this.users = data),
      error: (err) => console.error(err),
    });
  }

  changeRole(userId: string, role: string) {
    this.assessmentService.updateUserRole(userId, role).subscribe({
      next: () => {
        this.successMessage = 'User role updated.';
        this.loadUsers();
      },
      error: (err) =>
        (this.errorMessage = err.error?.error || 'Failed to update role.'),
    });
  }

  deleteUser(userId: string, email: string) {
    if (confirm(`Are you sure you want to delete user ${email}?`)) {
      this.assessmentService.deleteUser(userId).subscribe({
        next: () => {
          this.successMessage = 'User deleted.';
          this.loadUsers();
        },
        error: (err) =>
          (this.errorMessage = err.error?.error || 'Failed to delete user.'),
      });
    }
  }

  onCreateUser() {
    if (
      !this.newFirstName ||
      !this.newSurname ||
      !this.newEmail ||
      !this.newPassword
    ) {
      this.errorMessage = 'Please complete all required fields.';
      return;
    }

    this.creating = true;
    this.errorMessage = '';

    const payload = {
      first_name: this.newFirstName,
      middle_name: null,
      surname: this.newSurname,
      school: this.newSchool,
      profession: this.newProfession,
      specialization: this.newSpecialization,
      email: this.newEmail,
      password: this.newPassword,
      role: this.newRole,
    };

    this.assessmentService.createAdminUser(payload).subscribe({
      next: () => {
        this.creating = false;
        this.showCreateModal = false;
        this.successMessage = 'Account created successfully!';
        this.loadUsers();
      },
      error: (err) => {
        this.creating = false;
        this.errorMessage = err.error?.error || 'Failed to create account.';
      },
    });
  }
}
