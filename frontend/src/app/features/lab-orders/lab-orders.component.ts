import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-lab-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule],
  template: `
    <div class="lab-page">
      <div class="page-header">
        <div class="header-title">
          <h1>
            <span class="material-icons">biotech</span>
            {{ 'NAV.LAB_ORDERS' | translate }}
          </h1>
          <span class="lab-badge">LIS</span>
        </div>
        <button class="btn-add" (click)="showAddForm = true" *ngIf="role === 'admin' || role === 'doctor'">
          <span class="material-icons">add</span>
          {{ 'LIS.ORDER.NEW' | translate }}
        </button>
      </div>

      <div class="filters">
        <select [(ngModel)]="filterStatus" (change)="loadOrders()" class="filter-select">
          <option value="">{{ 'LIS.ORDER.ALL_STATUSES' | translate }}</option>
          <option value="pending">{{ 'LIS.WORKLIST.FILTER_PENDING' | translate }}</option>
          <option value="in_progress">{{ 'LIS.WORKLIST.FILTER_IN_PROGRESS' | translate }}</option>
          <option value="completed">{{ 'LIS.WORKLIST.FILTER_COMPLETED' | translate }}</option>
        </select>
        <select [(ngModel)]="filterPriority" (change)="loadOrders()" class="filter-select">
          <option value="">{{ 'LIS.ORDER.ALL_PRIORITIES' | translate }}</option>
          <option value="routine">{{ 'LIS.PRIORITIES.ROUTINE' | translate }}</option>
          <option value="urgent">{{ 'LIS.PRIORITIES.URGENT' | translate }}</option>
          <option value="stat">{{ 'LIS.PRIORITIES.STAT' | translate }}</option>
        </select>
      </div>

      <div class="loading" *ngIf="isLoading">
        <span class="material-icons spinning">refresh</span>
      </div>

      <div class="orders-grid" *ngIf="!isLoading">
        <div class="order-card" *ngFor="let order of orders" [class]="'priority-' + order.priority">
          <div class="order-header">
            <span class="order-number">{{ order.orderNumber }}</span>
            <span class="priority-badge" [class]="'priority-' + order.priority">
              {{ getPriorityLabelKey(order.priority) | translate }}
            </span>
          </div>
          <div class="order-body">
            <div class="order-test">{{ getTestName(order.testId) }}</div>
            <div class="order-patient">
              <span class="material-icons">person</span>
              {{ 'LIS.WORKLIST.PATIENT' | translate }} ID: {{ order.patientId }}
            </div>
            <div class="order-date" *ngIf="order.scheduledAt">
              <span class="material-icons">event</span>
              {{ order.scheduledAt }}
            </div>
            <div class="order-info" *ngIf="order.clinicalInfo">
              {{ order.clinicalInfo }}
            </div>
          </div>
          <div class="order-footer">
            <span class="status-badge" [class]="'status-' + order.status">
              {{ getStatusLabelKey(order.status) | translate }}
            </span>
            <button class="btn-view" [routerLink]="['/lab/order', order.id]">
              <span class="material-icons">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>

      <div class="empty-state" *ngIf="!isLoading && orders.length === 0">
        <span class="material-icons">science</span>
        <p>{{ 'LIS.ORDER.EMPTY' | translate }}</p>
      </div>

      <div class="modal-overlay" *ngIf="showAddForm" (click)="showAddForm = false">
        <div class="modal" (click)="$event.stopPropagation()">
          <h2>{{ 'LIS.ORDER.NEW_TITLE' | translate }}</h2>

          <div class="form-group">
            <label>{{ 'LIS.WORKLIST.PATIENT' | translate }}</label>
            <input type="number" [(ngModel)]="newOrder.patientId"
              [placeholder]="'LIS.ORDER.PATIENT_ID' | translate" class="form-input">
          </div>

          <div class="form-group">
            <label>{{ 'LIS.ORDER.TEST' | translate }}</label>
            <select [(ngModel)]="newOrder.testId" class="form-input">
              <option [ngValue]="null">{{ 'LIS.ORDER.SELECT_TEST' | translate }}</option>
              <option *ngFor="let test of tests" [ngValue]="test.id">
                {{ test.name }} ({{ test.price }} MDL)
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>{{ 'LIS.WORKLIST.PRIORITY' | translate }}</label>
            <select [(ngModel)]="newOrder.priority" class="form-input">
              <option value="routine">{{ 'LIS.PRIORITIES.ROUTINE' | translate }}</option>
              <option value="urgent">{{ 'LIS.PRIORITIES.URGENT' | translate }}</option>
              <option value="stat">{{ 'LIS.PRIORITIES.STAT' | translate }}</option>
            </select>
          </div>

          <div class="form-group">
            <label>{{ 'LIS.ORDER.CLINICAL_INFO' | translate }}</label>
            <textarea [(ngModel)]="newOrder.clinicalInfo" rows="3" class="form-input"
              [placeholder]="'LIS.ORDER.CLINICAL_PLACEHOLDER' | translate"></textarea>
          </div>

          <div class="form-group">
            <label>{{ 'LIS.ORDER.COLLECTION_DATE' | translate }}</label>
            <input type="date" [(ngModel)]="newOrder.scheduledAt" class="form-input">
          </div>

          <div class="modal-actions">
            <button class="btn-cancel" (click)="showAddForm = false">{{ 'COMMON.CANCEL' | translate }}</button>
            <button class="btn-save" (click)="createOrder()">{{ 'COMMON.CREATE' | translate }}</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .lab-page { padding: 32px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .header-title { display: flex; align-items: center; gap: 12px; }
    .header-title h1 { display: flex; align-items: center; gap: 10px; font-size: 26px; color: #0f2d52; margin: 0; }
    .header-title .material-icons { color: #10b981; }
    .lab-badge { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; }
    .btn-add { display: flex; align-items: center; gap: 6px; background: #1a73e8; color: white; border: none; padding: 10px 20px; border-radius: 10px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
    .btn-add:hover { background: #1557b0; }
    .filters { display: flex; gap: 12px; margin-bottom: 20px; }
    .filter-select { height: 40px; padding: 0 12px; border: 1.5px solid #e2e8f0; border-radius: 10px; background: white; font-size: 13px; cursor: pointer; }
    .loading { text-align: center; padding: 60px; color: #94a3b8; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .spinning { animation: spin 1s linear infinite; font-size: 36px; }
    .orders-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
    .order-card { background: white; border-radius: 14px; border: 1px solid #e2e8f0; padding: 18px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); transition: all 0.2s; position: relative; overflow: hidden; }
    .order-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.08); }
    .order-card::before { content:''; position: absolute; top: 0; left: 0; width: 4px; height: 100%; }
    .order-card.priority-routine::before { background: #94a3b8; }
    .order-card.priority-urgent::before { background: #f59e0b; }
    .order-card.priority-stat::before { background: #ef4444; }
    .order-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-left: 8px; }
    .order-number { font-size: 11px; color: #94a3b8; font-family: monospace; font-weight: 600; }
    .priority-badge { padding: 3px 10px; border-radius: 20px; font-size: 10px; font-weight: 700; text-transform: uppercase; }
    .priority-badge.priority-routine { background: #f1f5f9; color: #64748b; }
    .priority-badge.priority-urgent { background: #fef3c7; color: #d97706; }
    .priority-badge.priority-stat { background: #fee2e2; color: #dc2626; }
    .order-body { padding-left: 8px; }
    .order-test { font-size: 16px; font-weight: 600; color: #0f2d52; margin-bottom: 8px; }
    .order-patient, .order-date { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #64748b; margin-bottom: 4px; }
    .order-patient .material-icons, .order-date .material-icons { font-size: 16px; }
    .order-info { font-size: 12px; color: #64748b; background: #f8fafc; padding: 8px; border-radius: 6px; margin-top: 8px; }
    .order-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 12px; padding-top: 12px; border-top: 1px solid #f1f5f9; padding-left: 8px; }
    .status-badge { padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; }
    .status-pending { background: #fef3c7; color: #d97706; }
    .status-in_progress { background: #dbeafe; color: #1e40af; }
    .status-completed { background: #d1fae5; color: #047857; }
    .status-cancelled { background: #fee2e2; color: #dc2626; }
    .btn-view { background: #f1f5f9; border: none; width: 32px; height: 44px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; min-width: 44px; }
    .btn-view:hover { background: #1a73e8; color: white; }
    .empty-state { text-align: center; padding: 60px 20px; color: #94a3b8; }
    .empty-state .material-icons { font-size: 64px; opacity: 0.3; display: block; margin-bottom: 12px; }
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 100; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .modal { background: white; border-radius: 16px; padding: 24px; max-width: 500px; width: 100%; max-height: 90vh; overflow-y: auto; }
    .modal h2 { margin: 0 0 20px; color: #0f2d52; }
    .form-group { margin-bottom: 16px; }
    .form-group label { display: block; font-size: 13px; font-weight: 600; color: #475569; margin-bottom: 6px; }
    .form-input { width: 100%; padding: 10px 12px; border: 1.5px solid #e2e8f0; border-radius: 8px; font-size: 14px; outline: none; font-family: inherit; box-sizing: border-box; }
    .form-input:focus { border-color: #1a73e8; }
    .modal-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px; }
    .btn-cancel { background: #f1f5f9; color: #64748b; border: none; padding: 10px 20px; border-radius: 10px; font-weight: 600; cursor: pointer; }
    .btn-save { background: #10b981; color: white; border: none; padding: 10px 20px; border-radius: 10px; font-weight: 600; cursor: pointer; }
    .btn-save:hover { background: #059669; }
    :host-context(body.dark-theme) .lab-page { background: transparent; }
    :host-context(body.dark-theme) .header-title h1 { color: #e2e8f0; }
    :host-context(body.dark-theme) .order-card { background: #1e293b; border-color: #334155; }
    :host-context(body.dark-theme) .order-test { color: #e2e8f0; }
    :host-context(body.dark-theme) .filter-select { background: #1e293b; border-color: #334155; color: #e2e8f0; }
    :host-context(body.dark-theme) .modal { background: #1e293b; }
    :host-context(body.dark-theme) .modal h2 { color: #e2e8f0; }
    :host-context(body.dark-theme) .form-input { background: #0f172a; border-color: #334155; color: #e2e8f0; }
    @media (max-width: 414px) {
      .lab-page { padding: 16px !important; }
      button { min-height: 44px !important; }
      .filter-row { flex-direction: column !important; gap: 8px !important; }
      .filter-select { width: 100% !important; }
    }
  `]
})
export class LabOrdersComponent implements OnInit {
  orders: any[] = [];
  tests: any[] = [];
  isLoading = false;
  showAddForm = false;
  filterStatus = '';
  filterPriority = '';
  role = '';

