import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { Subject, interval } from 'rxjs';
import { takeUntil, startWith } from 'rxjs/operators';

interface AuditEntry {
  id: number;
  action: string;
  resource: string;
  resourceId: number | null;
  method: string;
  endpoint: string;
  ip: string;
  description: string;
  success: boolean;
  errorMessage: string;
  createdAt: string;
  user: { id: number; firstName: string; lastName: string; email: string; role: string } | null;
}

interface AuditStats {
  totalActions: number;
  todayActions: number;
  byAction: { action: string; count: number }[];
  byUser: { userId: number; name: string; email: string; count: number }[];
}

const ACTION_COLORS: Record<string, string> = {
  CREATE:       'badge-create',
  UPDATE:       'badge-update',
  DELETE:       'badge-delete',
  LOGIN:        'badge-login',
  LOGIN_FAILED: 'badge-failed',
  LOGOUT:       'badge-logout',
  EXPORT:       'badge-export',
  ACCESS:       'badge-access',
};

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
<div class="audit-page">
  <div class="bg-deco"></div>

  <!-- Header -->
  <header class="audit-header">
    <div>
      <h1><span class="material-icons">history</span> {{ 'AUDIT.TITLE' | translate }}</h1>
      <p class="subtitle">{{ 'AUDIT.SUBTITLE' | translate }}</p>
    </div>
    <div class="header-actions">
      <label class="auto-refresh-toggle">
        <input type="checkbox" [(ngModel)]="autoRefresh" (change)="toggleAutoRefresh()">
        <span class="material-icons">{{ autoRefresh ? 'sync' : 'sync_disabled' }}</span>
        {{ 'AUDIT.AUTO_REFRESH' | translate }}
      </label>
      <button class="btn-export" (click)="exportCsv()">
        <span class="material-icons">download</span>
        {{ 'AUDIT.EXPORT_CSV' | translate }}
      </button>
    </div>
  </header>

  <!-- Stats cards -->
  <div class="stats-row" *ngIf="stats">
    <div class="stat-card">
      <span class="material-icons stat-icon">analytics</span>
      <div class="stat-val">{{ stats.totalActions | number }}</div>
      <div class="stat-lbl">{{ 'AUDIT.TOTAL' | translate }}</div>
    </div>
    <div class="stat-card accent">
      <span class="material-icons stat-icon">today</span>
      <div class="stat-val">{{ stats.todayActions | number }}</div>
      <div class="stat-lbl">{{ 'AUDIT.TODAY' | translate }}</div>
    </div>
    <div class="stat-card">
      <span class="material-icons stat-icon">emoji_events</span>
      <div class="stat-lbl" style="margin-bottom:8px">{{ 'AUDIT.TOP_ACTIONS' | translate }}</div>
      <div class="mini-list">
        <div class="mini-item" *ngFor="let a of stats.byAction.slice(0,3)">
          <span class="action-badge" [ngClass]="getActionClass(a.action)">{{ getActionLabel(a.action) }}</span>
          <span class="mini-count">{{ a.count }}</span>
        </div>
      </div>
    </div>
    <div class="stat-card">
      <span class="material-icons stat-icon">group</span>
      <div class="stat-lbl" style="margin-bottom:8px">{{ 'AUDIT.TOP_USERS' | translate }}</div>
      <div class="mini-list">
        <div class="mini-item" *ngFor="let u of stats.byUser.slice(0,3)">
          <span class="mini-name">{{ u.name || u.email }}</span>
          <span class="mini-count">{{ u.count }}</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Filters -->
  <div class="filters-card">
    <span class="material-icons filter-icon">filter_list</span>
    <div class="filters-grid">
      <div class="filter-group">
        <label>{{ 'AUDIT.ACTION' | translate }}</label>
        <select [(ngModel)]="filters.action" (change)="applyFilters()">
          <option value="">{{ 'AUDIT.ALL' | translate }}</option>
          <option *ngFor="let a of actions" [value]="a">{{ 'AUDIT.ACTIONS.' + a | translate }}</option>
        </select>
      </div>
      <div class="filter-group">
        <label>{{ 'AUDIT.USER' | translate }}</label>
        <select [(ngModel)]="filters.userId" (change)="applyFilters()">
          <option value="">{{ 'AUDIT.ALL' | translate }}</option>
          <option *ngFor="let u of users" [value]="u.id">{{ u.firstName }} {{ u.lastName }}</option>
        </select>
      </div>
      <div class="filter-group">
        <label>{{ 'AUDIT.DATE_FROM' | translate }}</label>
        <input type="date" [(ngModel)]="filters.startDate" (change)="applyFilters()">
      </div>
      <div class="filter-group">
        <label>{{ 'AUDIT.DATE_TO' | translate }}</label>
        <input type="date" [(ngModel)]="filters.endDate" (change)="applyFilters()">
      </div>
      <div class="filter-group search-group">
        <label>{{ 'AUDIT.SEARCH' | translate }}</label>
        <div class="search-wrap">
          <span class="material-icons">search</span>
          <input type="text" [(ngModel)]="filters.search" (input)="onSearchInput()" [placeholder]="'AUDIT.SEARCH' | translate">
        </div>
      </div>
      <div class="filter-group filter-reset">
        <button class="btn-reset" (click)="resetFilters()">
          <span class="material-icons">clear</span>
        </button>
      </div>
    </div>
  </div>

  <!-- Table -->
  <div class="table-card">
    <!-- Loading overlay -->
    <div class="table-loading" *ngIf="loading">
      <span class="material-icons spin-icon">sync</span>
    </div>

    <!-- Empty state -->
    <div class="empty-state" *ngIf="!loading && entries.length === 0">
      <span class="material-icons">search_off</span>
      <p>{{ 'AUDIT.NO_RESULTS' | translate }}</p>
    </div>

    <table *ngIf="entries.length > 0">
      <thead>
        <tr>
          <th>{{ 'AUDIT.TIMESTAMP' | translate }}</th>
          <th>{{ 'AUDIT.USER' | translate }}</th>
          <th>{{ 'AUDIT.ACTION' | translate }}</th>
          <th>{{ 'AUDIT.RESOURCE' | translate }}</th>
          <th>{{ 'AUDIT.IP_ADDRESS' | translate }}</th>
          <th>{{ 'AUDIT.STATUS' | translate }}</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let e of entries" [class.row-error]="!e.success" [title]="e.endpoint">
          <td class="td-time">
            <span class="time-date">{{ e.createdAt | date:'dd.MM.yy' }}</span>
            <span class="time-clock">{{ e.createdAt | date:'HH:mm:ss' }}</span>
          </td>
          <td class="td-user">
            <span *ngIf="e.user" class="user-chip">
              <span class="user-avatar">{{ (e.user!.firstName?.[0] || '?') }}</span>
              <span class="user-name">{{ e.user.firstName }} {{ e.user.lastName }}</span>
            </span>
            <span *ngIf="!e.user" class="text-muted">—</span>
          </td>
          <td>
            <span class="action-badge" [ngClass]="getActionClass(e.action)">
              {{ 'AUDIT.ACTIONS.' + e.action | translate }}
            </span>
          </td>
          <td class="td-resource">
            <span class="resource-chip">{{ e.resource }}</span>
            <span class="resource-id" *ngIf="e.resourceId">#{{ e.resourceId }}</span>
          </td>
          <td class="td-ip">{{ e.ip || '—' }}</td>
          <td class="td-status">
            <span class="status-dot" [class.dot-ok]="e.success" [class.dot-err]="!e.success">
              <span class="material-icons">{{ e.success ? 'check_circle' : 'cancel' }}</span>
            </span>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Pagination -->
    <div class="pagination" *ngIf="totalPages > 1">
      <button [disabled]="currentPage === 1" (click)="goPage(1)">
        <span class="material-icons">first_page</span>
      </button>
      <button [disabled]="currentPage === 1" (click)="goPage(currentPage - 1)">
        <span class="material-icons">chevron_left</span>
      </button>
      <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
      <button [disabled]="currentPage === totalPages" (click)="goPage(currentPage + 1)">
        <span class="material-icons">chevron_right</span>
      </button>
      <button [disabled]="currentPage === totalPages" (click)="goPage(totalPages)">
        <span class="material-icons">last_page</span>
      </button>
      <span class="total-info">{{ total }} {{ 'AUDIT.TOTAL' | translate }}</span>
    </div>
  </div>
