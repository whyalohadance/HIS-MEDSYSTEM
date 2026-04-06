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
    this.translate.use(lang);
    localStorage.setItem(this.STORAGE_KEY, lang);
  }

  getCurrentLanguage(): string {
    return this.translate.getCurrentLang() || 'ru';
  }
}
