import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { map } from 'rxjs';

interface Patient { id: number; firstName: string; lastName: string; phone?: string; dateOfBirth?: string; doctorId?: number; }
interface Room { id: number; name: string; number: string; }

@Component({
  selector: 'app-my-cabinet',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './my-cabinet.component.html',
  styleUrls: ['./my-cabinet.component.scss']
})
export class MyCabinetComponent implements OnInit {
  profile: any = null;
  appointments: any[] = [];
  allPatients: any[] = [];
  results: any[] = [];
  schedules: any[] = [];
  rooms: Room[] = [];
  patientSearch = '';

  isLoadingProfile = true;
  isLoadingApts = true;
  isLoadingPatients = true;
  isLoadingResults = true;
  isLoadingSchedules = true;

  // Edit profile modal
  showEditModal = false;
  editForm = { firstName: '', lastName: '', phone: '' };
  isSavingProfile = false;
  profileSaved = false;

  // Add result modal
  showResultModal = false;
  resultForm = { title: '', description: '' };
  resultFile: File | null = null;
  isSavingResult = false;
  resultSuccess = false;

  readonly DAY_LABELS: Record<number, string> = {
    1: 'Понедельник', 2: 'Вторник', 3: 'Среда',
    4: 'Четверг', 5: 'Пятница', 6: 'Суббота', 7: 'Воскресенье'
  };

  constructor(
    public authService: AuthService,
    private api: ApiService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadProfile();
    this.loadAppointments();
    this.loadPatients();
    this.loadResults();
    this.loadSchedules();
    this.loadRooms();
  }

  loadProfile(): void {
    this.api.get<any>('/users/me').subscribe({
      next: res => {
        this.profile = res.data;
        this.editForm = { firstName: res.data.firstName, lastName: res.data.lastName, phone: res.data.phone || '' };
        this.isLoadingProfile = false;
        this.cdr.detectChanges();
      },
      error: () => { this.isLoadingProfile = false; this.cdr.detectChanges(); }
    });
  }

  loadAppointments(): void {
    this.api.get<any>('/appointments').pipe(map(r => r.data || r)).subscribe({
      next: data => {
        this.appointments = Array.isArray(data) ? data : [];
        this.isLoadingApts = false;
        this.cdr.detectChanges();
      },
      error: () => { this.isLoadingApts = false; this.cdr.detectChanges(); }
    });
  }

  loadPatients(): void {
    this.api.get<any>('/patients').pipe(map(r => r.data || r)).subscribe({
      next: data => {
        this.allPatients = Array.isArray(data) ? data : [];
        this.isLoadingPatients = false;
        this.cdr.detectChanges();
      },
      error: () => { this.isLoadingPatients = false; this.cdr.detectChanges(); }
    });
  }

  loadResults(): void {
    this.api.get<any>('/results').pipe(map(r => r.data || r)).subscribe({
      next: data => {
        const arr = Array.isArray(data) ? data : [];
        this.results = arr.slice(0, 5);
        this.isLoadingResults = false;
        this.cdr.detectChanges();
      },
      error: () => { this.isLoadingResults = false; this.cdr.detectChanges(); }
    });
  }

  loadSchedules(): void {
    this.api.get<any>('/schedules/my').pipe(map(r => r.data || r)).subscribe({
      next: data => {
        this.schedules = Array.isArray(data) ? data.sort((a: any, b: any) => a.dayOfWeek - b.dayOfWeek) : [];
        this.isLoadingSchedules = false;
        this.cdr.detectChanges();
      },
      error: () => { this.isLoadingSchedules = false; this.cdr.detectChanges(); }
    });
  }

  loadRooms(): void {
    this.api.get<any>('/rooms').pipe(map(r => r.data || r)).subscribe({
      next: data => { this.rooms = Array.isArray(data) ? data : []; this.cdr.detectChanges(); },
      error: () => {}
    });
  }

  get todayAppointments(): any[] {
    const today = new Date().toISOString().slice(0, 10);
    const uid = this.authService.currentUser?.id;
    return this.appointments.filter(a => a.doctorId === uid && a.date === today);
  }

