import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-tutorials-list',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="tutorials-page">
      <div class="bg-decoration"></div>

      <header class="page-header">
        <div>
          <h1>
            <span class="material-icons">school</span>
            <span>{{ 'NAV.TUTORIALS' | translate }}</span>
          </h1>
          <p class="subtitle">{{ 'TUTORIALS.SUBTITLE' | translate }}</p>
        </div>
        <div class="progress-circle" *ngIf="totalCount > 0">
          <svg viewBox="0 0 36 36">
            <path class="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
            <path class="circle-fill"
              [attr.stroke-dasharray]="completionPercent + ', 100'"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
          </svg>
          <div class="progress-text">
            <strong>{{ completedCount }}/{{ totalCount }}</strong>
            <span>{{ 'TUTORIALS.DONE' | translate }}</span>
          </div>
        </div>
      </header>

      <div class="filter-bar">
        <button class="filter-btn"
          [class.active]="selectedRole === 'all'"
          (click)="filterByRole('all')">
          <span class="material-icons">apps</span>
          {{ 'TUTORIALS.FILTER_ALL' | translate }} ({{ tutorials.length }})
        </button>
        <button class="filter-btn"
          *ngFor="let role of availableRoles"
          [class.active]="selectedRole === role.id"
          [style.--c]="role.color"
          (click)="filterByRole(role.id)">
          <span class="material-icons">{{ role.icon }}</span>
          {{ role.label }} ({{ countByRole(role.id) }})
        </button>
      </div>

      <div class="tutorials-grid">
        <article class="tutorial-card"
          *ngFor="let t of filteredTutorials"
          [class.completed]="isCompleted(t.id)"
          [style.--card-color]="t.color"
          (click)="openTutorial(t)">

          <div class="card-header">
            <div class="card-icon">
              <span class="material-icons">{{ t.icon }}</span>
            </div>
            <div class="card-badges">
              <span class="badge difficulty" [class]="'difficulty-' + t.difficulty">
                {{ getDifficultyLabel(t.difficulty) }}
              </span>
              <span class="badge time">
                <span class="material-icons">schedule</span>
                {{ t.duration }} {{ 'TUTORIALS.MIN' | translate }}
              </span>
            </div>
          </div>

          <h3>{{ getTitle(t) }}</h3>
          <p>{{ t.description }}</p>

          <div class="card-sections">
            <span class="section-pill" *ngFor="let s of t.sections.slice(0, 3)">{{ s }}</span>
            <span class="section-pill more" *ngIf="t.sections.length > 3">+{{ t.sections.length - 3 }}</span>
          </div>

          <div class="card-footer">
            <div class="card-status" *ngIf="isCompleted(t.id)">
              <span class="material-icons">check_circle</span>
              <span>{{ 'TUTORIALS.COMPLETED' | translate }}</span>
            </div>
            <div class="card-status not-started" *ngIf="!isCompleted(t.id)">
              <span class="material-icons">play_circle</span>
              <span>{{ 'TUTORIALS.START' | translate }}</span>
            </div>
            <span class="material-icons arrow">arrow_forward</span>
          </div>
        </article>
      </div>

      <footer class="page-footer">
        <div class="info-box">
          <span class="material-icons">tips_and_updates</span>
          <div>
            <strong>{{ 'TUTORIALS.TIP_TITLE' | translate }}</strong>
            <p>{{ 'TUTORIALS.TIP_TEXT' | translate }}</p>
          </div>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .tutorials-page {
      min-height: 100vh;
      background: #f4f6f9;
      color: #1f2937;
      padding: 32px;
      position: relative;
    }

    .bg-decoration {
      position: fixed;
      inset: 0;
      background:
        radial-gradient(circle at 20% 50%, rgba(26,115,232,0.04) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(99,102,241,0.03) 0%, transparent 50%);
      pointer-events: none;
      z-index: 0;
    }

    .page-header {
      max-width: 1200px;
      margin: 0 auto 32px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 24px;
      position: relative;
      z-index: 1;
    }

    h1 {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      margin: 0 0 8px;
      color: #0f2d52;
      font-size: 28px;
    }

    h1 .material-icons { color: #1a73e8; font-size: 32px; }

    .subtitle { margin: 0; color: #718096; font-size: 14px; }

    .progress-circle { position: relative; width: 80px; height: 80px; flex-shrink: 0; }

    .progress-circle svg { transform: rotate(-90deg); width: 100%; height: 100%; }

    .circle-bg { fill: none; stroke: #e2e8f0; stroke-width: 2; }

    .circle-fill {
      fill: none;
      stroke: #1a73e8;
      stroke-width: 2;
      stroke-linecap: round;
      transition: stroke-dasharray 0.5s;
    }

    .progress-text {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .progress-text strong { font-size: 16px; color: #0f2d52; }
    .progress-text span { font-size: 9px; color: #718096; text-transform: uppercase; }

    .filter-bar {
      max-width: 1200px;
      margin: 0 auto 24px;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      position: relative;
      z-index: 1;
    }

    .filter-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      background: white;
      border: 1.5px solid #e2e8f0;
      border-radius: 20px;
      color: #718096;
      font-family: inherit;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
    }

    .filter-btn .material-icons { font-size: 16px; }
    .filter-btn:hover { border-color: #1a73e8; color: #1a73e8; }
    .filter-btn.active { background: var(--c, #1a73e8); border-color: var(--c, #1a73e8); color: white; }

    .tutorials-grid {
      max-width: 1200px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 16px;
      position: relative;
      z-index: 1;
    }

    .tutorial-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 20px;
      cursor: pointer;
      transition: all 0.2s;
      position: relative;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }

    .tutorial-card::before {
      content: '';
      position: absolute;
      top: 0; left: 0;
      width: 3px; height: 100%;
      background: var(--card-color, #1a73e8);
      opacity: 0;
      transition: opacity 0.2s;
    }

    .tutorial-card:hover {
      transform: translateY(-3px);
      border-color: var(--card-color, #1a73e8);
      box-shadow: 0 8px 24px rgba(0,0,0,0.1);
    }

    .tutorial-card:hover::before { opacity: 1; }

    .tutorial-card.completed {
      background: rgba(34, 197, 94, 0.04);
      border-color: rgba(34, 197, 94, 0.3);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 14px;
    }

    .card-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: var(--card-color, #1a73e8);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .card-icon .material-icons { color: white; font-size: 24px; }

    .card-badges { display: flex; flex-direction: column; gap: 4px; align-items: flex-end; }

    .badge {
      padding: 3px 8px;
      border-radius: 8px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .difficulty-easy { background: rgba(34, 197, 94, 0.12); color: #16a34a; }
    .difficulty-medium { background: rgba(245, 158, 11, 0.12); color: #d97706; }
    .difficulty-hard { background: rgba(239, 68, 68, 0.12); color: #dc2626; }

    .badge.time {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      background: #f4f6f9;
      color: #718096;
    }

    .badge.time .material-icons { font-size: 12px; }

    .tutorial-card h3 { margin: 0 0 8px; font-size: 16px; color: #0f2d52; line-height: 1.3; }
    .tutorial-card p { margin: 0 0 14px; font-size: 13px; color: #718096; line-height: 1.5; }

    .card-sections { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 14px; }

    .section-pill {
      padding: 3px 8px;
      background: #f4f6f9;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      font-size: 10px;
      color: #718096;
    }

    .section-pill.more {
      background: var(--card-color, #1a73e8);
      border-color: var(--card-color, #1a73e8);
      color: white;
    }

    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 14px;
      border-top: 1px solid #f0f4f8;
    }

    .card-status { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; }
    .card-status .material-icons { font-size: 16px; color: #22c55e; }
    .card-status.not-started .material-icons { color: var(--card-color, #1a73e8); }
    .card-status.not-started { color: var(--card-color, #1a73e8); }

    .arrow { color: #94a3b8; font-size: 18px !important; transition: transform 0.15s; }
    .tutorial-card:hover .arrow { color: var(--card-color, #1a73e8); transform: translateX(4px); }

    .page-footer { max-width: 1200px; margin: 32px auto 0; position: relative; z-index: 1; }

    .info-box {
      display: flex;
      gap: 16px;
      padding: 20px;
      background: rgba(26,115,232,0.04);
      border: 1px solid rgba(26,115,232,0.15);
      border-radius: 12px;
    }

    .info-box > .material-icons { font-size: 28px; color: #1a73e8; flex-shrink: 0; }
    .info-box strong { display: block; color: #0f2d52; margin-bottom: 4px; }
    .info-box p { margin: 0; color: #718096; font-size: 13px; line-height: 1.5; }

    @media (max-width: 768px) {
      .tutorials-page { padding: 16px; }
      .page-header { flex-direction: column; }
      .progress-circle { align-self: flex-start; }
    }
  `]
})
export class TutorialsListComponent implements OnInit {
  tutorials: any[] = [];
  filteredTutorials: any[] = [];
  selectedRole = 'all';
  userProgress: any[] = [];
  currentLang = 'ru';

  availableRoles = [
    { id: 'admin',         label: 'Admin',       icon: 'admin_panel_settings', color: '#1a73e8' },
    { id: 'doctor',        label: 'Doctor',      icon: 'medical_services',     color: '#10b981' },
    { id: 'reception',     label: 'Reception',   icon: 'support_agent',        color: '#f59e0b' },
    { id: 'radiologist',   label: 'Radiolog',    icon: 'medical_information',  color: '#7c3aed' },
    { id: 'lab_technician',label: 'Lab',         icon: 'biotech',              color: '#06b6d4' },
  ];

  constructor(
    private http: HttpClient,
    private router: Router,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.currentLang = this.translate.currentLang || 'ru';
    this.loadTutorials();
    this.loadProgress();
  }

  async loadTutorials() {
    try {
      const res: any = await firstValueFrom(this.http.get('/api/tutorials/list'));
      this.tutorials = res?.data || [];
      this.applyFilter();
      this.cdr.detectChanges();
    } catch (e) {
      console.error('Failed to load tutorials', e);
    }
  }

  async loadProgress() {
    try {
      const res: any = await firstValueFrom(this.http.get('/api/tutorials/progress'));
      this.userProgress = res?.data || [];
      this.cdr.detectChanges();
    } catch {}
  }

  filterByRole(role: string) {
    this.selectedRole = role;
    this.applyFilter();
  }

  applyFilter() {
    if (this.selectedRole === 'all') {
      this.filteredTutorials = [...this.tutorials];
    } else {
      this.filteredTutorials = this.tutorials.filter(t =>
        t.role === this.selectedRole || t.role === 'all',
      );
    }
  }

  countByRole(role: string): number {
    return this.tutorials.filter(t => t.role === role || t.role === 'all').length;
  }

  isCompleted(tutorialId: string): boolean {
    return this.userProgress.some(p => p.tutorialId === tutorialId && p.completed);
  }

  get completedCount(): number {
    return this.userProgress.filter(p => p.completed).length;
  }

  get totalCount(): number {
    return this.tutorials.length;
  }

  get completionPercent(): number {
    if (this.totalCount === 0) return 0;
    return Math.round((this.completedCount / this.totalCount) * 100);
  }

  getTitle(t: any): string {
    if (this.currentLang === 'ro' && t.titleRo) return t.titleRo;
    if (this.currentLang === 'en' && t.titleEn) return t.titleEn;
    return t.title;
  }

  getDifficultyLabel(d: string): string {
    const map: Record<string, string> = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };
    return map[d] || d;
  }

  openTutorial(t: any) {
    this.router.navigate(['/tutorials', t.id]);
  }
}
