import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-access-denied',
  standalone: true,
  imports: [RouterLink, MatIconModule, TranslateModule],
  template: `
    <div class="denied-page">
      <div class="denied-card">
        <div class="denied-icon">
          <span class="material-icons">lock</span>
        </div>
        <h1>{{ 'ACCESS_DENIED.TITLE' | translate }}</h1>
        <p>{{ 'ACCESS_DENIED.MESSAGE' | translate }}</p>
        <p class="sub">{{ 'ACCESS_DENIED.CONTACT' | translate }}</p>
        <a routerLink="/dashboard" class="btn-home">
          <span class="material-icons">home</span>
          {{ 'COMMON.BACK' | translate }}
        </a>
      </div>
    </div>
  `,
  styles: [`
    .denied-page {
      min-height: 100vh; display: flex; align-items: center;
      justify-content: center; background: #f4f6f9;
    }
    .denied-card {
      background: white; border-radius: 20px; padding: 48px;
      text-align: center; max-width: 440px; width: 100%;
      box-shadow: 0 8px 32px rgba(0,0,0,0.08);
      border: 1px solid #e2e8f0;
    }
    .denied-icon {
      width: 80px; height: 80px; border-radius: 50%;
      background: #fce8e6; display: flex; align-items: center;
      justify-content: center; margin: 0 auto 24px;
    }
    .denied-icon .material-icons { font-size: 36px; color: #ea4335; }
    h1 { font-size: 24px; font-weight: 800; color: #0f2d52; margin: 0 0 12px; }
    p { font-size: 15px; color: #718096; margin: 0 0 8px; line-height: 1.6; }
    .sub { font-size: 13px; color: #a0aec0; margin-bottom: 28px; }
    .btn-home {
      display: inline-flex; align-items: center; gap: 8px;
      background: #1a73e8; color: white; text-decoration: none;
      padding: 12px 24px; border-radius: 12px; font-size: 14px;
      font-weight: 600; transition: background 0.2s;
    }
    .btn-home:hover { background: #1557b0; }
  `]
})
export class AccessDeniedComponent {}
