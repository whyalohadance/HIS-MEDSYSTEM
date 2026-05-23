import { Component, Inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { DOCUMENT } from '@angular/common';
import { TitleService } from './core/services/title.service';
import { ToastComponent } from './shared/components/toast/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastComponent],
  template: `
    <router-outlet></router-outlet>
    <app-toast></app-toast>
  `
})
export class App implements OnInit {
  constructor(
    private translate: TranslateService,
    @Inject(DOCUMENT) private document: Document,
    private titleService: TitleService
  ) {
    const savedLang = localStorage.getItem('language') || 'ru';
    this.document.documentElement.setAttribute('lang', savedLang);

    this.translate.onLangChange.subscribe(event => {
      this.document.documentElement.setAttribute('lang', event.lang);
    });
  }

  ngOnInit(): void {
    this.titleService.initialize();
  }
}
