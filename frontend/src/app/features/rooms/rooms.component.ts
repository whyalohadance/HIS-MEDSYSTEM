import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../core/services/api.service';
import { map } from 'rxjs';

interface Room {
  id: number;
  name: string;
  number: string;
  floor: number;
  description: string;
  isActive: boolean;
}

@Component({
  selector: 'app-rooms',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Кабинеты</h1>
          <p class="page-sub">{{ rooms.length }} кабинетов</p>
        </div>
        <button class="btn-primary" (click)="showForm = !showForm" *ngIf="canEdit">
          <span class="material-icons">add</span> Добавить
        </button>
      </div>

      <div class="form-card" *ngIf="showForm">
        <h3>Новый кабинет</h3>
        <div class="form-row">
          <div class="form-field">
            <label>Название *</label>
            <input [(ngModel)]="form.name" placeholder="Кабинет терапевта">
          </div>
          <div class="form-field">
            <label>Номер</label>
            <input [(ngModel)]="form.number" placeholder="101">
          </div>
        </div>
        <div class="form-row">
          <div class="form-field">
            <label>Этаж</label>
            <input type="number" [(ngModel)]="form.floor" placeholder="1">
          </div>
          <div class="form-field">
            <label>Описание</label>
            <input [(ngModel)]="form.description" placeholder="Описание...">
          </div>
        </div>
        <div class="form-actions">
          <button class="btn-primary" (click)="save()" [disabled]="isSaving">{{ isSaving ? 'Сохранение...' : 'Сохранить' }}</button>
          <button class="btn-secondary" (click)="showForm = false">Отмена</button>
        </div>
      </div>

      <div class="loading" *ngIf="isLoading">
        <span class="material-icons spin">autorenew</span> Загрузка...
      </div>

      <div class="empty-state" *ngIf="!isLoading && rooms.length === 0">
        <span class="material-icons">meeting_room</span>
        <p>Кабинетов пока нет</p>
      </div>

      <div class="grid" *ngIf="!isLoading && rooms.length > 0">
        <div class="room-card" *ngFor="let r of rooms">
          <div class="room-header">
            <div class="room-icon">
              <span class="material-icons">meeting_room</span>
            </div>
            <div class="room-info">
              <div class="room-name">{{ r.name }}</div>
              <div class="room-sub">Кабинет № {{ r.number || '—' }} · Этаж {{ r.floor || '—' }}</div>
            </div>
            <span class="badge" [class.active]="r.isActive" [class.inactive]="!r.isActive">
              {{ r.isActive ? 'Активен' : 'Неактивен' }}
            </span>
          </div>
          <p class="room-desc" *ngIf="r.description">{{ r.description }}</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 1000px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; }
    .page-title { font-size: 26px; font-weight: 700; color: #0f2d52; }
    .page-sub { font-size: 14px; color: #718096; margin-top: 4px; }
    .btn-primary { display: flex; align-items: center; gap: 8px; background: #1a73e8; color: white; border: none; border-radius: 10px; padding: 10px 18px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit; }
    .btn-primary:hover { background: #1557b0; }
    .btn-secondary { background: #f4f6f9; color: #2d3748; border: none; border-radius: 10px; padding: 10px 18px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit; }
    .form-card { background: white; border-radius: 14px; padding: 24px; border: 1px solid #e2e8f0; margin-bottom: 24px; }
    .form-card h3 { margin: 0 0 20px; color: #0f2d52; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
    .form-field { display: flex; flex-direction: column; gap: 6px; }
    .form-field label { font-size: 13px; font-weight: 600; color: #4a5568; }
    .form-field input { padding: 10px 14px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; font-family: inherit; outline: none; }
    .form-field input:focus { border-color: #1a73e8; }
    .form-actions { display: flex; gap: 12px; margin-top: 8px; }
    .loading { display: flex; align-items: center; gap: 8px; color: #718096; padding: 40px; justify-content: center; }
    .loading .material-icons { animation: spin 1s linear infinite; }
    @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
    .empty-state { text-align: center; padding: 60px; color: #a0aec0; }
    .empty-state .material-icons { font-size: 48px; display: block; margin-bottom: 12px; }
    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
    .room-card { background: white; border-radius: 14px; padding: 20px; border: 1px solid #e2e8f0; }
    .room-header { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
    .room-icon { width: 40px; height: 40px; border-radius: 10px; background: #e8f0fe; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .room-icon .material-icons { color: #1a73e8; font-size: 20px; }
    .room-info { flex: 1; }
    .room-name { font-size: 15px; font-weight: 600; color: #0f2d52; }
    .room-sub { font-size: 12px; color: #718096; margin-top: 2px; }
    .room-desc { font-size: 13px; color: #718096; margin: 8px 0 0; }
    .badge { padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .badge.active { background: #e6f4ea; color: #34a853; }
    .badge.inactive { background: #f4f6f9; color: #718096; }
  `]
})
export class RoomsComponent implements OnInit {
  rooms: Room[] = [];
  isLoading = true;
  showForm = false;
  isSaving = false;
  canEdit = true;
  form = { name: '', number: '', floor: 1, description: '' };

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.api.get<any>('/rooms').pipe(map(r => r.data)).subscribe({
      next: data => { this.rooms = data; this.isLoading = false; this.cdr.detectChanges(); },
      error: () => { this.isLoading = false; this.cdr.detectChanges(); }
    });
  }

  save(): void {
    if (!this.form.name || this.isSaving) return;
    this.isSaving = true;
    this.api.post<any>('/rooms', this.form).subscribe({
      next: () => {
        this.isSaving = false;
        this.showForm = false;
        this.form = { name: '', number: '', floor: 1, description: '' };
        this.load();
      },
      error: () => { this.isSaving = false; this.cdr.detectChanges(); }
    });
  }
}
