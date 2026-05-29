import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { Subject, interval } from 'rxjs';
import { takeUntil, switchMap, startWith } from 'rxjs/operators';
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
        <div class="sh-card skeleton" *ngFor="let i of [1,2,3,4,5,6]"></div>
      </div>

      <!-- Cards grid -->
      <div class="sh-grid" *ngIf="check || stats">

        <!-- Card 1: Backend status -->
        <div class="sh-card" [class.card-ok]="check?.status === 'ok'" [class.card-err]="check?.status !== 'ok'">
          <div class="card-icon">
            <span class="material-icons">dns</span>
          </div>
          <div class="card-body">
            <h3>{{ 'SYSTEM_HEALTH.BACKEND' | translate }}</h3>
            <div class="status-badge" [class.ok]="check?.status === 'ok'" [class.err]="check?.status !== 'ok'">
              <span class="material-icons">{{ check?.status === 'ok' ? 'check_circle' : 'error' }}</span>
              {{ check?.status === 'ok' ? ('SYSTEM_HEALTH.ONLINE' | translate) : ('SYSTEM_HEALTH.OFFLINE' | translate) }}
            </div>
          </div>
        </div>

        <!-- Card 2: Database -->
        <div class="sh-card" [class.card-ok]="dbStatus === 'up'" [class.card-err]="dbStatus !== 'up'">
          <div class="card-icon">
            <span class="material-icons">storage</span>
          </div>
          <div class="card-body">
            <h3>{{ 'SYSTEM_HEALTH.DATABASE' | translate }}</h3>
            <div class="status-badge" [class.ok]="dbStatus === 'up'" [class.err]="dbStatus !== 'up'">
              <span class="material-icons">{{ dbStatus === 'up' ? 'check_circle' : 'error' }}</span>
              {{ dbStatus === 'up' ? ('SYSTEM_HEALTH.ONLINE' | translate) : ('SYSTEM_HEALTH.OFFLINE' | translate) }}
            </div>
            <p class="card-detail" *ngIf="dbResponseTime != null">
              {{ dbResponseTime }} {{ 'SYSTEM_HEALTH.MS' | translate }}
            </p>
          </div>
        </div>

        <!-- Card 3: Disk usage -->
        <div class="sh-card" [class.card-ok]="diskPercent < 70" [class.card-warn]="diskPercent >= 70 && diskPercent < 90" [class.card-err]="diskPercent >= 90">
          <div class="card-icon">
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
            <p class="card-detail" *ngIf="diskStatus">{{ diskStatus }}</p>
          </div>
        </div>

        <!-- Card 4: Memory (RAM) -->
        <div class="sh-card" *ngIf="stats"
          [class.card-ok]="stats.memory.percent < 70"
          [class.card-warn]="stats.memory.percent >= 70 && stats.memory.percent < 90"
          [class.card-err]="stats.memory.percent >= 90">
          <div class="card-icon">
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
            <p class="card-detail">{{ stats.memory.heapUsedMB }} / {{ stats.memory.heapTotalMB }} MB heap · {{ stats.memory.rssMB }} MB RSS</p>
          </div>
        </div>

        <!-- Card 5: Uptime -->
        <div class="sh-card card-neutral" *ngIf="stats">
          <div class="card-icon">
            <span class="material-icons">timer</span>
          </div>
          <div class="card-body">
            <h3>{{ 'SYSTEM_HEALTH.UPTIME' | translate }}</h3>
            <div class="uptime-value">{{ formatUptime(stats.uptime.seconds) }}</div>
          </div>
        </div>

        <!-- Card 6: DB Counts -->
        <div class="sh-card card-neutral" *ngIf="stats">
          <div class="card-icon">
            <span class="material-icons">bar_chart</span>
          </div>
          <div class="card-body">
            <h3>{{ 'SYSTEM_HEALTH.COUNTS' | translate }}</h3>
            <div class="counts-grid">
              <div class="count-item">
                <span class="count-number">{{ stats.counts.patients }}</span>
                <span class="count-label">{{ 'SYSTEM_HEALTH.PATIENTS' | translate }}</span>
              </div>
              <div class="count-item">
                <span class="count-number">{{ stats.counts.appointments }}</span>
                <span class="count-label">{{ 'SYSTEM_HEALTH.APPOINTMENTS' | translate }}</span>
              </div>
              <div class="count-item">
                <span class="count-number">{{ stats.counts.users }}</span>
                <span class="count-label">{{ 'SYSTEM_HEALTH.USERS' | translate }}</span>
              </div>
              <div class="count-item">
                <span class="count-number">{{ stats.counts.studies }}</span>
                <span class="count-label">{{ 'SYSTEM_HEALTH.STUDIES' | translate }}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- Error state -->
      <div class="sh-error" *ngIf="loadError && !check && !stats">
        <span class="material-icons">cloud_off</span>
        <p>{{ loadError }}</p>
        <button class="btn-refresh" (click)="refresh()">
          <span class="material-icons">refresh</span>
          {{ 'SYSTEM_HEALTH.MANUAL_REFRESH' | translate }}
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
      padding: 8px 16px; border-radius: 12px;
      background: #1a73e8; color: white; border: none;
      font-size: 14px; font-weight: 600; cursor: pointer;
      transition: background 0.2s;
    }
    .btn-refresh:hover:not(:disabled) { background: #1558c0; }
    .btn-refresh:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-refresh .material-icons { font-size: 18px; }

    @keyframes spin { to { transform: rotate(360deg); } }
    .spinning { animation: spin 1s linear infinite; }

    /* ── Grid ── */
    .sh-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
    }

    /* ── Cards ── */
    .sh-card {
      background: white;
      border-radius: 20px;
      padding: 24px;
      display: flex; gap: 16px;
      border: 2px solid transparent;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06);
      transition: transform 0.2s, box-shadow 0.2s;
      animation: fadeUp 0.4s ease both;
    }
    .sh-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.1); }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .card-ok  { border-color: rgba(16,185,129,0.2); }
    .card-warn { border-color: rgba(245,158,11,0.25); }
    .card-err { border-color: rgba(239,68,68,0.2); }
    .card-neutral { border-color: rgba(26,115,232,0.15); }

    .card-icon {
      width: 52px; height: 52px; border-radius: 16px;
      background: #f4f6f9;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .card-ok  .card-icon { background: #e8f5e9; }
    .card-ok  .card-icon .material-icons { color: #10b981; }
    .card-warn .card-icon { background: #fff8e1; }
    .card-warn .card-icon .material-icons { color: #f59e0b; }
    .card-err .card-icon { background: #fce8e6; }
    .card-err .card-icon .material-icons { color: #ef4444; }
    .card-neutral .card-icon { background: #e8f0fe; }
    .card-neutral .card-icon .material-icons { color: #1a73e8; }
    .card-icon .material-icons { font-size: 26px; color: #718096; }

    .card-body { flex: 1; min-width: 0; }
    .card-body h3 {
      font-size: 13px; font-weight: 700; color: #a0aec0;
      text-transform: uppercase; letter-spacing: 0.5px;
      margin: 0 0 10px;
    }

    /* Status badge */
    .status-badge {
      display: inline-flex; align-items: center; gap: 5px;
      font-size: 15px; font-weight: 700; border-radius: 8px;
      padding: 4px 10px;
    }
    .status-badge.ok  { color: #10b981; background: #e8f5e9; }
    .status-badge.err { color: #ef4444; background: #fce8e6; }
    .status-badge .material-icons { font-size: 16px; }

    .card-detail { font-size: 12px; color: #a0aec0; margin: 6px 0 0; }

    /* Progress bar */
    .progress-wrap { display: flex; align-items: center; gap: 10px; }
    .progress-bar {
      flex: 1; height: 10px; background: #f0f4f8; border-radius: 99px; overflow: hidden;
    }
    .progress-fill {
      height: 100%; border-radius: 99px; transition: width 0.5s ease;
    }
    .fill-ok   { background: linear-gradient(90deg, #10b981, #34d399); }
    .fill-warn { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
    .fill-err  { background: linear-gradient(90deg, #ef4444, #f87171); }
    .progress-label { font-size: 13px; font-weight: 700; color: #4a5568; min-width: 38px; text-align: right; }

    /* Uptime */
    .uptime-value {
      font-size: 22px; font-weight: 800; color: #0f2d52;
      font-variant-numeric: tabular-nums;
    }

    /* Counts grid */
    .counts-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
    }
    .count-item {
      background: #f8faff; border-radius: 12px; padding: 10px 12px;
      text-align: center;
    }
    .count-number {
      display: block; font-size: 22px; font-weight: 800; color: #0f2d52;
      line-height: 1.2;
    }
    .count-label {
      display: block; font-size: 11px; color: #a0aec0;
      text-transform: uppercase; letter-spacing: 0.4px; margin-top: 2px;
    }

    /* Skeleton */
    .skeleton {
      min-height: 120px;
      background: linear-gradient(90deg, #f0f4f8 25%, #e2e8f0 50%, #f0f4f8 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }
    @keyframes shimmer { to { background-position: -200% 0; } }

    /* Error state */
    .sh-error {
      text-align: center; padding: 60px 24px; color: #718096;
    }
    .sh-error .material-icons { font-size: 56px; color: #cbd5e0; display: block; margin-bottom: 12px; }
    .sh-error p { font-size: 15px; margin: 0 0 20px; }

    @media (max-width: 600px) {
      .sh-page { padding: 16px; }
      .sh-header { flex-direction: column; }
      .sh-grid { grid-template-columns: 1fr; }
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
    // terminus returns disk info differently; fall back to 0 if not available
    return (disk as any).usedPercent != null
      ? Math.round((disk as any).usedPercent * 100)
      : 0;
  }

  get diskStatus(): string {
    return this.check?.info?.['disk']?.status ?? '';
  }

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    // Auto-refresh every 10 seconds
    interval(10000)
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
    if (d > 0) parts.push(`${d} zile`);
    if (h > 0) parts.push(`${h} ore`);
    parts.push(`${m} minute`);
    return parts.join(', ');
  }
}
