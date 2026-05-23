import { Component, OnInit, OnDestroy, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-hello-intro',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="hello-screen" [class.fade-out]="isFadingOut">
      <div class="hello-container">
        <div class="hello-text" *ngIf="currentGreeting" [key]="currentGreeting">
          {{ currentGreeting }}
        </div>
      </div>

      <button class="skip-btn" *ngIf="!isFadingOut" (click)="skip()">
        Skip
      </button>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .hello-screen {
      position: fixed;
      inset: 0;
      background: #000;
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      transition: opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .hello-screen.fade-out {
      opacity: 0;
      pointer-events: none;
    }

    .hello-container {
      position: relative;
      width: 100%;
      max-width: 700px;
      height: 160px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .hello-text {
      position: absolute;
      font-size: clamp(48px, 8vw, 96px);
      font-weight: 200;
      color: #fff;
      letter-spacing: -0.03em;
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', system-ui, sans-serif;
      text-align: center;
      animation: appearDisappear 1.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
      opacity: 0;
    }

    @keyframes appearDisappear {
      0% {
        opacity: 0;
        transform: translateY(20px) scale(0.95);
        filter: blur(8px);
      }
      20%, 68% {
        opacity: 1;
        transform: translateY(0) scale(1);
        filter: blur(0);
      }
      100% {
        opacity: 0;
        transform: translateY(-20px) scale(1.05);
        filter: blur(6px);
      }
    }

    .skip-btn {
      position: fixed;
      bottom: 40px;
      right: 40px;
      background: rgba(255, 255, 255, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: rgba(255, 255, 255, 0.75);
      padding: 10px 24px;
      border-radius: 100px;
      font-family: inherit;
      font-size: 13px;
      cursor: pointer;
      backdrop-filter: blur(10px);
      transition: all 0.2s;
      opacity: 0;
      animation: fadeInButton 0.5s 2s forwards;
    }

    @keyframes fadeInButton {
      to { opacity: 1; }
    }

    .skip-btn:hover {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      transform: scale(1.04);
    }

    @media (max-width: 600px) {
      .hello-text { font-size: clamp(40px, 12vw, 64px); }
      .skip-btn { bottom: 24px; right: 24px; }
    }
  `]
})
export class HelloIntroComponent implements OnInit, OnDestroy {
  @Output() done = new EventEmitter<void>();

  greetings = [
    'Hello',
    'Привет',
    'Salut',
    'Bună',
    'Hola',
    'Bonjour',
    'Ciao',
    'Hallo',
    'こんにちは',
    'Welcome'
  ];

  currentGreeting = '';
  currentIndex = 0;
  isFadingOut = false;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.showNext();
    this.intervalId = setInterval(() => {
      this.currentIndex++;
      if (this.currentIndex >= this.greetings.length) {
        this.complete();
        return;
      }
      this.showNext();
    }, 1800);
  }

  showNext() {
    this.currentGreeting = '';
    this.cdr.detectChanges();
    setTimeout(() => {
      this.currentGreeting = this.greetings[this.currentIndex];
      this.cdr.detectChanges();
    }, 50);
  }

  complete() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isFadingOut = true;
    this.cdr.detectChanges();
    setTimeout(() => this.done.emit(), 800);
  }

  skip() { this.complete(); }

  ngOnDestroy() {
    if (this.intervalId) clearInterval(this.intervalId);
  }
}
