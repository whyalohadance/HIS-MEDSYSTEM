import { Component, OnInit, OnDestroy, Output, EventEmitter, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-hello-intro',
  standalone: true,
  imports: [CommonModule],

  // Mac-style плавные переходы — длительность и cubic-bezier как у Apple
  animations: [
    trigger('textSwap', [
      transition('* => *', [
        style({
          opacity: 0,
          transform: 'translateY(12px) scale(0.96)',
          filter: 'blur(8px)'
        }),
        animate('900ms cubic-bezier(0.16, 1, 0.3, 1)',
          style({
            opacity: 1,
            transform: 'translateY(0) scale(1)',
            filter: 'blur(0)'
          })
        )
      ])
    ])
  ],

  template: `
    <div class="hello-screen" [class.fade-out]="isFadingOut">

      <div class="orb orb-blue"></div>
      <div class="orb orb-purple"></div>
      <div class="orb orb-cyan"></div>

      <div class="hello-content">
        <div class="hello-logo">
          <span class="material-icons">local_hospital</span>
        </div>

        <!-- БЕЗ *ngIf — элементы ВСЕГДА в DOM -->
        <div class="hello-main">
          <div class="hello-word" [@textSwap]="currentGreeting">{{ currentGreeting }}</div>
        </div>

        <div class="hello-lang" [@textSwap]="currentLang">{{ currentLang }}</div>

        <div class="hello-subtitle" [class.visible]="showSubtitle">
          HIS-MedSystem — Medical Information System
        </div>

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
      background: #000;
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      transition: opacity 1.2s cubic-bezier(0.16, 1, 0.3, 1),
                  transform 1.2s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .hello-screen.fade-out {
      opacity: 0;
      transform: scale(1.03);
      pointer-events: none;
    }

    /* Subtle orbs — slower, more atmospheric */
    .orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(100px);
      pointer-events: none;
      animation: orbFloat 14s ease-in-out infinite;
    }

    .orb-blue {
      width: 480px;
      height: 480px;
      background: radial-gradient(circle, rgba(26,115,232,0.28) 0%, transparent 70%);
      top: -150px;
      left: -150px;
    }

    .orb-purple {
      width: 380px;
      height: 380px;
      background: radial-gradient(circle, rgba(124,58,237,0.24) 0%, transparent 70%);
      bottom: -100px;
      right: -100px;
      animation-delay: -5s;
    }

    .orb-cyan {
      width: 300px;
      height: 300px;
      background: radial-gradient(circle, rgba(6,182,212,0.2) 0%, transparent 70%);
      top: 40%;
      right: 12%;
      animation-delay: -8s;
    }

    @keyframes orbFloat {
      0%, 100% { transform: translate(0, 0) scale(1); }
      33%       { transform: translate(40px, -50px) scale(1.08); }
      66%       { transform: translate(-30px, 30px) scale(0.95); }
    }

    .hello-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0;
      text-align: center;
      position: relative;
      z-index: 1;
    }

    /* Логотип — появляется ОДИН РАЗ медленно, потом застывает */
    .hello-logo {
      width: 96px;
      height: 96px;
      background: linear-gradient(135deg, #1a73e8 0%, #7c3aed 100%);
      border-radius: 26px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 56px;
      box-shadow:
        0 0 0 1px rgba(255,255,255,0.08),
        0 25px 80px rgba(26,115,232,0.45);
      animation: logoAppear 2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      opacity: 0;
    }

    .hello-logo .material-icons {
      font-size: 52px;
      color: white;
    }

    @keyframes logoAppear {
      from {
        opacity: 0;
        transform: translateY(30px) scale(0.7);
        filter: blur(8px);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
        filter: blur(0);
      }
    }

    /* Главное приветствие — фиксированная высота, БЕЗ *ngIf */
    .hello-main {
      height: 140px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 24px;
    }

    .hello-word {
      font-size: clamp(72px, 11vw, 124px);
      font-weight: 200;
      letter-spacing: -0.04em;
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif;
      color: white;
      line-height: 1;
    }

    /* Подпись языка */
    .hello-lang {
      font-size: 17px;
      font-weight: 300;
      color: rgba(255,255,255,0.5);
      letter-spacing: 0.02em;
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 80px;
    }

    /* Subtitle — плавное появление */
    .hello-subtitle {
      font-size: 13px;
      color: rgba(255,255,255,0.4);
      letter-spacing: 0.15em;
      font-weight: 400;
      text-transform: uppercase;
      opacity: 0;
      transform: translateY(8px);
      transition: opacity 1.5s cubic-bezier(0.16, 1, 0.3, 1) 0.2s,
                  transform 1.5s cubic-bezier(0.16, 1, 0.3, 1) 0.2s;
      margin-bottom: 56px;
    }

    .hello-subtitle.visible {
      opacity: 1;
      transform: translateY(0);
    }

    /* Continue button */
    .hello-continue {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 14px 32px;
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.15);
      color: white;
      border-radius: 100px;
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif;
      font-size: 15px;
      font-weight: 400;
      cursor: pointer;
      backdrop-filter: blur(20px);
      opacity: 0;
      transform: translateY(12px);
      transition: opacity 1.5s cubic-bezier(0.16, 1, 0.3, 1),
                  transform 1.5s cubic-bezier(0.16, 1, 0.3, 1),
                  background 0.3s, border-color 0.3s;
      letter-spacing: 0.01em;
    }

    .hello-continue.visible {
      opacity: 1;
      transform: translateY(0);
    }

    .hello-continue:hover {
      background: rgba(255,255,255,0.15);
      border-color: rgba(255,255,255,0.3);
    }

    .hello-continue .material-icons {
      font-size: 18px;
      transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .hello-continue:hover .material-icons {
      transform: translateX(5px);
    }

    @media (max-width: 600px) {
      .hello-logo { width: 80px; height: 80px; margin-bottom: 40px; }
      .hello-logo .material-icons { font-size: 42px; }
      .hello-main { height: 100px; }
      .orb-blue { width: 320px; height: 320px; }
      .orb-purple { width: 240px; height: 240px; }
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
    { word: 'Olá',         lang: 'Português' },
    { word: 'مرحبا',        lang: 'العربية' },
    { word: '你好',         lang: '中文' },
  ];

  currentGreeting = '';
  currentLang = '';
  private currentIndex = 0;
  isFadingOut = false;
  showSubtitle = false;
  showContinue = false;

  private intervalId: ReturnType<typeof setInterval> | null = null;
  private subtitleTimer: ReturnType<typeof setTimeout> | null = null;
  private continueTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    // Первое слово показываем через 1.5с после старта (даём логотипу появиться)
    setTimeout(() => {
      this.currentGreeting = this.greetings[0].word;
      this.currentLang = this.greetings[0].lang;
      this.cdr.detectChanges();
    }, 1500);

    // КАРУСЕЛЬ — бесконечный цикл через modulo, ~3 сек на слово как у Mac
    this.intervalId = setInterval(() => {
      this.currentIndex = (this.currentIndex + 1) % this.greetings.length;
      this.currentGreeting = this.greetings[this.currentIndex].word;
      this.currentLang = this.greetings[this.currentIndex].lang;
      this.cdr.detectChanges();
    }, 3200);

    // Subtitle через 4 секунды
    this.subtitleTimer = setTimeout(() => {
      this.showSubtitle = true;
      this.cdr.detectChanges();
    }, 4000);

    // Continue button через 6 секунд
    this.continueTimer = setTimeout(() => {
      this.showContinue = true;
      this.cdr.detectChanges();
    }, 6000);
  }

  onContinue() {
    this.complete();
  }

  @HostListener('document:keydown', ['$event'])
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
    setTimeout(() => this.done.emit(), 1200);
  }

  ngOnDestroy() {
    if (this.intervalId) clearInterval(this.intervalId);
    if (this.subtitleTimer) clearTimeout(this.subtitleTimer);
    if (this.continueTimer) clearTimeout(this.continueTimer);
  }
}
