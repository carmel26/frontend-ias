import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div style="max-width: 440px; margin: 4rem auto;" class="card">
      <div style="text-align: center; margin-bottom: 1.5rem;">
        <div
          class="brand-icon"
          style="margin: 0 auto 0.75rem auto; width: 48px; height: 48px; font-size: 1.4rem;"
        >
          AI
        </div>
        <h2 style="font-size: 1.5rem; font-weight: 800;">
          Academic Item Analysis
        </h2>
        <p style="color: var(--text-muted); font-size: 0.875rem;">
          Sign in to manage assessments and item statistics
        </p>
      </div>

      <div *ngIf="errorMessage" class="alert alert-danger">
        {{ errorMessage }}
      </div>

      <form (ngSubmit)="onLogin()">
        <div class="form-group">
          <label class="form-label">Email Address</label>
          <input
            type="email"
            class="form-control"
            [(ngModel)]="email"
            name="email"
            placeholder="e.g. lecturer@university.edu"
            required
          />
        </div>

        <div class="form-group">
          <label class="form-label">Password</label>
          <input
            type="password"
            class="form-control"
            [(ngModel)]="password"
            name="password"
            placeholder="••••••••"
            required
          />
        </div>

        <button
          type="submit"
          class="btn btn-primary"
          style="width: 100%; margin-top: 0.5rem;"
          [disabled]="loading"
        >
          {{ loading ? 'Signing in...' : 'Sign In' }}
        </button>
      </form>

      <div
        style="margin-top: 1.5rem; padding-top: 1.25rem; border-top: 1px solid var(--border-color);"
      >
        <p
          style="font-size: 0.825rem; font-weight: 700; color: var(--text-muted); margin-bottom: 0.75rem;"
        >
          QUICK DEMO SIGN-IN
        </p>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <button
            class="btn btn-secondary btn-sm"
            (click)="quickLogin('lecturer@university.edu', 'Lecturer123!')"
          >
            Lecturer
          </button>
          <button
            class="btn btn-secondary btn-sm"
            (click)="quickLogin('admin@system.com', 'Admin123!')"
          >
            Admin
          </button>
          <button
            class="btn btn-secondary btn-sm"
            (click)="quickLogin('superadmin@system.com', 'SuperAdmin123!')"
          >
            Superadmin
          </button>
        </div>
      </div>

      <div
        style="text-align: center; margin-top: 1.25rem; font-size: 0.875rem;"
      >
        Don't have a lecturer account?
        <a
          routerLink="/register"
          style="color: var(--primary); font-weight: 600;"
          >Register Here</a
        >
      </div>
    </div>
  `,
})
export class LoginComponent {
  email = '';
  password = '';
  loading = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  quickLogin(e: string, p: string) {
    this.email = e;
    this.password = p;
    this.onLogin();
  }

  onLogin() {
    if (!this.email || !this.password) {
      this.errorMessage = 'Please provide email and password';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authService
      .login({ email: this.email, password: this.password })
      .subscribe({
        next: () => {
          this.loading = false;
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.loading = false;
          this.errorMessage =
            err.error?.error || 'Failed to sign in. Please check credentials.';
        },
      });
  }
}