</div>
  `,
  styles: [`
    .audit-page {
      padding: 24px;
      position: relative;
      min-height: 100vh;
      background: #f8faff;
    }
    .bg-deco {
      position: fixed; top: -200px; right: -200px;
      width: 600px; height: 600px;
      background: radial-gradient(circle, rgba(26,115,232,0.06) 0%, transparent 70%);
      pointer-events: none;
    }

    /* Header */
    .audit-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      flex-wrap: wrap; gap: 16px; margin-bottom: 24px;
    }
    .audit-header h1 {
      display: flex; align-items: center; gap: 10px;
      font-size: 26px; font-weight: 800; color: #0f2d52; margin: 0 0 4px;
    }
    .audit-header h1 .material-icons { font-size: 30px; color: #1a73e8; }
    .subtitle { font-size: 14px; color: #718096; margin: 0; }

    .header-actions {
      display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
    }

    .auto-refresh-toggle {
      display: flex; align-items: center; gap: 6px;
      font-size: 13px; color: #64748b; cursor: pointer;
      background: white; border: 1px solid #e2e8f0;
      border-radius: 10px; padding: 7px 12px;
    }
    .auto-refresh-toggle input { display: none; }
    .auto-refresh-toggle .material-icons { font-size: 18px; color: #1a73e8; }

    .btn-export {
      display: flex; align-items: center; gap: 6px;
      padding: 8px 16px; border-radius: 12px;
      background: #0f2d52; color: white; border: none;
      font-size: 14px; font-weight: 600; cursor: pointer;
      transition: background 0.2s;
    }
    .btn-export:hover { background: #1a73e8; }
    .btn-export .material-icons { font-size: 18px; }

    /* Stats */
    .stats-row {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 16px; margin-bottom: 20px;
    }
    .stat-card {
      background: white; border-radius: 16px; padding: 20px;
      border: 1px solid rgba(0,0,0,0.06);
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
      transition: transform 0.2s, box-shadow 0.2s;
      animation: fadeUp 0.35s ease both;
    }
    .stat-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.08); }
    .stat-card.accent { border-top: 3px solid #1a73e8; }
    .stat-icon { font-size: 28px; color: #1a73e8; margin-bottom: 8px; display: block; }
    .stat-val { font-size: 32px; font-weight: 800; color: #0f2d52; line-height: 1; }
    .stat-lbl { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px; }

    .mini-list { display: flex; flex-direction: column; gap: 6px; }
    .mini-item { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    .mini-name { font-size: 12px; color: #334155; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 130px; }
    .mini-count { font-size: 12px; font-weight: 700; color: #1a73e8; min-width: 30px; text-align: right; }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* Filters */
    .filters-card {
      background: white; border-radius: 16px; padding: 20px 24px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04); border: 1px solid rgba(0,0,0,0.06);
      margin-bottom: 20px;
      display: flex; align-items: flex-start; gap: 12px;
    }
    .filter-icon { color: #1a73e8; margin-top: 26px; font-size: 20px; flex-shrink: 0; }
    .filters-grid {
      flex: 1;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 12px;
    }
    .filter-group { display: flex; flex-direction: column; gap: 4px; }
    .filter-group label { font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.4px; }
    .filter-group select,
    .filter-group input[type=date],
    .filter-group input[type=text] {
      padding: 8px 10px; border-radius: 8px;
      border: 1px solid #e2e8f0; font-size: 13px; color: #334155;
      background: #f8faff; outline: none;
      transition: border-color 0.2s;
    }
    .filter-group select:focus,
    .filter-group input:focus { border-color: #1a73e8; background: white; }
    .search-wrap {
      display: flex; align-items: center; gap: 6px;
      border: 1px solid #e2e8f0; border-radius: 8px; padding: 0 10px;
      background: #f8faff; transition: border-color 0.2s;
    }
    .search-wrap:focus-within { border-color: #1a73e8; background: white; }
    .search-wrap .material-icons { font-size: 18px; color: #a0aec0; }
    .search-wrap input { border: none; background: transparent; padding: 8px 0; font-size: 13px; outline: none; width: 100%; }
    .filter-reset { justify-content: flex-end; }
    .btn-reset {
      background: none; border: 1px solid #e2e8f0; border-radius: 8px;
      padding: 8px 10px; cursor: pointer; color: #a0aec0; transition: all 0.2s;
      align-self: flex-end;
    }
    .btn-reset:hover { color: #ef4444; border-color: #ef4444; }

    /* Table */
    .table-card {
      background: white; border-radius: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04); border: 1px solid rgba(0,0,0,0.06);
      overflow: hidden; position: relative;
    }
    .table-loading {
      position: absolute; inset: 0;
      background: rgba(255,255,255,0.75);
      display: flex; align-items: center; justify-content: center;
      z-index: 10; border-radius: 16px;
    }
    .spin-icon { font-size: 36px; color: #1a73e8; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .empty-state {
      text-align: center; padding: 60px 24px; color: #a0aec0;
    }
    .empty-state .material-icons { font-size: 52px; color: #cbd5e0; display: block; margin-bottom: 12px; }
    .empty-state p { font-size: 15px; }

    table { width: 100%; border-collapse: collapse; }
    thead { background: #f8faff; }
    th {
      padding: 12px 16px; text-align: left;
      font-size: 11px; font-weight: 700; color: #64748b;
      text-transform: uppercase; letter-spacing: 0.5px;
      border-bottom: 1px solid #e2e8f0;
    }
    td {
      padding: 12px 16px; font-size: 13px; color: #334155;
      border-bottom: 1px solid #f1f5f9;
    }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: #f8faff; }
    tr.row-error td { background: rgba(239, 68, 68, 0.02); }

    .td-time { min-width: 90px; }
    .time-date { display: block; font-size: 12px; color: #64748b; }
    .time-clock { display: block; font-size: 13px; font-weight: 600; color: #0f2d52; font-variant-numeric: tabular-nums; }

    .td-user { min-width: 140px; }
    .user-chip { display: flex; align-items: center; gap: 8px; }
    .user-avatar {
      width: 28px; height: 28px; border-radius: 50%;
      background: #e8f0fe; color: #1a73e8;
      display: flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: 700; flex-shrink: 0;
    }
    .user-name { font-size: 13px; font-weight: 500; }
    .text-muted { color: #a0aec0; }

    /* Action badges */
    .action-badge {
      display: inline-block; padding: 3px 8px; border-radius: 6px;
      font-size: 11px; font-weight: 700; letter-spacing: 0.3px;
    }
    .badge-create  { background: rgba(16,185,129,0.12); color: #059669; }
    .badge-update  { background: rgba(26,115,232,0.12); color: #1a73e8; }
    .badge-delete  { background: rgba(239,68,68,0.12);  color: #dc2626; }
    .badge-login   { background: rgba(100,116,139,0.12); color: #475569; }
    .badge-logout  { background: rgba(100,116,139,0.10); color: #64748b; }
    .badge-failed  { background: rgba(245,158,11,0.12); color: #d97706; }
    .badge-export  { background: rgba(124,58,237,0.12); color: #7c3aed; }
    .badge-access  { background: rgba(100,116,139,0.08); color: #94a3b8; }

    .td-resource { min-width: 120px; }
    .resource-chip {
      display: inline-block; padding: 2px 8px; border-radius: 6px;
      background: #f1f5f9; font-size: 12px; font-weight: 600; color: #475569;
    }
    .resource-id { font-size: 11px; color: #a0aec0; margin-left: 4px; }

    .td-ip { font-size: 12px; color: #94a3b8; font-variant-numeric: tabular-nums; }

    .td-status { text-align: center; }
    .status-dot .material-icons { font-size: 20px; }
    .dot-ok .material-icons  { color: #10b981; }
    .dot-err .material-icons { color: #ef4444; }

    /* Pagination */
    .pagination {
      display: flex; align-items: center; justify-content: center; gap: 8px;
      padding: 16px 24px; border-top: 1px solid #f1f5f9; flex-wrap: wrap;
    }
    .pagination button {
      padding: 6px; border-radius: 8px; border: 1px solid #e2e8f0;
      background: white; cursor: pointer; display: flex;
      color: #334155; transition: all 0.15s;
    }
    .pagination button:hover:not(:disabled) { background: #1a73e8; color: white; border-color: #1a73e8; }
    .pagination button:disabled { opacity: 0.35; cursor: not-allowed; }
    .pagination button .material-icons { font-size: 18px; }
    .page-info { font-size: 13px; font-weight: 600; color: #334155; padding: 0 8px; }
    .total-info { font-size: 12px; color: #94a3b8; margin-left: 8px; }

    /* Mobile */
    @media (max-width: 768px) {
      .audit-page { padding: 16px; }
      .audit-header { flex-direction: column; }
      .stats-row { grid-template-columns: 1fr 1fr; }
      .filters-grid { grid-template-columns: 1fr 1fr; }
      .table-card { overflow-x: auto; }
      table { min-width: 640px; }
    }
    @media (max-width: 480px) {
      .stats-row { grid-template-columns: 1fr; }
      .filters-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class AuditLogComponent implements OnInit, OnDestroy {
  entries: AuditEntry[] = [];
  stats: AuditStats | null = null;
  users: any[] = [];
  loading = false;
  autoRefresh = true;
  currentPage = 1;
  totalPages = 1;
  total = 0;
  readonly pageSize = 20;

  filters = { action: '', userId: '', startDate: '', endDate: '', search: '' };

  readonly actions = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGIN_FAILED', 'LOGOUT', 'EXPORT', 'ACCESS'];

  private destroy$ = new Subject<void>();
  private autoRefresh$ = new Subject<void>();
  private searchTimeout: any;

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadUsers();
    this.loadStats();
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    clearTimeout(this.searchTimeout);
  }

  private startAutoRefresh(): void {
    this.autoRefresh$.next(); // cancel previous
    this.autoRefresh$ = new Subject<void>();
    interval(30000).pipe(startWith(0), takeUntil(this.autoRefresh$), takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadEntries();
        this.loadStats();
      });
  }

  toggleAutoRefresh(): void {
    if (this.autoRefresh) {
      this.startAutoRefresh();
    } else {
      this.autoRefresh$.next(); // stop
    }
    if (!this.autoRefresh) this.loadEntries();
  }

  private loadUsers(): void {
    this.api.get<any>('/users').pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.users = (res?.data || res || []).slice(0, 50);
        this.cdr.markForCheck();
      },
      error: () => {}
    });
  }

  private loadStats(): void {
    this.api.get<any>('/audit/stats').pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.stats = res?.data ?? res;
        this.cdr.markForCheck();
      },
      error: () => {}
    });
  }

  loadEntries(page = this.currentPage): void {
    this.loading = true;
    const params: any = { page, limit: this.pageSize };
    if (this.filters.action)    params.action    = this.filters.action;
    if (this.filters.userId)    params.userId    = this.filters.userId;
    if (this.filters.startDate) params.startDate = this.filters.startDate;
    if (this.filters.endDate)   params.endDate   = this.filters.endDate;
    if (this.filters.search)    params.search    = this.filters.search;

    const query = Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v as string)}`).join('&');

    this.api.get<any>(`/audit?${query}`).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        const data = res?.data ?? res;
        this.entries    = data?.items  ?? [];
        this.total      = data?.total  ?? 0;
        this.totalPages = data?.pages  ?? 1;
        this.currentPage = data?.page ?? page;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); }
    });
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadEntries(1);
    this.loadStats();
  }

  onSearchInput(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.applyFilters(), 400);
  }

  resetFilters(): void {
    this.filters = { action: '', userId: '', startDate: '', endDate: '', search: '' };
    this.applyFilters();
  }

  goPage(p: number): void {
    if (p < 1 || p > this.totalPages) return;
    this.currentPage = p;
    this.loadEntries(p);
  }

  exportCsv(): void {
    const params: any = {};
    if (this.filters.action)    params.action    = this.filters.action;
    if (this.filters.userId)    params.userId    = this.filters.userId;
    if (this.filters.startDate) params.startDate = this.filters.startDate;
    if (this.filters.endDate)   params.endDate   = this.filters.endDate;
    if (this.filters.search)    params.search    = this.filters.search;

    const query = Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v as string)}`).join('&');
    const apiUrl = '/api';
    const token  = localStorage.getItem('token') || '';
    const url = `${apiUrl}/audit/export${query ? '?' + query : ''}`;

    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `audit-log-${new Date().toISOString().slice(0,10)}.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
      })
      .catch(() => {});
  }

  getActionClass(action: string): string {
    return ACTION_COLORS[action] ?? 'badge-access';
  }

  getActionLabel(action: string): string {
    return action;
  }
}
