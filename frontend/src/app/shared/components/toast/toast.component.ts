import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      <div *ngFor="let toast of toasts" class="toast toast-{{toast.type}}" (click)="toastService.remove(toast.id)">
        <span class="material-icons toast-icon">
          {{ toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'error' : toast.type === 'warning' ? 'warning' : 'info' }}
        </span>
        <span class="toast-message">{{ toast.message }}</span>
        <button class="toast-close" (click)="$event.stopPropagation(); toastService.remove(toast.id)">
          <span class="material-icons">close</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed; top: 24px; right: 24px;
      z-index: 9999;
      display: flex; flex-direction: column; gap: 10px;
      max-width: 360px; width: calc(100vw - 48px);
    }
    .toast {
      display: flex; align-items: center; gap: 12px;
      padding: 14px 16px; border-radius: 12px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.12);
      cursor: pointer; background: white; border-left: 4px solid;
      animation: slideIn 0.3s ease;
    }
    .toast-success { border-left-color: #34a853; }
    .toast-error   { border-left-color: #ea4335; }
    .toast-warning { border-left-color: #f9ab00; }
    .toast-info    { border-left-color: #1a73e8; }
    .toast-icon { font-size: 20px; }
    .toast-success .toast-icon { color: #34a853; }
    .toast-error   .toast-icon { color: #ea4335; }
    .toast-warning .toast-icon { color: #f9ab00; }
    .toast-info    .toast-icon { color: #1a73e8; }
    .toast-message { flex: 1; font-size: 14px; font-weight: 500; color: #2d3748; }
    .toast-close { background: none; border: none; cursor: pointer; padding: 0; color: #a0aec0; display: flex; }
    .toast-close .material-icons { font-size: 18px; }
    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    @media (max-width: 768px) {
      .toast-container { top: 70px; right: 12px; left: 12px; max-width: 100%; width: auto; }
    }
  `]
})
export class ToastComponent implements OnInit {
  toasts: Toast[] = [];
  constructor(public toastService: ToastService) {}
  ngOnInit(): void { this.toastService.toasts.subscribe(t => this.toasts = t); }
}
