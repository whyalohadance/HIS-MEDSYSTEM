import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DatePickerComponent } from '../../shared/components/date-picker/date-picker.component';
import { Router } from '@angular/router';
import { Appointment, AppointmentStatus } from '../../core/models/appointment.model';
import { AppointmentsService } from '../../core/services/appointments.service';
import { PatientsService } from '../../core/services/patients.service';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { map } from 'rxjs';

interface Doctor { id: number; firstName: string; lastName: string; }
interface Patient { id: number; firstName: string; lastName: string; phone?: string; dateOfBirth?: string; }
interface RoomService { name: string; price: number; duration: number; }
interface Room { id: number; name: string; number: string; type?: string; assignedUserId?: number; services?: RoomService[]; isActive?: boolean; }

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TranslateModule, DatePickerComponent],
  templateUrl: './appointments.component.html',
  styleUrls: ['./appointments.component.scss']
})
export class AppointmentsComponent implements OnInit {
  filterStatus = 'all';
  filterDate = '';
  filterDoctor = 0;
  searchQuery = '';
  showForm = false;
  appointments: Appointment[] = [];
  doctors: Doctor[] = [];
  rooms: Room[] = [];
  allRooms: Room[] = [];
  patients: Patient[] = [];
  isLoading = true;
  isSaving = false;
  successMsg = '';

  selectedRoom: Room | null = null;
  availableServices: RoomService[] = [];
  selectedService: RoomService | null = null;
  availableDoctors: any[] = [];
  isLoadingDoctors = false;

  showResultModal = false;
  selectedAptForResult: any = null;
  resultForm = { title: '', description: '' };
  resultFile: File | null = null;
  isSavingResult = false;

  currentPage = 1;
  readonly pageSize = 10;

  get totalPages(): number {
    return Math.ceil(this.filtered.length / this.pageSize) || 1;
  }

  get pagedFiltered(): Appointment[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filtered.slice(start, start + this.pageSize);
  }

  prevPage(): void { if (this.currentPage > 1) this.currentPage--; }
  nextPage(): void { if (this.currentPage < this.totalPages) this.currentPage++; }

  // Autocomplete
  patientSearch = '';
  patientSuggestions: Patient[] = [];
  selectedPatient: Patient | null = null;
  showSuggestions = false;

  form: {
    patientId: number;
    doctorId: number;
    roomId: number;
    date: string;
    time: string;
    notes: string;
    price: number;
    examination: string;
  } = { patientId: 0, doctorId: 0, roomId: 0, date: '', time: '', notes: '', price: 0, examination: '' };

