import { Component, OnInit, OnDestroy, Output, EventEmitter, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-hello-intro',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="hello-screen" [class.fade-out]="isFadingOut">

      <!-- Floating orbs -->
      <div class="orb orb-blue"></div>
      <div class="orb orb-purple"></div>
      <div class="orb orb-cyan"></div>

      <div class="hello-content">

        <!-- Logo -->
        <div class="hello-logo">
          <span class="material-icons">local_hospital</span>
        </div>

        <!-- Main greeting -->
        <div class="hello-main">
          <div class="hello-word" *ngIf="currentGreeting">{{ currentGreeting }}</div>
        </div>

        <!-- Language carousel -->
        <div class="hello-lang" *ngIf="currentLang">{{ currentLang }}</div>

        <!-- Subtitle — appears after delay -->
        <div class="hello-subtitle" [class.visible]="showSubtitle">
          HIS-MedSystem — Medical Information System
        </div>

        <!-- Continue button — appears last -->
        <button
          class="hello-continue"
          [class.visible]="showContinue"
          (click)="onContinue()">
          <span>Continue</span>
          <span class="material-icons">arrow_forward</span>
        </button>

      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .hello-screen {
      position: fixed;
      inset: 0;
      background: #0a0e1a;
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      transition: opacity 0.9s cubic-bezier(0.4, 0, 0.2, 1),
                  transform 0.9s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .hello-screen.fade-out {
      opacity: 0;
      transform: scale(1.05);
      pointer-events: none;
    }

    /* ── Floating orbs ── */
    .orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      pointer-events: none;
      animation: orbFloat 8s ease-in-out infinite;
    }

    .orb-blue {
      width: 400px;
      height: 400px;
      background: radial-gradient(circle, rgba(26,115,232,0.35) 0%, transparent 70%);
      top: -100px;
      left: -100px;
      animation-delay: 0s;
    }

    .orb-purple {
      width: 320px;
      height: 320px;
      background: radial-gradient(circle, rgba(124,58,237,0.3) 0%, transparent 70%);
      bottom: -80px;
      right: -80px;
      animation-delay: -3s;
    }

    .orb-cyan {
      width: 260px;
      height: 260px;
      background: radial-gradient(circle, rgba(6,182,212,0.25) 0%, transparent 70%);
      top: 40%;
      right: 10%;
      animation-delay: -5s;
    }

    @keyframes orbFloat {
      0%, 100% { transform: translate(0, 0) scale(1); }
      33%       { transform: translate(30px, -40px) scale(1.05); }
      66%       { transform: translate(-20px, 20px) scale(0.97); }
    }

    /* ── Content ── */
    .hello-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0;
      text-align: center;
      position: relative;
      z-index: 1;
    }

    /* ── Logo ── */
    .hello-logo {
      width: 88px;
      height: 88px;
      background: linear-gradient(135deg, #1a73e8 0%, #7c3aed 100%);
      border-radius: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 40px;
      box-shadow:
        0 0 0 1px rgba(255,255,255,0.08),
        0 20px 60px rgba(26,115,232,0.4);
      animation: logoFloat 4s ease-in-out infinite, logoAppear 1s cubic-bezier(0.215, 0.61, 0.355, 1) forwards;
    }

    .hello-logo .material-icons {
      font-size: 48px;
      color: white;
    }

    @keyframes logoFloat {
      0%, 100% { transform: translateY(0); }
      50%       { transform: translateY(-8px); }
    }

    @keyframes logoAppear {
      from { opacity: 0; transform: translateY(20px) scale(0.85); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    /* ── Main greeting ── */
    .hello-main {
      height: 120px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
    }

    .hello-word {
      font-size: clamp(64px, 10vw, 108px);
      font-weight: 300;
      letter-spacing: -0.04em;
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', system-ui, sans-serif;
      background: linear-gradient(135deg, #ffffff 0%, rgba(255,255,255,0.7) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: wordAppear 1.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
      opacity: 0;
    }

    @keyframes wordAppear {
      0% {
        opacity: 0;
        transform: translateY(24px) scale(0.92);
        filter: blur(12px);
      }
      25%, 65% {
        opacity: 1;
        transform: translateY(0) scale(1);
        filter: blur(0);
      }
      100% {
        opacity: 0;
        transform: translateY(-16px) scale(1.04);
        filter: blur(8px);
      }
    }

    /* ── Language label ── */
    .hello-lang {
      font-size: 18px;
      font-weight: 400;
      color: #94a3b8;
      letter-spacing: 0.02em;
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', system-ui, sans-serif;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 56px;
      animation: langFadeIn 0.4s ease-out forwards;
    }

    @keyframes langFadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }

    /* ── Subtitle ── */
    .hello-subtitle {
      font-size: 14px;
      color: rgba(148,163,184,0.7);
      letter-spacing: 0.05em;
      font-weight: 400;
      text-transform: uppercase;
      opacity: 0;
      transform: translateY(8px);
      transition: opacity 0.6s ease, transform 0.6s ease;
      margin-bottom: 40px;
    }

    .hello-subtitle.visible {
      opacity: 1;
      transform: translateY(0);
    }

    /* ── Continue button ── */
    .hello-continue {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 14px 32px;
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.2);
      color: white;
      border-radius: 100px;
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', system-ui, sans-serif;
      font-size: 15px;
      font-weight: 500;
      cursor: pointer;
      backdrop-filter: blur(12px);
      opacity: 0;
      transform: translateY(12px);
      transition: opacity 0.6s ease, transform 0.6s ease, background 0.2s, border-color 0.2s;
      letter-spacing: 0.01em;
    }

    .hello-continue.visible {
      opacity: 1;
      transform: translateY(0);
    }

    .hello-continue:hover {
      background: rgba(255,255,255,0.18);
      border-color: rgba(255,255,255,0.35);
    }

    .hello-continue .material-icons {
      font-size: 18px;
      transition: transform 0.2s;
    }

    .hello-continue:hover .material-icons {
      transform: translateX(4px);
    }

    @media (max-width: 600px) {
      .hello-logo { width: 72px; height: 72px; margin-bottom: 32px; }
      .hello-logo .material-icons { font-size: 38px; }
      .hello-main { height: 90px; }
      .orb-blue { width: 260px; height: 260px; }
      .orb-purple { width: 200px; height: 200px; }
    }
  `]
})
export class HelloIntroComponent implements OnInit, OnDestroy {
  @Output() done = new EventEmitter<void>();

  greetings = [
    { word: 'Hello',       lang: 'English' },
    { word: 'Привет',      lang: 'Русский' },
    { word: 'Salut',       lang: 'Română' },
    { word: 'Hola',        lang: 'Español' },
    { word: 'Bonjour',     lang: 'Français' },
    { word: 'Ciao',        lang: 'Italiano' },
    { word: 'こんにちは',    lang: '日本語' },
    { word: 'Hallo',       lang: 'Deutsch' },
    { word: '안녕하세요',    lang: '한국어' },
    { word: 'Hello',       lang: 'Welcome' },
  ];

  currentGreeting = '';
  currentLang = '';
  currentIndex = 0;
  isFadingOut = false;
  showSubtitle = false;
  showContinue = false;

  private intervalId: ReturnType<typeof setInterval> | null = null;
  private subtitleTimer: ReturnType<typeof setTimeout> | null = null;
  private continueTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.showNext();

    this.intervalId = setInterval(() => {
      this.currentIndex++;
      if (this.currentIndex >= this.greetings.length) {
        // stop cycling but don't auto-complete — wait for user
        if (this.intervalId) {
          clearInterval(this.intervalId);
          this.intervalId = null;
        }
        return;
      }
      this.showNext();
    }, 1800);

    // Subtitle appears at 2.8s
    this.subtitleTimer = setTimeout(() => {
      this.showSubtitle = true;
      this.cdr.detectChanges();
    }, 2800);

    // Continue button appears at 3.8s
    this.continueTimer = setTimeout(() => {
      this.showContinue = true;
      this.cdr.detectChanges();
    }, 3800);
  }

  showNext() {
    this.currentGreeting = '';
    this.currentLang = '';
    this.cdr.detectChanges();
    setTimeout(() => {
      this.currentGreeting = this.greetings[this.currentIndex].word;
      this.currentLang = this.greetings[this.currentIndex].lang;
      this.cdr.detectChanges();
    }, 50);
  }

  onContinue() {
    this.complete();
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if ((event.key === 'Enter' || event.key === ' ') && this.showContinue) {
      event.preventDefault();
      this.complete();
    }
  }

  complete() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isFadingOut = true;
    this.cdr.detectChanges();
    setTimeout(() => this.done.emit(), 900);
  }

  ngOnDestroy() {
    if (this.intervalId) clearInterval(this.intervalId);
    if (this.subtitleTimer) clearTimeout(this.subtitleTimer);
    if (this.continueTimer) clearTimeout(this.continueTimer);
  }
}
