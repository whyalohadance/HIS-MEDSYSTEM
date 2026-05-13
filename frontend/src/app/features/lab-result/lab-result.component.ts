import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-lab-result',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="result-page" *ngIf="order && test">
      <div class="page-header">
        <button class="btn-back" (click)="goBack()">
          <span class="material-icons">arrow_back</span>
          {{ 'COMMON.BACK' | translate }}
        </button>
        <div class="header-info">
          <h1>{{ test.name }}</h1>
          <div class="meta">
            <span class="order-num">{{ order.orderNumber }}</span>
            <span class="priority-badge" [class]="'priority-' + order.priority">{{ getPriorityLabelKey(order.priority) | translate }}</span>
            <span class="status-badge" [class]="'status-' + order.status">{{ getStatusLabelKey(order.status) | translate }}</span>
          </div>
        </div>
      </div>

      <div class="info-banner" *ngIf="order.clinicalInfo">
        <span class="material-icons">info</span>
        <span>{{ order.clinicalInfo }}</span>
      </div>

      <div class="results-card">
        <div class="card-header">
          <h2>{{ 'LIS.RESULT.INDICATORS' | translate }}</h2>
          <span class="test-price">{{ test.price }} MDL</span>
        </div>

        <div class="params-table">
          <div class="param-row param-header">
            <div class="col-name">{{ 'LIS.RESULT.COL_NAME' | translate }}</div>
            <div class="col-value">{{ 'LIS.RESULT.COL_VALUE' | translate }}</div>
            <div class="col-unit">{{ 'LIS.RESULT.COL_UNIT' | translate }}</div>
            <div class="col-ref">{{ 'LIS.RESULT.COL_REF' | translate }}</div>
            <div class="col-flag">{{ 'LIS.RESULT.COL_FLAG' | translate }}</div>
          </div>

          <div class="param-row" *ngFor="let p of parameters" [class]="'flag-row-' + (p.flag || 'normal')">
            <div class="col-name">{{ p.parameterName }}</div>
            <div class="col-value">
              <input type="text" [(ngModel)]="p.value" (blur)="checkRange(p)"
                [disabled]="order.status === 'completed'"
                placeholder="—" class="value-input">
            </div>
            <div class="col-unit">{{ p.unit || '—' }}</div>
            <div class="col-ref">{{ p.referenceRange || '—' }}</div>
            <div class="col-flag">
              <span class="flag-badge" [class]="'flag-' + (p.flag || 'normal')" *ngIf="p.value">
                {{ getFlagLabelKey(p.flag) | translate }}
              </span>
            </div>
          </div>
        </div>

        <div class="actions" *ngIf="order.status !== 'completed' && (role === 'lab_technician' || role === 'admin')">
          <button class="btn-save" (click)="saveResults()" [disabled]="isSaving">
            <span class="material-icons">check_circle</span>
            {{ (isSaving ? 'LIS.RESULT.SAVING' : 'LIS.RESULT.SAVE_AND_COMPLETE') | translate }}
          </button>
        </div>

        <div class="completed-info" *ngIf="order.status === 'completed'">
          <span class="material-icons">verified</span>
          {{ 'LIS.RESULT.COMPLETED_AT' | translate }} {{ order.completedAt | date:'dd.MM.yyyy HH:mm' }}
        </div>
      </div>

      <div class="summary-card" *ngIf="order.status === 'completed' && parameters.length > 0">
        <h3>{{ 'LIS.RESULT.SUMMARY' | translate }}</h3>
        <div class="summary-stats">
          <div class="stat">
            <span class="stat-value normal">{{ countByFlag('normal') }}</span>
            <span class="stat-label">{{ 'LIS.RESULT.FLAG_NORMAL' | translate }}</span>
          </div>
          <div class="stat">
            <span class="stat-value warn">{{ countByFlag('low') + countByFlag('critical_low') }}</span>
            <span class="stat-label">{{ 'LIS.RESULT.FLAG_LOW' | translate }}</span>
          </div>
          <div class="stat">
            <span class="stat-value danger">{{ countByFlag('high') + countByFlag('critical_high') }}</span>
            <span class="stat-label">{{ 'LIS.RESULT.FLAG_HIGH' | translate }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="loading-state" *ngIf="!order">
      <span class="material-icons spinning">refresh</span>
      <p>{{ 'COMMON.LOADING' | translate }}</p>
    </div>
  `,
  styles: [`
    .result-page { padding: 32px; max-width: 900px; margin: 0 auto; }
    .loading-state { text-align: center; padding: 80px; color: #94a3b8; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .spinning { animation: spin 1s linear infinite; font-size: 36px; display: block; margin-bottom: 12px; }
    .page-header { display: flex; gap: 16px; align-items: flex-start; margin-bottom: 20px; }
    .btn-back { display: flex; align-items: center; gap: 6px; background: #f1f5f9; border: none; padding: 8px 14px; border-radius: 10px; cursor: pointer; color: #64748b; font-size: 14px; white-space: nowrap; }
    .btn-back:hover { background: #e2e8f0; }
    .header-info h1 { margin: 0 0 8px; color: #0f2d52; font-size: 22px; }
    .meta { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
    .order-num { font-family: monospace; font-size: 12px; color: #94a3b8; font-weight: 600; }
    .priority-badge, .status-badge { padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; }
    .priority-badge.priority-routine { background: #f1f5f9; color: #64748b; }
    .priority-badge.priority-urgent { background: #fef3c7; color: #d97706; }
    .priority-badge.priority-stat { background: #fee2e2; color: #dc2626; }
    .status-badge.status-pending { background: #fef3c7; color: #d97706; }
    .status-badge.status-in_progress { background: #dbeafe; color: #1e40af; }
    .status-badge.status-completed { background: #d1fae5; color: #047857; }
    .info-banner { display: flex; gap: 10px; align-items: flex-start; background: #eff6ff; border: 1px solid #bfdbfe; padding: 12px 16px; border-radius: 10px; margin-bottom: 20px; color: #1e40af; }
    .info-banner .material-icons { color: #3b82f6; flex-shrink: 0; }
    .results-card { background: white; border-radius: 14px; border: 1px solid #e2e8f0; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid #f1f5f9; }
    .card-header h2 { margin: 0; color: #0f2d52; font-size: 18px; }
    .test-price { background: #d1fae5; color: #047857; padding: 4px 12px; border-radius: 20px; font-weight: 700; font-size: 13px; }
    .params-table { display: flex; flex-direction: column; }
    .param-row { display: grid; grid-template-columns: 2fr 1.5fr 0.8fr 1.2fr 1fr; gap: 12px; padding: 10px 8px; align-items: center; border-bottom: 1px solid #f8fafc; border-radius: 6px; }
    .param-header { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; background: #f8fafc; border-radius: 8px !important; margin-bottom: 4px; padding: 10px 8px; }
    .param-row.flag-row-low, .param-row.flag-row-critical_low { background: rgba(251,191,36,0.06); }
    .param-row.flag-row-high, .param-row.flag-row-critical_high { background: rgba(239,68,68,0.06); }
    .col-name { font-weight: 500; color: #0f2d52; font-size: 14px; }
    .col-unit, .col-ref { font-size: 12px; color: #64748b; font-family: monospace; }
    .value-input { width: 100%; padding: 6px 10px; border: 1.5px solid #e2e8f0; border-radius: 6px; font-size: 14px; font-family: monospace; font-weight: 600; outline: none; color: #0f2d52; }
    .value-input:focus { border-color: #1a73e8; }
    .value-input:disabled { background: #f8fafc; color: #64748b; }
    .flag-badge { padding: 3px 8px; border-radius: 20px; font-size: 10px; font-weight: 700; white-space: nowrap; }
    .flag-badge.flag-normal { background: #d1fae5; color: #047857; }
    .flag-badge.flag-low { background: #fef3c7; color: #d97706; }
    .flag-badge.flag-high { background: #fef3c7; color: #d97706; }
    .flag-badge.flag-critical_low, .flag-badge.flag-critical_high { background: #fee2e2; color: #dc2626; }
    .actions { display: flex; justify-content: flex-end; margin-top: 20px; padding-top: 20px; border-top: 1px solid #f1f5f9; }
    .btn-save { display: flex; align-items: center; gap: 8px; background: #10b981; color: white; border: none; padding: 12px 24px; border-radius: 10px; font-weight: 600; font-size: 14px; cursor: pointer; transition: background 0.2s; }
    .btn-save:hover { background: #059669; }
    .btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
    .completed-info { display: flex; align-items: center; gap: 8px; justify-content: center; color: #047857; margin-top: 20px; padding: 14px; background: #d1fae5; border-radius: 10px; font-weight: 600; }
    .summary-card { background: white; border-radius: 14px; border: 1px solid #e2e8f0; padding: 24px; margin-top: 16px; }
    .summary-card h3 { margin: 0 0 16px; color: #0f2d52; }
    .summary-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .stat { text-align: center; padding: 16px; border-radius: 10px; background: #f8fafc; }
    .stat-value { display: block; font-size: 32px; font-weight: 700; margin-bottom: 4px; }
    .stat-value.normal { color: #10b981; }
    .stat-value.warn { color: #f59e0b; }
    .stat-value.danger { color: #ef4444; }
    .stat-label { font-size: 12px; color: #64748b; }

    :host-context(body.dark-theme) .results-card,
    :host-context(body.dark-theme) .summary-card { background: #1e293b; border-color: #334155; }
    :host-context(body.dark-theme) .card-header h2,
    :host-context(body.dark-theme) .col-name,
    :host-context(body.dark-theme) .header-info h1 { color: #e2e8f0; }
    :host-context(body.dark-theme) .value-input { background: #0f172a; border-color: #334155; color: #e2e8f0; }
    :host-context(body.dark-theme) .param-header { background: #0f172a; }
    :host-context(body.dark-theme) .stat { background: #0f172a; }
  `]
})
export class LabResultComponent implements OnInit {
  order: any = null;
  test: any = null;
  parameters: any[] = [];
  isSaving = false;
  role = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private toast: ToastService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.role = user.role || '';
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadOrder(+id);
  }

  loadOrder(id: number): void {
    this.api.get<any>(`/lab/orders/${id}`).subscribe({
      next: res => {
        this.order = res.data;
        this.cdr.detectChanges();
        this.loadTest(this.order.testId);
        this.loadResults(id);
      }
    });
  }

  loadTest(testId: number): void {
    this.api.get<any>('/lab/tests').subscribe({
      next: res => {
        this.test = (res.data || []).find((t: any) => t.id === testId);
        if (this.test && this.parameters.length === 0) {
          this.parameters = (this.test.parameters || []).map((p: any) => ({
            parameterName: p.name,
            value: '',
            unit: p.unit,
            referenceRange: p.referenceRange,
            minRange: p.minRange,
            maxRange: p.maxRange,
            flag: null
          }));
        }
        this.cdr.detectChanges();
      }
    });
  }

  loadResults(orderId: number): void {
    this.api.get<any>(`/lab/orders/${orderId}/results`).subscribe({
      next: res => {
        const results = res.data || [];
        if (results.length > 0) {
          this.parameters = results;
        }
        this.cdr.detectChanges();
      }
    });
  }

  checkRange(p: any): void {
    const num = parseFloat(p.value);
    if (isNaN(num) || !p.minRange || !p.maxRange) {
      p.flag = 'normal';
      return;
    }
    const range = p.maxRange - p.minRange;
    if (num < p.minRange - range * 0.3) p.flag = 'critical_low';
    else if (num > p.maxRange + range * 0.3) p.flag = 'critical_high';
    else if (num < p.minRange) p.flag = 'low';
    else if (num > p.maxRange) p.flag = 'high';
    else p.flag = 'normal';
  }

  saveResults(): void {
    this.isSaving = true;
    this.cdr.detectChanges();

    this.api.post<any>(`/lab/orders/${this.order.id}/results`, {
      results: this.parameters
    }).subscribe({
      next: () => {
        this.toast.success(this.translate.instant('LIS.RESULT.SAVED'));
        this.isSaving = false;
        this.loadOrder(this.order.id);
      },
      error: () => {
        this.toast.error(this.translate.instant('LIS.RESULT.SAVE_ERROR'));
        this.isSaving = false;
        this.cdr.detectChanges();
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/lab/orders']);
  }

  getPriorityLabelKey(p: string): string {
    return `LIS.PRIORITIES.${(p || 'routine').toUpperCase()}`;
  }

  getStatusLabelKey(s: string): string {
    const map: Record<string, string> = {
      'pending': 'LIS.WORKLIST.FILTER_PENDING',
      'in_progress': 'LIS.WORKLIST.FILTER_IN_PROGRESS',
      'completed': 'LIS.WORKLIST.FILTER_COMPLETED',
      'cancelled': 'LIS.ORDER.CANCELLED'
    };
    return map[s] || s;
  }

  getFlagLabelKey(flag: string): string {
    const map: Record<string, string> = {
      normal: 'LIS.FLAGS.NORMAL',
      low: 'LIS.FLAGS.LOW',
      high: 'LIS.FLAGS.HIGH',
      critical_low: 'LIS.FLAGS.CRITICAL_LOW',
      critical_high: 'LIS.FLAGS.CRITICAL_HIGH'
    };
    return map[flag] || 'LIS.FLAGS.NORMAL';
  }

  countByFlag(flag: string): number {
    return this.parameters.filter(p => p.flag === flag).length;
  }
}
