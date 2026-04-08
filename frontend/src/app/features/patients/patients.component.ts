import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { PatientsService } from '../../core/services/patients.service';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { Patient } from '../../core/models/patient.model';
import { map } from 'rxjs';

interface Doctor { id: number; firstName: string; lastName: string; }

@Component({
  selector: 'app-patients',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TranslateModule],
  templateUrl: './patients.component.html',
  styleUrls: ['./patients.component.scss']
})
export class PatientsComponent implements OnInit {
  filteredPatients: Patient[] = [];
  doctors: Doctor[] = [];
  searchQuery = '';
  isLoading = false;
  hasSearched = false;
  showForm = false;
  showEditModal = false;
  isSaving = false;
  successMessage = '';
  selectedPatient: Patient | null = null;
  formTouched = false;

  currentPage = 1;
  readonly pageSize = 10;

  get totalPages(): number {
    return Math.ceil(this.filteredPatients.length / this.pageSize) || 1;
  }

  get pagedPatients(): Patient[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredPatients.slice(start, start + this.pageSize);
  }

  prevPage(): void { if (this.currentPage > 1) this.currentPage--; }
  nextPage(): void { if (this.currentPage < this.totalPages) this.currentPage++; }

  form: {
    firstName: string; lastName: string; dateOfBirth: string;
    gender: 'male' | 'female'; phone: string; email: string;
    city: string; country: string; doctorId: number;
  } = {
    firstName: '', lastName: '', dateOfBirth: '',
    gender: 'male', phone: '', email: '',
    city: '', country: '', doctorId: 0
  };

  constructor(
    public authService: AuthService,
    private patientsService: PatientsService,
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private translate: TranslateService
  ) {}

  get currentLang(): string {
    return this.translate.currentLang || localStorage.getItem('language') || 'en';
  }

  ngOnInit(): void {
    const endpoint = this.authService.isAdmin ? '/users' : '/users/doctors';
    this.api.get<any>(endpoint).pipe(map(r => r.data)).subscribe({
      next: users => {
        this.doctors = this.authService.isAdmin
          ? users.filter((u: any) => u.role === 'doctor')
          : users;
        this.cdr.detectChanges();
      }
    });
  }

  get errors(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!this.form.firstName.trim()) e['firstName'] = 'Введите имя';
    if (!this.form.lastName.trim()) e['lastName'] = 'Введите фамилию';
    if (this.form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.form.email))
      e['email'] = 'Неверный формат email';
    if (this.form.phone && !/^\+?[\d\s\-()]{7,}$/.test(this.form.phone))
      e['phone'] = 'Неверный формат телефона';
    if (this.form.dateOfBirth) {
      const age = Math.floor((Date.now() - new Date(this.form.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
      if (age < 0 || age > 150) e['dateOfBirth'] = 'Неверная дата рождения';
    }
    return e;
  }

  get isFormValid(): boolean { return Object.keys(this.errors).length === 0; }

  fieldError(field: string): string {
    return this.formTouched ? (this.errors[field] || '') : '';
  }

  search(): void {
    if (!this.searchQuery.trim()) return;
    this.isLoading = true;
    this.hasSearched = true;
    this.currentPage = 1;
    this.cdr.detectChanges();
    this.patientsService.getAll().subscribe({
      next: data => {
        const q = this.searchQuery.toLowerCase().trim();
        this.filteredPatients = data.filter(p =>
          p.firstName?.toLowerCase().includes(q) ||
          p.lastName?.toLowerCase().includes(q) ||
          p.email?.toLowerCase().includes(q) ||
          p.phone?.includes(q) ||
          String(p.id).includes(q)
        );
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.isLoading = false; this.cdr.detectChanges(); }
    });
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.filteredPatients = [];
    this.hasSearched = false;
    this.currentPage = 1;
    this.cdr.detectChanges();
  }

  openEdit(patient: Patient): void {
    this.selectedPatient = patient;
    this.form = {
      firstName: patient.firstName,
      lastName: patient.lastName,
      dateOfBirth: patient.dateOfBirth,
      gender: patient.gender as 'male' | 'female',
      phone: patient.phone || '',
      email: patient.email || '',
      city: (patient as any).city || '',
      country: (patient as any).country || '',
      doctorId: patient.doctorId || 0
    };
    this.formTouched = false;
    this.showEditModal = true;
    this.cdr.detectChanges();
  }

  resetForm(): void {
    this.form = { firstName: '', lastName: '', dateOfBirth: '', gender: 'male', phone: '', email: '', city: '', country: '', doctorId: 0 };
    this.formTouched = false;
  }

  saveNew(): void {
    this.formTouched = true;
    if (!this.isFormValid || this.isSaving) return;
    this.isSaving = true;
    const payload: any = { ...this.form };
    if (!payload.doctorId) delete payload.doctorId;
    this.patientsService.create(payload).subscribe({
      next: () => {
        this.isSaving = false;
        this.showForm = false;
        this.resetForm();
        this.successMessage = 'Пациент добавлен';
        this.cdr.detectChanges();
        setTimeout(() => { this.successMessage = ''; this.cdr.detectChanges(); }, 3000);
        if (this.hasSearched) this.search();
      },
      error: () => { this.isSaving = false; this.cdr.detectChanges(); }
    });
  }

  saveEdit(): void {
    this.formTouched = true;
    if (!this.isFormValid || !this.selectedPatient || this.isSaving) return;
    this.isSaving = true;
    this.patientsService.update(this.selectedPatient.id, this.form).subscribe({
      next: updated => {
        this.isSaving = false;
        this.showEditModal = false;
        this.filteredPatients = this.filteredPatients.map(p => p.id === updated.id ? updated : p);
        this.successMessage = 'Пациент обновлён';
        this.cdr.detectChanges();
        setTimeout(() => { this.successMessage = ''; this.cdr.detectChanges(); }, 3000);
      },
      error: () => { this.isSaving = false; this.cdr.detectChanges(); }
    });
  }

  delete(id: number): void {
    if (!confirm('Удалить пациента?')) return;
    this.filteredPatients = this.filteredPatients.filter(p => p.id !== id);
    this.cdr.detectChanges();
    this.patientsService.delete(id).subscribe({ error: () => this.search() });
  }

  viewCard(p: Patient): void {
    this.router.navigate(['/patients', p.id]);
  }

  bookAppointment(p: Patient): void {
    this.router.navigate(['/appointments'], {
      state: { patientId: p.id, patientName: `${p.lastName} ${p.firstName}` }
    });
  }

  getDoctorName(doctorId: number): string {
    const d = this.doctors.find(d => d.id === doctorId);
    return d ? `${d.lastName} ${d.firstName}` : '';
  }

  getAge(dateOfBirth: string): number {
    if (!dateOfBirth) return 0;
    return Math.floor((Date.now() - new Date(dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
  }

  getInitials(p: Patient): string {
    return `${p.firstName?.[0] || ''}${p.lastName?.[0] || ''}`;
  }
}
