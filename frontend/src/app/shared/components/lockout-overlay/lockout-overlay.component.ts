import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-lockout-overlay',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="lockout-overlay" role="alertdialog" aria-modal="true">
      <div class="lockout-card">
        <div class="lockout-icon">
          <span class="material-icons">lock_clock</span>
        </div>

        <h2 class="lockout-title">
          {{ (reason === 'throttle' ? 'LOCKOUT.THROTTLE_TITLE' : 'LOCKOUT.LOCKED_TITLE') | translate }}
        </h2>

        <p class="lockout-desc">
          {{ (reason === 'throttle' ? 'LOCKOUT.THROTTLE_DESC' : 'LOCKOUT.LOCKED_DESC') | translate }}
        </p>

        <div class="lockout-timer-wrap">
          <span class="timer-label">{{ 'LOCKOUT.WAIT' | translate }}</span>
          <span class="timer-value">{{ minutes }}:{{ seconds }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .lockout-overlay {
      position: fixed; inset: 0;
      background: rgba(10, 20, 40, 0.88);
      backdrop-filter: blur(6px);
      z-index: 9999;
      display: flex; align-items: center; justify-content: center;
      padding: 16px;
      animation: loFadeIn 0.3s ease;
    }

    .lockout-card {
      background: #fff;
      border-radius: 28px;
      padding: 44px 36px 36px;
      max-width: 420px; width: 100%;
      text-align: center;
      box-shadow: 0 32px 96px rgba(0, 0, 0, 0.45);
      animation: loScaleIn 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    .lockout-icon {
      width: 84px; height: 84px;
      border-radius: 24px;
      background: linear-gradient(135deg, #fce8e6 0%, #fef3cd 100%);
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 24px;
    }
    .lockout-icon .material-icons {
      font-size: 42px;
      color: #ea4335;
    }

    .lockout-title {
      font-size: 22px; font-weight: 800;
      color: #0f2d52; margin: 0 0 12px;
      line-height: 1.3;
    }

    .lockout-desc {
      font-size: 14px; color: #718096;
      line-height: 1.7; margin: 0 0 28px;
    }

    .lockout-timer-wrap {
      background: #f4f6f9;
      border-radius: 18px;
      padding: 20px 32px;
      display: flex; flex-direction: column; align-items: center; gap: 4px;
    }

    .timer-label {
      font-size: 11px; font-weight: 700;
      color: #a0aec0;
      text-transform: uppercase; letter-spacing: 0.8px;
    }

    .timer-value {
      font-size: 56px; font-weight: 800;
      color: #0f2d52;
      font-variant-numeric: tabular-nums;
      letter-spacing: -2px;
      line-height: 1.1;
    }

    @keyframes loFadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }

    @keyframes loScaleIn {
      from { transform: scale(0.88); opacity: 0; }
      to   { transform: scale(1);    opacity: 1; }
    }
  `],
})
export class LockoutOverlayComponent implements OnInit, OnDestroy {
  @Input() secondsLeft = 60;
  @Input() reason: 'throttle' | 'locked' = 'throttle';
  @Output() expired = new EventEmitter<void>();

  remaining = 0;
  private sub?: Subscription;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.remaining = this.secondsLeft;
    this.sub = interval(1000).subscribe(() => {
      this.remaining = Math.max(0, this.remaining - 1);
      this.cdr.markForCheck();
      if (this.remaining === 0) {
        this.sub?.unsubscribe();
        this.expired.emit();
      }
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  get minutes(): string {
    return Math.floor(this.remaining / 60).toString().padStart(2, '0');
  }

  get seconds(): string {
    return (this.remaining % 60).toString().padStart(2, '0');
  }
}
