import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AssessmentService } from '../../services/assessment.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div style="max-width: 600px; margin: 2.5rem auto;" class="card">
      <div style="text-align: center; margin-bottom: 1.5rem;">
        <h2 style="font-size: 1.5rem; font-weight: 800;">
          Lecturer Registration
        </h2>
        <p style="color: var(--text-muted); font-size: 0.875rem;">
          Create an account to conduct assessment item analysis
        </p>
      </div>

      <div *ngIf="errorMessage" class="alert alert-danger">
        {{ errorMessage }}
      </div>

      <form (ngSubmit)="onRegister()">
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">First Name *</label>
            <input
              type="text"
              class="form-control"
              [(ngModel)]="firstName"
              name="first_name"
              required
              placeholder="e.g. Jane"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Middle Name</label>
            <input
              type="text"
              class="form-control"
              [(ngModel)]="middleName"
              name="middle_name"
              placeholder="e.g. Mary"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Surname / Last Name *</label>
            <input
              type="text"
              class="form-control"
              [(ngModel)]="surname"
              name="surname"
              required
              placeholder="e.g. Doe"
            />
          </div>
        </div>

        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">School / Institution *</label>
            <select
              class="form-control"
              [(ngModel)]="school"
              name="school"
              required
            >
              <option value="" disabled selected>
                Select School/Institution
              </option>
              <option *ngFor="let s of schoolOptions" [value]="s">
                {{ s }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Profession / Title *</label>
            <input
              type="text"
              class="form-control"
              [(ngModel)]="profession"
              name="profession"
              required
              placeholder="e.g. Associate Professor"
            />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Specialization *</label>
          <input
            type="text"
            class="form-control"
            [(ngModel)]="specialization"
            name="specialization"
            required
            placeholder="e.g. Computer Science, Mathematics"
          />
        </div>

        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Email Address *</label>
            <input
              type="email"
              class="form-control"
              [(ngModel)]="email"
              name="email"
              required
              placeholder="e.g. jdoe@university.edu"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Password *</label>
            <input
              type="password"
              class="form-control"
              [(ngModel)]="password"
              name="password"
              required
              placeholder="At least 6 characters"
            />
          </div>
        </div>

        <button
          type="submit"
          class="btn btn-primary"
          style="width: 100%; margin-top: 0.5rem;"
          [disabled]="loading"
        >
          {{ loading ? 'Creating Account...' : 'Register Lecturer Account' }}
        </button>
      </form>

      <div
        style="text-align: center; margin-top: 1.25rem; font-size: 0.875rem;"
      >
        Already registered?
        <a routerLink="/login" style="color: var(--primary); font-weight: 600;"
          >Sign In</a
        >
      </div>
    </div>
  `,
})
export class RegisterComponent implements OnInit {
  firstName = '';
  middleName = '';
  surname = '';
  school = '';
  profession = '';
  specialization = '';
  email = '';
  password = '';

  schoolOptions: string[] = [];
  loading = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private assessmentService: AssessmentService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.assessmentService.getSystemSettings().subscribe({
      next: (settings) => {
        this.schoolOptions = settings.schools;
        if (this.schoolOptions.length > 0) {
          this.school = this.schoolOptions[0];
        }
      },
      error: () => {
        this.schoolOptions = [
          'School of Science & Technology',
          'School of Business',
          'Faculty of Education',
        ];
        this.school = this.schoolOptions[0];
      },
    });
  }

  onRegister() {
    if (
      !this.firstName ||
      !this.surname ||
      !this.email ||
      !this.password ||
      !this.school
    ) {
      this.errorMessage = 'Please complete all required fields.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const payload = {
      first_name: this.firstName,
      middle_name: this.middleName ? this.middleName : null,
      surname: this.surname,
      school: this.school,
      profession: this.profession,
      specialization: this.specialization,
      email: this.email,
      password: this.password,
    };

    this.authService.register(payload).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage =
          err.error?.error || 'Registration failed. Please try again.';
      },
    });
  }
}
