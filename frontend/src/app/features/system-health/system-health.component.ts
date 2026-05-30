import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { Subject, interval } from 'rxjs';
import { takeUntil, startWith } from 'rxjs/operators';
import { forkJoin } from 'rxjs';

interface HealthCheck {
  status: string;
  info?: Record<string, { status: string; responseTime?: number }>;
  error?: Record<string, any>;
}

interface HealthStats {
  uptime: { seconds: number; formatted: string };
  memory: { heapUsedMB: number; heapTotalMB: number; rssMB: number; percent: number };
  counts: { patients: number; appointments: number; users: number; studies: number };
  timestamp: string;
}

@Component({
  selector: 'app-system-health',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="sh-page">
      <div class="bg-decoration"></div>

      <!-- Header -->
      <header class="sh-header">
        <div class="sh-header-left">
          <h1>
            <span class="material-icons">monitor_heart</span>
            {{ 'SYSTEM_HEALTH.TITLE' | translate }}
          </h1>
          <p class="sh-subtitle">{{ 'SYSTEM_HEALTH.SUBTITLE' | translate }}</p>
        </div>
        <div class="sh-header-right">
          <span class="last-update" *ngIf="lastUpdate">
            <span class="material-icons">schedule</span>
            {{ 'SYSTEM_HEALTH.LAST_UPDATE' | translate }}: {{ secondsSinceUpdate }}s
          </span>
          <button class="btn-refresh" (click)="refresh()" [disabled]="loading">
            <span class="material-icons" [class.spinning]="loading">refresh</span>
            {{ 'SYSTEM_HEALTH.MANUAL_REFRESH' | translate }}
          </button>
        </div>
      </header>

      <!-- Loading skeleton -->
      <div class="sh-grid" *ngIf="loading && !check">
        <div class="sh-card skeleton" *ngFor="let i of [1,2,3,4,5]"></div>
        <div class="sh-card skeleton counts-card"></div>
      </div>

      <!-- Cards grid -->
      <div class="sh-grid" *ngIf="check || stats">

        <!-- Card 1: Backend status -->
        <div class="sh-card" [class.card-ok]="check?.status === 'ok'" [class.card-err]="check?.status !== 'ok'" [class.refreshing]="isRefreshing">
          <div class="card-icon-wrap">
            <span class="material-icons">{{ check?.status === 'ok' ? 'cloud_done' : 'cloud_off' }}</span>
          </div>
          <div class="card-body">
            <h3>{{ 'SYSTEM_HEALTH.BACKEND' | translate }}</h3>
            <div class="status-badge" [class.online]="check?.status === 'ok'" [class.offline]="check?.status !== 'ok'">
              <span class="material-icons">{{ check?.status === 'ok' ? 'check_circle' : 'error' }}</span>
              {{ check?.status === 'ok' ? ('SYSTEM_HEALTH.ONLINE' | translate) : ('SYSTEM_HEALTH.OFFLINE' | translate) }}
            </div>
            <div class="error-details" *ngIf="check?.status !== 'ok'">
              <button class="error-toggle" (click)="toggleErrorDetails('backend')">
                <span class="material-icons">{{ expandedErrors.has('backend') ? 'expand_less' : 'expand_more' }}</span>
                {{ (expandedErrors.has('backend') ? 'SYSTEM_HEALTH.HIDE_DETAILS' : 'SYSTEM_HEALTH.SHOW_DETAILS') | translate }}
              </button>
              <div class="error-content" *ngIf="expandedErrors.has('backend')">
                <div class="error-causes">
                  <p class="causes-label">{{ 'SYSTEM_HEALTH.POSSIBLE_CAUSES' | translate }}:</p>
                  <ul>
                    <li *ngFor="let cause of getCauses('backend')">{{ cause | translate }}</li>
                  </ul>
                </div>
                <button class="retry-btn" (click)="refresh()">
                  <span class="material-icons">refresh</span>
                  {{ 'SYSTEM_HEALTH.RETRY' | translate }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Card 2: Database -->
        <div class="sh-card" [class.card-ok]="dbStatus === 'up'" [class.card-err]="dbStatus !== 'up'" [class.refreshing]="isRefreshing">
          <div class="card-icon-wrap">
            <span class="material-icons">storage</span>
          </div>
          <div class="card-body">
            <h3>{{ 'SYSTEM_HEALTH.DATABASE' | translate }}</h3>
            <div class="status-badge" [class.online]="dbStatus === 'up'" [class.offline]="dbStatus !== 'up'">
              <span class="material-icons">{{ dbStatus === 'up' ? 'check_circle' : 'error' }}</span>
              {{ dbStatus === 'up' ? ('SYSTEM_HEALTH.ONLINE' | translate) : ('SYSTEM_HEALTH.OFFLINE' | translate) }}
            </div>
            <p class="card-detail" *ngIf="dbResponseTime != null">
              <span class="material-icons" style="font-size:13px;vertical-align:middle">speed</span>
              {{ dbResponseTime }} {{ 'SYSTEM_HEALTH.MS' | translate }}
            </p>
            <div class="error-details" *ngIf="dbStatus !== 'up'">
              <button class="error-toggle" (click)="toggleErrorDetails('database')">
                <span class="material-icons">{{ expandedErrors.has('database') ? 'expand_less' : 'expand_more' }}</span>
                {{ (expandedErrors.has('database') ? 'SYSTEM_HEALTH.HIDE_DETAILS' : 'SYSTEM_HEALTH.SHOW_DETAILS') | translate }}
              </button>
              <div class="error-content" *ngIf="expandedErrors.has('database')">
                <div class="error-causes">
                  <p class="causes-label">{{ 'SYSTEM_HEALTH.POSSIBLE_CAUSES' | translate }}:</p>
                  <ul>
                    <li *ngFor="let cause of getCauses('database')">{{ cause | translate }}</li>
                  </ul>
                </div>
                <button class="retry-btn" (click)="refresh()">
                  <span class="material-icons">refresh</span>
                  {{ 'SYSTEM_HEALTH.RETRY' | translate }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Card 3: Disk usage -->
        <div class="sh-card"
          [class.card-ok]="diskPercent < 70"
          [class.card-warn]="diskPercent >= 70 && diskPercent < 90"
          [class.card-err]="diskPercent >= 90"
          [class.refreshing]="isRefreshing">
          <div class="card-icon-wrap">
            <span class="material-icons">hard_drive</span>
          </div>
          <div class="card-body">
            <h3>{{ 'SYSTEM_HEALTH.DISK_USAGE' | translate }}</h3>
            <div class="progress-wrap">
              <div class="progress-bar">
                <div class="progress-fill"
                  [style.width]="diskPercent + '%'"
                  [class.fill-ok]="diskPercent < 70"
                  [class.fill-warn]="diskPercent >= 70 && diskPercent < 90"
                  [class.fill-err]="diskPercent >= 90">
                </div>
              </div>
              <span class="progress-label">{{ diskPercent }}%</span>
            </div>
            <div class="error-details" *ngIf="diskPercent >= 90">
              <button class="error-toggle" (click)="toggleErrorDetails('disk')">
                <span class="material-icons">{{ expandedErrors.has('disk') ? 'expand_less' : 'expand_more' }}</span>
                {{ (expandedErrors.has('disk') ? 'SYSTEM_HEALTH.HIDE_DETAILS' : 'SYSTEM_HEALTH.SHOW_DETAILS') | translate }}
              </button>
              <div class="error-content" *ngIf="expandedErrors.has('disk')">
                <div class="error-causes">
                  <p class="causes-label">{{ 'SYSTEM_HEALTH.POSSIBLE_CAUSES' | translate }}:</p>
                  <ul>
                    <li *ngFor="let cause of getCauses('disk')">{{ cause | translate }}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Card 4: Memory (RAM) -->
        <div class="sh-card" *ngIf="stats"
          [class.card-ok]="stats.memory.percent < 70"
          [class.card-warn]="stats.memory.percent >= 70 && stats.memory.percent < 90"
          [class.card-err]="stats.memory.percent >= 90"
          [class.refreshing]="isRefreshing">
          <div class="card-icon-wrap">
            <span class="material-icons">memory</span>
          </div>
          <div class="card-body">
            <h3>{{ 'SYSTEM_HEALTH.MEMORY' | translate }}</h3>
            <div class="progress-wrap">
              <div class="progress-bar">
                <div class="progress-fill"
                  [style.width]="stats.memory.percent + '%'"
                  [class.fill-ok]="stats.memory.percent < 70"
                  [class.fill-warn]="stats.memory.percent >= 70 && stats.memory.percent < 90"
                  [class.fill-err]="stats.memory.percent >= 90">
                </div>
              </div>
              <span class="progress-label">{{ stats.memory.percent }}%</span>
            </div>
            <p class="card-detail">{{ stats.memory.heapUsedMB }} / {{ stats.memory.heapTotalMB }} MB</p>
            <div class="error-details" *ngIf="stats.memory.percent >= 90">
              <button class="error-toggle" (click)="toggleErrorDetails('memory')">
                <span class="material-icons">{{ expandedErrors.has('memory') ? 'expand_less' : 'expand_more' }}</span>
                {{ (expandedErrors.has('memory') ? 'SYSTEM_HEALTH.HIDE_DETAILS' : 'SYSTEM_HEALTH.SHOW_DETAILS') | translate }}
              </button>
              <div class="error-content" *ngIf="expandedErrors.has('memory')">
                <div class="error-causes">
                  <p class="causes-label">{{ 'SYSTEM_HEALTH.POSSIBLE_CAUSES' | translate }}:</p>
                  <ul>
                    <li *ngFor="let cause of getCauses('memory')">{{ cause | translate }}</li>
                  </ul>
                </div>
                <button class="retry-btn" (click)="refresh()">
                  <span class="material-icons">refresh</span>
                  {{ 'SYSTEM_HEALTH.RETRY' | translate }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Card 5: Uptime -->
        <div class="sh-card card-neutral" *ngIf="stats" [class.refreshing]="isRefreshing">
          <div class="card-icon-wrap">
            <span class="material-icons">schedule</span>
          </div>
          <div class="card-body">
            <h3>{{ 'SYSTEM_HEALTH.UPTIME' | translate }}</h3>
            <div class="uptime-value">{{ formatUptime(stats.uptime.seconds) }}</div>
          </div>
        </div>

        <!-- Card 6: DB Counts — spans 2 columns -->
        <div class="sh-card card-neutral counts-card" *ngIf="stats" [class.refreshing]="isRefreshing">
          <div class="card-header-row">
            <div class="card-icon-wrap">
              <span class="material-icons">analytics</span>
            </div>
            <h3>{{ 'SYSTEM_HEALTH.DB_COUNTS' | translate }}</h3>
          </div>
          <div class="counts-grid">
            <div class="count-item">
              <span class="material-icons count-icon">person</span>
              <div class="count-number">{{ stats.counts.patients }}</div>
              <div class="count-label">{{ 'SYSTEM_HEALTH.PATIENTS' | translate }}</div>
            </div>
            <div class="count-item">
              <span class="material-icons count-icon">event</span>
              <div class="count-number">{{ stats.counts.appointments }}</div>
              <div class="count-label">{{ 'SYSTEM_HEALTH.APPOINTMENTS' | translate }}</div>
            </div>
            <div class="count-item">
              <span class="material-icons count-icon">group</span>
              <div class="count-number">{{ stats.counts.users }}</div>
              <div class="count-label">{{ 'SYSTEM_HEALTH.USERS' | translate }}</div>
            </div>
            <div class="count-item">
              <span class="material-icons count-icon">image</span>
              <div class="count-number">{{ stats.counts.studies }}</div>
              <div class="count-label">{{ 'SYSTEM_HEALTH.STUDIES' | translate }}</div>
            </div>
          </div>
        </div>

      </div>

      <!-- Full error state (no data at all) -->
      <div class="sh-error" *ngIf="loadError && !check && !stats">
        <span class="material-icons">cloud_off</span>
        <p>{{ loadError }}</p>
        <button class="btn-refresh" (click)="refresh()">
          <span class="material-icons">refresh</span>
          {{ 'SYSTEM_HEALTH.RETRY' | translate }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .sh-page {
      padding: 24px;
      position: relative;
      min-height: 100vh;
      background: #f8faff;
    }

    .bg-decoration {
      position: fixed;
      top: -200px; right: -200px;
      width: 600px; height: 600px;
      background: radial-gradient(circle, rgba(26,115,232,0.06) 0%, transparent 70%);
      pointer-events: none;
    }

    /* ── Header ── */
    .sh-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      margin-bottom: 28px; flex-wrap: wrap; gap: 16px;
    }
    .sh-header h1 {
      display: flex; align-items: center; gap: 12px;
      font-size: 26px; font-weight: 800; color: #0f2d52; margin: 0 0 4px;
    }
    .sh-header h1 .material-icons { font-size: 30px; color: #1a73e8; }
    .sh-subtitle { font-size: 14px; color: #718096; margin: 0; }

    .sh-header-right {
      display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
    }

    .last-update {
      display: flex; align-items: center; gap: 5px;
      font-size: 13px; color: #a0aec0; background: #fff;
      border-radius: 10px; padding: 6px 12px;
      border: 1px solid #e2e8f0;
    }
    .last-update .material-icons { font-size: 15px; }

    .btn-refresh {
      display: flex; align-items: center; gap: 6px;
      padding: 8px 18px; border-radius: 12px;
      background: #1a73e8; color: white; border: none;
      font-size: 14px; font-weight: 600; cursor: pointer;
      transition: background 0.2s, transform 0.1s;
    }
    .btn-refresh:hover:not(:disabled) { background: #1558c0; transform: translateY(-1px); }
    .btn-refresh:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-refresh .material-icons { font-size: 18px; }

    @keyframes spin { to { transform: rotate(360deg); } }
    .spinning { animation: spin 1s linear infinite; }

    /* ── Grid ── */
    .sh-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
      max-width: 1400px;
      margin: 0 auto;
    }

    /* ── Cards ── */
    .sh-card {
      background: white;
      border-radius: 20px;
      padding: 24px;
      display: flex; gap: 16px;
      border: 2px solid transparent;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06);
      transition: transform 0.25s cubic-bezier(0.4,0,0.2,1),
                  box-shadow 0.25s cubic-bezier(0.4,0,0.2,1),
                  border-color 0.25s;
      animation: fadeUp 0.4s ease both;
    }
    .sh-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 10px 28px rgba(0,0,0,0.1);
    }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(14px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    @keyframes refresh-flash {
      0%   { background: white; }
      40%  { background: rgba(26, 115, 232, 0.05); }
      100% { background: white; }
    }
    .sh-card.refreshing { animation: refresh-flash 0.6s ease; }

    .card-ok     { border-color: rgba(16,185,129,0.25); }
    .card-warn   { border-color: rgba(245,158,11,0.30); }
    .card-err    { border-color: rgba(239,68,68,0.25); }
    .card-neutral{ border-color: rgba(26,115,232,0.18); }

    /* Card icon */
    .card-icon-wrap {
      width: 52px; height: 52px; min-width: 52px; border-radius: 16px;
      background: #f4f6f9;
      display: flex; align-items: center; justify-content: center;
    }
    .card-icon-wrap .material-icons { font-size: 26px; color: #718096; }

    .card-ok   .card-icon-wrap { background: #e8f5e9; }
    .card-ok   .card-icon-wrap .material-icons { color: #10b981; }
    .card-warn .card-icon-wrap { background: #fff8e1; }
    .card-warn .card-icon-wrap .material-icons { color: #f59e0b; }
    .card-err  .card-icon-wrap { background: #fce8e6; }
    .card-err  .card-icon-wrap .material-icons { color: #ef4444; }
    .card-neutral .card-icon-wrap { background: #e8f0fe; }
    .card-neutral .card-icon-wrap .material-icons { color: #1a73e8; }

    .card-body { flex: 1; min-width: 0; }
    .card-body h3 {
      font-size: 12px; font-weight: 700; color: #a0aec0;
      text-transform: uppercase; letter-spacing: 0.6px;
      margin: 0 0 10px;
    }

    /* Status badge */
    .status-badge {
      display: inline-flex; align-items: center; gap: 6px;
      font-size: 14px; font-weight: 700; border-radius: 20px;
      padding: 5px 12px;
    }
    .status-badge.online  { color: #059669; background: rgba(16,185,129,0.10); }
    .status-badge.online::before {
      content: ''; width: 7px; height: 7px; border-radius: 50%;
      background: #10b981; animation: pulse 2s infinite; flex-shrink: 0;
    }
    .status-badge.offline { color: #dc2626; background: rgba(239,68,68,0.10); }
    .status-badge .material-icons { font-size: 16px; }

    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50%       { opacity: 0.5; transform: scale(1.3); }
    }

    .card-detail { font-size: 12px; color: #a0aec0; margin: 6px 0 0; display: flex; align-items: center; gap: 4px; }

    /* Progress bar */
    .progress-wrap { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
    .progress-bar {
      flex: 1; height: 10px; background: #f0f4f8; border-radius: 99px; overflow: hidden;
    }
    .progress-fill {
      height: 100%; border-radius: 99px;
      transition: width 0.6s cubic-bezier(0.4,0,0.2,1);
    }
    .fill-ok   { background: linear-gradient(90deg, #10b981, #34d399); }
    .fill-warn { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
    .fill-err  { background: linear-gradient(90deg, #ef4444, #f87171); }
    .progress-label {
      font-size: 13px; font-weight: 700; color: #4a5568; min-width: 38px; text-align: right;
    }

    /* Uptime */
    .uptime-value {
      font-size: 20px; font-weight: 800; color: #0f2d52;
      font-variant-numeric: tabular-nums;
    }

    /* ── DB Counts card ── */
    .counts-card {
      grid-column: span 2;
      flex-direction: column;
      gap: 16px;
    }
    .card-header-row {
      display: flex; align-items: center; gap: 12px;
    }
    .card-header-row h3 { margin: 0; }
    .counts-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
    }
    .count-item {
      text-align: center;
      padding: 16px 8px;
      background: rgba(26, 115, 232, 0.04);
      border-radius: 14px;
      transition: background 0.2s, transform 0.2s;
      cursor: default;
    }
    .count-item:hover {
      background: rgba(26, 115, 232, 0.09);
      transform: translateY(-2px);
    }
    .count-icon {
      display: block;
      font-size: 22px !important;
      color: #1a73e8;
      margin-bottom: 6px;
    }
    .count-number {
      display: block; font-size: 28px; font-weight: 800; color: #1a73e8;
      line-height: 1.1; margin-bottom: 4px;
    }
    .count-label {
      display: block; font-size: 11px; color: #64748b;
      text-transform: uppercase; letter-spacing: 0.5px;
    }

    /* ── Error details ── */
    .error-details { margin-top: 12px; }
    .error-toggle {
      background: rgba(239, 68, 68, 0.07);
      border: 1px solid rgba(239, 68, 68, 0.2);
      color: #dc2626;
      padding: 7px 12px;
      border-radius: 8px;
      cursor: pointer;
      display: flex; align-items: center; gap: 6px;
      font-size: 12px; font-weight: 600;
      width: 100%; justify-content: center;
      transition: background 0.2s;
    }
    .error-toggle:hover { background: rgba(239, 68, 68, 0.13); }
    .error-toggle .material-icons { font-size: 16px; }

    .error-content {
      margin-top: 10px;
      padding: 14px;
      background: rgba(239, 68, 68, 0.04);
      border-radius: 10px;
      border-left: 3px solid #dc2626;
    }
    .causes-label {
      font-size: 12px; font-weight: 600; color: #64748b;
      margin: 0 0 6px; text-transform: uppercase; letter-spacing: 0.4px;
    }
    .error-causes ul {
      list-style: none; padding: 0; margin: 0 0 10px;
    }
    .error-causes li {
      padding: 5px 0 5px 18px;
      position: relative;
      font-size: 12px; color: #64748b;
    }
    .error-causes li::before {
      content: '•'; position: absolute; left: 4px; color: #ef4444;
    }
    .retry-btn {
      background: white; border: 1px solid #ef4444; color: #dc2626;
      padding: 7px 14px; border-radius: 8px; cursor: pointer;
      display: inline-flex; align-items: center; gap: 6px;
      font-size: 12px; font-weight: 600; transition: all 0.2s;
    }
    .retry-btn:hover { background: #ef4444; color: white; }
    .retry-btn .material-icons { font-size: 15px; }

    /* ── Skeleton ── */
    .skeleton {
      min-height: 120px;
      background: linear-gradient(90deg, #f0f4f8 25%, #e2e8f0 50%, #f0f4f8 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }
    @keyframes shimmer { to { background-position: -200% 0; } }

    /* ── Error state ── */
    .sh-error {
      text-align: center; padding: 60px 24px; color: #718096;
    }
    .sh-error .material-icons { font-size: 56px; color: #cbd5e0; display: block; margin-bottom: 12px; }
    .sh-error p { font-size: 15px; margin: 0 0 20px; }

    /* ── Mobile responsive ── */
    @media (max-width: 768px) {
      .sh-page { padding: 16px; }
      .sh-header { flex-direction: column; }
      .sh-grid {
        grid-template-columns: 1fr;
        gap: 12px;
      }
      .counts-card { grid-column: span 1; }
      .counts-grid { grid-template-columns: repeat(2, 1fr); }
      .sh-card { padding: 16px; }
      .count-number { font-size: 22px; }
    }

    @media (max-width: 480px) {
      .sh-header h1 { font-size: 20px; }
      .sh-header h1 .material-icons { font-size: 24px; }
      .btn-refresh span:last-child { display: none; }
    }
  `]
})
export class SystemHealthComponent implements OnInit, OnDestroy {
  check: HealthCheck | null = null;
  stats: HealthStats | null = null;
  loading = false;
  loadError = '';
  lastUpdate: Date | null = null;
  secondsSinceUpdate = 0;
  isRefreshing = false;
  expandedErrors = new Set<string>();

  private destroy$ = new Subject<void>();
  private ticker: any;

  get dbStatus(): string {
    return this.check?.info?.['database']?.status ?? 'unknown';
  }

  get dbResponseTime(): number | null {
    const rt = (this.check?.info?.['database'] as any)?.responseTime;
    return rt != null ? Math.round(rt) : null;
  }

  get diskPercent(): number {
    const disk = this.check?.info?.['disk'];
    if (!disk) return 0;
    return (disk as any).usedPercent != null
      ? Math.round((disk as any).usedPercent * 100)
      : 0;
  }

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    // Auto-refresh every 30 seconds
    interval(30000)
      .pipe(startWith(0), takeUntil(this.destroy$))
      .subscribe(() => this.load());

    // Update "seconds since update" counter every second
    this.ticker = setInterval(() => {
      if (this.lastUpdate) {
        this.secondsSinceUpdate = Math.floor((Date.now() - this.lastUpdate.getTime()) / 1000);
        this.cdr.markForCheck();
      }
    }, 1000);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    clearInterval(this.ticker);
  }

  refresh(): void {
    this.load();
  }

  toggleErrorDetails(cardId: string): void {
    const next = new Set(this.expandedErrors);
    next.has(cardId) ? next.delete(cardId) : next.add(cardId);
    this.expandedErrors = next;
    this.cdr.markForCheck();
  }

  getCauses(errorType: string): string[] {
    const causes: Record<string, string[]> = {
      backend: [
        'SYSTEM_HEALTH.CAUSE.DB_CONTAINER_DOWN',
        'SYSTEM_HEALTH.CAUSE.DB_NETWORK',
      ],
      database: [
        'SYSTEM_HEALTH.CAUSE.DB_CONTAINER_DOWN',
        'SYSTEM_HEALTH.CAUSE.DB_NETWORK',
        'SYSTEM_HEALTH.CAUSE.DB_CREDENTIALS',
      ],
      disk: [
        'SYSTEM_HEALTH.CAUSE.DISK_LOGS',
        'SYSTEM_HEALTH.CAUSE.DISK_BACKUPS',
        'SYSTEM_HEALTH.CAUSE.DISK_DICOM',
      ],
      memory: [
        'SYSTEM_HEALTH.CAUSE.MEMORY_LEAK',
        'SYSTEM_HEALTH.CAUSE.MEMORY_LOAD',
      ],
    };
    return causes[errorType] || [];
  }

  private load(): void {
    this.loading = true;
    this.loadError = '';

    forkJoin({
      check: this.api.get<any>('/health/check'),
      stats: this.api.get<any>('/health/stats'),
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: ({ check, stats }) => {
        this.check = (check?.data ?? check) as HealthCheck;
        this.stats = (stats?.data ?? stats) as HealthStats;
        this.loading = false;
        this.lastUpdate = new Date();
        this.secondsSinceUpdate = 0;

        // Trigger refresh-flash animation
        this.isRefreshing = true;
        setTimeout(() => {
          this.isRefreshing = false;
          this.cdr.markForCheck();
        }, 650);

        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loading = false;
        this.loadError = err?.error?.error?.message || 'Eroare la încărcarea datelor';
        this.cdr.markForCheck();
      }
    });
  }

  formatUptime(seconds: number): string {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const parts: string[] = [];
    if (d > 0) parts.push(`${d}d`);
    if (h > 0) parts.push(`${h}h`);
    parts.push(`${m}m`);
    return parts.join(' ');
  }
}
