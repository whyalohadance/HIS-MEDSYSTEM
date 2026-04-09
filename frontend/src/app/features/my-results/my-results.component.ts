import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { ResultsService, Result } from '../../core/services/results.service';

@Component({
  selector: 'app-my-results',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslateModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">Мои результаты</h1>
        <p class="page-sub">Ваши медицинские анализы и обследования</p>
      </div>
      <div class="loading" *ngIf="isLoading">
        <span class="material-icons spin">autorenew</span> Загрузка...
      </div>
      <div class="empty-state" *ngIf="!isLoading && results.length === 0">
        <span class="material-icons">assignment</span>
        <p>Результатов пока нет</p>
      </div>
      <div class="list" *ngIf="!isLoading && results.length > 0">
        <div class="card-item" *ngFor="let r of results">
          <div class="card-icon">
            <span class="material-icons">picture_as_pdf</span>
          </div>
          <div class="card-body">
            <div class="card-title">{{ r.title }}</div>
            <div class="card-sub">{{ r.description }}</div>
            <div class="card-date">{{ r.createdAt | date:'dd.MM.yyyy' }}</div>
          </div>
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
    .card-icon { width: 40px; height: 40px; border-radius: 10px; background: #fce8e6; display: flex; align-items: center; justify-content: center; }
    .card-icon .material-icons { color: #ea4335; font-size: 20px; }
    .card-body { flex: 1; }
    .card-title { font-size: 14px; font-weight: 600; color: #0f2d52; }
    .card-sub { font-size: 13px; color: #718096; margin-top: 2px; }
    .card-date { font-size: 11px; color: #a0aec0; margin-top: 4px; }
  `]
})
export class MyResultsComponent implements OnInit {
  results: Result[] = [];
  isLoading = true;

  constructor(private service: ResultsService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.service.getAll().subscribe({
      next: data => { this.results = data; this.isLoading = false; this.cdr.detectChanges(); },
      error: () => { this.isLoading = false; this.cdr.detectChanges(); }
    });
  }
}
