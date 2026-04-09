import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmService, ConfirmOptions } from '../../../core/services/confirm.service';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="confirm-overlay" *ngIf="options" (click)="confirmService.resolve(false)">
      <div class="confirm-modal" (click)="$event.stopPropagation()">
        <div class="confirm-icon" [class]="options.type || 'danger'">
          <span class="material-icons">
            {{ options.type === 'warning' ? 'warning' : options.type === 'info' ? 'info' : 'delete_forever' }}
          </span>
        </div>
        <h3 class="confirm-title">{{ options.title }}</h3>
        <p class="confirm-message">{{ options.message }}</p>
        <div class="confirm-actions">
          <button class="btn-cancel" (click)="confirmService.resolve(false)">
            {{ options.cancelText || 'Anulează' }}
          </button>
          <button class="btn-confirm" [class]="options.type || 'danger'" (click)="confirmService.resolve(true)">
            {{ options.confirmText || 'Confirmă' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .confirm-overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.5);
      z-index: 9998;
      display: flex; align-items: center; justify-content: center;
      padding: 16px;
      animation: fadeIn 0.2s ease;
    }
    .confirm-modal {
      background: white; border-radius: 20px;
      padding: 32px 24px 24px; max-width: 360px; width: 100%;
      text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.2);
      animation: scaleIn 0.2s ease;
    }
    .confirm-icon {
      width: 72px; height: 72px; border-radius: 20px;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 20px;
    }
    .confirm-icon.danger { background: #fce8e6; }
    .confirm-icon.danger .material-icons { color: #ea4335; font-size: 36px; }
    .confirm-icon.warning { background: #fef9e7; }
    .confirm-icon.warning .material-icons { color: #f9ab00; font-size: 36px; }
    .confirm-icon.info { background: #e8f0fe; }
    .confirm-icon.info .material-icons { color: #1a73e8; font-size: 36px; }
    .confirm-title { font-size: 20px; font-weight: 700; color: #0f2d52; margin: 0 0 10px; }
    .confirm-message { font-size: 14px; color: #718096; margin: 0 0 24px; line-height: 1.6; }
    .confirm-actions { display: flex; gap: 10px; }
    .btn-cancel {
      flex: 1; height: 48px; border-radius: 12px;
      background: #f4f6f9; border: none; color: #718096;
      font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.2s;
    }
    .btn-cancel:hover { background: #e2e8f0; }
    .btn-confirm {
      flex: 1; height: 48px; border-radius: 12px;
      border: none; color: white;
      font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.2s;
    }
    .btn-confirm.danger { background: #ea4335; }
    .btn-confirm.danger:hover { background: #c62828; }
    .btn-confirm.warning { background: #f9ab00; }
    .btn-confirm.info { background: #1a73e8; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes scaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  `]
})
export class ConfirmDialogComponent implements OnInit {
  options: ConfirmOptions | null = null;
  constructor(public confirmService: ConfirmService) {}
  ngOnInit(): void { this.confirmService.options.subscribe(o => this.options = o); }
}
