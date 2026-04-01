import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <nav class="bottom-nav" *ngIf="isMobile">
      <a routerLink="/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}" class="nav-tab">
        <span class="material-icons">dashboard</span>
        <span>Главная</span>
      </a>
      <a routerLink="/patients" routerLinkActive="active" class="nav-tab">
        <span class="material-icons">people</span>
        <span>Пациенты</span>
      </a>
      <a routerLink="/appointments" routerLinkActive="active" class="nav-tab">
        <span class="material-icons">event</span>
        <span>Приёмы</span>
      </a>
      <a routerLink="/notifications" routerLinkActive="active" class="nav-tab">
        <span class="material-icons">notifications</span>
        <span>Уведомления</span>
      </a>
      <a routerLink="/profile" routerLinkActive="active" class="nav-tab">
        <span class="material-icons">person</span>
        <span>Профиль</span>
      </a>
    </nav>
  `,
  styles: [`
    .bottom-nav { display: none; }

    @media (max-width: 768px) {
      .bottom-nav {
        display: flex;
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        height: 64px;
        background: white;
        border-top: 1px solid #e2e8f0;
        z-index: 1000;
        box-shadow: 0 -4px 12px rgba(0,0,0,0.08);
        padding-bottom: env(safe-area-inset-bottom);
      }
      .nav-tab {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 2px;
        text-decoration: none;
        color: #94a3b8;
        font-size: 10px;
        font-weight: 600;
        transition: color 0.2s;
        padding: 8px 0;
        -webkit-tap-highlight-color: transparent;
      }
      .nav-tab .material-icons { font-size: 22px; }
      .nav-tab.active { color: #1a73e8; }
      .nav-tab.active .material-icons { color: #1a73e8; }
    }
  `]
})
export class BottomNavComponent {
  isMobile = window.innerWidth <= 768;

  @HostListener('window:resize')
  onResize(): void {
    this.isMobile = window.innerWidth <= 768;
  }
}