  newOrder: any = {
    patientId: null,
    testId: null,
    priority: 'routine',
    clinicalInfo: '',
    scheduledAt: ''
  };

  constructor(
    private api: ApiService,
    private toast: ToastService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.role = user.role || '';
    this.loadTests();
    this.loadOrders();
  }

  loadTests(): void {
    this.api.get<any>('/lab/tests').subscribe({
      next: res => {
        this.tests = res.data || [];
        this.cdr.detectChanges();
      }
    });
  }

  loadOrders(): void {
    this.isLoading = true;
    this.cdr.detectChanges();

    let query = '/lab/orders?';
    if (this.filterStatus) query += `status=${this.filterStatus}&`;
    if (this.filterPriority) query += `priority=${this.filterPriority}`;

    this.api.get<any>(query).subscribe({
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

  createOrder(): void {
    if (!this.newOrder.patientId || !this.newOrder.testId) {
      this.toast.error(this.translate.instant('LIS.ORDER.FILL_REQUIRED'));
      return;
    }

    this.api.post<any>('/lab/orders', this.newOrder).subscribe({
      next: () => {
        this.toast.success(this.translate.instant('LIS.ORDER.CREATED'));
        this.showAddForm = false;
        this.newOrder = { patientId: null, testId: null, priority: 'routine', clinicalInfo: '', scheduledAt: '' };
        this.loadOrders();
      },
      error: () => this.toast.error(this.translate.instant('LIS.ORDER.CREATE_ERROR'))
    });
  }

  getTestName(testId: number): string {
    const test = this.tests.find(t => t.id === testId);
    return test?.name || `Test #${testId}`;
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
}
