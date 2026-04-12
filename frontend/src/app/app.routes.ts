import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { LayoutComponent } from './shared/components/layout/layout.component';
import { NotFoundComponent } from './features/not-found/not-found.component';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'auth/login', loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
  { path: 'access-denied', loadComponent: () => import('./features/access-denied/access-denied.component').then(m => m.AccessDeniedComponent) },

  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'profile', loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent) },
      { path: 'notifications', loadComponent: () => import('./features/notifications/notifications.component').then(m => m.NotificationsComponent) },
      { path: 'patients', loadComponent: () => import('./features/patients/patients.component').then(m => m.PatientsComponent) },
      { path: 'patients/:id', loadComponent: () => import('./features/patient-card/patient-card.component').then(m => m.PatientCardComponent) },
      { path: 'appointments', loadComponent: () => import('./features/appointments/appointments.component').then(m => m.AppointmentsComponent) },
      { path: 'results', redirectTo: '/patients', pathMatch: 'full' },
      { path: 'studies', loadComponent: () => import('./features/studies/studies.component').then(m => m.StudiesComponent) },
      { path: 'worklist', loadComponent: () => import('./features/studies/worklist.component').then(m => m.WorklistComponent) },
      { path: 'my-room', loadComponent: () => import('./features/my-room/my-room.component').then(m => m.MyRoomComponent) },
      { path: 'my-cabinet', loadComponent: () => import('./features/my-cabinet/my-cabinet.component').then(m => m.MyCabinetComponent) },

      // Только АДМИН
      { path: 'staff', loadComponent: () => import('./features/staff/staff.component').then(m => m.StaffComponent), canActivate: [adminGuard] },
      { path: 'rooms', loadComponent: () => import('./features/rooms/rooms.component').then(m => m.RoomsComponent), canActivate: [adminGuard] },
      { path: 'schedules', loadComponent: () => import('./features/schedules/schedules.component').then(m => m.SchedulesComponent), canActivate: [adminGuard] },
      { path: 'examinations', loadComponent: () => import('./features/examinations/examinations.component').then(m => m.ExaminationsComponent), canActivate: [adminGuard] },
      { path: 'reports', loadComponent: () => import('./features/reports/reports.component').then(m => m.ReportsComponent), canActivate: [adminGuard] },
    ]
  },

  { path: '**', component: NotFoundComponent }
];
