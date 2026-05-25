import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-achievements-section',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <section class="achievements-card">
      <div class="section-header">
        <div class="header-text">
          <h2>
            <span class="material-icons">emoji_events</span>
            {{ 'WELCOME.ACHIEVEMENTS' | translate }}
          </h2>
          <p class="header-subtitle">
            {{ unlockedCount }} / {{ totalCount }} {{ 'WELCOME.ACH.UNLOCKED' | translate }}
          </p>
        </div>

        <!-- Progress circle -->
        <div class="progress-circle" [title]="percent + '%'">
          <svg viewBox="0 0 36 36">
            <path class="circle-bg"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
            <path class="circle-fill"
              [attr.stroke-dasharray]="percent + ', 100'"
              [class.complete]="percent === 100"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
          </svg>
          <div class="progress-text">
            <strong [class.complete]="percent === 100">{{ percent }}%</strong>
          </div>
        </div>
      </div>

      <!-- Production Ready banner -->
      <div class="production-status" [class.ready]="isProductionReady" *ngIf="achievements.length">
        <span class="material-icons">{{ isProductionReady ? 'verified' : 'pending' }}</span>
        <div>
          <strong>{{ isProductionReady
            ? ('WELCOME.ACH.PRODUCTION_READY' | translate)
            : ('WELCOME.ACH.IN_PROGRESS' | translate) }}
          </strong>
          <p>{{ isProductionReady
            ? ('WELCOME.ACH.PRODUCTION_READY_DESC' | translate)
            : (totalCount - unlockedCount) + ' ' + ('WELCOME.ACH.STEPS_LEFT' | translate) }}
          </p>
        </div>
      </div>

      <!-- Achievements grid -->
      <div class="achievements-grid">
        <div class="achievement-item"
          *ngFor="let a of achievements"
          [class.unlocked]="a.unlocked"
          [class.legendary]="a.legendary"
          [style.--ach-color]="a.color">

          <div class="ach-icon">
            <span class="material-icons">{{ a.icon }}</span>
            <div class="ach-glow" *ngIf="a.unlocked"></div>
          </div>

          <div class="ach-info">
            <div class="ach-title">{{ ('WELCOME.ACH.' + getAchKey(a.id)) | translate }}</div>
            <div class="ach-desc">{{ ('WELCOME.ACH.' + getAchKey(a.id) + '_DESC') | translate }}</div>
            <div class="ach-date" *ngIf="a.unlocked && a.unlockedAt">
              <span class="material-icons">check_circle</span>
              {{ formatDate(a.unlockedAt) }}
            </div>
            <div class="ach-locked" *ngIf="!a.unlocked">
              <span class="material-icons">lock</span>
              {{ 'WELCOME.ACH.LOCKED' | translate }}
            </div>
          </div>

          <div class="ach-status">
            <span class="material-icons" *ngIf="a.unlocked">verified</span>
            <span class="material-icons locked-icon" *ngIf="!a.unlocked">lock</span>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; }

    .achievements-card {
      background: white;
      border-radius: 16px;
      padding: 28px;
      margin-top: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      border: 1px solid #e2e8f0;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
      gap: 16px;
    }

    .header-text h2 {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      margin: 0 0 4px;
      color: #0f172a;
      font-size: 18px;
      font-weight: 700;
    }

    .header-text h2 .material-icons { color: #1a73e8; font-size: 22px; }

    .header-subtitle { color: #64748b; font-size: 13px; margin: 0; }

    /* Progress circle */
    .progress-circle {
      position: relative;
      width: 68px;
      height: 68px;
      flex-shrink: 0;
    }

    .progress-circle svg {
      transform: rotate(-90deg);
      width: 100%;
      height: 100%;
    }

    .circle-bg {
      fill: none;
      stroke: #f1f5f9;
      stroke-width: 2.8;
    }

    .circle-fill {
      fill: none;
      stroke: #1a73e8;
      stroke-width: 2.8;
      stroke-linecap: round;
      transition: stroke-dasharray 0.7s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .circle-fill.complete { stroke: #22c55e; }

    .progress-text {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .progress-text strong {
      font-size: 13px;
      font-weight: 700;
      color: #1a73e8;
    }

    .progress-text strong.complete { color: #22c55e; }

    /* Production status banner */
    .production-status {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 16px 18px;
      background: rgba(245, 158, 11, 0.06);
      border: 1px solid rgba(245, 158, 11, 0.25);
      border-radius: 12px;
      margin-bottom: 20px;
      transition: all 0.4s;
    }

    .production-status.ready {
      background: rgba(34, 197, 94, 0.06);
      border-color: rgba(34, 197, 94, 0.3);
    }

    .production-status > .material-icons {
      font-size: 28px;
      color: #f59e0b;
      flex-shrink: 0;
    }

    .production-status.ready > .material-icons { color: #22c55e; }

    .production-status strong {
      display: block;
      color: #0f172a;
      font-size: 14px;
      margin-bottom: 2px;
    }

    .production-status p { margin: 0; color: #64748b; font-size: 12px; }

    /* Achievements grid */
    .achievements-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(280px, 100%), 1fr));
      gap: 10px;
    }

    .achievement-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      background: #f8fafc;
      border: 1px solid transparent;
      border-radius: 12px;
      transition: all 0.2s;
      opacity: 0.55;
      position: relative;
    }

    .achievement-item.unlocked {
      background: white;
      border-color: #e2e8f0;
      opacity: 1;
      box-shadow: 0 1px 4px rgba(0,0,0,0.04);
    }

    .achievement-item.unlocked:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 14px rgba(0,0,0,0.07);
    }

    .achievement-item.unlocked.legendary {
      background: linear-gradient(135deg, rgba(26,115,232,0.05), white);
      border-color: rgba(26,115,232,0.25);
      box-shadow: 0 4px 16px rgba(26,115,232,0.1);
    }

    /* Icon */
    .ach-icon {
      position: relative;
      width: 42px;
      height: 42px;
      border-radius: 11px;
      background: #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .achievement-item.unlocked .ach-icon {
      background: var(--ach-color, #1a73e8);
    }

    .ach-icon .material-icons { font-size: 20px; color: #94a3b8; }
    .achievement-item.unlocked .ach-icon .material-icons { color: white; }

    .ach-glow {
      position: absolute;
      inset: -3px;
      border-radius: 13px;
      background: var(--ach-color, #1a73e8);
      opacity: 0.18;
      filter: blur(6px);
      z-index: -1;
    }

    /* Info */
    .ach-info { flex: 1; min-width: 0; }

    .ach-title {
      font-size: 13px;
      font-weight: 700;
      color: #0f2d52;
      margin-bottom: 1px;
    }

    .achievement-item:not(.unlocked) .ach-title { color: #94a3b8; }

    .ach-desc { font-size: 11px; color: #94a3b8; margin-bottom: 4px; }

    .ach-date {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      font-size: 10px;
      color: #22c55e;
      font-weight: 600;
    }

    .ach-date .material-icons { font-size: 12px; }

    .ach-locked {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      font-size: 10px;
      color: #94a3b8;
    }

    .ach-locked .material-icons { font-size: 12px; }

    /* Status icon */
    .ach-status .material-icons {
      font-size: 18px;
      color: var(--ach-color, #1a73e8);
    }

    .ach-status .locked-icon { color: #cbd5e1; }
  `]
})
export class AchievementsSectionComponent implements OnInit {
  achievements: any[] = [];

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    try {
      const res: any = await firstValueFrom(this.api.get('/welcome/progress'));
      if (res?.data?.achievements) {
        this.achievements = res.data.achievements;
        this.cdr.detectChanges();
      }
    } catch (e) {
      console.error('Failed to load achievements', e);
    }
  }

  get unlockedCount(): number {
    return this.achievements.filter(a => a.unlocked).length;
  }

  get totalCount(): number {
    return this.achievements.length;
  }

  get percent(): number {
    if (this.totalCount === 0) return 0;
    return Math.round((this.unlockedCount / this.totalCount) * 100);
  }

  get isProductionReady(): boolean {
    return this.totalCount > 0 && this.unlockedCount === this.totalCount;
  }

  getAchKey(id: string): string {
    return id.toUpperCase();
  }

  formatDate(d: string): string {
    if (!d) return '';
    return new Date(d).toLocaleDateString('ru-RU', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }
}
