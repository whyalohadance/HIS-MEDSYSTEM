import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { map } from 'rxjs';

interface Examination {
  id: number;
  name: string;
  description: string;
  duration: number;
  isActive: boolean;
}

@Component({
  selector: 'app-examinations',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TranslateModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">{{ 'EXAMINATIONS.TITLE' | translate }}</h1>
          <p class="page-sub">{{ examinations.length }} {{ 'EXAMINATIONS.TITLE' | translate }}</p>
        </div>
        <button class="btn-primary" (click)="showForm = !showForm">
          <span class="material-icons">add</span> {{ 'COMMON.ADD' | translate }}
        </button>
      </div>

      <div class="form-card" *ngIf="showForm">
        <h3>{{ 'EXAMINATIONS.ADD_EXAMINATION' | translate }}</h3>
        <div class="form-row">
          <div class="form-field">
            <label>{{ 'EXAMINATIONS.NAME' | translate }} *</label>
            <input [(ngModel)]="form.name" placeholder="УЗИ брюшной полости">
          </div>
          <div class="form-field">
            <label>{{ 'EXAMINATIONS.DURATION' | translate }}</label>
            <input type="number" [(ngModel)]="form.duration" placeholder="30">
          </div>
        </div>
        <div class="form-field" style="margin-bottom:16px">
          <label>{{ 'ROOMS.DESCRIPTION' | translate }}</label>
          <input [(ngModel)]="form.description" placeholder="Описание обследования...">
        </div>
        <div class="form-actions">
          <button class="btn-primary" (click)="save()" [disabled]="isSaving">{{ isSaving ? ('COMMON.SAVING' | translate) : ('COMMON.SAVE' | translate) }}</button>
          <button class="btn-secondary" (click)="showForm = false">{{ 'COMMON.CANCEL' | translate }}</button>
        </div>
      </div>

      <div class="loading" *ngIf="isLoading">
        <span class="material-icons spin">autorenew</span> {{ 'COMMON.LOADING' | translate }}
      </div>

      <div class="empty-state" *ngIf="!isLoading && examinations.length === 0">
        <span class="material-icons">biotech</span>
        <p>{{ 'EXAMINATIONS.NO_EXAMINATIONS' | translate }}</p>
      </div>

      <div class="list" *ngIf="!isLoading && examinations.length > 0">
        <div class="exam-card" *ngFor="let e of examinations">
          <div class="exam-icon">
            <span class="material-icons">biotech</span>
          </div>
          <div class="exam-body">
            <div class="exam-name">{{ e.name }}</div>
            <div class="exam-desc" *ngIf="e.description">{{ e.description }}</div>
          </div>
          <div class="exam-duration" *ngIf="e.duration">
            <span class="material-icons">schedule</span>
            {{ e.duration }} мин
          </div>
          <span class="badge" [class.active]="e.isActive">{{ e.isActive ? ('PROFILE.ACTIVE' | translate) : ('PROFILE.INACTIVE' | translate) }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 800px; }
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
    .form-actions { display: flex; gap: 12px; }
    .loading { display: flex; align-items: center; gap: 8px; color: #718096; padding: 40px; justify-content: center; }
    .loading .material-icons { animation: spin 1s linear infinite; }
    @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
    .empty-state { text-align: center; padding: 60px; color: #a0aec0; }
    .empty-state .material-icons { font-size: 48px; display: block; margin-bottom: 12px; }
    .exam-card { display: flex; align-items: center; gap: 16px; padding: 16px 20px; background: white; border-radius: 12px; margin-bottom: 10px; border: 1px solid #e2e8f0; }
    .exam-icon { width: 40px; height: 40px; border-radius: 10px; background: #e6f4ea; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .exam-icon .material-icons { color: #34a853; font-size: 20px; }
    .exam-body { flex: 1; }
    .exam-name { font-size: 14px; font-weight: 600; color: #0f2d52; }
    .exam-desc { font-size: 13px; color: #718096; margin-top: 2px; }
    .exam-duration { display: flex; align-items: center; gap: 4px; font-size: 13px; color: #718096; margin-right: 12px; }
    .exam-duration .material-icons { font-size: 16px; }
    .badge { padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; background: #f4f6f9; color: #718096; }
    .badge.active { background: #e6f4ea; color: #34a853; }
  `]
})
export class ExaminationsComponent implements OnInit {
  examinations: Examination[] = [];
  isLoading = true;
  showForm = false;
  isSaving = false;
  form = { name: '', description: '', duration: 30 };

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.api.get<any>('/examinations').pipe(map(r => r.data)).subscribe({
      next: data => { this.examinations = data; this.isLoading = false; this.cdr.detectChanges(); },
      error: () => { this.isLoading = false; this.cdr.detectChanges(); }
    });
  }

  save(): void {
    if (!this.form.name || this.isSaving) return;
    this.isSaving = true;
    this.api.post<any>('/examinations', this.form).subscribe({
      next: () => {
        this.isSaving = false;
        this.showForm = false;
        this.form = { name: '', description: '', duration: 30 };
        this.load();
      },
      error: () => { this.isSaving = false; this.cdr.detectChanges(); }
    });
  }
}
