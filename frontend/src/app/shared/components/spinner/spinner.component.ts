import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="spinner-wrap" [class.fullscreen]="fullscreen">
      <div class="spinner" [style.width.px]="size" [style.height.px]="size">
        <svg viewBox="0 0 50 50">
          <circle cx="25" cy="25" r="20"
            fill="none"
            stroke="currentColor"
            stroke-width="4"
            stroke-linecap="round"/>
        </svg>
      </div>
      <div class="spinner-message" *ngIf="message">{{ message }}</div>
    </div>
  `,
  styles: [`
    .spinner-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      padding: 32px;
      color: #1a73e8;
    }

    .spinner-wrap.fullscreen {
      position: fixed;
      inset: 0;
      background: rgba(255,255,255,0.85);
      backdrop-filter: blur(4px);
      z-index: 9998;
    }

    .spinner svg {
      width: 100%;
      height: 100%;
      animation: rotate 2s linear infinite;
    }

    .spinner circle {
      stroke-dasharray: 90, 150;
      stroke-dashoffset: 0;
      animation: dash 1.5s ease-in-out infinite;
    }

    @keyframes rotate {
      100% { transform: rotate(360deg); }
    }

    @keyframes dash {
      0%   { stroke-dasharray: 1, 150; stroke-dashoffset: 0; }
      50%  { stroke-dasharray: 90, 150; stroke-dashoffset: -35; }
      100% { stroke-dasharray: 90, 150; stroke-dashoffset: -124; }
    }

    .spinner-message {
      color: #475569;
      font-size: 14px;
      font-weight: 500;
    }
  `]
})
export class SpinnerComponent {
  @Input() size = 40;
  @Input() fullscreen = false;
  @Input() message = '';
}
