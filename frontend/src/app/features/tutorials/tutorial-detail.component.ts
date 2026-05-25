import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-tutorial-detail',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="detail-page" *ngIf="tutorial">
      <div class="bg-decoration"></div>

      <div class="back-bar">
        <button class="btn-back" (click)="goBack()">
          <span class="material-icons">arrow_back</span>
          {{ 'TUTORIALS.BACK' | translate }}
        </button>
      </div>

      <header class="tutorial-header" [style.--c]="tutorial.color">
        <div class="header-icon">
          <span class="material-icons">{{ tutorial.icon }}</span>
        </div>
        <div class="header-info">
          <h1>{{ tutorial.title }}</h1>
          <p>{{ tutorial.description }}</p>
          <div class="meta">
            <span class="meta-item">
              <span class="material-icons">schedule</span>
              {{ tutorial.duration }} {{ 'TUTORIALS.MIN' | translate }}
            </span>
            <span class="meta-item">
              <span class="material-icons">trending_up</span>
              {{ getDifficultyLabel(tutorial.difficulty) }}
            </span>
            <span class="meta-item" *ngIf="tutorial.role !== 'all'">
              <span class="material-icons">person</span>
              {{ getRoleLabel(tutorial.role) }}
            </span>
          </div>
        </div>
      </header>

      <article class="content-card">
        <div [ngSwitch]="tutorial.id">

          <!-- ─── Admin Overview ─── -->
          <div *ngSwitchCase="'admin-overview'">
            <h2 class="tut-h2">
              <span class="material-icons" style="color:#1a73e8">admin_panel_settings</span>
              {{ 'TUT.ADMIN.H2' | translate }}
            </h2>
            <p class="tut-intro">{{ 'TUT.ADMIN.INTRO' | translate }}</p>

            <div class="tut-section">
              <h3>{{ 'TUT.ADMIN.SEC1_TITLE' | translate }}</h3>
              <p>{{ 'TUT.ADMIN.SEC1_DESC' | translate }}</p>
              <ul class="tut-list">
                <li>{{ 'TUT.ADMIN.SEC1_ITEM1' | translate }}</li>
                <li>{{ 'TUT.ADMIN.SEC1_ITEM2' | translate }}</li>
                <li>{{ 'TUT.ADMIN.SEC1_ITEM3' | translate }}</li>
                <li>{{ 'TUT.ADMIN.SEC1_ITEM4' | translate }}</li>
              </ul>
            </div>

            <div class="tut-section">
              <h3>{{ 'TUT.ADMIN.SEC2_TITLE' | translate }}</h3>
              <p>{{ 'TUT.ADMIN.SEC2_DESC' | translate }}</p>
              <ul class="tut-list">
                <li>{{ 'TUT.ADMIN.SEC2_ITEM1' | translate }}</li>
                <li>{{ 'TUT.ADMIN.SEC2_ITEM2' | translate }}</li>
                <li>{{ 'TUT.ADMIN.SEC2_ITEM3' | translate }}</li>
              </ul>
            </div>

            <div class="tut-section">
              <h3>{{ 'TUT.ADMIN.SEC3_TITLE' | translate }}</h3>
              <p>{{ 'TUT.ADMIN.SEC3_DESC' | translate }}</p>
              <ul class="tut-list">
                <li>{{ 'TUT.ADMIN.SEC3_ITEM1' | translate }}</li>
                <li>{{ 'TUT.ADMIN.SEC3_ITEM2' | translate }}</li>
                <li>{{ 'TUT.ADMIN.SEC3_ITEM3' | translate }}</li>
              </ul>
            </div>

            <div class="tut-section">
              <h3>{{ 'TUT.ADMIN.SEC4_TITLE' | translate }}</h3>
              <p>{{ 'TUT.ADMIN.SEC4_DESC' | translate }}</p>
              <ul class="tut-list">
                <li>{{ 'TUT.ADMIN.SEC4_ITEM1' | translate }}</li>
                <li>{{ 'TUT.ADMIN.SEC4_ITEM2' | translate }}</li>
                <li>{{ 'TUT.ADMIN.SEC4_ITEM3' | translate }}</li>
              </ul>
            </div>

            <div class="tip-box">
              <span class="material-icons">tips_and_updates</span>
              <div><strong>{{ 'TUT.COMMON.TIP' | translate }}</strong><p>{{ 'TUT.ADMIN.TIP1' | translate }}</p></div>
            </div>
            <div class="warn-box">
              <span class="material-icons">warning</span>
              <div><strong>{{ 'TUT.COMMON.WARNING' | translate }}</strong><p>{{ 'TUT.ADMIN.WARN1' | translate }}</p></div>
            </div>
            <div class="next-box">
              <span class="material-icons">arrow_forward_ios</span>
              <div><strong>{{ 'TUT.COMMON.NEXT' | translate }}</strong><p>{{ 'TUT.ADMIN.NEXT1' | translate }}</p></div>
            </div>
          </div>

          <!-- ─── Doctor Workflow ─── -->
          <div *ngSwitchCase="'doctor-workflow'">
            <h2 class="tut-h2">
              <span class="material-icons" style="color:#10b981">medical_services</span>
              {{ 'TUT.DOCTOR.H2' | translate }}
            </h2>
            <p class="tut-intro">{{ 'TUT.DOCTOR.INTRO' | translate }}</p>

            <div class="tut-section">
              <h3>{{ 'TUT.DOCTOR.SEC1_TITLE' | translate }}</h3>
              <p>{{ 'TUT.DOCTOR.SEC1_DESC' | translate }}</p>
              <ul class="tut-list">
                <li>{{ 'TUT.DOCTOR.SEC1_ITEM1' | translate }}</li>
                <li>{{ 'TUT.DOCTOR.SEC1_ITEM2' | translate }}</li>
              </ul>
            </div>

            <div class="tut-section">
              <h3>{{ 'TUT.DOCTOR.SEC2_TITLE' | translate }}</h3>
              <p>{{ 'TUT.DOCTOR.SEC2_DESC' | translate }}</p>
              <ul class="tut-list">
                <li>{{ 'TUT.DOCTOR.SEC2_ITEM1' | translate }}</li>
                <li>{{ 'TUT.DOCTOR.SEC2_ITEM2' | translate }}</li>
                <li>{{ 'TUT.DOCTOR.SEC2_ITEM3' | translate }}</li>
                <li>{{ 'TUT.DOCTOR.SEC2_ITEM4' | translate }}</li>
                <li>{{ 'TUT.DOCTOR.SEC2_ITEM5' | translate }}</li>
              </ul>
            </div>

            <div class="tut-section">
              <h3>{{ 'TUT.DOCTOR.SEC3_TITLE' | translate }}</h3>
              <ol class="step-list">
                <li><span class="step-num">1</span><span>{{ 'TUT.DOCTOR.SEC3_STEP1' | translate }}</span></li>
                <li><span class="step-num">2</span><span>{{ 'TUT.DOCTOR.SEC3_STEP2' | translate }}</span></li>
                <li><span class="step-num">3</span><span>{{ 'TUT.DOCTOR.SEC3_STEP3' | translate }}</span></li>
                <li><span class="step-num">4</span><span>{{ 'TUT.DOCTOR.SEC3_STEP4' | translate }}</span></li>
              </ol>
            </div>

            <div class="tip-box">
              <span class="material-icons">tips_and_updates</span>
              <div><strong>{{ 'TUT.COMMON.TIP' | translate }}</strong><p>{{ 'TUT.DOCTOR.TIP1' | translate }}</p></div>
            </div>
            <div class="warn-box">
              <span class="material-icons">warning</span>
              <div><strong>{{ 'TUT.COMMON.WARNING' | translate }}</strong><p>{{ 'TUT.DOCTOR.WARN1' | translate }}</p></div>
            </div>
            <div class="next-box">
              <span class="material-icons">arrow_forward_ios</span>
              <div><strong>{{ 'TUT.COMMON.NEXT' | translate }}</strong><p>{{ 'TUT.DOCTOR.NEXT1' | translate }}</p></div>
            </div>
          </div>

          <!-- ─── Reception Booking ─── -->
          <div *ngSwitchCase="'reception-booking'">
            <h2 class="tut-h2">
              <span class="material-icons" style="color:#f59e0b">support_agent</span>
              {{ 'TUT.RECEPTION.H2' | translate }}
            </h2>
            <p class="tut-intro">{{ 'TUT.RECEPTION.INTRO' | translate }}</p>

            <div class="tut-section">
              <h3>{{ 'TUT.RECEPTION.SEC1_TITLE' | translate }}</h3>
              <p>{{ 'TUT.RECEPTION.SEC1_DESC' | translate }}</p>
            </div>

            <div class="tut-section">
              <h3>{{ 'TUT.RECEPTION.SEC2_TITLE' | translate }}</h3>
              <ol class="step-list">
                <li><span class="step-num">1</span><span>{{ 'TUT.RECEPTION.SEC2_STEP1' | translate }}</span></li>
                <li><span class="step-num">2</span><span>{{ 'TUT.RECEPTION.SEC2_STEP2' | translate }}</span></li>
                <li><span class="step-num">3</span><span>{{ 'TUT.RECEPTION.SEC2_STEP3' | translate }}</span></li>
                <li><span class="step-num">4</span><span>{{ 'TUT.RECEPTION.SEC2_STEP4' | translate }}</span></li>
                <li><span class="step-num">5</span><span>{{ 'TUT.RECEPTION.SEC2_STEP5' | translate }}</span></li>
              </ol>
            </div>

            <div class="tut-section">
              <h3>{{ 'TUT.RECEPTION.SEC3_TITLE' | translate }}</h3>
              <ul class="tut-list">
                <li>{{ 'TUT.RECEPTION.SEC3_ITEM1' | translate }}</li>
                <li>{{ 'TUT.RECEPTION.SEC3_ITEM2' | translate }}</li>
                <li>{{ 'TUT.RECEPTION.SEC3_ITEM3' | translate }}</li>
              </ul>
            </div>

            <div class="tip-box">
              <span class="material-icons">tips_and_updates</span>
              <div><strong>{{ 'TUT.COMMON.TIP' | translate }}</strong><p>{{ 'TUT.RECEPTION.TIP1' | translate }}</p></div>
            </div>
            <div class="warn-box">
              <span class="material-icons">warning</span>
              <div><strong>{{ 'TUT.COMMON.WARNING' | translate }}</strong><p>{{ 'TUT.RECEPTION.WARN1' | translate }}</p></div>
            </div>
            <div class="next-box">
              <span class="material-icons">arrow_forward_ios</span>
              <div><strong>{{ 'TUT.COMMON.NEXT' | translate }}</strong><p>{{ 'TUT.RECEPTION.NEXT1' | translate }}</p></div>
            </div>
          </div>

          <!-- ─── Radiologist DICOM ─── -->
          <div *ngSwitchCase="'radiologist-dicom'">
            <h2 class="tut-h2">
              <span class="material-icons" style="color:#7c3aed">medical_information</span>
              {{ 'TUT.RADIOLOGIST.H2' | translate }}
            </h2>
            <p class="tut-intro">{{ 'TUT.RADIOLOGIST.INTRO' | translate }}</p>

            <div class="tut-section">
              <h3>{{ 'TUT.RADIOLOGIST.SEC1_TITLE' | translate }}</h3>
              <ul class="tut-list">
                <li>{{ 'TUT.RADIOLOGIST.SEC1_ITEM1' | translate }}</li>
                <li>{{ 'TUT.RADIOLOGIST.SEC1_ITEM2' | translate }}</li>
                <li>{{ 'TUT.RADIOLOGIST.SEC1_ITEM3' | translate }}</li>
              </ul>
            </div>

            <div class="tut-section">
              <h3>{{ 'TUT.RADIOLOGIST.SEC2_TITLE' | translate }}</h3>
              <ul class="tut-list">
                <li>{{ 'TUT.RADIOLOGIST.SEC2_ITEM1' | translate }}</li>
                <li>{{ 'TUT.RADIOLOGIST.SEC2_ITEM2' | translate }}</li>
                <li>{{ 'TUT.RADIOLOGIST.SEC2_ITEM3' | translate }}</li>
                <li>{{ 'TUT.RADIOLOGIST.SEC2_ITEM4' | translate }}</li>
                <li>{{ 'TUT.RADIOLOGIST.SEC2_ITEM5' | translate }}</li>
              </ul>
            </div>

            <div class="tut-section">
              <h3>{{ 'TUT.RADIOLOGIST.SEC3_TITLE' | translate }}</h3>
              <ol class="step-list">
                <li><span class="step-num">1</span><span>{{ 'TUT.RADIOLOGIST.SEC3_STEP1' | translate }}</span></li>
                <li><span class="step-num">2</span><span>{{ 'TUT.RADIOLOGIST.SEC3_STEP2' | translate }}</span></li>
                <li><span class="step-num">3</span><span>{{ 'TUT.RADIOLOGIST.SEC3_STEP3' | translate }}</span></li>
              </ol>
            </div>

            <div class="tip-box">
              <span class="material-icons">tips_and_updates</span>
              <div><strong>{{ 'TUT.COMMON.TIP' | translate }}</strong><p>{{ 'TUT.RADIOLOGIST.TIP1' | translate }}</p></div>
            </div>
            <div class="warn-box">
              <span class="material-icons">warning</span>
              <div><strong>{{ 'TUT.COMMON.WARNING' | translate }}</strong><p>{{ 'TUT.RADIOLOGIST.WARN1' | translate }}</p></div>
            </div>
            <div class="next-box">
              <span class="material-icons">arrow_forward_ios</span>
              <div><strong>{{ 'TUT.COMMON.NEXT' | translate }}</strong><p>{{ 'TUT.RADIOLOGIST.NEXT1' | translate }}</p></div>
            </div>
          </div>

          <!-- ─── Lab Results ─── -->
          <div *ngSwitchCase="'lab-results'">
            <h2 class="tut-h2">
              <span class="material-icons" style="color:#06b6d4">biotech</span>
              {{ 'TUT.LAB.H2' | translate }}
            </h2>
            <p class="tut-intro">{{ 'TUT.LAB.INTRO' | translate }}</p>

            <div class="tut-section">
              <h3>{{ 'TUT.LAB.SEC1_TITLE' | translate }}</h3>
              <ul class="tut-list">
                <li><span class="priority-dot stat"></span>{{ 'TUT.LAB.SEC1_ITEM1' | translate }}</li>
                <li><span class="priority-dot urgent"></span>{{ 'TUT.LAB.SEC1_ITEM2' | translate }}</li>
                <li><span class="priority-dot routine"></span>{{ 'TUT.LAB.SEC1_ITEM3' | translate }}</li>
              </ul>
            </div>

            <div class="tut-section">
              <h3>{{ 'TUT.LAB.SEC2_TITLE' | translate }}</h3>
              <ul class="tut-list">
                <li><span class="flag-dot normal"></span>{{ 'TUT.LAB.SEC2_ITEM1' | translate }}</li>
                <li><span class="flag-dot high"></span>{{ 'TUT.LAB.SEC2_ITEM2' | translate }}</li>
                <li><span class="flag-dot critical"></span>{{ 'TUT.LAB.SEC2_ITEM3' | translate }}</li>
              </ul>
            </div>

            <div class="tut-section">
              <h3>{{ 'TUT.LAB.SEC3_TITLE' | translate }}</h3>
              <ol class="step-list">
                <li><span class="step-num">1</span><span>{{ 'TUT.LAB.SEC3_STEP1' | translate }}</span></li>
                <li><span class="step-num">2</span><span>{{ 'TUT.LAB.SEC3_STEP2' | translate }}</span></li>
                <li><span class="step-num">3</span><span>{{ 'TUT.LAB.SEC3_STEP3' | translate }}</span></li>
              </ol>
            </div>

            <div class="tip-box">
              <span class="material-icons">tips_and_updates</span>
              <div><strong>{{ 'TUT.COMMON.TIP' | translate }}</strong><p>{{ 'TUT.LAB.TIP1' | translate }}</p></div>
            </div>
            <div class="warn-box">
              <span class="material-icons">warning</span>
              <div><strong>{{ 'TUT.COMMON.WARNING' | translate }}</strong><p>{{ 'TUT.LAB.WARN1' | translate }}</p></div>
            </div>
            <div class="next-box">
              <span class="material-icons">arrow_forward_ios</span>
              <div><strong>{{ 'TUT.COMMON.NEXT' | translate }}</strong><p>{{ 'TUT.LAB.NEXT1' | translate }}</p></div>
            </div>
          </div>

          <!-- ─── System Overview ─── -->
          <div *ngSwitchCase="'system-overview'">
            <h2 class="tut-h2">
              <span class="material-icons" style="color:#94a3b8">info</span>
              {{ 'TUT.SYSTEM.H2' | translate }}
            </h2>

            <div class="tut-section">
              <h3>{{ 'TUT.SYSTEM.SEC1_TITLE' | translate }}</h3>
              <ul class="tut-list">
                <li>{{ 'TUT.SYSTEM.SEC1_ITEM1' | translate }}</li>
                <li>{{ 'TUT.SYSTEM.SEC1_ITEM2' | translate }}</li>
                <li>{{ 'TUT.SYSTEM.SEC1_ITEM3' | translate }}</li>
              </ul>
            </div>

            <div class="tut-section">
              <h3>{{ 'TUT.SYSTEM.SEC2_TITLE' | translate }}</h3>
              <ul class="tut-list">
                <li>{{ 'TUT.SYSTEM.SEC2_ITEM1' | translate }}</li>
                <li>{{ 'TUT.SYSTEM.SEC2_ITEM2' | translate }}</li>
                <li>{{ 'TUT.SYSTEM.SEC2_ITEM3' | translate }}</li>
                <li>{{ 'TUT.SYSTEM.SEC2_ITEM4' | translate }}</li>
                <li>{{ 'TUT.SYSTEM.SEC2_ITEM5' | translate }}</li>
              </ul>
            </div>

            <div class="tut-section">
              <h3>{{ 'TUT.SYSTEM.SEC3_TITLE' | translate }}</h3>
              <ul class="tut-list">
                <li>{{ 'TUT.SYSTEM.SEC3_ITEM1' | translate }}</li>
                <li>{{ 'TUT.SYSTEM.SEC3_ITEM2' | translate }}</li>
                <li>{{ 'TUT.SYSTEM.SEC3_ITEM3' | translate }}</li>
              </ul>
            </div>
          </div>

          <!-- ─── Languages ─── -->
          <div *ngSwitchCase="'languages'">
            <h2 class="tut-h2">
              <span class="material-icons" style="color:#ec4899">language</span>
              {{ 'TUT.LANGUAGES.H2' | translate }}
            </h2>
            <p class="tut-intro">{{ 'TUT.LANGUAGES.INTRO' | translate }}</p>

            <div class="tut-section">
              <h3>{{ 'TUT.LANGUAGES.SEC1_TITLE' | translate }}</h3>
              <p>{{ 'TUT.LANGUAGES.SEC1_DESC' | translate }}</p>
            </div>

            <div class="tut-section">
              <h3>{{ 'TUT.LANGUAGES.SEC2_TITLE' | translate }}</h3>
              <ul class="tut-list">
                <li>{{ 'TUT.LANGUAGES.SEC2_ITEM1' | translate }}</li>
                <li>{{ 'TUT.LANGUAGES.SEC2_ITEM2' | translate }}</li>
                <li>{{ 'TUT.LANGUAGES.SEC2_ITEM3' | translate }}</li>
              </ul>
            </div>

            <div class="tut-section">
              <h3>{{ 'TUT.LANGUAGES.SEC3_TITLE' | translate }}</h3>
              <ul class="tut-list">
                <li>{{ 'TUT.LANGUAGES.SEC3_ITEM1' | translate }}</li>
                <li>{{ 'TUT.LANGUAGES.SEC3_ITEM2' | translate }}</li>
              </ul>
            </div>

            <div class="tip-box">
              <span class="material-icons">tips_and_updates</span>
              <div><strong>{{ 'TUT.COMMON.TIP' | translate }}</strong><p>{{ 'TUT.LANGUAGES.TIP1' | translate }}</p></div>
            </div>
          </div>

          <!-- ─── Security Basics ─── -->
          <div *ngSwitchCase="'security-basics'">
            <h2 class="tut-h2">
              <span class="material-icons" style="color:#ef4444">shield</span>
              {{ 'TUT.SECURITY.H2' | translate }}
            </h2>

            <div class="tut-section">
              <h3>{{ 'TUT.SECURITY.SEC1_TITLE' | translate }}</h3>
              <ul class="tut-list">
                <li>{{ 'TUT.SECURITY.SEC1_ITEM1' | translate }}</li>
                <li>{{ 'TUT.SECURITY.SEC1_ITEM2' | translate }}</li>
              </ul>
            </div>

            <div class="tut-section">
              <h3>{{ 'TUT.SECURITY.SEC2_TITLE' | translate }}</h3>
              <ul class="tut-list">
                <li>{{ 'TUT.SECURITY.SEC2_ITEM1' | translate }}</li>
                <li>{{ 'TUT.SECURITY.SEC2_ITEM2' | translate }}</li>
              </ul>
            </div>

            <div class="tut-section">
              <h3>{{ 'TUT.SECURITY.SEC3_TITLE' | translate }}</h3>
              <ul class="tut-list">
                <li>{{ 'TUT.SECURITY.SEC3_ITEM1' | translate }}</li>
              </ul>
            </div>

            <div class="tut-section">
              <h3>{{ 'TUT.SECURITY.SEC4_TITLE' | translate }}</h3>
              <ul class="tut-list">
                <li>{{ 'TUT.SECURITY.SEC4_ITEM1' | translate }}</li>
                <li>{{ 'TUT.SECURITY.SEC4_ITEM2' | translate }}</li>
                <li>{{ 'TUT.SECURITY.SEC4_ITEM3' | translate }}</li>
              </ul>
            </div>

            <div class="warn-box">
              <span class="material-icons">warning</span>
              <div><strong>{{ 'TUT.COMMON.WARNING' | translate }}</strong><p>{{ 'TUT.SECURITY.WARN1' | translate }}</p></div>
            </div>
          </div>

          <div *ngSwitchDefault>
            <p>{{ 'TUTORIALS.IN_DEVELOPMENT' | translate }}</p>
          </div>
        </div>
      </article>

      <div class="action-bar">
        <button class="btn-complete" *ngIf="!completed" (click)="markComplete()">
          <span class="material-icons">check_circle</span>
          {{ 'TUTORIALS.MARK_COMPLETE' | translate }}
        </button>
        <div class="completed-badge" *ngIf="completed">
          <span class="material-icons">verified</span>
          {{ 'TUTORIALS.COMPLETED_MSG' | translate }}
        </div>
        <button class="btn-next" (click)="goBack()">
          <span>{{ 'TUTORIALS.BACK' | translate }}</span>
          <span class="material-icons">arrow_forward</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .detail-page {
      min-height: 100vh;
      background: #f4f6f9;
      color: #1f2937;
      padding: 32px;
      position: relative;
    }

    .bg-decoration {
      position: fixed; inset: 0;
      background: radial-gradient(circle at 20% 30%, rgba(26,115,232,0.05) 0%, transparent 50%);
      pointer-events: none; z-index: 0;
    }

    .back-bar {
      max-width: 800px;
      margin: 0 auto 24px;
      position: relative; z-index: 1;
    }

    .btn-back {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      background: white;
      border: 1.5px solid #e2e8f0;
      border-radius: 10px;
      color: #718096;
      cursor: pointer;
      font-family: inherit;
      font-size: 13px;
      transition: all 0.15s;
    }

    .btn-back:hover { color: #1a73e8; border-color: #1a73e8; }
    .btn-back .material-icons { font-size: 16px; }

    .tutorial-header {
      max-width: 800px;
      margin: 0 auto 32px;
      display: flex;
      gap: 24px;
      padding: 32px;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      position: relative; z-index: 1;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }

    .tutorial-header::before {
      content: '';
      position: absolute;
      top: 0; left: 0;
      width: 4px; height: 100%;
      background: var(--c, #1a73e8);
    }

    .header-icon {
      width: 64px; height: 64px;
      border-radius: 16px;
      background: var(--c, #1a73e8);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }

    .header-icon .material-icons { color: white; font-size: 32px; }
    .header-info h1 { margin: 0 0 8px; font-size: 24px; color: #0f2d52; }
    .header-info p { margin: 0 0 16px; color: #718096; }

    .meta { display: flex; flex-wrap: wrap; gap: 12px; }

    .meta-item { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: #718096; }
    .meta-item .material-icons { font-size: 16px; color: var(--c, #1a73e8); }

    .content-card {
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      position: relative; z-index: 1;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }

    .content-card h2 { color: #0f2d52; font-size: 22px; margin: 0 0 16px; }
    .content-card h3 { color: #1a73e8; margin: 28px 0 12px; font-size: 16px; }
    .content-card p { color: #475569; line-height: 1.7; margin: 0 0 12px; }
    .content-card ul, .content-card ol { color: #475569; line-height: 1.8; padding-left: 0; margin: 0 0 12px; list-style: none; }
    .content-card li { margin: 6px 0; }
    .content-card strong { color: #0f2d52; }
    .content-card em { color: #718096; font-style: italic; }

    .content-card code {
      background: rgba(26,115,232,0.08);
      color: #1557b0;
      padding: 1px 6px;
      border-radius: 4px;
      font-size: 90%;
      font-family: ui-monospace, monospace;
    }

    /* ─── Tutorial structure ─── */
    .tut-h2 {
      display: flex;
      align-items: center;
      gap: 12px;
      color: #0f2d52;
      font-size: 22px;
      margin: 0 0 8px;
    }
    .tut-h2 .material-icons { font-size: 28px; }

    .tut-intro {
      color: #64748b;
      font-size: 14px;
      margin: 0 0 24px;
      padding-bottom: 20px;
      border-bottom: 1px solid #f1f5f9;
    }

    .tut-section {
      margin-bottom: 28px;
      padding-bottom: 28px;
      border-bottom: 1px solid #f1f5f9;
    }
    .tut-section:last-of-type { border-bottom: none; }

    .tut-section h3 {
      color: #0f2d52;
      font-size: 15px;
      font-weight: 700;
      margin: 0 0 10px;
      padding: 6px 12px;
      background: #f8fafc;
      border-left: 3px solid #1a73e8;
      border-radius: 0 6px 6px 0;
    }

    .tut-list {
      list-style: none !important;
      padding: 0 !important;
      margin: 8px 0 0 !important;
    }
    .tut-list li {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 6px 0;
      color: #475569;
      font-size: 13.5px;
      line-height: 1.6;
    }
    .tut-list li::before {
      content: '→';
      color: #1a73e8;
      font-weight: 700;
      flex-shrink: 0;
      margin-top: 1px;
    }

    /* numbered steps */
    .step-list {
      list-style: none !important;
      padding: 0 !important;
      margin: 8px 0 0 !important;
    }
    .step-list li {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 8px 0;
      color: #475569;
      font-size: 13.5px;
      line-height: 1.6;
    }
    .step-num {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      min-width: 22px;
      background: #1a73e8;
      color: white;
      border-radius: 50%;
      font-size: 11px;
      font-weight: 700;
      flex-shrink: 0;
    }

    /* priority dots */
    .priority-dot, .flag-dot {
      display: inline-block;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
      margin-top: 5px;
    }
    .priority-dot.stat   { background: #ef4444; }
    .priority-dot.urgent { background: #f59e0b; }
    .priority-dot.routine{ background: #22c55e; }
    .flag-dot.normal   { background: #22c55e; }
    .flag-dot.high     { background: #f59e0b; }
    .flag-dot.critical { background: #ef4444; }

    /* tip / warn / next boxes */
    .tip-box, .warn-box, .next-box {
      display: flex;
      gap: 12px;
      align-items: flex-start;
      padding: 14px 16px;
      border-radius: 10px;
      margin-top: 20px;
      font-size: 13px;
    }
    .tip-box {
      background: rgba(26,115,232,0.05);
      border: 1px solid rgba(26,115,232,0.2);
    }
    .tip-box > .material-icons { color: #1a73e8; font-size: 20px; flex-shrink: 0; margin-top: 1px; }

    .warn-box {
      background: rgba(245,158,11,0.05);
      border: 1px solid rgba(245,158,11,0.25);
    }
    .warn-box > .material-icons { color: #f59e0b; font-size: 20px; flex-shrink: 0; margin-top: 1px; }

    .next-box {
      background: rgba(34,197,94,0.05);
      border: 1px solid rgba(34,197,94,0.2);
    }
    .next-box > .material-icons { color: #22c55e; font-size: 20px; flex-shrink: 0; margin-top: 1px; }

    .tip-box strong, .warn-box strong, .next-box strong {
      display: block;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      margin-bottom: 3px;
    }
    .tip-box p, .warn-box p, .next-box p { margin: 0; color: #475569; line-height: 1.5; }

    .action-bar {
      max-width: 800px;
      margin: 32px auto 0;
      display: flex;
      justify-content: space-between;
      gap: 12px;
      position: relative; z-index: 1;
    }

    .btn-complete, .btn-next {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      border-radius: 12px;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      font-size: 14px;
      border: none;
    }

    .btn-complete {
      background: linear-gradient(135deg, #22c55e, #16a34a);
      color: white;
    }

    .btn-next {
      background: #f4f6f9;
      color: #475569;
      border: 1.5px solid #e2e8f0;
      margin-left: auto;
    }

    .btn-next:hover { background: #e2e8f0; color: #1a73e8; border-color: #1a73e8; }

    .completed-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      background: rgba(34, 197, 94, 0.08);
      border: 1px solid rgba(34, 197, 94, 0.3);
      border-radius: 12px;
      color: #16a34a;
      font-weight: 600;
    }

    @media (max-width: 768px) {
      .detail-page { padding: 16px; }
      .tutorial-header { flex-direction: column; gap: 16px; padding: 20px; }
      .content-card { padding: 24px; }
      .action-bar { flex-direction: column; }
      .btn-next { margin-left: 0; }
    }
  `]
})
export class TutorialDetailComponent implements OnInit {
  tutorial: any = null;
  tutorialId = '';
  completed = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService,
  ) {}

  async ngOnInit() {
    this.tutorialId = this.route.snapshot.params['id'];
    await this.loadTutorial();
    await this.loadProgress();
  }

  async loadTutorial() {
    try {
      const res: any = await firstValueFrom(this.api.get('/tutorials/list'));
      this.tutorial = (res?.data || []).find((t: any) => t.id === this.tutorialId);
      this.cdr.detectChanges();
    } catch {}
  }

  async loadProgress() {
    try {
      const res: any = await firstValueFrom(this.api.get('/tutorials/progress'));
      this.completed = (res?.data || []).some((p: any) =>
        p.tutorialId === this.tutorialId && p.completed,
      );
      this.cdr.detectChanges();
    } catch {}
  }

  async markComplete() {
    try {
      await firstValueFrom(this.api.post(`/tutorials/complete/${this.tutorialId}`, {}));
      this.completed = true;
      this.cdr.detectChanges();
    } catch {}
  }

  goBack() {
    this.router.navigate(['/tutorials']);
  }

  getDifficultyLabel(d: string): string {
    const key = d?.toUpperCase();
    return this.translate.instant(`TUT.COMMON.DIFFICULTY.${key}`) || d;
  }

  getRoleLabel(r: string): string {
    const map: Record<string, string> = {
      admin: 'TUT.COMMON.ROLE.ADMIN',
      doctor: 'TUT.COMMON.ROLE.DOCTOR',
      receptionist: 'TUT.COMMON.ROLE.RECEPTIONIST',
      radiologist: 'TUT.COMMON.ROLE.RADIOLOGIST',
      lab_technician: 'TUT.COMMON.ROLE.LAB',
      all: 'TUT.COMMON.ROLE.ALL',
    };
    return this.translate.instant(map[r] || r);
  }
}