  constructor(
    private service: AppointmentsService,
    private patientsService: PatientsService,
    private api: ApiService,
    public authService: AuthService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.loadAppointments();
    this.loadDoctors();
    this.loadPatients();
    this.loadAllRooms();

    const state = window.history.state;
    if (state?.patientId) {
      setTimeout(() => this.openFormWithPatient(state.patientId, state.patientName), 500);
    }
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

  loadAllRooms(): void {
    this.api.get<any>('/rooms/active').subscribe({
      next: (res) => {
        this.allRooms = (res.data || []).filter((r: Room) => r.isActive !== false);
        this.rooms = this.allRooms;
        this.cdr.detectChanges();
      },
      error: () => {
        // fallback to /rooms
        this.api.get<any>('/rooms').subscribe({
          next: (res) => {
            const data = res.data || res;
            this.allRooms = Array.isArray(data) ? data : [];
            this.rooms = this.allRooms;
            this.cdr.detectChanges();
          }
        });
      }
    });
  }

  loadRooms(): void {
    if (this.form.date && this.form.time) {
      this.api.get<any>(`/rooms/available?date=${this.form.date}&time=${this.form.time}`)
        .pipe(map(r => r.data || r)).subscribe({
          next: data => { this.cdr.detectChanges(); }
        });
    }
  }

  onRoomChange(): void {
    this.selectedRoom = this.allRooms.find(r => r.id === +this.form.roomId) || null;
    this.availableServices = this.selectedRoom?.services || [];
    this.selectedService = null;
    this.form.examination = '';
    this.form.price = 0;
    this.form.doctorId = 0;
    this.availableDoctors = [];

    if (this.selectedRoom && this.form.date) {
      this.loadAvailableDoctors();
    }
    this.cdr.detectChanges();
  }

  onServiceChange(): void {
    this.selectedService = this.availableServices.find(s => s.name === this.form.examination) || null;
    if (this.selectedService) {
      this.form.price = this.selectedService.price;
    }
    this.cdr.detectChanges();
  }

  onDateChange(): void {
    this.form.doctorId = 0;
    if (this.selectedRoom && this.form.date) {
      this.loadAvailableDoctors();
    }
  }

  onTimeChange(): void {
    if (this.selectedRoom && this.form.date) {
      this.loadAvailableDoctors();
    }
  }

  loadAvailableDoctors(): void {
    if (!this.selectedRoom || !this.form.date) return;

    if (this.selectedRoom.type === 'laboratory') {
      this.availableDoctors = [];
      return;
    }

    this.isLoadingDoctors = true;
    this.cdr.detectChanges();

    let url = `/rooms/${this.selectedRoom.id}/available-doctors?date=${this.form.date}`;
    if (this.form.time) url += `&time=${this.form.time}`;

    this.api.get<any>(url).subscribe({
      next: (res) => {
        this.availableDoctors = res.data || [];
        if (this.selectedRoom?.type === 'radiology' && this.availableDoctors.length > 0) {
          const first = this.availableDoctors.find(d => d.isAvailable);
          if (first) this.form.doctorId = first.id;
        }
        this.isLoadingDoctors = false;
        this.cdr.detectChanges();
      },
      error: () => { this.isLoadingDoctors = false; this.cdr.detectChanges(); }
    });
  }

  selectDoctor(doctorId: number): void {
    this.form.doctorId = doctorId;
    this.cdr.detectChanges();
  }

  getSelectedDoctorName(): string {
    const doc = this.availableDoctors.find(d => d.id === this.form.doctorId);
    return doc ? `${doc.firstName} ${doc.lastName}` : '';
  }

  getRoomTypeLabel(type: string): string {
    const map: Record<string, string> = {
      consultation: 'Консультация', radiology: 'Радиология',
      laboratory: 'Лаборатория', procedure: 'Процедуры', surgery: 'Операция'
    };
    return map[type] || type;
  }

  getRoomTypeIcon(type: string): string {
    const map: Record<string, string> = {
      consultation: 'medical_services', radiology: 'blur_on',
      laboratory: 'biotech', procedure: 'healing', surgery: 'local_hospital'
    };
    return map[type] || 'meeting_room';
  }

  getRoomsByType(type: string): Room[] {
    return this.allRooms.filter(r => r.type === type);
  }

  // Фильтрация
  get filtered(): Appointment[] {
    let result = this.appointments;

    if (this.filterStatus !== 'all')
      result = result.filter(a => a.status === this.filterStatus);

    if (this.filterDate)
      result = result.filter(a => a.date === this.filterDate);

    if (this.filterDoctor)
      result = result.filter(a => a.doctorId === Number(this.filterDoctor));

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      result = result.filter(a => {
        const patientName = this.getPatientName(a.patientId).toLowerCase();
        const doctorName = this.getDoctorName(a.doctorId).toLowerCase();
        return patientName.includes(q) || doctorName.includes(q) || a.date.includes(q);
      });
    }

    return result;
  }

  clearFilters(): void {
    this.filterStatus = 'all';
    this.filterDate = '';
    this.filterDoctor = 0;
    this.searchQuery = '';
    this.currentPage = 1;
    this.cdr.detectChanges();
  }

