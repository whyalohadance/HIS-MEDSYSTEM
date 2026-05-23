import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="empty-state-wrap">
      <div class="empty-icon">
        <span class="material-icons">{{ icon }}</span>
      </div>
      <h3 class="empty-title">{{ title }}</h3>
      <p class="empty-desc">{{ description }}</p>
      <button *ngIf="actionLabel"
        class="empty-action"
        (click)="action.emit()">
        <span class="material-icons">{{ actionIcon }}</span>
        {{ actionLabel }}
      </button>
    </div>
  `,
  styles: [`
    .empty-state-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 64px 32px;
      text-align: center;
      animation: esFadeIn 0.4s ease-out both;
    }

    @keyframes esFadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .empty-icon {
      width: 80px;
      height: 80px;
      border-radius: 20px;
      background: linear-gradient(135deg, #e8f0fe 0%, #dbeafe 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 24px;
    }

    .empty-icon .material-icons {
      font-size: 40px !important;
      color: #1a73e8;
    }

    .empty-title {
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 8px;
    }

    .empty-desc {
      color: #64748b;
      max-width: 360px;
      margin: 0 0 24px;
      line-height: 1.5;
      font-size: 14px;
    }

    .empty-action {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      background: linear-gradient(135deg, #1a73e8 0%, #1557b0 100%);
      color: white;
      border: none;
      border-radius: 10px;
      font-family: inherit;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.15s, box-shadow 0.15s;
      box-shadow: 0 4px 12px rgba(26,115,232,0.25);
    }

    .empty-action:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(26,115,232,0.35);
    }

    .empty-action:active { transform: scale(0.98); }

    .empty-action .material-icons { font-size: 18px !important; }
  `]
})
export class EmptyStateComponent {
  @Input() icon = 'inbox';
  @Input() title = 'Нет данных';
  @Input() description = 'Здесь пока пусто';
  @Input() actionLabel = '';
  @Input() actionIcon = 'add';
  @Output() action = new EventEmitter<void>();
}
