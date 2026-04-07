import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../core/services/api.service';
import { map, forkJoin } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

interface StaffMember {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  phone: string;
  createdAt: string;
  status?: 'busy' | 'available';
}

@Component({
  selector: 'app-staff',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TranslateModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">{{ 'STAFF.TITLE' | translate }}</h1>
          <p class="page-sub">{{ staff.length }} {{ 'STAFF.EMPLOYEES_COUNT' | translate }}</p>
        </div>
        <button class="btn-primary" (click)="showForm = !showForm">
          <span class="material-icons">person_add</span> {{ 'STAFF.ADD_STAFF' | translate }}
        </button>
      </div>

      <div class="success-msg" *ngIf="successMsg">
        <span class="material-icons">check_circle</span> {{ successMsg }}
      </div>

      <div class="form-card" *ngIf="showForm">
        <h3>{{ 'STAFF.NEW_EMPLOYEE' | translate }}</h3>
        <div class="form-row">
          <div class="form-field">
            <label>{{ 'STAFF.FIRST_NAME' | translate }}</label>
            <input [(ngModel)]="form.firstName" placeholder="Ivan" (ngModelChange)="updateEmail()">
          </div>
          <div class="form-field">
            <label>{{ 'STAFF.LAST_NAME' | translate }}</label>
            <input [(ngModel)]="form.lastName" placeholder="Ivanov" (ngModelChange)="updateEmail()">
          </div>
        </div>
        <div class="form-row">
          <div class="form-field">
            <label>{{ 'STAFF.EMAIL_AUTO' | translate }}</label>
            <div class="email-preview">{{ generatedEmail || '—' }}</div>
          </div>
          <div class="form-field">
            <label>{{ 'STAFF.ROLE_LABEL' | translate }}</label>
            <select [(ngModel)]="form.role">
              <option value="doctor">{{ 'STAFF.ROLE_DOCTOR' | translate }}</option>
              <option value="receptionist">{{ 'STAFF.ROLE_RECEPTIONIST' | translate }}</option>
              <option value="admin">{{ 'STAFF.ROLE_ADMIN' | translate }}</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-field">
            <label>{{ 'STAFF.PASSWORD_LABEL' | translate }}</label>
            <input type="password" [(ngModel)]="form.password" [placeholder]="'STAFF.MIN_PASSWORD' | translate">
          </div>
          <div class="form-field">
            <label>{{ 'STAFF.PHONE_LABEL' | translate }}</label>
            <input [(ngModel)]="form.phone" placeholder="+373 69 000 000">
          </div>
        </div>
        <div class="error-msg" *ngIf="errorMsg">{{ errorMsg }}</div>
        <div class="form-actions">
          <button class="btn-primary" (click)="save()"
            [disabled]="isSaving || !form.firstName || !form.lastName || !form.password">
            {{ isSaving ? ('COMMON.SAVING' | translate) : ('STAFF.ADD_STAFF_FULL' | translate) }}
          </button>
          <button class="btn-secondary" (click)="showForm = false">{{ 'COMMON.CANCEL' | translate }}</button>
        </div>
      </div>

      <div class="filters">
        <button class="filter-btn" [class.active]="filter === 'all'" (click)="filter = 'all'">{{ 'STAFF.ALL' | translate }}</button>
        <button class="filter-btn" [class.active]="filter === 'doctor'" (click)="filter = 'doctor'">{{ 'STAFF.DOCTORS' | translate }}</button>
        <button class="filter-btn" [class.active]="filter === 'receptionist'" (click)="filter = 'receptionist'">{{ 'STAFF.RECEPTIONISTS' | translate }}</button>
        <button class="filter-btn" [class.active]="filter === 'admin'" (click)="filter = 'admin'">{{ 'STAFF.ADMINS' | translate }}</button>
      </div>

      <div class="loading" *ngIf="isLoading">
        <span class="material-icons spin">autorenew</span> {{ 'COMMON.LOADING' | translate }}
      </div>

      <div class="empty-state" *ngIf="!isLoading && filteredStaff.length === 0">
        <span class="material-icons">badge</span>
        <p>{{ 'STAFF.NO_STAFF' | translate }}</p>
      </div>

      <div class="staff-list" *ngIf="!isLoading && filteredStaff.length > 0">
        <div class="staff-card" *ngFor="let s of filteredStaff">
          <div class="staff-avatar-wrap">
            <div class="staff-avatar" [class]="s.role">{{ getInitials(s) }}</div>
            <div class="status-dot" [class]="s.role === 'doctor' ? (s.status === 'busy' ? 'busy' : 'available') : 'none'"></div>
          </div>
          <div class="staff-info">
            <div class="staff-name">{{ s.lastName }} {{ s.firstName }}</div>
            <div class="staff-email">{{ s.email }}</div>
            <div class="staff-phone" *ngIf="s.phone">{{ s.phone }}</div>
          </div>
          <div class="staff-right">
            <span class="role-badge" [class]="s.role">{{ getRoleLabel(s.role) }}</span>
            <span class="status-badge" *ngIf="s.role === 'doctor'" [class]="s.status">
              <span class="status-dot-inline" [class]="s.status"></span>
              {{ s.status === 'busy' ? ('STAFF.STATUS_BUSY' | translate) : ('STAFF.STATUS_AVAILABLE' | translate) }}
            </span>
          </div>
          <button class="btn-danger" (click)="delete(s.id)" [title]="'COMMON.DELETE' | translate">
            <span class="material-icons">delete</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 900px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .page-title { font-size: 26px; font-weight: 700; color: #0f2d52; }
    .page-sub { font-size: 14px; color: #718096; margin-top: 4px; }
    .btn-primary { display: flex; align-items: center; gap: 8px; background: #1a73e8; color: white; border: none; border-radius: 10px; padding: 10px 18px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit; }
    .btn-primary:hover { background: #1557b0; }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-secondary { background: #f4f6f9; color: #2d3748; border: none; border-radius: 10px; padding: 10px 18px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit; }
    .btn-danger { background: none; border: none; cursor: pointer; color: #ea4335; padding: 8px; border-radius: 8px; display: flex; align-items: center; }
    .btn-danger:hover { background: #fce8e6; }
    .success-msg { display: flex; align-items: center; gap: 8px; background: #e6f4ea; color: #34a853; padding: 12px 16px; border-radius: 10px; margin-bottom: 20px; font-size: 14px; font-weight: 600; }
    .form-card { background: white; border-radius: 14px; padding: 24px; border: 1px solid #e2e8f0; margin-bottom: 24px; }
    .form-card h3 { margin: 0 0 20px; color: #0f2d52; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
    .form-field { display: flex; flex-direction: column; gap: 6px; }
    .form-field label { font-size: 13px; font-weight: 600; color: #4a5568; }
    .form-field input, .form-field select { padding: 10px 14px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; font-family: inherit; outline: none; background: white; }
    .form-field input:focus, .form-field select:focus { border-color: #1a73e8; }
    .email-preview { padding: 10px 14px; background: #f4f6f9; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; color: #1a73e8; font-weight: 600; }
    .error-msg { color: #ea4335; font-size: 13px; margin-bottom: 12px; }
    .form-actions { display: flex; gap: 12px; }
    .filters { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
    .filter-btn { padding: 8px 16px; border-radius: 20px; border: 1px solid #e2e8f0; background: white; color: #718096; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.2s; }
    .filter-btn.active { background: #1a73e8; color: white; border-color: #1a73e8; }
    .loading { display: flex; align-items: center; gap: 8px; color: #718096; padding: 40px; justify-content: center; }
    .loading .material-icons { animation: spin 1s linear infinite; }
    @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
    .empty-state { text-align: center; padding: 60px; color: #a0aec0; }
    .empty-state .material-icons { font-size: 48px; display: block; margin-bottom: 12px; }
    .staff-list { display: flex; flex-direction: column; gap: 10px; }
    .staff-card { display: flex; align-items: center; gap: 16px; padding: 16px 20px; background: white; border-radius: 12px; border: 1px solid #e2e8f0; transition: border-color 0.2s; }
    .staff-card:hover { border-color: #1a73e8; }
    .staff-avatar-wrap { position: relative; flex-shrink: 0; }
    .staff-avatar { width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; }
    .staff-avatar.doctor { background: #e8f0fe; color: #1a73e8; }
    .staff-avatar.receptionist { background: #e6f4ea; color: #34a853; }
    .staff-avatar.admin { background: #f3e8fd; color: #9334e6; }
    .status-dot { position: absolute; bottom: 1px; right: 1px; width: 11px; height: 11px; border-radius: 50%; border: 2px solid white; }
    .status-dot.available { background: #34a853; }
    .status-dot.busy { background: #f9ab00; }
    .status-dot.none { display: none; }
    .staff-info { flex: 1; }
    .staff-name { font-size: 14px; font-weight: 600; color: #0f2d52; }
    .staff-email { font-size: 13px; color: #718096; margin-top: 2px; }
    .staff-phone { font-size: 12px; color: #a0aec0; margin-top: 2px; }
    .staff-right { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
    .role-badge { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .role-badge.doctor { background: #e8f0fe; color: #1a73e8; }
    .role-badge.receptionist { background: #e6f4ea; color: #34a853; }
    .role-badge.admin { background: #f3e8fd; color: #9334e6; }
    .status-badge { display: flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 20px; }
    .status-badge.available { background: #e6f4ea; color: #34a853; }
    .status-badge.busy { background: #fef7e0; color: #f9ab00; }
    .status-dot-inline { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
    .status-dot-inline.available { background: #34a853; }
    .status-dot-inline.busy { background: #f9ab00; }
  `]
})
export class StaffComponent implements OnInit {
  staff: StaffMember[] = [];
  isLoading = true;
  showForm = false;
  isSaving = false;
  errorMsg = '';
  successMsg = '';
  filter = 'all';

  form = { firstName: '', lastName: '', password: '', role: 'doctor', phone: '' };

  constructor(private api: ApiService, private cdr: ChangeDetectorRef, private translate: TranslateService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    forkJoin({
      users: this.api.get<any>('/users').pipe(map(r => r.data)),
      appointments: this.api.get<any>('/appointments').pipe(map(r => r.data))
    }).subscribe({
      next: ({ users, appointments }) => {
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        this.staff = users.map((u: StaffMember) => {
          if (u.role !== 'doctor') return { ...u, status: undefined };

          const isBusy = appointments.some((a: any) => {
            if (a.doctorId !== u.id) return false;
            if (a.date !== todayStr) return false;
            if (a.status !== 'scheduled' && a.status !== 'completed') return false;
            const [h, m] = a.time.split(':').map(Number);
            const aptMinutes = h * 60 + m;
            return currentMinutes >= aptMinutes && currentMinutes <= aptMinutes + 30;
          });

          return { ...u, status: isBusy ? 'busy' : 'available' };
        });

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.isLoading = false; this.cdr.detectChanges(); }
    });
  }

  get generatedEmail(): string {
    if (!this.form.firstName || !this.form.lastName) return '';
    const first = this.transliterate(this.form.firstName.toLowerCase().trim());
    const last = this.transliterate(this.form.lastName.toLowerCase().trim());
    return `${first}.${last}@med.com`;
  }

  updateEmail(): void { this.cdr.detectChanges(); }

  transliterate(text: string): string {
    const map: Record<string, string> = {
      'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'zh',
      'з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o',
      'п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'kh','ц':'ts',
      'ч':'ch','ш':'sh','щ':'sch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya'
    };
    return text.split('').map(c => map[c] || c).join('');
  }

  get filteredStaff(): StaffMember[] {
    if (this.filter === 'all') return this.staff;
    return this.staff.filter(s => s.role === this.filter);
  }

  save(): void {
    if (!this.form.firstName || !this.form.lastName || !this.form.password || this.isSaving) return;
    if (this.form.password.length < 6) { this.errorMsg = 'Пароль должен быть минимум 6 символов'; return; }
    this.isSaving = true;
    this.errorMsg = '';
    this.api.post<any>('/auth/register', {
      firstName: this.form.firstName, lastName: this.form.lastName,
      email: this.generatedEmail, password: this.form.password,
      role: this.form.role, phone: this.form.phone
    }).subscribe({
      next: () => {
        this.isSaving = false; this.showForm = false;
        this.form = { firstName: '', lastName: '', password: '', role: 'doctor', phone: '' };
        this.successMsg = 'Сотрудник успешно добавлен!';
        setTimeout(() => { this.successMsg = ''; this.cdr.detectChanges(); }, 4000);
        this.load(); this.cdr.detectChanges();
      },
      error: err => { this.isSaving = false; this.errorMsg = err?.error?.error?.message || 'Ошибка при добавлении'; this.cdr.detectChanges(); }
    });
  }

  delete(id: number): void {
    if (!confirm('Удалить сотрудника?')) return;
    this.staff = this.staff.filter(s => s.id !== id);
    this.cdr.detectChanges();
    this.api.delete<any>(`/users/${id}`).subscribe({ error: () => this.load() });
  }

  getInitials(s: StaffMember): string { return `${s.firstName?.[0] || ''}${s.lastName?.[0] || ''}`; }

  getRoleLabel(role: string): string {
    const keys: Record<string, string> = {
      doctor: 'STAFF.ROLE_DOCTOR', receptionist: 'STAFF.ROLE_RECEPTIONIST', admin: 'STAFF.ROLE_ADMIN'
    };
    const key = keys[role];
    return key ? this.translate.instant(key) : role;
  }
}