  get myPatients(): any[] {
    const uid = this.authService.currentUser?.id;
    const q = this.patientSearch.toLowerCase().trim();
    return this.allPatients
      .filter(p => p.doctorId === uid)
      .filter(p => !q ||
        p.firstName?.toLowerCase().includes(q) ||
        p.lastName?.toLowerCase().includes(q)
      );
  }

  get stats() {
    const uid = this.authService.currentUser?.id;
    const mine = this.appointments.filter(a => a.doctorId === uid);
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    return {
      total: mine.length,
      thisMonth: mine.filter(a => { const d = new Date(a.date); return d.getMonth() === month && d.getFullYear() === year; }).length,
      completed: mine.filter(a => a.status === 'completed').length,
      cancelled: mine.filter(a => a.status === 'cancelled').length
    };
  }

  getInitials(): string {
    if (!this.profile) return '?';
    return `${this.profile.firstName?.[0] || ''}${this.profile.lastName?.[0] || ''}`;
  }

  getPatientName(id: number): string {
    const p = this.allPatients.find(p => p.id === id);
    return p ? `${p.lastName} ${p.firstName}` : `Пациент #${id}`;
  }

  getRoomName(id: number): string {
    const r = this.rooms.find(r => r.id === id);
    return r ? `${r.name} (№${r.number})` : `Кабинет #${id}`;
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = { scheduled: 'Запланирован', completed: 'Завершён', cancelled: 'Отменён' };
    return map[status] || status;
  }

  completeAppointment(id: number): void {
    this.api.patch<any>(`/appointments/${id}/status`, { status: 'completed' }).subscribe({
      next: () => { this.loadAppointments(); }
    });
  }

  openEditModal(): void {
    this.showEditModal = true;
    this.profileSaved = false;
    this.cdr.detectChanges();
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.cdr.detectChanges();
  }

  saveProfile(): void {
    if (this.isSavingProfile) return;
    this.isSavingProfile = true;
    this.api.put<any>('/users/me', this.editForm).subscribe({
      next: res => {
        this.profile = res.data;
        this.isSavingProfile = false;
        this.profileSaved = true;
        localStorage.setItem('currentUser', JSON.stringify(res.data));
        this.cdr.detectChanges();
        setTimeout(() => { this.showEditModal = false; this.profileSaved = false; this.cdr.detectChanges(); }, 1200);
      },
      error: () => { this.isSavingProfile = false; this.cdr.detectChanges(); }
    });
  }

  openResultModal(): void {
    this.resultForm = { title: '', description: '' };
    this.resultFile = null;
    this.resultSuccess = false;
    this.showResultModal = true;
    this.cdr.detectChanges();
  }

  closeResultModal(): void {
    this.showResultModal = false;
    this.cdr.detectChanges();
  }

  onResultFileChange(event: any): void {
    this.resultFile = event.target.files[0] || null;
  }

  saveResult(): void {
    if (!this.resultForm.title || this.isSavingResult) return;
    this.isSavingResult = true;
    const uid = this.authService.currentUser?.id;
    const token = localStorage.getItem('token') || '';

    if (this.resultFile) {
      const fd = new FormData();
      fd.append('file', this.resultFile);
      fd.append('title', this.resultForm.title);
      fd.append('description', this.resultForm.description);
      if (uid) fd.append('doctorId', String(uid));
      fetch('http://localhost:3000/api/results', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd
      }).then(() => { this.onResultSaved(); }).catch(() => { this.isSavingResult = false; this.cdr.detectChanges(); });
    } else {
      this.api.post<any>('/results', { title: this.resultForm.title, description: this.resultForm.description, doctorId: uid }).subscribe({
        next: () => { this.onResultSaved(); },
        error: () => { this.isSavingResult = false; this.cdr.detectChanges(); }
      });
    }
  }

  private onResultSaved(): void {
    this.isSavingResult = false;
    this.resultSuccess = true;
    this.cdr.detectChanges();
    setTimeout(() => { this.showResultModal = false; this.resultSuccess = false; this.loadResults(); this.cdr.detectChanges(); }, 1000);
  }

  goToPatient(id: number): void {
    this.router.navigate(['/patients', id]);
  }
}
