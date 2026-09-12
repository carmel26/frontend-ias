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
  templateUrl: './register.component.html',
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
  confirmPassword = '';

  schoolOptions: string[] = [];
  loading = false;
  errorMessage = '';
  duplicateEmail = false;

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

    if (this.password.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters long.';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
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
        const message =
          err.error?.error || 'Registration failed. Please try again.';
        this.duplicateEmail = /email already exists/i.test(message);
        this.errorMessage = message;
      },
    });
  }

  onEmailChange() {
    this.duplicateEmail = false;
  }
}
