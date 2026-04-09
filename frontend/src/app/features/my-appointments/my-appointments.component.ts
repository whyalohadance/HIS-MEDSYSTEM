import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { AppointmentsService } from '../../core/services/appointments.service';
import { Appointment } from '../../core/models/appointment.model';

@Component({
  selector: 'app-my-appointments',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslateModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Мои приёмы</h1>
          <p class="page-sub">Ваши записи к врачу</p>
        </div>
      </div>
      <div class="loading" *ngIf="isLoading">
        <span class="material-icons spin">autorenew</span> Загрузка...
      </div>
      <div class="empty-state" *ngIf="!isLoading && appointments.length === 0">
        <span class="material-icons">event_busy</span>
        <p>Приёмов пока нет</p>
      </div>
      <div class="list" *ngIf="!isLoading && appointments.length > 0">
        <div class="card-item" *ngFor="let a of appointments">
          <div class="card-icon">
            <span class="material-icons">event</span>
          </div>
          <div class="card-body">
            <div class="card-title">{{ a.date }} в {{ a.time }}</div>
            <div class="card-sub">{{ a.notes || 'Нет заметок' }}</div>
          </div>
          <span class="badge" [class]="a.status">{{ statusLabel(a.status) }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 700px; }
    .page-header { margin-bottom: 28px; }
    .page-title { font-size: 26px; font-weight: 700; color: #0f2d52; }
    .page-sub { font-size: 14px; color: #718096; margin-top: 4px; }
    .loading { display: flex; align-items: center; gap: 8px; color: #718096; padding: 40px; justify-content: center; }
    .loading .material-icons { animation: spin 1s linear infinite; }
    @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
    .empty-state { text-align: center; padding: 60px; color: #a0aec0; }
    .empty-state .material-icons { font-size: 48px; display: block; margin-bottom: 12px; }
    .card-item { display: flex; align-items: center; gap: 16px; padding: 16px 20px; background: white; border-radius: 12px; margin-bottom: 10px; border: 1px solid #e2e8f0; }
    .card-icon { width: 40px; height: 40px; border-radius: 10px; background: #e8f0fe; display: flex; align-items: center; justify-content: center; }
    .card-icon .material-icons { color: #1a73e8; font-size: 20px; }
    .card-body { flex: 1; }
    .card-title { font-size: 14px; font-weight: 600; color: #0f2d52; }
    .card-sub { font-size: 13px; color: #718096; margin-top: 2px; }
    .badge { padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .badge.scheduled { background: #e8f0fe; color: #1a73e8; }
    .badge.completed { background: #e6f4ea; color: #34a853; }
    .badge.cancelled { background: #fce8e6; color: #ea4335; }
  `]
})
export class MyAppointmentsComponent implements OnInit {
  appointments: Appointment[] = [];
  isLoading = true;

  constructor(private service: AppointmentsService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.service.getAll().subscribe({
      next: data => { this.appointments = data; this.isLoading = false; this.cdr.detectChanges(); },
      error: () => { this.isLoading = false; this.cdr.detectChanges(); }
    });
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = { scheduled: 'Запланирован', completed: 'Завершён', cancelled: 'Отменён' };
    return map[status] || status;
  }
}
