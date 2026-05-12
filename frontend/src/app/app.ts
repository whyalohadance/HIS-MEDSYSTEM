import { Component, Inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet></router-outlet>`
})
export class App {
  constructor(
    private translate: TranslateService,
    @Inject(DOCUMENT) private document: Document
  ) {
    const savedLang = localStorage.getItem('language') || 'ru';
    this.document.documentElement.setAttribute('lang', savedLang);

    this.translate.onLangChange.subscribe(event => {
      this.document.documentElement.setAttribute('lang', event.lang);
    });
  }
}