  get hasActiveFilters(): boolean {
    return this.filterStatus !== 'all' || !!this.filterDate || !!this.filterDoctor || !!this.searchQuery;
  }

  // Autocomplete
  onPatientSearch(): void {
    const q = this.patientSearch.toLowerCase().trim();
    if (q.length < 1) {
      this.patientSuggestions = [];
      this.showSuggestions = false;
      this.form.patientId = 0;
      this.selectedPatient = null;
      return;
    }
    this.patientSuggestions = this.patients.filter(p =>
      p.firstName?.toLowerCase().includes(q) ||
      p.lastName?.toLowerCase().includes(q) ||
      p.phone?.includes(q) ||
      p.dateOfBirth?.includes(q)
    ).slice(0, 6);
    this.showSuggestions = this.patientSuggestions.length > 0;
    this.cdr.detectChanges();
  }

  selectPatient(p: Patient): void {
    this.selectedPatient = p;
    this.form.patientId = p.id;
    this.patientSearch = `${p.lastName} ${p.firstName}`;
    this.showSuggestions = false;
    this.cdr.detectChanges();
  }

  clearPatient(): void {
    this.selectedPatient = null;
    this.form.patientId = 0;
    this.patientSearch = '';
    this.patientSuggestions = [];
    this.showSuggestions = false;
    this.cdr.detectChanges();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(e: Event): void {
    const target = e.target as HTMLElement;
    if (!target.closest('.autocomplete-wrapper')) {
      this.showSuggestions = false;
      this.cdr.detectChanges();
    }
  }

  openFormWithPatient(patientId: number, patientName: string): void {
    const p = this.patients.find(p => p.id === patientId);
    if (p) this.selectPatient(p);
    else { this.form.patientId = patientId; this.patientSearch = patientName; }
    if (this.authService.isDoctor) this.form.doctorId = this.authService.currentUser?.id || 0;
    this.showForm = true;
    this.cdr.detectChanges();
  }

  openForm(): void {
    if (this.authService.isDoctor) this.form.doctorId = this.authService.currentUser?.id || 0;
    this.showForm = true;
    this.cdr.detectChanges();
  }

  resetForm(): void {
    this.form = { patientId: 0, doctorId: 0, roomId: 0, date: '', time: '', notes: '', price: 0, examination: '' };
    this.patientSearch = '';
    this.selectedPatient = null;
    this.patientSuggestions = [];
    this.showSuggestions = false;
    this.selectedRoom = null;
    this.availableServices = [];
    this.selectedService = null;
    this.availableDoctors = [];
  }

  isSaveDisabled(): boolean {
    if (!this.form.patientId || !this.form.date || !this.form.time || !this.form.roomId) return true;
    const type = this.selectedRoom?.type;
    if (type === 'consultation' && !this.form.doctorId) return true;
    if (type === 'radiology' && !this.form.doctorId) return true;
    return false;
  }

  save(): void {
    if (this.isSaveDisabled()) return;
    this.isSaving = true;
    this.service.create(this.form).subscribe({
      next: () => {
        this.isSaving = false;
        this.showForm = false;
        this.resetForm();
        this.successMsg = 'Приём записан!';
        setTimeout(() => { this.successMsg = ''; this.cdr.detectChanges(); }, 3000);
        this.loadAppointments();
        this.cdr.detectChanges();
      },
      error: () => { this.isSaving = false; this.cdr.detectChanges(); }
    });
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

  isAdminOrReception(): boolean {
    const role = this.authService.currentUser?.role;
    return role === 'admin' || role === 'receptionist';
  }

  updateStatus(id: number, status: AppointmentStatus): void {
    this.service.updateStatus(id, status).subscribe({
      next: () => this.loadAppointments(),
      error: (err) => {
        alert(err?.error?.error?.message || 'Нет доступа для изменения статуса');
        this.cdr.detectChanges();
      }
    });
  }

  getAppointmentTimeStatus(apt: Appointment): { status: string; label: string; color: string } {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    if (apt.date < today) return { status: 'past',   label: 'Прошёл',          color: '#94a3b8' };
    if (apt.date > today) return { status: 'future', label: `${apt.date}`,     color: '#3b82f6' };
    if (!apt.time)        return { status: 'today',  label: 'Сегодня',         color: '#3b82f6' };

    const start   = this.parseTime(apt.time);
    const end     = start + (apt.duration || 30);
    const current = now.getHours() * 60 + now.getMinutes();

    if (current < start) {
      const diff = start - current;
      if (diff <= 30) return { status: 'soon',     label: `Через ${diff} мин`,           color: '#f59e0b' };
      return            { status: 'today',          label: `Сегодня в ${apt.time}`,        color: '#3b82f6' };
    }
    if (current < end) {
      return { status: 'now',      label: `Идёт · ${end - current} мин`,    color: '#10b981' };
    }
    return   { status: 'finished', label: 'Время закончилось',               color: '#dc2626' };
  }

  private parseTime(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  delete(id: number): void {
    if (!confirm('Удалить приём?')) return;
    this.appointments = this.appointments.filter(a => a.id !== id);
    this.cdr.detectChanges();
    this.service.delete(id).subscribe({ error: () => this.loadAppointments() });
  }

  openResultModal(apt: any): void {
    this.selectedAptForResult = apt;
    this.resultForm = { title: '', description: '' };
    this.resultFile = null;
    this.showResultModal = true;
    this.cdr.detectChanges();
  }

  closeResultModal(): void {
    this.showResultModal = false;
    this.selectedAptForResult = null;
    this.cdr.detectChanges();
  }

  onResultFileChange(event: any): void {
    this.resultFile = event.target.files[0] || null;
  }

  saveResult(): void {
    if (!this.resultForm.title || !this.selectedAptForResult) return;
    this.isSavingResult = true;

    const token = localStorage.getItem('token') || '';

    if (this.resultFile) {
      const formData = new FormData();
      formData.append('file', this.resultFile);
      formData.append('title', this.resultForm.title);
      formData.append('description', this.resultForm.description);
      formData.append('patientId', String(this.selectedAptForResult.patientId));
      formData.append('doctorId', String(this.selectedAptForResult.doctorId));

      fetch('http://localhost:3000/api/results', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      })
      .then(r => r.json())
      .then(() => {
        this.isSavingResult = false;
        this.showResultModal = false;
        this.successMsg = 'Результат добавлен!';
        setTimeout(() => { this.successMsg = ''; this.cdr.detectChanges(); }, 3000);
        this.cdr.detectChanges();
      })
      .catch(() => { this.isSavingResult = false; this.cdr.detectChanges(); });
    } else {
      this.api.post<any>('/results', {
        title: this.resultForm.title,
        description: this.resultForm.description,
        patientId: this.selectedAptForResult.patientId,
        doctorId: this.selectedAptForResult.doctorId
      }).subscribe({
        next: () => {
          this.isSavingResult = false;
          this.showResultModal = false;
          this.successMsg = 'Результат добавлен!';
          setTimeout(() => { this.successMsg = ''; this.cdr.detectChanges(); }, 3000);
          this.cdr.detectChanges();
        },
        error: () => { this.isSavingResult = false; this.cdr.detectChanges(); }
      });
    }
  }

  get currentLang(): string {
    return this.translate.currentLang || localStorage.getItem('language') || 'en';
  }

  getStatusLabel(status: AppointmentStatus): string {
    const map: Record<string, string> = {
      scheduled:   'APPOINTMENTS.STATUS_SCHEDULED',
      in_progress: 'APPOINTMENTS.STATUS_IN_PROGRESS',
      completed:   'APPOINTMENTS.STATUS_COMPLETED',
      cancelled:   'APPOINTMENTS.STATUS_CANCELLED',
    };
    return this.translate.instant(map[status] || status);
  }

  formatDate(date: string): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });
  }
}
