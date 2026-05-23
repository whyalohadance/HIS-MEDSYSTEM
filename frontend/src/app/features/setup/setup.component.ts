import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { HelloIntroComponent } from './hello-intro.component';
import { ToastService } from '../../core/services/toast.service';

interface WizardStep {
  id: string;
  titleKey: string;
  icon: string;
}

@Component({
  selector: 'app-setup',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, HelloIntroComponent],
  template: `
    <app-hello-intro
      *ngIf="showHelloIntro"
      (done)="onHelloDone()">
    </app-hello-intro>

    <div class="setup-page" *ngIf="!showHelloIntro">

      <div class="bg-gradient"></div>

      <!-- Language selector -->
      <div class="lang-selector">
        <button *ngFor="let l of langs"
          [class.active]="currentLang === l.code"
          (click)="changeLang(l.code)">
          {{ l.code.toUpperCase() }}
        </button>
      </div>

      <!-- Progress bar -->
      <div class="progress-bar"
        role="progressbar"
        [attr.aria-valuenow]="progressPct"
        aria-valuemin="0"
        aria-valuemax="100"
        [attr.aria-label]="'Шаг ' + (currentStep + 1) + ' из ' + steps.length">
        <div class="progress-fill" [style.width.%]="progressPct"></div>
      </div>

      <!-- Step indicator -->
      <div class="step-indicator">
        <span class="material-icons">{{ steps[currentStep].icon }}</span>
        <span class="step-label">
          {{ 'SETUP.STEP_OF' | translate: {current: currentStep + 1, total: steps.length} }}
        </span>
      </div>

      <!-- Wizard card -->
      <div class="wizard-card">

        <!-- STEP 0: WELCOME -->
        <div class="step-content" *ngIf="currentStep === 0">
          <div class="step-hero">
            <div class="hero-logo">
              <span class="material-icons">local_hospital</span>
            </div>
            <h1>{{ 'SETUP.WELCOME.TITLE' | translate }}</h1>
            <p class="hero-subtitle">{{ 'SETUP.WELCOME.SUBTITLE' | translate }}</p>
            <p class="hero-tagline">{{ 'SETUP.WELCOME.TAGLINE' | translate }}</p>
          </div>

          <div class="welcome-features">
            <div class="feature">
              <span class="material-icons">verified</span>
              <span>{{ 'SETUP.WELCOME.FEATURE_TESTS' | translate }}</span>
            </div>
            <div class="feature">
              <span class="material-icons">speed</span>
              <span>{{ 'SETUP.WELCOME.FEATURE_LIGHTHOUSE' | translate }}</span>
            </div>
            <div class="feature">
              <span class="material-icons">shield</span>
              <span>{{ 'SETUP.WELCOME.FEATURE_SECURITY' | translate }}</span>
            </div>
            <div class="feature">
              <span class="material-icons">language</span>
              <span>{{ 'SETUP.WELCOME.FEATURE_LANGS' | translate }}</span>
            </div>
          </div>

          <p class="welcome-text">{{ 'SETUP.WELCOME.TEXT' | translate }}</p>
        </div>

        <!-- STEP 1: ABOUT -->
        <div class="step-content" *ngIf="currentStep === 1">
          <h2><span class="material-icons">info</span> {{ 'SETUP.ABOUT.TITLE' | translate }}</h2>

          <div class="info-grid">
            <div class="info-card stagger-item lift-on-hover">
              <span class="material-icons">people</span>
              <h3>HIS</h3>
              <p>{{ 'SETUP.ABOUT.HIS_DESC' | translate }}</p>
            </div>
            <div class="info-card stagger-item lift-on-hover">
              <span class="material-icons">medical_information</span>
              <h3>RIS</h3>
              <p>{{ 'SETUP.ABOUT.RIS_DESC' | translate }}</p>
            </div>
            <div class="info-card stagger-item lift-on-hover">
              <span class="material-icons">biotech</span>
              <h3>LIS</h3>
              <p>{{ 'SETUP.ABOUT.LIS_DESC' | translate }}</p>
            </div>
          </div>

          <div class="tech-stack">
            <p class="tech-label">{{ 'SETUP.ABOUT.TECH_STACK' | translate }}</p>
            <div class="tech-badges">
              <span class="tech-badge">Angular 19</span>
              <span class="tech-badge">NestJS 10</span>
              <span class="tech-badge">PostgreSQL 16</span>
              <span class="tech-badge">Docker</span>
              <span class="tech-badge">TypeORM</span>
              <span class="tech-badge">JWT Auth</span>
            </div>
          </div>
        </div>

        <!-- STEP 2: SCENARIO -->
        <div class="step-content" *ngIf="currentStep === 2">
          <h2><span class="material-icons">tune</span> {{ 'SETUP.MODE.TITLE' | translate }}</h2>

          <div class="option-grid" role="radiogroup" aria-label="Режим запуска">
            <button class="option-card stagger-item"
              [class.selected]="scenario === 'demo'"
              [attr.aria-pressed]="scenario === 'demo'"
              (click)="scenario = 'demo'">
              <span class="material-icons option-icon">science</span>
              <h3>{{ 'SETUP.MODE.DEMO_TITLE' | translate }}</h3>
              <p>{{ 'SETUP.MODE.DEMO_DESC' | translate }}</p>
              <ul>
                <li>{{ 'SETUP.MODE.DEMO_F1' | translate }}</li>
                <li>{{ 'SETUP.MODE.DEMO_F2' | translate }}</li>
                <li>{{ 'SETUP.MODE.DEMO_F3' | translate }}</li>
                <li>{{ 'SETUP.MODE.DEMO_F4' | translate }}</li>
              </ul>
              <span class="badge-recommended">{{ 'SETUP.MODE.DEMO_RECOMMENDED' | translate }}</span>
            </button>

            <button class="option-card stagger-item"
              [class.selected]="scenario === 'clean'"
              [attr.aria-pressed]="scenario === 'clean'"
              (click)="scenario = 'clean'">
              <span class="material-icons option-icon">construction</span>
              <h3>{{ 'SETUP.MODE.CLEAN_TITLE' | translate }}</h3>
              <p>{{ 'SETUP.MODE.CLEAN_DESC' | translate }}</p>
              <ul>
                <li>{{ 'SETUP.MODE.CLEAN_F1' | translate }}</li>
                <li>{{ 'SETUP.MODE.CLEAN_F2' | translate }}</li>
                <li>{{ 'SETUP.MODE.CLEAN_F3' | translate }}</li>
              </ul>
            </button>
          </div>
        </div>

        <!-- STEP 3: ROLES -->
        <div class="step-content" *ngIf="currentStep === 3">
          <h2><span class="material-icons">school</span> {{ 'SETUP.ROLES.TITLE' | translate }}</h2>
          <p class="step-description">{{ 'SETUP.ROLES.DESC' | translate }}</p>

          <div class="role-grid">
            <button class="role-card stagger-item" *ngFor="let role of roles"
              (click)="viewRole(role)"
              [class.viewed]="viewedRoles.includes(role.id)">
              <span class="material-icons" [style.color]="role.color">{{ role.icon }}</span>
              <h3>{{ role.title }}</h3>
              <p>{{ role.shortKey | translate }}</p>
              <span class="view-tour" *ngIf="!viewedRoles.includes(role.id)">
                {{ 'SETUP.ROLES.LEARN' | translate }}
              </span>
              <span class="viewed-badge" *ngIf="viewedRoles.includes(role.id)">
                <span class="material-icons">check_circle</span>
                {{ 'SETUP.ROLES.DONE' | translate }}
              </span>
            </button>
          </div>

          <button class="btn-skip" (click)="nextStep()">
            <span class="material-icons">skip_next</span>
            {{ 'SETUP.ROLES.SKIP' | translate }}
          </button>
        </div>


        <!-- STEP 4: CLINIC -->
        <div class="step-content" *ngIf="currentStep === 4">
          <h2><span class="material-icons">business</span> {{ 'SETUP.CLINIC.TITLE' | translate }}</h2>

          <div class="form-group">
            <label>{{ 'SETUP.CLINIC.COUNTRY' | translate }}</label>
            <div class="select-wrap">
              <select [(ngModel)]="clinic.country" (ngModelChange)="onCountryChange()">
                <option *ngFor="let c of countries" [value]="c.code">
                  {{ c.name }} ({{ c.phone }})
                </option>
              </select>
              <span class="material-icons select-arrow">expand_more</span>
            </div>
          </div>

          <div class="form-group">
            <label>{{ 'SETUP.CLINIC.NAME' | translate }}</label>
            <input type="text" [(ngModel)]="clinic.name"
              (ngModelChange)="onClinicNameChange()"
              [placeholder]="'SETUP.CLINIC.NAME_PH' | translate">
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>{{ 'SETUP.CLINIC.CITY' | translate }}</label>
              <input type="text" [(ngModel)]="clinic.city"
                [placeholder]="'SETUP.CLINIC.CITY_PH' | translate">
            </div>
            <div class="form-group">
              <label>{{ 'SETUP.CLINIC.TIMEZONE' | translate }}</label>
              <div class="select-wrap">
                <select [(ngModel)]="clinic.timezone">
                  <option *ngFor="let tz of timezones" [value]="tz.value">{{ tz.label }}</option>
                </select>
                <span class="material-icons select-arrow">expand_more</span>
              </div>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>{{ 'SETUP.CLINIC.LANGUAGE' | translate }}</label>
              <div class="select-wrap">
                <select [(ngModel)]="clinic.defaultLanguage">
                  <option value="ru">Русский</option>
                  <option value="ro">Română</option>
                  <option value="en">English</option>
                </select>
                <span class="material-icons select-arrow">expand_more</span>
              </div>
            </div>
            <div class="form-group">
              <label>{{ 'SETUP.CLINIC.CURRENCY' | translate }}</label>
              <div class="select-wrap">
                <select [(ngModel)]="clinic.currency">
                  <option value="MDL">MDL — Leu moldovenesc</option>
                  <option value="RON">RON — Leu românesc</option>
                  <option value="EUR">EUR — Euro</option>
                  <option value="USD">USD — US Dollar</option>
                  <option value="RUB">RUB — Рубль</option>
                  <option value="UAH">UAH — Гривна</option>
                  <option value="GBP">GBP — Pound</option>
                </select>
                <span class="material-icons select-arrow">expand_more</span>
              </div>
            </div>
          </div>
        </div>

        <!-- STEP 5: ADMIN -->
        <div class="step-content" *ngIf="currentStep === 5">
          <h2><span class="material-icons">admin_panel_settings</span> {{ 'SETUP.ADMIN.TITLE' | translate }}</h2>
          <p class="step-description">{{ 'SETUP.ADMIN.DESC' | translate }}</p>

          <div class="form-row">
            <div class="form-group">
              <label>{{ 'SETUP.ADMIN.FIRST_NAME' | translate }}</label>
              <input type="text" [(ngModel)]="admin.firstName"
                (ngModelChange)="onFirstNameChange()"
                [placeholder]="'SETUP.ADMIN.FIRST_PH' | translate">
            </div>
            <div class="form-group">
              <label>{{ 'SETUP.ADMIN.LAST_NAME' | translate }}</label>
              <input type="text" [(ngModel)]="admin.lastName"
                (ngModelChange)="onLastNameChange()"
                [placeholder]="'SETUP.ADMIN.LAST_PH' | translate">
            </div>
          </div>

          <div class="form-group">
            <label>{{ 'SETUP.ADMIN.EMAIL' | translate }}</label>
            <input type="email" [(ngModel)]="admin.email"
              [placeholder]="emailPlaceholder">
          </div>

          <div class="form-group">
            <label>{{ 'SETUP.ADMIN.PHONE' | translate }}</label>
            <input type="tel" [(ngModel)]="admin.phone"
              [placeholder]="phonePlaceholder">
          </div>

          <div class="form-group">
            <label>{{ 'SETUP.ADMIN.PASSWORD' | translate }}</label>
            <input type="password" [(ngModel)]="admin.password"
              [placeholder]="'SETUP.ADMIN.PASSWORD_PH' | translate">
            <small class="password-strength" *ngIf="admin.password">
              {{ getPasswordStrengthKey() | translate }}
            </small>
          </div>

          <div class="form-group">
            <label>{{ 'SETUP.ADMIN.PASSWORD_CONFIRM' | translate }}</label>
            <input type="password" [(ngModel)]="admin.passwordConfirm"
              [placeholder]="'SETUP.ADMIN.PASSWORD_CONFIRM_PH' | translate">
            <small class="error"
              *ngIf="admin.passwordConfirm && admin.password !== admin.passwordConfirm">
              {{ 'SETUP.ADMIN.PASS_MISMATCH' | translate }}
            </small>
          </div>
        </div>

        <!-- STEP 6: FINISH -->
        <div class="step-content" *ngIf="currentStep === 6">
          <div class="success-screen">
            <div class="success-icon"
              [class.blue]="isSubmitting"
              [class.green]="setupComplete">
              <span class="material-icons" [class.spinning]="isSubmitting">
                {{ setupComplete ? 'check_circle' : isSubmitting ? 'autorenew' : 'rocket_launch' }}
              </span>
            </div>

            <h2 *ngIf="!isSubmitting && !setupComplete">{{ 'SETUP.FINISH.READY' | translate }}</h2>
            <h2 *ngIf="isSubmitting">{{ 'SETUP.FINISH.CONFIGURING' | translate }}</h2>
            <h2 *ngIf="setupComplete">{{ 'SETUP.FINISH.DONE' | translate }}</h2>

            <div class="setup-summary" *ngIf="!isSubmitting && !setupComplete">
              <div class="summary-item">
                <span class="material-icons">business</span>
                <div>
                  <strong>{{ clinic.name || 'Clinic' }}</strong>
                  <small>{{ clinic.city }} · {{ clinic.timezone }}</small>
                </div>
              </div>
              <div class="summary-item">
                <span class="material-icons">admin_panel_settings</span>
                <div>
                  <strong>{{ admin.firstName }} {{ admin.lastName }}</strong>
                  <small>{{ admin.email }}</small>
                </div>
              </div>
              <div class="summary-item">
                <span class="material-icons">{{ scenario === 'demo' ? 'science' : 'construction' }}</span>
                <div>
                  <strong>{{ (scenario === 'demo' ? 'SETUP.FINISH.MODE_DEMO' : 'SETUP.FINISH.MODE_CLEAN') | translate }}</strong>
                  <small>{{ (scenario === 'demo' ? 'SETUP.FINISH.DEMO_DATA' : 'SETUP.FINISH.CLEAN_DATA') | translate }}</small>
                </div>
              </div>
            </div>

            <p class="setup-message" *ngIf="setupComplete">
              {{ 'SETUP.FINISH.REDIRECT' | translate }}
            </p>
          </div>
        </div>

        <!-- Footer buttons -->
        <div class="wizard-footer" *ngIf="!isSubmitting && !setupComplete">
          <button class="btn-back"
            (click)="prevStep()"
            [disabled]="currentStep === 0">
            <span class="material-icons">arrow_back</span>
            {{ 'SETUP.BACK' | translate }}
          </button>

          <button class="btn-next"
            *ngIf="currentStep < steps.length - 1"
            (click)="nextStep()"
            [disabled]="!canProceed()">
            {{ 'SETUP.NEXT' | translate }}
            <span class="material-icons">arrow_forward</span>
          </button>

          <button class="btn-finish"
            *ngIf="currentStep === steps.length - 1"
            (click)="completeSetup()"
            [disabled]="!canFinish()">
            <span class="material-icons">check</span>
            {{ 'SETUP.FINISH.LAUNCH' | translate }}
          </button>
        </div>
      </div>

      <!-- Footer -->
      <div class="setup-footer">
        {{ 'SETUP.FOOTER' | translate }}
      </div>

      <!-- Role modal -->
      <div class="modal-overlay" *ngIf="showRoleModal" (click)="closeRoleModal()">
        <div class="role-modal" (click)="$event.stopPropagation()">
          <button class="modal-close" (click)="closeRoleModal()">
            <span class="material-icons">close</span>
          </button>

          <div class="role-modal-header"
            [style.border-bottom]="'2px solid ' + (selectedRole?.color || '#1a73e8')">
            <span class="material-icons" [style.color]="selectedRole?.color">{{ selectedRole?.icon }}</span>
            <h2>{{ selectedRole?.title }}</h2>
          </div>

          <div class="role-modal-body">
            <p>{{ selectedRole?.fullDescription }}</p>

            <h3>{{ 'SETUP.ROLES.KEY_FEATURES' | translate }}</h3>
            <ul class="role-features">
              <li *ngFor="let f of selectedRole?.features">
                <span class="material-icons">check_circle</span>
                {{ f }}
              </li>
            </ul>

            <h3>{{ 'SETUP.ROLES.PAGES' | translate }}</h3>
            <div class="role-pages">
              <span class="page-badge" *ngFor="let p of selectedRole?.pages">{{ p }}</span>
            </div>
          </div>

          <div class="role-modal-footer">
            <button class="btn-modal-primary" (click)="markRoleViewed(); closeRoleModal()">
              <span class="material-icons">check</span>
              {{ 'SETUP.ROLES.GOT_IT' | translate }}
            </button>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; }

    .setup-page {
      min-height: 100vh;
      background: linear-gradient(150deg, #eef2ff 0%, #f0f4ff 50%, #e8f0fe 100%);
      color: #1f2937;
      position: relative;
      overflow-x: hidden;
      padding: 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }

    .bg-gradient {
      position: fixed;
      inset: 0;
      background:
        radial-gradient(circle at 15% 25%, rgba(26,115,232,0.07) 0%, transparent 55%),
        radial-gradient(circle at 85% 75%, rgba(99,102,241,0.05) 0%, transparent 55%);
      pointer-events: none;
      z-index: 0;
    }

    /* LANGUAGE SELECTOR */
    .lang-selector {
      position: absolute;
      top: 20px;
      right: 24px;
      display: flex;
      gap: 4px;
      z-index: 10;
    }

    .lang-selector button {
      padding: 6px 12px;
      background: white;
      border: 1.5px solid #e2e8f0;
      border-radius: 8px;
      color: #718096;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
      font-family: inherit;
      transition: all 0.15s;
      letter-spacing: 0.5px;
    }

    .lang-selector button.active {
      background: #1a73e8;
      border-color: #1a73e8;
      color: white;
    }

    .lang-selector button:hover:not(.active) {
      border-color: #1a73e8;
      color: #1a73e8;
    }

    /* PROGRESS BAR */
    .progress-bar {
      width: 100%;
      max-width: 720px;
      height: 3px;
      background: rgba(26,115,232,0.12);
      border-radius: 3px;
      margin: 52px 0 14px;
      position: relative;
      z-index: 1;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #1a73e8, #6366f1);
      border-radius: 3px;
      transition: width 0.4s ease;
      box-shadow: 0 0 8px rgba(26,115,232,0.3);
    }

    /* STEP INDICATOR */
    .step-indicator {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 5px 14px;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      font-size: 12px;
      color: #718096;
      margin-bottom: 20px;
      position: relative;
      z-index: 1;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }

    .step-indicator .material-icons { font-size: 16px; color: #1a73e8; }

    /* WIZARD CARD */
    .wizard-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      padding: 48px;
      max-width: 720px;
      width: 100%;
      position: relative;
      z-index: 1;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    }

    .step-content { min-height: 360px; }

    /* HERO */
    .step-hero { text-align: center; margin-bottom: 32px; }

    .hero-logo {
      width: 76px;
      height: 76px;
      margin: 0 auto 20px;
      background: linear-gradient(135deg, #1a73e8, #1557b0);
      border-radius: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 28px rgba(26,115,232,0.3);
    }

    .hero-logo .material-icons { font-size: 42px; color: white; }

    .step-hero h1 {
      font-size: 34px;
      font-weight: 800;
      margin: 0 0 6px;
      color: #0f2d52;
      letter-spacing: -1px;
    }

    .hero-subtitle { font-size: 15px; color: #718096; margin: 0 0 4px; }
    .hero-tagline { font-size: 12px; color: #94a3b8; margin: 0; font-style: italic; }

    .welcome-features {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin: 28px 0;
    }

    .feature {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 14px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      font-size: 13px;
      color: #475569;
    }

    .feature .material-icons { font-size: 18px; color: #1a73e8; }

    .welcome-text {
      text-align: center;
      font-size: 14px;
      color: #718096;
      line-height: 1.7;
    }

    /* HEADINGS */
    h2 {
      font-size: 22px;
      margin: 0 0 22px;
      display: inline-flex;
      align-items: center;
      gap: 10px;
      color: #0f2d52;
    }

    h2 .material-icons { color: #1a73e8; font-size: 24px; }

    .step-description { color: #718096; font-size: 13px; margin: -14px 0 20px; }

    /* INFO GRID */
    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(160px, 100%), 1fr));
      gap: 12px;
      margin-bottom: 20px;
    }

    .info-card {
      padding: 18px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      text-align: center;
    }

    .info-card .material-icons { font-size: 30px; color: #1a73e8; margin-bottom: 8px; }
    .info-card h3 { margin: 0 0 6px; font-size: 16px; color: #0f2d52; }
    .info-card p { margin: 0; font-size: 11px; color: #718096; line-height: 1.5; }

    .tech-stack { margin-top: 8px; }
    .tech-label { font-size: 12px; color: #718096; margin: 0 0 8px; font-weight: 600; }
    .tech-badges { display: flex; flex-wrap: wrap; gap: 6px; }

    .tech-badge {
      padding: 4px 10px;
      background: rgba(26,115,232,0.08);
      border: 1px solid rgba(26,115,232,0.18);
      color: #1557b0;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
    }

    /* OPTIONS */
    .option-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(280px, 100%), 1fr));
      gap: 16px;
      width: 100%;
    }

    .option-card {
      background: #f8fafc;
      border: 2px solid #e2e8f0;
      border-radius: 14px;
      padding: 22px;
      cursor: pointer;
      text-align: left;
      transition: all 0.2s;
      position: relative;
      color: inherit;
      font-family: inherit;
      min-width: 0;
      overflow: hidden;
    }

    .option-card:hover { border-color: #1a73e8; transform: translateY(-2px); box-shadow: 0 4px 16px rgba(26,115,232,0.12); }
    .option-card.selected { border-color: #1a73e8; background: rgba(26,115,232,0.06); }

    .option-icon { font-size: 30px !important; color: #1a73e8; margin-bottom: 10px; display: block; }
    .option-card h3 { margin: 0 0 8px; color: #0f2d52; font-size: 17px; }
    .option-card p { margin: 0 0 10px; color: #718096; font-size: 12px; }
    .option-card ul { margin: 0; padding-left: 18px; color: #475569; font-size: 12px; }
    .option-card ul li { margin: 3px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .option-card p {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .badge-recommended {
      position: absolute;
      top: 10px;
      right: 10px;
      padding: 3px 8px;
      background: #1a73e8;
      color: white;
      border-radius: 8px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* ROLES */
    .role-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(200px, 100%), 1fr));
      gap: 10px;
      margin-bottom: 16px;
      width: 100%;
    }

    .role-card {
      background: #f8fafc;
      border: 1.5px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px;
      cursor: pointer;
      text-align: left;
      transition: all 0.15s;
      color: inherit;
      font-family: inherit;
      min-width: 0;
      overflow: hidden;
    }

    .role-card:hover { border-color: #1a73e8; transform: translateY(-1px); box-shadow: 0 2px 8px rgba(26,115,232,0.1); }
    .role-card.viewed { border-color: rgba(34,197,94,0.5); background: rgba(34,197,94,0.05); }
    .role-card .material-icons { font-size: 26px; margin-bottom: 8px; display: block; }
    .role-card h3 { margin: 0 0 4px; font-size: 13px; color: #0f2d52; }
    .role-card p {
      margin: 0 0 10px;
      font-size: 11px;
      color: #718096;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .view-tour { font-size: 11px; color: #1a73e8; font-weight: 600; }

    .viewed-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      color: #22c55e;
      font-weight: 600;
    }

    .viewed-badge .material-icons { font-size: 14px !important; margin: 0 !important; }

    .btn-skip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 10px 16px;
      background: transparent;
      border: 1.5px solid #e2e8f0;
      border-radius: 10px;
      color: #718096;
      font-size: 13px;
      cursor: pointer;
      font-family: inherit;
      transition: all 0.15s;
    }

    .btn-skip:hover { background: #f8fafc; color: #475569; border-color: #cbd5e1; }

    /* FORMS */
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }

    .form-group { margin-bottom: 16px; }

    .form-group label {
      display: block;
      font-size: 11px;
      font-weight: 700;
      color: #4a5568;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.6px;
    }

    .form-group input {
      width: 100%;
      height: 42px;
      padding: 0 14px;
      background: white;
      border: 1.5px solid #e2e8f0;
      border-radius: 10px;
      color: #0f2d52;
      font-size: 14px;
      font-family: inherit;
      outline: none;
      box-sizing: border-box;
      transition: border-color 0.15s, box-shadow 0.15s;
    }

    .form-group input:focus {
      border-color: #1a73e8;
      box-shadow: 0 0 0 3px rgba(26,115,232,0.1);
    }

    /* Custom select wrapper */
    .select-wrap {
      position: relative;
      display: block;
    }

    .select-wrap select {
      width: 100%;
      height: 42px;
      padding: 0 36px 0 14px;
      background: white;
      border: 1.5px solid #e2e8f0;
      border-radius: 10px;
      color: #0f2d52;
      font-size: 14px;
      font-family: inherit;
      outline: none;
      box-sizing: border-box;
      appearance: none;
      -webkit-appearance: none;
      -moz-appearance: none;
      cursor: pointer;
      transition: border-color 0.15s, box-shadow 0.15s;
    }

    .select-wrap select:focus {
      border-color: #1a73e8;
      box-shadow: 0 0 0 3px rgba(26,115,232,0.1);
    }

    .select-arrow {
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 20px !important;
      color: #718096;
      pointer-events: none;
    }

    .password-strength {
      display: block;
      margin-top: 5px;
      font-size: 11px;
      color: #22c55e;
      font-weight: 600;
    }

    .error {
      display: block;
      margin-top: 5px;
      font-size: 11px;
      color: #ef4444;
      font-weight: 600;
    }

    /* SUCCESS */
    .success-screen { text-align: center; padding: 24px 0; }

    .success-icon {
      width: 76px;
      height: 76px;
      margin: 0 auto 20px;
      background: linear-gradient(135deg, #1a73e8, #6366f1);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 28px rgba(26,115,232,0.25);
    }

    .success-icon.blue { background: linear-gradient(135deg, #1a73e8, #1557b0); }
    .success-icon.green {
      background: linear-gradient(135deg, #22c55e, #16a34a);
      box-shadow: 0 8px 28px rgba(34,197,94,0.3);
    }

    .success-icon .material-icons { font-size: 42px; color: white; }
    .success-icon .material-icons.spinning { animation: spin 1s linear infinite; }

    .success-screen h2 { color: #0f2d52; margin: 0 0 16px; }

    @keyframes spin { to { transform: rotate(360deg); } }

    .setup-summary { max-width: 380px; margin: 22px auto; text-align: left; }

    .summary-item {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 12px 16px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      margin-bottom: 8px;
    }

    .summary-item .material-icons { font-size: 22px; color: #1a73e8; }
    .summary-item strong { display: block; color: #0f2d52; font-size: 13px; }
    .summary-item small { display: block; color: #718096; font-size: 11px; margin-top: 2px; }

    .setup-message { color: #718096; font-size: 14px; line-height: 1.7; margin-top: 16px; }

    /* FOOTER BUTTONS */
    .wizard-footer {
      display: flex;
      justify-content: space-between;
      margin-top: 32px;
      padding-top: 22px;
      border-top: 1px solid #f0f4f8;
    }

    .btn-back, .btn-next, .btn-finish {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 11px 22px;
      border-radius: 10px;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      font-size: 14px;
      transition: all 0.15s;
      border: none;
    }

    .btn-back {
      background: #f4f6f9;
      color: #718096;
      border: 1.5px solid #e2e8f0;
    }

    .btn-back:hover:not(:disabled) { background: #e2e8f0; color: #475569; }
    .btn-back:disabled { opacity: 0.4; cursor: not-allowed; }

    .btn-next, .btn-finish {
      background: #1a73e8;
      color: white;
      box-shadow: 0 4px 12px rgba(26,115,232,0.3);
    }

    .btn-next:hover:not(:disabled), .btn-finish:hover:not(:disabled) {
      background: #1557b0;
      transform: translateY(-1px);
      box-shadow: 0 6px 18px rgba(26,115,232,0.35);
    }

    .btn-next:disabled, .btn-finish:disabled { opacity: 0.4; cursor: not-allowed; }

    /* PAGE FOOTER */
    .setup-footer {
      margin-top: 28px;
      color: #94a3b8;
      font-size: 11px;
      letter-spacing: 0.5px;
      position: relative;
      z-index: 1;
    }

    /* ROLE MODAL */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.45);
      backdrop-filter: blur(4px);
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .role-modal {
      background: white;
      border-radius: 18px;
      max-width: 580px;
      width: 100%;
      max-height: 85vh;
      overflow-y: auto;
      position: relative;
      border: 1px solid #e2e8f0;
      box-shadow: 0 24px 64px rgba(0,0,0,0.15);
    }

    .modal-close {
      position: absolute;
      top: 14px;
      right: 14px;
      background: #f4f6f9;
      border: none;
      width: 34px;
      height: 34px;
      border-radius: 50%;
      color: #718096;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1;
      transition: all 0.15s;
    }

    .modal-close:hover { background: #fce8e6; color: #ea4335; }

    .role-modal-header {
      padding: 28px 32px;
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .role-modal-header .material-icons { font-size: 36px; }
    .role-modal-header h2 { margin: 0; font-size: 22px; color: #0f2d52; }

    .role-modal-body { padding: 0 32px 24px; }
    .role-modal-body p { color: #475569; line-height: 1.7; font-size: 14px; margin: 0 0 20px; }

    .role-modal-body h3 {
      margin: 16px 0 10px;
      font-size: 11px;
      color: #1a73e8;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      font-weight: 700;
    }

    .role-features { list-style: none; padding: 0; margin: 0; }

    .role-features li {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 7px 0;
      color: #475569;
      font-size: 13px;
    }

    .role-features .material-icons { font-size: 16px; color: #22c55e; }

    .role-pages { display: flex; flex-wrap: wrap; gap: 6px; }

    .page-badge {
      padding: 3px 9px;
      background: rgba(26,115,232,0.08);
      border: 1px solid rgba(26,115,232,0.18);
      color: #1557b0;
      border-radius: 5px;
      font-size: 11px;
      font-weight: 600;
      font-family: ui-monospace, monospace;
    }

    .role-modal-footer {
      padding: 18px 32px;
      border-top: 1px solid #f0f4f8;
      display: flex;
      justify-content: flex-end;
    }

    .btn-modal-primary {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 11px 22px;
      background: #1a73e8;
      color: white;
      border: none;
      border-radius: 10px;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      font-size: 14px;
      transition: all 0.15s;
    }

    .btn-modal-primary:hover { background: #1557b0; }

    @media (max-width: 700px) {
      .wizard-card { padding: 24px 18px; }
      .form-row { grid-template-columns: 1fr; }
      .welcome-features { grid-template-columns: 1fr; }
      .option-grid { grid-template-columns: 1fr; }
      .role-grid { grid-template-columns: 1fr 1fr; }
      .step-hero h1 { font-size: 26px; }
      .wizard-footer { flex-wrap: wrap; gap: 8px; }
    }

    @media (max-width: 480px) {
      .role-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class SetupComponent implements OnInit {
  showHelloIntro = false; // set in ngOnInit based on localStorage
  currentStep = 0;
  isSubmitting = false;
  setupComplete = false;

  scenario: 'demo' | 'clean' = 'demo';
  viewedRoles: string[] = [];
  showRoleModal = false;
  selectedRole: any = null;

  emailPlaceholder = 'admin@yourclinic.md';
  phonePlaceholder = '+373 ...';
  private lastAutoEmail = '';

  steps: WizardStep[] = [
    { id: 'welcome',  titleKey: 'SETUP.STEPS.WELCOME', icon: 'waving_hand' },
    { id: 'about',    titleKey: 'SETUP.STEPS.ABOUT',   icon: 'info' },
    { id: 'scenario', titleKey: 'SETUP.STEPS.MODE',    icon: 'tune' },
    { id: 'roles',    titleKey: 'SETUP.STEPS.ROLES',   icon: 'school' },
    { id: 'clinic',   titleKey: 'SETUP.STEPS.CLINIC',  icon: 'business' },
    { id: 'admin',    titleKey: 'SETUP.STEPS.ADMIN',   icon: 'admin_panel_settings' },
    { id: 'finish',   titleKey: 'SETUP.STEPS.FINISH',  icon: 'rocket_launch' }
  ];

  langs = [
    { code: 'ru' },
    { code: 'ro' },
    { code: 'en' }
  ];

  currentLang = 'ru';

  countries = [
    { code: 'MD', name: 'Moldova',  tld: 'md',  phone: '+373', timezone: 'Europe/Chisinau',  currency: 'MDL', cities: { ru: 'Кишинёв',    ro: 'Chișinău',   en: 'Chisinau'  } },
    { code: 'RO', name: 'Romania',  tld: 'ro',  phone: '+40',  timezone: 'Europe/Bucharest', currency: 'RON', cities: { ru: 'Бухарест',   ro: 'București',  en: 'Bucharest' } },
    { code: 'RU', name: 'Russia',   tld: 'ru',  phone: '+7',   timezone: 'Europe/Moscow',    currency: 'RUB', cities: { ru: 'Москва',     ro: 'Moscova',    en: 'Moscow'    } },
    { code: 'UA', name: 'Ukraine',  tld: 'ua',  phone: '+380', timezone: 'Europe/Kyiv',      currency: 'UAH', cities: { ru: 'Киев',       ro: 'Kiev',       en: 'Kyiv'      } },
    { code: 'US', name: 'USA',      tld: 'com', phone: '+1',   timezone: 'America/New_York', currency: 'USD', cities: { ru: 'Нью-Йорк',  ro: 'New York',   en: 'New York'  } },
    { code: 'GB', name: 'UK',       tld: 'uk',  phone: '+44',  timezone: 'Europe/London',    currency: 'GBP', cities: { ru: 'Лондон',     ro: 'Londra',     en: 'London'    } },
    { code: 'DE', name: 'Germany',  tld: 'de',  phone: '+49',  timezone: 'Europe/Berlin',    currency: 'EUR', cities: { ru: 'Берлин',     ro: 'Berlin',     en: 'Berlin'    } },
  ];

  timezones = [
    { value: 'Europe/Chisinau',  label: 'Chișinău (EET UTC+2/+3)' },
    { value: 'Europe/Bucharest', label: 'Bucharest (EET UTC+2/+3)' },
    { value: 'Europe/Moscow',    label: 'Moscow (MSK UTC+3)' },
    { value: 'Europe/Kyiv',      label: 'Kyiv (EET UTC+2/+3)' },
    { value: 'Europe/Berlin',    label: 'Berlin (CET UTC+1/+2)' },
    { value: 'Europe/London',    label: 'London (GMT UTC+0/+1)' },
    { value: 'America/New_York', label: 'New York (ET UTC-5/-4)' },
    { value: 'UTC',              label: 'UTC' },
  ];

  clinic = {
    name: '',
    city: 'Chișinău',
    country: 'MD',
    timezone: 'Europe/Chisinau',
    defaultLanguage: 'ru' as 'ru' | 'ro' | 'en',
    currency: 'MDL'
  };

  admin = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    passwordConfirm: ''
  };

  roles = [
    {
      id: 'admin',
      title: 'Administrator',
      icon: 'admin_panel_settings',
      color: '#1a73e8',
      shortKey: 'SETUP.ROLES.ROLE_ADMIN_SHORT',
      description: 'Full system access',
      fullDescription: 'Administrator has full access to all system functions: staff management, cabinets, test catalogs, reports, and clinic settings.',
      features: [
        'Staff management (create, edit, deactivate)',
        'Cabinet and service management',
        'Lab test catalog',
        'All appointment access',
        'Analytics and reports',
        'System configuration'
      ],
      pages: ['/dashboard', '/patients', '/appointments', '/rooms', '/staff', '/profile', '/lab-catalog', '/reports']
    },
    {
      id: 'doctor',
      title: 'Doctor',
      icon: 'medical_services',
      color: '#10b981',
      shortKey: 'SETUP.ROLES.ROLE_DOCTOR_SHORT',
      description: 'Appointments and diagnoses',
      fullDescription: 'Doctor manages patient appointments, enters diagnoses and treatment, orders lab tests, and reviews results.',
      features: [
        'Daily appointment view',
        'Patient cards with history',
        'Diagnosis and prescription entry',
        'Lab test orders',
        'Lab result review'
      ],
      pages: ['/dashboard', '/patients', '/appointments', '/profile']
    },
    {
      id: 'reception',
      title: 'Receptionist',
      icon: 'support_agent',
      color: '#f59e0b',
      shortKey: 'SETUP.ROLES.ROLE_RECEPTION_SHORT',
      description: 'Scheduling and registration',
      fullDescription: 'Receptionist registers new patients and books appointments with doctors, radiology, or laboratory.',
      features: [
        'New patient registration',
        'Appointment creation',
        'Schedule management',
        'Doctor availability check',
        'Reports access'
      ],
      pages: ['/dashboard', '/patients', '/appointments', '/reports', '/profile']
    },
    {
      id: 'radiologist',
      title: 'Radiologist',
      icon: 'medical_information',
      color: '#7c3aed',
      shortKey: 'SETUP.ROLES.ROLE_RADIOLOGIST_SHORT',
      description: 'Radiology studies',
      fullDescription: 'Radiologist conducts MRI, CT, X-Ray, and Ultrasound studies, works with DICOM images, and creates reports.',
      features: [
        'Radiology worklist',
        'DICOM viewer (Zoom, Pan, Window/Level)',
        'Measurements (length, angle, HU)',
        'Report templates',
        'PDF export'
      ],
      pages: ['/ris-dashboard', '/worklist', '/studies', '/profile']
    },
    {
      id: 'lab_technician',
      title: 'Lab Technician',
      icon: 'biotech',
      color: '#06b6d4',
      shortKey: 'SETUP.ROLES.ROLE_LAB_SHORT',
      description: 'Lab orders and results',
      fullDescription: 'Lab technician processes test orders, enters results with auto-flag detection (normal/abnormal/critical).',
      features: [
        'Lab order worklist',
        'Priority handling (Routine/Urgent/STAT)',
        'Result entry per parameter',
        'Auto-flag: normal/low/high/critical',
        'PDF result export'
      ],
      pages: ['/lab-dashboard', '/lab/worklist', '/lab/orders', '/profile']
    }
  ];

  constructor(
    private http: HttpClient,
    private router: Router,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
    private toast: ToastService
  ) {}

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape' && this.showRoleModal) {
      this.closeRoleModal();
      event.preventDefault();
    }
    if (this.showHelloIntro) return;
    const tag = (event.target as HTMLElement).tagName;
    if (event.key === 'ArrowRight' && !this.showRoleModal) {
      if (this.canProceed() && this.currentStep < this.steps.length - 1) this.nextStep();
    }
    if (event.key === 'ArrowLeft' && !this.showRoleModal) {
      if (this.currentStep > 0) this.prevStep();
    }
    if (event.key === 'Enter' && tag !== 'INPUT' && tag !== 'SELECT' && tag !== 'TEXTAREA' && !this.showRoleModal) {
      if (this.currentStep < this.steps.length - 1 && this.canProceed()) {
        this.nextStep();
        event.preventDefault();
      }
    }
  }

  onHelloDone() {
    this.showHelloIntro = false;
    localStorage.setItem('hello_seen', 'true');
    this.cdr.detectChanges();
  }

  async ngOnInit(): Promise<void> {
    // Show hello intro only on first visit
    this.showHelloIntro = localStorage.getItem('hello_seen') !== 'true';

    const saved = localStorage.getItem('language') || localStorage.getItem('lang');
    const browserLang = navigator.language.split('-')[0];
    const langToUse = (['ru', 'ro', 'en'].includes(saved || '') ? saved : null)
      || (['ru', 'ro', 'en'].includes(browserLang) ? browserLang : 'ru');

    this.currentLang = langToUse!;
    this.clinic.defaultLanguage = langToUse as any;

    // Await translation load before first render
    try {
      await firstValueFrom(this.translate.use(langToUse!));
    } catch {}

    this.onCountryChange();
    this.cdr.detectChanges();

    this.checkStatus();
  }

  async checkStatus() {
    try {
      const res: any = await firstValueFrom(this.http.get('/api/setup/status'));
      if (res?.data?.isSetupComplete) {
        this.router.navigate(['/auth/login']);
      }
    } catch {}
  }

  async changeLang(lang: string): Promise<void> {
    this.currentLang = lang;
    this.clinic.defaultLanguage = lang as any;
    try {
      await firstValueFrom(this.translate.use(lang));
    } catch {}
    localStorage.setItem('language', lang);
    // Update city name to the new language
    const country = this.countries.find(c => c.code === this.clinic.country);
    if (country) {
      this.clinic.city = (country.cities as any)[lang] || country.cities.en;
    }
    this.cdr.detectChanges();
  }

  onCountryChange(): void {
    const country = this.countries.find(c => c.code === this.clinic.country);
    if (!country) return;
    this.clinic.timezone = country.timezone;
    this.clinic.currency = country.currency;
    this.phonePlaceholder = country.phone + ' ...';
    this.clinic.city = (country.cities as any)[this.currentLang] || country.cities.en;
    this.updateEmailPlaceholder(country);
  }

  onClinicNameChange(): void {
    const country = this.countries.find(c => c.code === this.clinic.country);
    if (country) this.updateEmailPlaceholder(country);
  }

  onFirstNameChange(): void { this.updateAutoEmail(); }
  onLastNameChange(): void  { this.updateAutoEmail(); }

  private transliterate(text: string): string {
    const map: Record<string, string> = {
      'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'zh','з':'z',
      'и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r',
      'с':'s','т':'t','у':'u','ф':'f','х':'kh','ц':'ts','ч':'ch','ш':'sh',
      'щ':'shch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya',
      'ă':'a','â':'a','î':'i','ș':'s','ț':'t','ş':'s','ţ':'t',
    };
    return text.toLowerCase().split('').map(c => map[c] !== undefined ? map[c] : c).join('');
  }

  private clinicSlug(): string {
    return (this.clinic.name || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '')
      .replace(/^-+|-+$/g, '');
  }

  private updateEmailPlaceholder(country: { tld: string }): void {
    const slug = this.clinicSlug();
    const clinicPart = slug || 'yourclinic';
    const first = this.transliterate(this.admin.firstName || '').replace(/[^a-z0-9]/g, '');
    const last  = this.transliterate(this.admin.lastName  || '').replace(/[^a-z0-9]/g, '');
    const namePart = (first + last) || 'admin';
    this.emailPlaceholder = `${namePart}@${clinicPart}.${country.tld}`;
    this.updateAutoEmail();
  }

  private updateAutoEmail(): void {
    // Don't overwrite if the user typed their own email
    if (this.admin.email && this.admin.email !== this.lastAutoEmail) return;
    const country = this.countries.find(c => c.code === this.clinic.country);
    if (!country) return;
    const slug = this.clinicSlug();
    const clinicPart = slug || 'yourclinic';
    const first = this.transliterate(this.admin.firstName || '').replace(/[^a-z0-9]/g, '');
    const last  = this.transliterate(this.admin.lastName  || '').replace(/[^a-z0-9]/g, '');
    if (!first && !last) return; // don't auto-fill until at least one name char
    const generated = `${first}${last}@${clinicPart}.${country.tld}`;
    this.lastAutoEmail = generated;
    this.admin.email = generated;
  }

  get progressPct(): number {
    return Math.round((this.currentStep / (this.steps.length - 1)) * 100);
  }

  nextStep(): void {
    if (this.canProceed() && this.currentStep < this.steps.length - 1) {
      this.currentStep++;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  prevStep(): void {
    if (this.currentStep > 0) {
      this.currentStep--;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  canProceed(): boolean {
    if (this.currentStep === 4) return !!this.clinic.name?.trim();
    if (this.currentStep === 5) {
      return !!(
        this.admin.firstName?.trim() &&
        this.admin.lastName?.trim() &&
        this.admin.email?.trim() &&
        this.admin.password?.length >= 6 &&
        this.admin.password === this.admin.passwordConfirm
      );
    }
    return true;
  }

  canFinish(): boolean {
    return this.canProceed();
  }

  getPasswordStrengthKey(): string {
    const p = this.admin.password;
    if (!p) return '';
    if (p.length < 6) return 'SETUP.ADMIN.PASS_SHORT';
    if (p.length < 8) return 'SETUP.ADMIN.PASS_OK';
    if (p.length < 12) return 'SETUP.ADMIN.PASS_GOOD';
    return 'SETUP.ADMIN.PASS_GREAT';
  }

  viewRole(role: any): void {
    this.selectedRole = role;
    this.showRoleModal = true;
  }

  closeRoleModal(): void {
    this.showRoleModal = false;
  }

  markRoleViewed(): void {
    if (this.selectedRole && !this.viewedRoles.includes(this.selectedRole.id)) {
      this.viewedRoles.push(this.selectedRole.id);
    }
  }

  async completeSetup(): Promise<void> {
    this.isSubmitting = true;
    this.cdr.detectChanges();

    try {
      const payload = {
        admin: {
          firstName: this.admin.firstName,
          lastName: this.admin.lastName,
          email: this.admin.email,
          phone: this.admin.phone,
          password: this.admin.password
        },
        clinic: {
          name: this.clinic.name,
          city: this.clinic.city,
          timezone: this.clinic.timezone,
          defaultLanguage: this.clinic.defaultLanguage,
          currency: this.clinic.currency
        },
        importDemo: this.scenario === 'demo'
      };

      await firstValueFrom(this.http.post('/api/setup/initialize', payload));

      this.isSubmitting = false;
      this.setupComplete = true;
      this.toast.success('Система настроена! Добро пожаловать в HIS-MedSystem 🎉');
      this.cdr.detectChanges();

      setTimeout(() => {
        this.router.navigate(['/auth/login'], {
          queryParams: { firstLogin: 'true' }
        });
      }, 3000);
    } catch (err: any) {
      this.isSubmitting = false;
      const errMsg = err?.error?.message || err?.message || 'Unknown error';
      this.toast.error('Ошибка: ' + errMsg);
      this.cdr.detectChanges();
    }
  }
}
