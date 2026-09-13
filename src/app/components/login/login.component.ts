import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
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
