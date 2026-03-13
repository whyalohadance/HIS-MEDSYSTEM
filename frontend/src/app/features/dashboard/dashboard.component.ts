import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { PatientsService } from '../../core/services/patients.service';
import { AppointmentsService } from '../../core/services/appointments.service';
import { NotificationsService } from '../../core/services/notifications.service';
import { ResultsService } from '../../core/services/results.service';
import { map, forkJoin } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  isLoading = true;
  today = new Date();

  // Админ
  adminStats: any = null;

  // Доктор
  doctorPatients = 0;
  doctorAppointmentsToday = 0;
  doctorAppointmentsTotal = 0;
  doctorResults = 0;
  doctorScheduled = 0;
  doctorCompleted = 0;
  recentAppointments: any[] = [];

  // Регистратура
  receptionAppointmentsToday = 0;
  receptionScheduled = 0;
  receptionTotal = 0;
  receptionPatients = 0;

  // Пациент
  patientAppointments = 0;
  patientResults = 0;
  patientNotifications = 0;
  patientNextAppointment: any = null;

  constructor(
    public authService: AuthService,
    private api: ApiService,
    private patientsService: PatientsService,
    private appointmentsService: AppointmentsService,
    private notificationsService: NotificationsService,
    private resultsService: ResultsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (this.authService.isAdmin) this.loadAdminStats();
    else if (this.authService.isDoctor) this.loadDoctorStats();
    else if (this.authService.isReceptionist) this.loadReceptionStats();
    else this.loadPatientStats();
  }

  loadAdminStats(): void {
    this.api.get<any>('/admin/stats').pipe(map(r => r.data)).subscribe({
      next: data => { this.adminStats = data; this.isLoading = false; this.cdr.detectChanges(); },
      error: () => { this.isLoading = false; this.cdr.detectChanges(); }
    });
  }

  loadDoctorStats(): void {
    const today = new Date().toISOString().split('T')[0];
    forkJoin({
      patients: this.patientsService.getAll(),
      appointments: this.appointmentsService.getAll(),
      results: this.resultsService.getAll()
    }).subscribe({
      next: ({ patients, appointments, results }) => {
        const me = this.authService.currentUser;
        this.doctorPatients = patients.filter((p: any) => Number(p.doctorId) === Number(me?.id)).length;
        this.doctorAppointmentsToday = appointments.filter(a => a.date === today).length;
        this.doctorAppointmentsTotal = appointments.length;
        this.doctorScheduled = appointments.filter(a => a.status === 'scheduled').length;
        this.doctorCompleted = appointments.filter(a => a.status === 'completed').length;
        this.doctorResults = results.length;
        this.recentAppointments = appointments.filter(a => a.status === 'scheduled').slice(0, 3);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.isLoading = false; this.cdr.detectChanges(); }
    });
  }

  loadReceptionStats(): void {
    const today = new Date().toISOString().split('T')[0];
    forkJoin({
      patients: this.patientsService.getAll(),
      appointments: this.appointmentsService.getAll()
    }).subscribe({
      next: ({ patients, appointments }) => {
        this.receptionPatients = patients.length;
        this.receptionAppointmentsToday = appointments.filter(a => a.date === today).length;
        this.receptionScheduled = appointments.filter(a => a.status === 'scheduled').length;
        this.receptionTotal = appointments.length;
        this.recentAppointments = appointments.filter(a => a.date === today).slice(0, 5);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.isLoading = false; this.cdr.detectChanges(); }
    });
  }

  loadPatientStats(): void {
    forkJoin({
      appointments: this.appointmentsService.getAll(),
      notifications: this.notificationsService.getUnreadCount()
    }).subscribe({
      next: ({ appointments, notifications }) => {
        this.patientAppointments = appointments.length;
        this.patientNotifications = notifications;
        const upcoming = appointments
          .filter(a => a.status === 'scheduled' && a.date >= new Date().toISOString().split('T')[0])
          .sort((a, b) => a.date.localeCompare(b.date));
        this.patientNextAppointment = upcoming[0] || null;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.isLoading = false; this.cdr.detectChanges(); }
    });
  }

  get greeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Доброе утро';
    if (h < 18) return 'Добрый день';
    return 'Добрый вечер';
  }

  formatDate(date: string): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('ru-RU', { day: '2-digit', month: 'long' });
  }

}
