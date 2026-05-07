import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { roleGuard } from './core/guards/role.guard';
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
      { path: 'lab-dashboard', loadComponent: () => import('./features/lab-dashboard/lab-dashboard.component').then(m => m.LabDashboardComponent), canActivate: [roleGuard], data: { roles: ['admin', 'lab_technician'] } },
      { path: 'ris-dashboard', loadComponent: () => import('./features/ris-dashboard/ris-dashboard.component').then(m => m.RisDashboardComponent), canActivate: [roleGuard], data: { roles: ['admin', 'radiologist'] } },
      { path: 'profile', loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent) },
      { path: 'notifications', loadComponent: () => import('./features/notifications/notifications.component').then(m => m.NotificationsComponent) },
      { path: 'patients', loadComponent: () => import('./features/patients/patients.component').then(m => m.PatientsComponent) },
      { path: 'patients/:id', loadComponent: () => import('./features/patient-card/patient-card.component').then(m => m.PatientCardComponent) },
      { path: 'appointments', loadComponent: () => import('./features/appointments/appointments.component').then(m => m.AppointmentsComponent) },
      { path: 'results', redirectTo: '/patients', pathMatch: 'full' },
      { path: 'studies', loadComponent: () => import('./features/studies/studies.component').then(m => m.StudiesComponent), canActivate: [roleGuard], data: { roles: ['admin', 'radiologist'] } },
      { path: 'worklist', loadComponent: () => import('./features/studies/worklist.component').then(m => m.WorklistComponent), canActivate: [roleGuard], data: { roles: ['admin', 'radiologist'] } },
      { path: 'dicom', loadComponent: () => import('./features/dicom-viewer/dicom-viewer-page.component').then(m => m.DicomViewerPageComponent), canActivate: [roleGuard], data: { roles: ['admin', 'radiologist'] } },
      { path: 'dicom/:id', loadComponent: () => import('./features/dicom-viewer/dicom-viewer-page.component').then(m => m.DicomViewerPageComponent), canActivate: [roleGuard], data: { roles: ['admin', 'radiologist'] } },

      // LIS
      { path: 'lab/orders', loadComponent: () => import('./features/lab-orders/lab-orders.component').then(m => m.LabOrdersComponent), canActivate: [roleGuard], data: { roles: ['admin', 'doctor', 'lab_technician'] } },
      { path: 'lab/worklist', loadComponent: () => import('./features/lab-worklist/lab-worklist.component').then(m => m.LabWorklistComponent), canActivate: [roleGuard], data: { roles: ['admin', 'lab_technician'] } },
      { path: 'lab/order/:id', loadComponent: () => import('./features/lab-result/lab-result.component').then(m => m.LabResultComponent), canActivate: [roleGuard], data: { roles: ['admin', 'doctor', 'lab_technician'] } },
      { path: 'lab/catalog', loadComponent: () => import('./features/lab-catalog/lab-catalog.component').then(m => m.LabCatalogComponent), canActivate: [adminGuard] },

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
