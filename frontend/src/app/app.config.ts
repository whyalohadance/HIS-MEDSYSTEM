import { ApplicationConfig, APP_INITIALIZER, inject, LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localeRu from '@angular/common/locales/ru';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { firstValueFrom } from 'rxjs';
import { routes } from './app.routes';

registerLocaleData(localeRu);

function getSavedLang(): string {
  try {
    const saved = localStorage.getItem('language');
    if (saved && ['ru', 'ro', 'en'].includes(saved)) return saved;
  } catch {}
  return 'ru';
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(withInterceptorsFromDi()),
    { provide: LOCALE_ID, useValue: 'ru' },
    provideTranslateService({ lang: getSavedLang(), fallbackLang: 'ru' }),
    ...provideTranslateHttpLoader({ prefix: '/i18n/', suffix: '.json' }),
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: () => {
        const translate = inject(TranslateService);
        return async () => {
          translate.addLangs(['ru', 'ro', 'en']);
          try {
            await firstValueFrom(translate.use(getSavedLang()));
          } catch (e) {
            console.error('Translation load failed:', e);
          }
        };
      }
    }
  ]
};
