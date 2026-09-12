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
  templateUrl: './user-management.component.html',
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
