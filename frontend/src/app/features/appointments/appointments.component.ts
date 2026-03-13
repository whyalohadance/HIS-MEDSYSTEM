import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Appointment, AppointmentStatus } from '../../core/models/appointment.model';
import { AppointmentsService } from '../../core/services/appointments.service';
import { PatientsService } from '../../core/services/patients.service';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { map } from 'rxjs';

interface Doctor { id: number; firstName: string; lastName: string; }
interface Patient { id: number; firstName: string; lastName: string; }

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './appointments.component.html',
  styleUrls: ['./appointments.component.scss']
})
export class AppointmentsComponent implements OnInit {
  filterStatus = 'all';
  showForm = false;
  appointments: Appointment[] = [];
  doctors: Doctor[] = [];
  patients: Patient[] = [];
  isLoading = true;
  isSaving = false;
  successMsg = '';

  form: {
    patientId: number;
    doctorId: number;
    date: string;
    time: string;
    notes: string;
  } = { patientId: 0, doctorId: 0, date: '', time: '', notes: '' };

  constructor(
    private service: AppointmentsService,
    private patientsService: PatientsService,
    private api: ApiService,
    public authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAppointments();
    this.loadDoctors();
    this.loadPatients();
  }

  loadAppointments(): void {
    this.isLoading = true;
    this.service.getAll().subscribe({
      next: data => { this.appointments = data; this.isLoading = false; this.cdr.detectChanges(); },
      error: () => { this.isLoading = false; this.cdr.detectChanges(); }
    });
  }

  loadDoctors(): void {
    this.api.get<any>('/users/doctors').pipe(map(r => r.data)).subscribe({
      next: data => { this.doctors = data; this.cdr.detectChanges(); }
    });
  }

  loadPatients(): void {
    this.patientsService.getAll().subscribe({
      next: data => { this.patients = data; this.cdr.detectChanges(); }
    });
  }

  get filtered(): Appointment[] {
    if (this.filterStatus === 'all') return this.appointments;
    return this.appointments.filter(a => a.status === this.filterStatus);
  }

  getPatientName(id: number): string {
    const p = this.patients.find(p => p.id === id);
    return p ? `${p.lastName} ${p.firstName}` : `Пациент #${id}`;
  }

  getDoctorName(id: number): string {
    const d = this.doctors.find(d => d.id === id);
    return d ? `${d.lastName} ${d.firstName}` : `Врач #${id}`;
  }

  getInitials(id: number, type: 'patient' | 'doctor'): string {
    if (type === 'patient') {
      const p = this.patients.find(p => p.id === id);
      return p ? `${p.firstName?.[0] || ''}${p.lastName?.[0] || ''}` : '?';
    }
    const d = this.doctors.find(d => d.id === id);
    return d ? `${d.firstName?.[0] || ''}${d.lastName?.[0] || ''}` : '?';
  }

  openForm(): void {
    // Если доктор — сразу ставим его ID
    if (this.authService.isDoctor) {
      const user = this.authService.currentUser;
      this.form.doctorId = user?.id || 0;
    }
    this.showForm = true;
    this.cdr.detectChanges();
  }

  save(): void {
    if (!this.form.patientId || !this.form.doctorId || !this.form.date || !this.form.time) return;
    this.isSaving = true;
    this.service.create(this.form).subscribe({
      next: () => {
        this.isSaving = false;
        this.showForm = false;
        this.form = { patientId: 0, doctorId: 0, date: '', time: '', notes: '' };
        this.successMsg = 'Приём записан!';
        setTimeout(() => { this.successMsg = ''; this.cdr.detectChanges(); }, 3000);
        this.loadAppointments();
        this.cdr.detectChanges();
      },
      error: () => { this.isSaving = false; this.cdr.detectChanges(); }
    });
  }

  updateStatus(id: number, status: AppointmentStatus): void {
    this.service.updateStatus(id, status).subscribe({
      next: () => this.loadAppointments()
    });
  }

  delete(id: number): void {
    if (!confirm('Удалить приём?')) return;
    this.appointments = this.appointments.filter(a => a.id !== id);
    this.cdr.detectChanges();
    this.service.delete(id).subscribe({ error: () => this.loadAppointments() });
  }

  getStatusLabel(status: AppointmentStatus): string {
    const map: Record<AppointmentStatus, string> = {
      scheduled: 'Запланирован',
      completed: 'Завершён',
      cancelled: 'Отменён'
    };
    return map[status];
  }

  formatDate(date: string): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });
  }
}
