import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

interface WizardStep {
  id: string;
  title: string;
  icon: string;
}

@Component({
  selector: 'app-setup',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="setup-page">

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
      <div class="progress-bar">
        <div class="progress-fill" [style.width.%]="progress"></div>
      </div>

      <!-- Step indicator -->
      <div class="step-indicator">
        <span class="material-icons">{{ steps[currentStep].icon }}</span>
        <span class="step-label">Step {{ currentStep + 1 }} / {{ steps.length }}</span>
      </div>

      <!-- Wizard card -->
      <div class="wizard-card">

        <!-- STEP 0: WELCOME -->
        <div class="step-content" *ngIf="currentStep === 0">
          <div class="step-hero">
            <div class="hero-logo">
              <span class="material-icons">local_hospital</span>
            </div>
            <h1>HIS-MedSystem</h1>
            <p class="hero-subtitle">Hospital Information System</p>
            <p class="hero-tagline">Engineered for Healthcare. Built for Performance.</p>
          </div>

          <div class="welcome-features">
            <div class="feature">
              <span class="material-icons">verified</span>
              <span>272 automated tests</span>
            </div>
            <div class="feature">
              <span class="material-icons">speed</span>
              <span>Lighthouse 95.5/100</span>
            </div>
            <div class="feature">
              <span class="material-icons">shield</span>
              <span>Production-grade security</span>
            </div>
            <div class="feature">
              <span class="material-icons">language</span>
              <span>3 languages (RU/RO/EN)</span>
            </div>
          </div>

          <p class="welcome-text">
            First launch detected.<br>
            Let's configure your clinic in 2 minutes.
          </p>
        </div>

        <!-- STEP 1: ABOUT -->
        <div class="step-content" *ngIf="currentStep === 1">
          <h2><span class="material-icons">info</span> About the system</h2>

          <div class="info-grid">
            <div class="info-card">
              <span class="material-icons">people</span>
              <h3>HIS</h3>
              <p>Patient management, appointments, scheduling</p>
            </div>
            <div class="info-card">
              <span class="material-icons">medical_information</span>
              <h3>RIS</h3>
              <p>Radiology with DICOM viewer and reports</p>
            </div>
            <div class="info-card">
              <span class="material-icons">biotech</span>
              <h3>LIS</h3>
              <p>Laboratory with auto-flag interpretation</p>
            </div>
          </div>

          <div class="tech-stack">
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
          <h2><span class="material-icons">tune</span> Setup mode</h2>

          <div class="option-grid">
            <button class="option-card"
              [class.selected]="scenario === 'demo'"
              (click)="scenario = 'demo'">
              <span class="material-icons option-icon">science</span>
              <h3>Demo mode</h3>
              <p>Full system with sample data:</p>
              <ul>
                <li>12 patients</li>
                <li>3 cabinets</li>
                <li>15 lab tests</li>
                <li>20+ appointments</li>
              </ul>
              <span class="badge-recommended">Recommended</span>
            </button>

            <button class="option-card"
              [class.selected]="scenario === 'clean'"
              (click)="scenario = 'clean'">
              <span class="material-icons option-icon">construction</span>
              <h3>Clean install</h3>
              <p>Admin account only, no data:</p>
              <ul>
                <li>For production</li>
                <li>Clean start</li>
                <li>No demo records</li>
              </ul>
            </button>
          </div>
        </div>

        <!-- STEP 3: ROLES -->
        <div class="step-content" *ngIf="currentStep === 3">
          <h2><span class="material-icons">school</span> System roles</h2>
          <p class="step-description">Learn about roles (can be skipped)</p>

          <div class="role-grid">
            <button class="role-card" *ngFor="let role of roles"
              (click)="viewRole(role)"
              [class.viewed]="viewedRoles.includes(role.id)">
              <span class="material-icons" [style.color]="role.color">{{ role.icon }}</span>
              <h3>{{ role.title }}</h3>
              <p>{{ role.description }}</p>
              <span class="view-tour" *ngIf="!viewedRoles.includes(role.id)">
                Learn more →
              </span>
              <span class="viewed-badge" *ngIf="viewedRoles.includes(role.id)">
                <span class="material-icons">check_circle</span> Done
              </span>
            </button>
          </div>

          <button class="btn-skip" (click)="nextStep()">
            <span class="material-icons">skip_next</span>
            Skip and continue
          </button>
        </div>

        <!-- STEP 4: CLINIC -->
        <div class="step-content" *ngIf="currentStep === 4">
          <h2><span class="material-icons">business</span> Clinic settings</h2>

          <div class="form-group">
            <label>Clinic name *</label>
            <input type="text" [(ngModel)]="clinic.name"
              placeholder="e.g. Medical Center Vita">
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>City</label>
              <input type="text" [(ngModel)]="clinic.city" placeholder="Chișinău">
            </div>
            <div class="form-group">
              <label>Timezone</label>
              <select [(ngModel)]="clinic.timezone">
                <option value="Europe/Chisinau">Chișinău (EET)</option>
                <option value="Europe/Bucharest">Bucharest (EET)</option>
                <option value="Europe/Moscow">Moscow (MSK)</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Default language</label>
              <select [(ngModel)]="clinic.defaultLanguage">
                <option value="ru">Русский</option>
                <option value="ro">Română</option>
                <option value="en">English</option>
              </select>
            </div>
            <div class="form-group">
              <label>Currency</label>
              <select [(ngModel)]="clinic.currency">
                <option value="MDL">MDL (Moldovan leu)</option>
                <option value="RON">RON (Romanian leu)</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>
        </div>

        <!-- STEP 5: ADMIN -->
        <div class="step-content" *ngIf="currentStep === 5">
          <h2><span class="material-icons">admin_panel_settings</span> Administrator account</h2>
          <p class="step-description">Create the main account to manage the system</p>

          <div class="form-row">
            <div class="form-group">
              <label>First name *</label>
              <input type="text" [(ngModel)]="admin.firstName" placeholder="Ion">
            </div>
            <div class="form-group">
              <label>Last name *</label>
              <input type="text" [(ngModel)]="admin.lastName" placeholder="Popescu">
            </div>
          </div>

          <div class="form-group">
            <label>Email *</label>
            <input type="email" [(ngModel)]="admin.email"
              placeholder="admin@yourclinic.com">
          </div>

          <div class="form-group">
            <label>Phone</label>
            <input type="tel" [(ngModel)]="admin.phone" placeholder="+373 ...">
          </div>

          <div class="form-group">
            <label>Password * (min 6 characters)</label>
            <input type="password" [(ngModel)]="admin.password"
              placeholder="Strong password">
            <small class="password-strength" *ngIf="admin.password">
              {{ getPasswordStrength() }}
            </small>
          </div>

          <div class="form-group">
            <label>Confirm password *</label>
            <input type="password" [(ngModel)]="admin.passwordConfirm"
              placeholder="Repeat password">
            <small class="error"
              *ngIf="admin.passwordConfirm && admin.password !== admin.passwordConfirm">
              Passwords do not match
            </small>
          </div>
        </div>

        <!-- STEP 6: FINISH -->
        <div class="step-content" *ngIf="currentStep === 6">
          <div class="success-screen">
            <div class="success-icon" [class.blue]="isSubmitting" [class.green]="setupComplete">
              <span class="material-icons"
                [class.spinning]="isSubmitting">
                {{ setupComplete ? 'check_circle' : isSubmitting ? 'autorenew' : 'rocket_launch' }}
              </span>
            </div>

            <h2 *ngIf="!isSubmitting && !setupComplete">Ready to launch</h2>
            <h2 *ngIf="isSubmitting">Configuring system...</h2>
            <h2 *ngIf="setupComplete">Complete!</h2>

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
                  <strong>{{ scenario === 'demo' ? 'Demo mode' : 'Clean install' }}</strong>
                  <small>{{ scenario === 'demo' ? 'With sample data' : 'Empty database' }}</small>
                </div>
              </div>
            </div>

            <p class="setup-message" *ngIf="setupComplete">
              Redirecting to login page...<br>
              Use the email and password you just created.
            </p>
          </div>
        </div>

        <!-- Footer buttons -->
        <div class="wizard-footer" *ngIf="!isSubmitting && !setupComplete">
          <button class="btn-back"
            (click)="prevStep()"
            [disabled]="currentStep === 0">
            <span class="material-icons">arrow_back</span>
            Back
          </button>

          <button class="btn-next"
            *ngIf="currentStep < steps.length - 1"
            (click)="nextStep()"
            [disabled]="!canProceed()">
            Next
            <span class="material-icons">arrow_forward</span>
          </button>

          <button class="btn-finish"
            *ngIf="currentStep === steps.length - 1"
            (click)="completeSetup()"
            [disabled]="!canFinish()">
            <span class="material-icons">check</span>
            Launch system
          </button>
        </div>
      </div>

      <!-- Footer -->
      <div class="setup-footer">
        Built with precision · Tested with rigor
      </div>

      <!-- Role modal -->
      <div class="modal-overlay" *ngIf="showRoleModal" (click)="closeRoleModal()">
        <div class="role-modal" (click)="$event.stopPropagation()">
          <button class="modal-close" (click)="closeRoleModal()">
            <span class="material-icons">close</span>
          </button>

          <div class="role-modal-header" [style.border-bottom]="'2px solid ' + (selectedRole?.color || '#D5001C')">
            <span class="material-icons" [style.color]="selectedRole?.color">{{ selectedRole?.icon }}</span>
            <h2>{{ selectedRole?.title }}</h2>
          </div>

          <div class="role-modal-body">
            <p>{{ selectedRole?.fullDescription }}</p>

            <h3>Key features</h3>
            <ul class="role-features">
              <li *ngFor="let f of selectedRole?.features">
                <span class="material-icons">check_circle</span>
                {{ f }}
              </li>
            </ul>

            <h3>Pages</h3>
            <div class="role-pages">
              <span class="page-badge" *ngFor="let p of selectedRole?.pages">{{ p }}</span>
            </div>
          </div>

          <div class="role-modal-footer">
            <button class="btn-primary" (click)="markRoleViewed(); closeRoleModal()">
              <span class="material-icons">check</span>
              Got it
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
      background: #0a0e1a;
      color: #e2e8f0;
      position: relative;
      overflow-x: hidden;
      padding: 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }

    .bg-gradient {
      position: fixed;
      inset: 0;
      background:
        radial-gradient(circle at 20% 30%, rgba(213,0,28,0.08) 0%, transparent 50%),
        radial-gradient(circle at 80% 70%, rgba(26,115,232,0.06) 0%, transparent 50%);
      pointer-events: none;
      z-index: 0;
    }

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
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 8px;
      color: #64748b;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
      font-family: inherit;
      transition: all 0.15s;
      letter-spacing: 0.5px;
    }

    .lang-selector button.active {
      background: #D5001C;
      border-color: #D5001C;
      color: white;
    }

    .progress-bar {
      width: 100%;
      max-width: 720px;
      height: 2px;
      background: rgba(255,255,255,0.06);
      border-radius: 2px;
      margin: 44px 0 14px;
      position: relative;
      z-index: 1;
    }

    .progress-fill {
      height: 100%;
      background: #D5001C;
      border-radius: 2px;
      transition: width 0.4s ease;
      box-shadow: 0 0 10px rgba(213,0,28,0.5);
    }

    .step-indicator {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 5px 14px;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 20px;
      font-size: 12px;
      color: #64748b;
      margin-bottom: 20px;
      position: relative;
      z-index: 1;
    }

    .step-indicator .material-icons { font-size: 16px; color: #D5001C; }

    .wizard-card {
      background: rgba(16,22,38,0.9);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 20px;
      padding: 48px;
      max-width: 720px;
      width: 100%;
      position: relative;
      z-index: 1;
      box-shadow: 0 24px 64px rgba(0,0,0,0.6);
    }

    .step-content { min-height: 360px; }

    /* HERO */
    .step-hero { text-align: center; margin-bottom: 32px; }

    .hero-logo {
      width: 76px;
      height: 76px;
      margin: 0 auto 20px;
      background: linear-gradient(135deg, #D5001C, #8B0000);
      border-radius: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 28px rgba(213,0,28,0.35);
    }

    .hero-logo .material-icons { font-size: 42px; color: white; }

    .step-hero h1 {
      font-size: 34px;
      font-weight: 800;
      margin: 0 0 6px;
      background: linear-gradient(135deg, #fff 50%, #94a3b8);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      letter-spacing: -1px;
    }

    .hero-subtitle { font-size: 15px; color: #94a3b8; margin: 0 0 4px; }

    .hero-tagline { font-size: 12px; color: #475569; margin: 0; font-style: italic; }

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
      background: rgba(255,255,255,0.025);
      border: 1px solid rgba(255,255,255,0.04);
      border-radius: 10px;
      font-size: 13px;
      color: #cbd5e1;
    }

    .feature .material-icons { font-size: 18px; color: #D5001C; }

    .welcome-text { text-align: center; font-size: 14px; color: #94a3b8; line-height: 1.7; }

    /* HEADINGS */
    h2 {
      font-size: 22px;
      margin: 0 0 22px;
      display: inline-flex;
      align-items: center;
      gap: 10px;
      color: #f1f5f9;
    }
    h2 .material-icons { color: #D5001C; font-size: 24px; }

    .step-description { color: #64748b; font-size: 13px; margin: -14px 0 20px; }

    /* INFO GRID */
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 12px;
      margin-bottom: 20px;
    }

    .info-card {
      padding: 18px;
      background: rgba(255,255,255,0.025);
      border: 1px solid rgba(255,255,255,0.05);
      border-radius: 12px;
      text-align: center;
    }

    .info-card .material-icons { font-size: 30px; color: #D5001C; margin-bottom: 8px; }
    .info-card h3 { margin: 0 0 6px; font-size: 16px; color: #fff; }
    .info-card p { margin: 0; font-size: 11px; color: #94a3b8; line-height: 1.5; }

    .tech-stack { margin-top: 8px; }
    .tech-badges { display: flex; flex-wrap: wrap; gap: 6px; }

    .tech-badge {
      padding: 4px 10px;
      background: rgba(213,0,28,0.08);
      border: 1px solid rgba(213,0,28,0.18);
      color: #f87171;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
    }

    /* OPTIONS */
    .option-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

    .option-card {
      background: rgba(255,255,255,0.025);
      border: 2px solid rgba(255,255,255,0.05);
      border-radius: 14px;
      padding: 22px;
      cursor: pointer;
      text-align: left;
      transition: all 0.2s;
      position: relative;
      color: inherit;
      font-family: inherit;
    }

    .option-card:hover { border-color: rgba(213,0,28,0.3); transform: translateY(-2px); }
    .option-card.selected { border-color: #D5001C; background: rgba(213,0,28,0.06); }

    .option-icon { font-size: 30px !important; color: #D5001C; margin-bottom: 10px; display: block; }
    .option-card h3 { margin: 0 0 8px; color: #fff; font-size: 17px; }
    .option-card p { margin: 0 0 10px; color: #94a3b8; font-size: 12px; }
    .option-card ul { margin: 0; padding-left: 18px; color: #cbd5e1; font-size: 12px; }
    .option-card ul li { margin: 3px 0; }

    .badge-recommended {
      position: absolute;
      top: 10px;
      right: 10px;
      padding: 3px 8px;
      background: #D5001C;
      color: white;
      border-radius: 8px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* ROLES */
    .role-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px; }

    .role-card {
      background: rgba(255,255,255,0.025);
      border: 1px solid rgba(255,255,255,0.05);
      border-radius: 12px;
      padding: 16px;
      cursor: pointer;
      text-align: left;
      transition: all 0.15s;
      color: inherit;
      font-family: inherit;
    }

    .role-card:hover { border-color: rgba(255,255,255,0.12); transform: translateY(-1px); }
    .role-card.viewed { border-color: rgba(34,197,94,0.3); background: rgba(34,197,94,0.04); }
    .role-card .material-icons { font-size: 26px; margin-bottom: 8px; display: block; }
    .role-card h3 { margin: 0 0 4px; font-size: 13px; color: #fff; }
    .role-card p { margin: 0 0 10px; font-size: 11px; color: #94a3b8; }
    .view-tour { font-size: 11px; color: #D5001C; font-weight: 600; }

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
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 10px;
      color: #64748b;
      font-size: 13px;
      cursor: pointer;
      font-family: inherit;
      transition: all 0.15s;
    }

    .btn-skip:hover { background: rgba(255,255,255,0.04); color: #94a3b8; }

    /* FORMS */
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .form-group { margin-bottom: 16px; }

    .form-group label {
      display: block;
      font-size: 11px;
      font-weight: 700;
      color: #64748b;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.6px;
    }

    .form-group input,
    .form-group select {
      width: 100%;
      padding: 11px 14px;
      background: rgba(255,255,255,0.03);
      border: 1.5px solid rgba(255,255,255,0.07);
      border-radius: 10px;
      color: #f1f5f9;
      font-size: 14px;
      font-family: inherit;
      outline: none;
      box-sizing: border-box;
      transition: border-color 0.15s;
    }

    .form-group select option { background: #1a2238; }

    .form-group input:focus,
    .form-group select:focus { border-color: #D5001C; }

    .password-strength { display: block; margin-top: 5px; font-size: 11px; color: #22c55e; }
    .error { display: block; margin-top: 5px; font-size: 11px; color: #ef4444; }

    /* SUCCESS */
    .success-screen { text-align: center; padding: 24px 0; }

    .success-icon {
      width: 76px;
      height: 76px;
      margin: 0 auto 20px;
      background: linear-gradient(135deg, #D5001C, #8B0000);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .success-icon.blue { background: linear-gradient(135deg, #1a73e8, #1557b0); }
    .success-icon.green { background: linear-gradient(135deg, #22c55e, #16a34a); box-shadow: 0 8px 28px rgba(34,197,94,0.4); }

    .success-icon .material-icons { font-size: 42px; color: white; }
    .success-icon .material-icons.spinning { animation: spin 1s linear infinite; }

    @keyframes spin { to { transform: rotate(360deg); } }

    .setup-summary { max-width: 380px; margin: 22px auto; text-align: left; }

    .summary-item {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 12px 16px;
      background: rgba(255,255,255,0.025);
      border-radius: 10px;
      margin-bottom: 8px;
    }

    .summary-item .material-icons { font-size: 22px; color: #D5001C; }
    .summary-item strong { display: block; color: #fff; font-size: 13px; }
    .summary-item small { display: block; color: #94a3b8; font-size: 11px; margin-top: 2px; }

    .setup-message { color: #94a3b8; font-size: 14px; line-height: 1.7; margin-top: 16px; }

    /* FOOTER */
    .wizard-footer {
      display: flex;
      justify-content: space-between;
      margin-top: 32px;
      padding-top: 22px;
      border-top: 1px solid rgba(255,255,255,0.04);
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
      background: transparent;
      color: #64748b;
      border: 1px solid rgba(255,255,255,0.08);
    }

    .btn-back:hover:not(:disabled) { background: rgba(255,255,255,0.04); color: #94a3b8; }
    .btn-back:disabled { opacity: 0.3; cursor: not-allowed; }

    .btn-next, .btn-finish {
      background: #D5001C;
      color: white;
      box-shadow: 0 4px 16px rgba(213,0,28,0.3);
    }

    .btn-next:hover:not(:disabled), .btn-finish:hover:not(:disabled) {
      background: #b8001a;
      transform: translateY(-1px);
    }

    .btn-next:disabled, .btn-finish:disabled { opacity: 0.35; cursor: not-allowed; }

    .setup-footer {
      margin-top: 28px;
      color: #334155;
      font-size: 11px;
      letter-spacing: 0.5px;
      position: relative;
      z-index: 1;
    }

    /* MODAL */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.75);
      backdrop-filter: blur(8px);
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .role-modal {
      background: #0f1829;
      border-radius: 18px;
      max-width: 580px;
      width: 100%;
      max-height: 85vh;
      overflow-y: auto;
      position: relative;
      border: 1px solid rgba(255,255,255,0.08);
    }

    .modal-close {
      position: absolute;
      top: 14px;
      right: 14px;
      background: rgba(255,255,255,0.05);
      border: none;
      width: 34px;
      height: 34px;
      border-radius: 50%;
      color: #64748b;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1;
    }

    .role-modal-header {
      padding: 28px 32px;
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .role-modal-header .material-icons { font-size: 36px; }
    .role-modal-header h2 { margin: 0; font-size: 22px; color: #fff; }

    .role-modal-body { padding: 0 32px 24px; }

    .role-modal-body p { color: #cbd5e1; line-height: 1.7; font-size: 14px; margin: 0 0 20px; }

    .role-modal-body h3 {
      margin: 16px 0 10px;
      font-size: 11px;
      color: #D5001C;
      text-transform: uppercase;
      letter-spacing: 0.6px;
    }

    .role-features { list-style: none; padding: 0; margin: 0; }

    .role-features li {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 7px 0;
      color: #cbd5e1;
      font-size: 13px;
    }

    .role-features .material-icons { font-size: 16px; color: #22c55e; }

    .role-pages { display: flex; flex-wrap: wrap; gap: 6px; }

    .page-badge {
      padding: 3px 9px;
      background: rgba(213,0,28,0.08);
      border: 1px solid rgba(213,0,28,0.18);
      color: #f87171;
      border-radius: 5px;
      font-size: 11px;
      font-weight: 600;
      font-family: ui-monospace, monospace;
    }

    .role-modal-footer {
      padding: 18px 32px;
      border-top: 1px solid rgba(255,255,255,0.05);
      display: flex;
      justify-content: flex-end;
    }

    .btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 11px 22px;
      background: #D5001C;
      color: white;
      border: none;
      border-radius: 10px;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      font-size: 14px;
    }

    @media (max-width: 700px) {
      .wizard-card { padding: 24px 18px; }
      .form-row { grid-template-columns: 1fr; }
      .welcome-features { grid-template-columns: 1fr; }
      .info-grid { grid-template-columns: 1fr; }
      .option-grid { grid-template-columns: 1fr; }
      .role-grid { grid-template-columns: 1fr; }
      .step-hero h1 { font-size: 26px; }
    }
  `]
})
export class SetupComponent implements OnInit {
  currentStep = 0;
  isSubmitting = false;
  setupComplete = false;

  scenario: 'demo' | 'clean' = 'demo';
  viewedRoles: string[] = [];
  showRoleModal = false;
  selectedRole: any = null;

  steps: WizardStep[] = [
    { id: 'welcome',  title: 'Welcome',  icon: 'waving_hand' },
    { id: 'about',    title: 'About',    icon: 'info' },
    { id: 'scenario', title: 'Mode',     icon: 'tune' },
    { id: 'roles',    title: 'Roles',    icon: 'school' },
    { id: 'clinic',   title: 'Clinic',   icon: 'business' },
    { id: 'admin',    title: 'Admin',    icon: 'admin_panel_settings' },
    { id: 'finish',   title: 'Done',     icon: 'rocket_launch' }
  ];

  langs = [
    { code: 'ru' },
    { code: 'ro' },
    { code: 'en' }
  ];

  currentLang = 'en';

  clinic = {
    name: '',
    city: 'Chișinău',
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
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const browserLang = navigator.language.split('-')[0];
    if (['ru', 'ro', 'en'].includes(browserLang)) {
      this.currentLang = browserLang;
      this.clinic.defaultLanguage = browserLang as any;
      this.translate.use(browserLang);
    }
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

  changeLang(lang: string) {
    this.currentLang = lang;
    this.clinic.defaultLanguage = lang as any;
    this.translate.use(lang);
  }

  get progress(): number {
    return Math.round((this.currentStep / (this.steps.length - 1)) * 100);
  }

  nextStep() {
    if (this.canProceed() && this.currentStep < this.steps.length - 1) {
      this.currentStep++;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  prevStep() {
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

  getPasswordStrength(): string {
    const p = this.admin.password;
    if (!p) return '';
    if (p.length < 6) return 'Too short';
    if (p.length < 8) return 'Acceptable';
    if (p.length < 12) return 'Good';
    return 'Strong';
  }

  viewRole(role: any) {
    this.selectedRole = role;
    this.showRoleModal = true;
  }

  closeRoleModal() {
    this.showRoleModal = false;
  }

  markRoleViewed() {
    if (this.selectedRole && !this.viewedRoles.includes(this.selectedRole.id)) {
      this.viewedRoles.push(this.selectedRole.id);
    }
  }

  async completeSetup() {
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
      this.cdr.detectChanges();

      setTimeout(() => {
        this.router.navigate(['/auth/login']);
      }, 3000);
    } catch (err: any) {
      this.isSubmitting = false;
      alert('Error: ' + (err?.error?.message || err?.message || 'Unknown error'));
      this.cdr.detectChanges();
    }
  }
}
