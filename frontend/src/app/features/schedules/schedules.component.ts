import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { map, forkJoin } from 'rxjs';

interface Schedule { id: number; doctorId: number; roomId: number; dayOfWeek: number; startTime: string; endTime: string; isActive: boolean; }
interface Doctor { id: number; firstName: string; lastName: string; role: string; }
interface Room { id: number; name: string; number: string; }

@Component({
  selector: 'app-schedules',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TranslateModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">{{ 'SCHEDULES.TITLE' | translate }}</h1>
          <p class="page-sub">{{ schedules.length }} записей</p>
        </div>
        <button class="btn-primary" (click)="showForm = !showForm">
          <span class="material-icons">add</span> {{ 'COMMON.ADD' | translate }}
        </button>
      </div>

      <div class="form-card" *ngIf="showForm">
        <h3>{{ 'SCHEDULES.ADD_SCHEDULE' | translate }}</h3>
        <div class="form-row">
          <div class="form-field">
            <label>{{ 'STAFF.ROLE_DOCTOR' | translate }} *</label>
            <select [(ngModel)]="form.doctorId">
              <option [value]="0" disabled>{{ 'APPOINTMENTS.SELECT_DOCTOR' | translate }}</option>
              <option *ngFor="let d of doctors" [value]="d.id">{{ d.lastName }} {{ d.firstName }}</option>
            </select>
          </div>
          <div class="form-field">
            <label>{{ 'NAV.ROOMS' | translate }} *</label>
            <select [(ngModel)]="form.roomId">
              <option [value]="0" disabled>{{ 'APPOINTMENTS.SELECT_DOCTOR' | translate }}</option>
              <option *ngFor="let r of rooms" [value]="r.id">{{ r.name }} (№{{ r.number }})</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-field">
            <label>{{ 'SCHEDULES.DAY_OF_WEEK' | translate }} *</label>
            <select [(ngModel)]="form.dayOfWeek">
              <option [value]="1">{{ 'SCHEDULES.MONDAY' | translate }}</option>
              <option [value]="2">{{ 'SCHEDULES.TUESDAY' | translate }}</option>
              <option [value]="3">{{ 'SCHEDULES.WEDNESDAY' | translate }}</option>
              <option [value]="4">{{ 'SCHEDULES.THURSDAY' | translate }}</option>
              <option [value]="5">{{ 'SCHEDULES.FRIDAY' | translate }}</option>
              <option [value]="6">{{ 'SCHEDULES.SATURDAY' | translate }}</option>
              <option [value]="7">{{ 'SCHEDULES.SUNDAY' | translate }}</option>
            </select>
          </div>
          <div class="form-field">
            <label>{{ 'SCHEDULES.START_TIME' | translate }}</label>
            <input type="time" [(ngModel)]="form.startTime">
          </div>
        </div>
        <div class="form-row">
          <div class="form-field">
            <label>{{ 'SCHEDULES.END_TIME' | translate }}</label>
            <input type="time" [(ngModel)]="form.endTime">
          </div>
        </div>
        <div class="form-actions">
          <button class="btn-primary" (click)="save()" [disabled]="isSaving">{{ isSaving ? ('COMMON.SAVING' | translate) : ('COMMON.SAVE' | translate) }}</button>
          <button class="btn-secondary" (click)="showForm = false">{{ 'COMMON.CANCEL' | translate }}</button>
        </div>
      </div>

      <div class="loading" *ngIf="isLoading">
        <span class="material-icons spin">autorenew</span> {{ 'COMMON.LOADING' | translate }}
      </div>

      <div class="empty-state" *ngIf="!isLoading && schedules.length === 0">
        <span class="material-icons">calendar_month</span>
        <p>{{ 'SCHEDULES.NO_SCHEDULES' | translate }}</p>
      </div>

      <div class="schedule-list" *ngIf="!isLoading && schedules.length > 0">
        <div class="schedule-card" *ngFor="let s of schedules">
          <div class="day-badge">{{ getDayName(s.dayOfWeek) }}</div>
          <div class="schedule-info">
            <div class="schedule-doctor">{{ getDoctorName(s.doctorId) }}</div>
            <div class="schedule-room">{{ getRoomName(s.roomId) }}</div>
          </div>
          <div class="schedule-time">
            <span class="material-icons">schedule</span>
            {{ s.startTime }} — {{ s.endTime }}
          </div>
          <button class="btn-danger" (click)="delete(s.id)">
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
    .btn-secondary { background: #f4f6f9; color: #2d3748; border: none; border-radius: 10px; padding: 10px 18px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit; }
    .btn-danger { background: none; border: none; cursor: pointer; color: #ea4335; padding: 8px; border-radius: 8px; display: flex; align-items: center; }
    .btn-danger:hover { background: #fce8e6; }
    .form-card { background: white; border-radius: 14px; padding: 24px; border: 1px solid #e2e8f0; margin-bottom: 24px; }
    .form-card h3 { margin: 0 0 20px; color: #0f2d52; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
    .form-field { display: flex; flex-direction: column; gap: 6px; }
    .form-field label { font-size: 13px; font-weight: 600; color: #4a5568; }
    .form-field input, .form-field select { padding: 10px 14px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; font-family: inherit; outline: none; background: white; }
    .form-field input:focus, .form-field select:focus { border-color: #1a73e8; }
    .form-actions { display: flex; gap: 12px; }
    .loading { display: flex; align-items: center; gap: 8px; color: #718096; padding: 40px; justify-content: center; }
    .loading .material-icons { animation: spin 1s linear infinite; }
    @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
    .empty-state { text-align: center; padding: 60px; color: #a0aec0; }
    .empty-state .material-icons { font-size: 48px; display: block; margin-bottom: 12px; }
    .schedule-list { display: flex; flex-direction: column; gap: 10px; }
    .schedule-card { display: flex; align-items: center; gap: 16px; padding: 16px 20px; background: white; border-radius: 12px; border: 1px solid #e2e8f0; }
    .day-badge { background: #e8f0fe; color: #1a73e8; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; white-space: nowrap; }
    .schedule-info { flex: 1; }
    .schedule-doctor { font-size: 14px; font-weight: 600; color: #0f2d52; }
    .schedule-room { font-size: 13px; color: #718096; margin-top: 2px; }
    .schedule-time { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #718096; white-space: nowrap; }
    .schedule-time .material-icons { font-size: 16px; }
  `]
})
export class SchedulesComponent implements OnInit {
  schedules: Schedule[] = [];
  doctors: Doctor[] = [];
  rooms: Room[] = [];
  isLoading = true;
  showForm = false;
  isSaving = false;
  form = { doctorId: 0, roomId: 0, dayOfWeek: 1, startTime: '09:00', endTime: '18:00' };

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    forkJoin({
      schedules: this.api.get<any>('/schedules').pipe(map(r => r.data)),
      users: this.api.get<any>('/users').pipe(map(r => r.data)),
      rooms: this.api.get<any>('/rooms').pipe(map(r => r.data)),
    }).subscribe({
      next: ({ schedules, users, rooms }) => {
        this.schedules = schedules;
        this.doctors = users.filter((u: Doctor) => u.role === 'doctor');
        this.rooms = rooms;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.isLoading = false; this.cdr.detectChanges(); }
    });
  }

  save(): void {
    if (!this.form.doctorId || !this.form.roomId || this.isSaving) return;
    this.isSaving = true;
    this.api.post<any>('/schedules', this.form).subscribe({
      next: data => {
        this.schedules = [...this.schedules, data.data];
        this.isSaving = false;
        this.showForm = false;
        this.form = { doctorId: 0, roomId: 0, dayOfWeek: 1, startTime: '09:00', endTime: '18:00' };
        this.cdr.detectChanges();
      },
      error: () => { this.isSaving = false; this.cdr.detectChanges(); }
    });
  }

  delete(id: number): void {
    if (!confirm('Удалить график?')) return;
    this.schedules = this.schedules.filter(s => s.id !== id);
    this.cdr.detectChanges();
    this.api.delete<any>(`/schedules/${id}`).subscribe({ error: () => this.ngOnInit() });
  }

  getDayName(day: number): string {
    const days = ['', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    return days[day] || '';
  }

  getDoctorName(id: number): string {
    const d = this.doctors.find(d => d.id === id);
    return d ? `${d.lastName} ${d.firstName}` : `Врач #${id}`;
  }

  getRoomName(id: number): string {
    const r = this.rooms.find(r => r.id === id);
    return r ? `${r.name} (№${r.number})` : `Кабинет #${id}`;
  }
}
