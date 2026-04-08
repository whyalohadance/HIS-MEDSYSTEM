import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly STORAGE_KEY = 'language';

  languages = [
    { code: 'ro', label: 'RO', flag: '🇷🇴' },
    { code: 'ru', label: 'RU', flag: '🇷🇺' },
    { code: 'en', label: 'EN', flag: '🇬🇧' }
  ];

  constructor(private translate: TranslateService) {
    const saved = localStorage.getItem(this.STORAGE_KEY) || 'ru';
    this.translate.addLangs(['ro', 'ru', 'en']);
    this.setLanguage(saved);
  }

  setLanguage(lang: string): void {
    const mainContent = document.querySelector('.main-content') as HTMLElement;
    const sidebar = document.querySelector('.sidebar') as HTMLElement;

    const elements = [mainContent, sidebar].filter(Boolean) as HTMLElement[];

    elements.forEach(el => el.classList.add('lang-transition-out'));

    setTimeout(() => {
      this.translate.use(lang);
      localStorage.setItem(this.STORAGE_KEY, lang);

      elements.forEach(el => {
        el.classList.remove('lang-transition-out');
        el.classList.add('lang-transition-in');
      });

      setTimeout(() => {
        elements.forEach(el => el.classList.remove('lang-transition-in'));
      }, 200);
    }, 150);
  }

  getCurrentLanguage(): string {
    return this.translate.getCurrentLang() || 'ru';
  }
}
