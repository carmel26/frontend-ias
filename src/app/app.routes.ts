import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AssessmentListComponent } from './components/assessment-list/assessment-list.component';
import { AssessmentWizardComponent } from './components/assessment-wizard/assessment-wizard.component';
import { AdminSettingsComponent } from './components/admin-settings/admin-settings.component';
import { UserManagementComponent } from './components/user-management/user-management.component';
import { adminGuard, authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard],
  },
  {
    path: 'assessments',
    component: AssessmentListComponent,
    canActivate: [authGuard],
  },
  {
    path: 'assessment/new',
    component: AssessmentWizardComponent,
    canActivate: [authGuard],
  },
  {
    path: 'assessment/:id',
    component: AssessmentWizardComponent,
    canActivate: [authGuard],
  },
  {
    path: 'admin/settings',
    component: AdminSettingsComponent,
    canActivate: [adminGuard],
  },
  {
    path: 'admin/users',
    component: UserManagementComponent,
    canActivate: [adminGuard],
  },
  { path: '**', redirectTo: 'dashboard' },
];
