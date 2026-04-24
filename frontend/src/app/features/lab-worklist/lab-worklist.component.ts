import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-lab-worklist',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="worklist-page">
      <div class="page-header">
        <div class="header-left">
          <h1><span class="material-icons">fact_check</span> Лабораторный Worklist</h1>
          <span class="lis-badge">LIS</span>
        </div>
        <div class="stats" *ngIf="stats">
          <div class="stat-item pending">
            <span class="material-icons">pending</span>
            <span>{{ stats.pending }} ожидают</span>
          </div>
          <div class="stat-item in-progress">
            <span class="material-icons">play_circle</span>
            <span>{{ stats.inProgress }} в работе</span>
          </div>
          <div class="stat-item completed">
            <span class="material-icons">check_circle</span>
            <span>{{ stats.completed }} завершено</span>
          </div>
        </div>
      </div>

      <div class="worklist" *ngIf="orders.length > 0">
        <div class="work-item" *ngFor="let o of orders" [class]="'priority-' + o.priority">
          <div class="priority-indicator"></div>
          <div class="work-info">
            <div class="work-order">{{ o.orderNumber }}</div>
            <div class="work-test">{{ getTestName(o.testId) }}</div>
            <div class="work-meta">
              <span class="material-icons">person</span>
              Пациент #{{ o.patientId }}
              <span class="dot">•</span>
              {{ o.scheduledAt || 'без даты' }}
            </div>
          </div>
          <div class="work-right">
            <span class="status-badge" [class]="'status-' + o.status">
              {{ o.status === 'pending' ? 'Ожидает' : 'В процессе' }}
            </span>
            <button class="btn-work" [routerLink]="['/lab/order', o.id]">
              <span class="material-icons">assignment</span>
              Ввести результаты
            </button>
          </div>
        </div>
      </div>

      <div class="empty" *ngIf="orders.length === 0 && !isLoading">
        <span class="material-icons">task_alt</span>
        <p>Нет заказов в работе</p>
        <span class="empty-sub">Все анализы выполнены</span>
      </div>

      <div class="loading" *ngIf="isLoading">
        <span class="material-icons spinning">refresh</span>
      </div>
    </div>
  `,
  styles: [`
    .worklist-page { padding: 32px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; flex-wrap: wrap; gap: 16px; }
    .header-left { display: flex; align-items: center; gap: 12px; }
    h1 { display: flex; align-items: center; gap: 10px; color: #0f2d52; margin: 0; font-size: 24px; }
    h1 .material-icons { color: #10b981; }
    .lis-badge { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; }
    .stats { display: flex; gap: 10px; flex-wrap: wrap; }
    .stat-item { display: flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 10px; font-weight: 600; font-size: 13px; }
    .stat-item .material-icons { font-size: 18px; }
    .stat-item.pending { background: #fef3c7; color: #d97706; }
    .stat-item.in-progress { background: #dbeafe; color: #1e40af; }
    .stat-item.completed { background: #d1fae5; color: #047857; }
    .worklist { display: flex; flex-direction: column; gap: 10px; }
    .work-item { display: flex; align-items: center; gap: 16px; background: white; border-radius: 12px; padding: 16px 20px; border: 1px solid #e2e8f0; box-shadow: 0 2px 6px rgba(0,0,0,0.03); transition: all 0.2s; }
    .work-item:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.08); transform: translateX(2px); }
    .priority-indicator { width: 4px; height: 52px; border-radius: 2px; flex-shrink: 0; }
    .work-item.priority-routine .priority-indicator { background: #94a3b8; }
    .work-item.priority-urgent .priority-indicator { background: #f59e0b; }
    .work-item.priority-stat .priority-indicator { background: #ef4444; }
    .work-info { flex: 1; min-width: 0; }
    .work-order { font-family: monospace; font-size: 11px; color: #94a3b8; font-weight: 600; margin-bottom: 4px; }
    .work-test { font-size: 16px; font-weight: 600; color: #0f2d52; margin-bottom: 6px; }
    .work-meta { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #64748b; }
    .work-meta .material-icons { font-size: 14px; }
    .dot { color: #cbd5e1; }
    .work-right { display: flex; flex-direction: column; align-items: flex-end; gap: 10px; }
    .status-badge { padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; white-space: nowrap; }
    .status-pending { background: #fef3c7; color: #d97706; }
    .status-in_progress { background: #dbeafe; color: #1e40af; }
    .btn-work { display: flex; align-items: center; gap: 6px; background: #10b981; color: white; border: none; padding: 8px 16px; border-radius: 10px; font-weight: 600; font-size: 13px; cursor: pointer; white-space: nowrap; transition: background 0.2s; }
    .btn-work:hover { background: #059669; }
    .empty { text-align: center; padding: 80px 20px; color: #94a3b8; }
    .empty .material-icons { font-size: 72px; opacity: 0.3; display: block; margin-bottom: 16px; }
    .empty p { margin: 0 0 8px; font-size: 18px; color: #64748b; }
    .empty-sub { font-size: 13px; }
    .loading { text-align: center; padding: 60px; color: #94a3b8; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .spinning { animation: spin 1s linear infinite; font-size: 36px; }

    :host-context(body.dark-theme) h1 { color: #e2e8f0; }
    :host-context(body.dark-theme) .work-item { background: #1e293b; border-color: #334155; }
    :host-context(body.dark-theme) .work-test { color: #e2e8f0; }
    :host-context(body.dark-theme) .stat-item.pending { background: rgba(254,243,199,0.15); }
    :host-context(body.dark-theme) .stat-item.in-progress { background: rgba(219,234,254,0.15); }
    :host-context(body.dark-theme) .stat-item.completed { background: rgba(209,250,229,0.15); }
  `]
})
export class LabWorklistComponent implements OnInit {
  orders: any[] = [];
  tests: any[] = [];
  stats: any = null;
  isLoading = false;

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadTests();
    this.loadWorklist();
    this.loadStats();
  }

  loadTests(): void {
    this.api.get<any>('/lab/tests').subscribe({
      next: res => {
        this.tests = res.data || [];
        this.cdr.detectChanges();
      }
    });
  }

  loadWorklist(): void {
    this.isLoading = true;
    this.api.get<any>('/lab/worklist').subscribe({
      next: res => {
        this.orders = res.data || [];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadStats(): void {
    this.api.get<any>('/lab/stats').subscribe({
      next: res => {
        this.stats = res.data;
        this.cdr.detectChanges();
      }
    });
  }

  getTestName(testId: number): string {
    const t = this.tests.find(x => x.id === testId);
    return t?.name || `Тест #${testId}`;
  }
}
