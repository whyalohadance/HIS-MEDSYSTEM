import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="welcome-page">

      <div class="bg-decoration"></div>

      <!-- ШАПКА -->
      <header class="welcome-header">
        <div class="header-content">
          <h1>
            <span class="wave">👋</span>
            {{ 'WELCOME.GREETING' | translate }} <span class="user-name">{{ userName }}</span>!
          </h1>
          <p class="welcome-subtitle" *ngIf="clinicName">
            <span class="material-icons">business</span>
            {{ clinicName }}
            <span *ngIf="clinicCity">· {{ clinicCity }}</span>
          </p>
        </div>

        <button class="btn-skip-to-work" (click)="skipToWork()">
          <span>{{ 'WELCOME.TO_WORK' | translate }}</span>
          <span class="material-icons">arrow_forward</span>
        </button>
      </header>

      <!-- ПРОГРЕСС -->
      <section class="progress-section">
        <div class="progress-header">
          <div class="progress-info">
            <h2>{{ 'WELCOME.SETUP_TITLE' | translate }}</h2>
            <p>{{ progress?.completed || 0 }} {{ 'WELCOME.OF' | translate }} {{ progress?.total || 7 }} {{ 'WELCOME.STEPS_DONE' | translate }}</p>
          </div>
          <div class="progress-percent" [class.complete]="progress?.isComplete">
            <div class="percent-value">{{ progress?.percent || 0 }}%</div>
            <div class="percent-label" *ngIf="!progress?.isComplete">{{ 'WELCOME.PROGRESS' | translate }}</div>
            <div class="percent-label complete-label" *ngIf="progress?.isComplete">
              <span class="material-icons">verified</span>
              {{ 'WELCOME.DONE' | translate }}
            </div>
          </div>
        </div>

        <div class="progress-bar">
          <div class="progress-fill"
            [style.width.%]="progress?.percent || 0"
            [class.complete]="progress?.isComplete"></div>
        </div>
      </section>

      <!-- ЧЕКЛИСТ -->
      <section class="checklist-section">
        <h2>
          <span class="material-icons">checklist</span>
          {{ 'WELCOME.WHAT_TO_DO' | translate }}
        </h2>

        <div class="checklist">
          <div class="check-item"
            *ngFor="let item of checklist; let i = index"
            [class.completed]="item.completed">

            <div class="check-icon">
              <span class="material-icons" *ngIf="item.completed">check_circle</span>
              <span class="material-icons" *ngIf="!item.completed">{{ item.icon }}</span>
            </div>

            <div class="check-content">
              <div class="check-title">
                <span>{{ item.title }}</span>
                <span class="check-progress" *ngIf="!item.completed && item.target > 1">
                  {{ item.current }} / {{ item.target }}
                </span>
              </div>
              <div class="check-description">{{ item.description }}</div>
              <div class="mini-progress" *ngIf="!item.completed && item.target > 1">
                <div class="mini-fill" [style.width.%]="(item.current / item.target) * 100"></div>
              </div>
            </div>

            <button class="check-action"
              (click)="goTo(item.route)"
              *ngIf="!item.completed">
              <span>Перейти</span>
              <span class="material-icons">arrow_forward</span>
            </button>

            <div class="check-done" *ngIf="item.completed">
              <span class="material-icons">done</span>
            </div>
          </div>
        </div>
      </section>

      <!-- ACHIEVEMENTS -->
      <section class="achievements-section">
        <h2>
          <span class="material-icons">emoji_events</span>
          Достижения
          <span class="achievement-count">
            {{ unlockedCount }} / {{ totalAchievements }}
          </span>
        </h2>

        <div class="achievements-grid">
          <div class="achievement"
            *ngFor="let a of achievements"
            [class.unlocked]="a.unlocked"
            [class.legendary]="a.legendary"
            [style.--ach-color]="a.color">

            <div class="ach-icon-wrap">
              <div class="ach-icon">
                <span class="material-icons">{{ a.icon }}</span>
              </div>
              <div class="ach-glow" *ngIf="a.unlocked"></div>
            </div>

            <div class="ach-info">
              <div class="ach-title">{{ a.title }}</div>
              <div class="ach-desc">{{ a.description }}</div>
            </div>

            <div class="ach-status">
              <span class="material-icons" *ngIf="a.unlocked">verified</span>
              <span class="material-icons locked" *ngIf="!a.unlocked">lock</span>
            </div>
          </div>
        </div>
      </section>

      <!-- СТАТИСТИКА -->
      <section class="quick-stats">
        <h2>
          <span class="material-icons">insights</span>
          Текущее состояние
        </h2>

        <div class="stats-grid">
          <div class="stat-card">
            <span class="material-icons">people</span>
            <div class="stat-value">{{ stats?.usersCount || 0 }}</div>
            <div class="stat-label">Сотрудников</div>
          </div>
          <div class="stat-card">
            <span class="material-icons">medical_services</span>
            <div class="stat-value">{{ stats?.doctorCount || 0 }}</div>
            <div class="stat-label">Врачей</div>
          </div>
          <div class="stat-card">
            <span class="material-icons">meeting_room</span>
            <div class="stat-value">{{ stats?.roomsCount || 0 }}</div>
            <div class="stat-label">Кабинетов</div>
          </div>
          <div class="stat-card">
            <span class="material-icons">biotech</span>
            <div class="stat-value">{{ stats?.testsCount || 0 }}</div>
            <div class="stat-label">Тестов</div>
          </div>
          <div class="stat-card">
            <span class="material-icons">person</span>
            <div class="stat-value">{{ stats?.patientsCount || 0 }}</div>
            <div class="stat-label">Пациентов</div>
          </div>
          <div class="stat-card">
            <span class="material-icons">event</span>
            <div class="stat-value">{{ stats?.appointmentsCount || 0 }}</div>
            <div class="stat-label">Приёмов</div>
          </div>
        </div>
      </section>

      <!-- COMPLETION CELEBRATION -->
      <div class="celebration" *ngIf="progress?.isComplete">
        <div class="celebration-content">
          <span class="celebration-icon">🎉</span>
          <h2>Поздравляем!</h2>
          <p>Все шаги настройки выполнены. Система полностью готова к работе.</p>
          <button class="btn-go-dashboard" (click)="skipToWork()">
            <span class="material-icons">rocket_launch</span>
            Перейти к работе
          </button>
        </div>
      </div>

      <!-- FOOTER -->
      <footer class="welcome-footer">
        <button class="btn-link" (click)="skipToWork()">
          <span class="material-icons">trending_flat</span>
          Пропустить и перейти в Dashboard
        </button>
        <p class="footer-text">
          Этот экран всегда доступен в меню «Welcome»
        </p>
      </footer>

    </div>
  `,
  styles: [`
    :host { display: block; }

    .welcome-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #0a0e1a 0%, #131927 100%);
      color: #e2e8f0;
      padding: 32px;
      position: relative;
      overflow: hidden;
    }

    .bg-decoration {
      position: fixed;
      inset: 0;
      background:
        radial-gradient(circle at 10% 20%, rgba(213, 0, 28, 0.06) 0%, transparent 50%),
        radial-gradient(circle at 90% 80%, rgba(26, 115, 232, 0.06) 0%, transparent 50%);
      z-index: 0;
      pointer-events: none;
    }

    .welcome-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      max-width: 1200px;
      margin: 0 auto 40px;
      position: relative;
      z-index: 1;
    }

    .header-content h1 {
      font-size: 32px;
      font-weight: 800;
      margin: 0 0 8px;
      color: #fff;
      letter-spacing: -0.5px;
    }

    .wave {
      display: inline-block;
      animation: wave 2s infinite;
      transform-origin: 70% 70%;
    }

    @keyframes wave {
      0%, 100% { transform: rotate(0deg); }
      10%, 30% { transform: rotate(14deg); }
      20% { transform: rotate(-8deg); }
      40% { transform: rotate(-4deg); }
      50% { transform: rotate(10deg); }
      60% { transform: rotate(0deg); }
    }

    .user-name {
      background: linear-gradient(135deg, #D5001C, #ff6b6b);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .welcome-subtitle {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      color: #94a3b8;
      font-size: 14px;
      margin: 0;
    }

    .welcome-subtitle .material-icons {
      font-size: 18px;
      color: #D5001C;
    }

    .btn-skip-to-work {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 10px 20px;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 10px;
      color: #94a3b8;
      cursor: pointer;
      font-family: inherit;
      font-size: 13px;
      font-weight: 600;
      transition: all 0.15s;
    }

    .btn-skip-to-work:hover {
      background: rgba(255,255,255,0.08);
      color: #fff;
    }

    section {
      max-width: 1200px;
      margin: 0 auto 32px;
      position: relative;
      z-index: 1;
    }

    section h2 {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      font-size: 18px;
      margin: 0 0 16px;
      color: #fff;
    }

    section h2 .material-icons {
      color: #D5001C;
      font-size: 22px;
    }

    .progress-section {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 20px;
      padding: 28px;
    }

    .progress-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .progress-info h2 {
      margin: 0 0 4px;
      font-size: 20px;
    }

    .progress-info p {
      margin: 0;
      color: #94a3b8;
      font-size: 14px;
    }

    .progress-percent {
      text-align: right;
    }

    .percent-value {
      font-size: 36px;
      font-weight: 800;
      line-height: 1;
      background: linear-gradient(135deg, #D5001C, #ff6b6b);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .progress-percent.complete .percent-value {
      background: linear-gradient(135deg, #22c55e, #16a34a);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .percent-label {
      font-size: 12px;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 4px;
    }

    .complete-label {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      color: #22c55e !important;
    }

    .complete-label .material-icons {
      font-size: 14px;
    }

    .progress-bar {
      height: 8px;
      background: rgba(255,255,255,0.05);
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #D5001C, #ff6b6b);
      transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 0 12px rgba(213, 0, 28, 0.5);
    }

    .progress-fill.complete {
      background: linear-gradient(90deg, #22c55e, #16a34a);
      box-shadow: 0 0 12px rgba(34, 197, 94, 0.5);
    }

    .checklist {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .check-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px 20px;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.05);
      border-radius: 14px;
      transition: all 0.2s;
    }

    .check-item:hover:not(.completed) {
      border-color: rgba(213, 0, 28, 0.3);
      background: rgba(213, 0, 28, 0.05);
      transform: translateX(4px);
    }

    .check-item.completed {
      background: rgba(34, 197, 94, 0.05);
      border-color: rgba(34, 197, 94, 0.2);
    }

    .check-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: rgba(255,255,255,0.05);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .check-item.completed .check-icon {
      background: rgba(34, 197, 94, 0.15);
    }

    .check-icon .material-icons {
      font-size: 22px;
      color: #94a3b8;
    }

    .check-item.completed .check-icon .material-icons {
      color: #22c55e;
    }

    .check-content {
      flex: 1;
      min-width: 0;
    }

    .check-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 15px;
      font-weight: 600;
      color: #fff;
      margin-bottom: 4px;
    }

    .check-item.completed .check-title {
      color: #94a3b8;
      text-decoration: line-through;
    }

    .check-progress {
      padding: 2px 8px;
      background: rgba(213, 0, 28, 0.15);
      color: #ff6b6b;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 700;
    }

    .check-description {
      font-size: 13px;
      color: #94a3b8;
    }

    .mini-progress {
      margin-top: 8px;
      height: 3px;
      background: rgba(255,255,255,0.05);
      border-radius: 2px;
      overflow: hidden;
    }

    .mini-fill {
      height: 100%;
      background: #D5001C;
      transition: width 0.5s;
    }

    .check-action {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      background: rgba(213, 0, 28, 0.1);
      border: 1px solid rgba(213, 0, 28, 0.2);
      border-radius: 10px;
      color: #ff6b6b;
      cursor: pointer;
      font-family: inherit;
      font-size: 12px;
      font-weight: 600;
      transition: all 0.15s;
    }

    .check-action:hover {
      background: #D5001C;
      color: white;
    }

    .check-action .material-icons {
      font-size: 16px;
    }

    .check-done {
      color: #22c55e;
    }

    .check-done .material-icons {
      font-size: 24px;
    }

    .achievement-count {
      margin-left: auto;
      padding: 4px 12px;
      background: rgba(213, 0, 28, 0.1);
      border-radius: 10px;
      color: #ff6b6b;
      font-size: 12px;
      font-weight: 700;
    }

    .achievements-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 12px;
    }

    .achievement {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 16px;
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.05);
      border-radius: 14px;
      position: relative;
      transition: all 0.2s;
      opacity: 0.5;
    }

    .achievement.unlocked {
      opacity: 1;
      background: rgba(255,255,255,0.04);
      border-color: rgba(255,255,255,0.1);
    }

    .achievement.unlocked.legendary {
      background: linear-gradient(135deg, rgba(213, 0, 28, 0.08), rgba(213, 0, 28, 0.02));
      border-color: rgba(213, 0, 28, 0.3);
      box-shadow: 0 4px 20px rgba(213, 0, 28, 0.15);
    }

    .ach-icon-wrap {
      position: relative;
      flex-shrink: 0;
    }

    .ach-icon {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      background: rgba(255,255,255,0.05);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .achievement.unlocked .ach-icon {
      background: var(--ach-color, #D5001C);
      box-shadow: 0 4px 16px color-mix(in srgb, var(--ach-color, #D5001C) 40%, transparent);
    }

    .ach-icon .material-icons {
      font-size: 24px;
      color: #64748b;
    }

    .achievement.unlocked .ach-icon .material-icons {
      color: white;
    }

    .ach-glow {
      position: absolute;
      inset: -4px;
      background: var(--ach-color, #D5001C);
      border-radius: 16px;
      opacity: 0.2;
      filter: blur(8px);
      z-index: -1;
    }

    .ach-info {
      flex: 1;
      min-width: 0;
    }

    .ach-title {
      font-size: 14px;
      font-weight: 700;
      color: #fff;
      margin-bottom: 2px;
    }

    .achievement:not(.unlocked) .ach-title {
      color: #64748b;
    }

    .ach-desc {
      font-size: 12px;
      color: #94a3b8;
    }

    .ach-status .material-icons {
      font-size: 20px;
      color: var(--ach-color, #D5001C);
    }

    .ach-status .locked {
      color: #475569;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 12px;
    }

    .stat-card {
      padding: 18px;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.05);
      border-radius: 12px;
      text-align: center;
      transition: all 0.2s;
    }

    .stat-card:hover {
      transform: translateY(-2px);
      border-color: rgba(213, 0, 28, 0.2);
    }

    .stat-card .material-icons {
      font-size: 24px;
      color: #D5001C;
      margin-bottom: 8px;
    }

    .stat-value {
      font-size: 26px;
      font-weight: 800;
      color: #fff;
      line-height: 1;
      margin-bottom: 4px;
    }

    .stat-label {
      font-size: 11px;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      font-weight: 600;
    }

    .celebration {
      max-width: 1200px;
      margin: 0 auto 32px;
      padding: 32px;
      background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(22, 163, 74, 0.05));
      border: 1px solid rgba(34, 197, 94, 0.3);
      border-radius: 20px;
      text-align: center;
      position: relative;
      z-index: 1;
    }

    .celebration-icon {
      font-size: 56px;
      display: block;
      margin-bottom: 8px;
    }

    .celebration h2 {
      font-size: 28px;
      color: #22c55e;
      margin: 0 0 8px;
    }

    .celebration p {
      color: #cbd5e1;
      margin: 0 0 20px;
    }

    .btn-go-dashboard {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 14px 28px;
      background: linear-gradient(135deg, #22c55e, #16a34a);
      color: white;
      border: none;
      border-radius: 12px;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      font-size: 15px;
      box-shadow: 0 4px 16px rgba(34, 197, 94, 0.3);
    }

    .welcome-footer {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px 0;
      text-align: center;
      position: relative;
      z-index: 1;
    }

    .btn-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 10px 18px;
      background: transparent;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      font-family: inherit;
      font-size: 13px;
      transition: color 0.15s;
    }

    .btn-link:hover {
      color: #D5001C;
    }

    .footer-text {
      margin: 8px 0 0;
      color: #475569;
      font-size: 11px;
    }

    @media (max-width: 768px) {
      .welcome-page { padding: 20px 16px; }
      .welcome-header { flex-direction: column; gap: 16px; }
      .header-content h1 { font-size: 24px; }
      .progress-header { flex-direction: column; align-items: flex-start; gap: 12px; }
      .check-item { flex-wrap: wrap; }
      .check-action { width: 100%; justify-content: center; margin-top: 8px; }
      .achievements-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class WelcomeComponent implements OnInit {
  userName = 'Admin';
  clinicName = '';
  clinicCity = '';

  progress: any = null;
  checklist: any[] = [];
  achievements: any[] = [];
  stats: any = null;

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.userName = user.firstName || 'Admin';

    this.loadProgress();
    this.loadClinic();
  }

  async loadProgress() {
    try {
      const res: any = await firstValueFrom(this.http.get('/api/welcome/progress'));
      const data = res?.data;
      if (data) {
        this.progress = data.progress;
        this.checklist = data.checklist;
        this.achievements = data.achievements;
        this.stats = data.stats;
        this.cdr.detectChanges();
      }
    } catch (e) {
      console.error('Failed to load progress', e);
    }
  }

  async loadClinic() {
    try {
      const res: any = await firstValueFrom(this.http.get('/api/welcome/clinic'));
      const data = res?.data || {};
      this.clinicName = data.clinic_name || '';
      this.clinicCity = data.clinic_city || '';
      this.cdr.detectChanges();
    } catch {}
  }

  get unlockedCount(): number {
    return this.achievements.filter(a => a.unlocked).length;
  }

  get totalAchievements(): number {
    return this.achievements.length;
  }

  goTo(route: string) {
    this.router.navigate([route]);
  }

  skipToWork() {
    this.router.navigate(['/dashboard']);
  }
}
