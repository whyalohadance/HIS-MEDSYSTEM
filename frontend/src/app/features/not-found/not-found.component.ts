import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  template: `
    <div class="not-found-page">
      <div class="not-found-content">
        <div class="not-found-icon">
          <span class="material-icons">local_hospital</span>
        </div>
        <h1 class="not-found-code">404</h1>
        <h2 class="not-found-title">Pagina nu a fost găsită</h2>
        <p class="not-found-subtitle">Pagina pe care o cauți nu există sau a fost mutată.</p>
        <a routerLink="/dashboard" class="btn-home">
          <span class="material-icons">home</span>
          Înapoi la panou de control
        </a>
      </div>
    </div>
  `,
  styles: [`
    .not-found-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f4f6f9;
      padding: 24px;
    }
    .not-found-content { text-align: center; max-width: 400px; }
    .not-found-icon {
      width: 100px; height: 100px;
      background: linear-gradient(135deg, #1a73e8, #0d47a1);
      border-radius: 28px;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 24px;
      box-shadow: 0 8px 24px rgba(26,115,232,0.3);
    }
    .not-found-icon .material-icons { font-size: 48px; color: white; }
    .not-found-code { font-size: 80px; font-weight: 800; color: #0f2d52; line-height: 1; margin: 0 0 8px; }
    .not-found-title { font-size: 22px; font-weight: 700; color: #0f2d52; margin: 0 0 12px; }
    .not-found-subtitle { font-size: 15px; color: #718096; margin: 0 0 32px; line-height: 1.6; }
    .btn-home {
      display: inline-flex; align-items: center; gap: 8px;
      background: #1a73e8; color: white;
      padding: 14px 28px; border-radius: 12px;
      text-decoration: none; font-weight: 600; font-size: 15px;
      transition: all 0.2s; box-shadow: 0 4px 12px rgba(26,115,232,0.3);
    }
    .btn-home:hover { background: #1557b0; transform: translateY(-2px); box-shadow: 0 6px 16px rgba(26,115,232,0.4); }
  `]
})
export class NotFoundComponent {}
