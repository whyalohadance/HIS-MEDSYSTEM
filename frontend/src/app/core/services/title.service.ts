import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class TitleService {
  private readonly APP = 'HIS-MedSystem';

  private routeTitles: Record<string, string> = {
    '/setup':           'Настройка',
    '/auth/login':      'Вход',
    '/dashboard':       'Главная',
    '/welcome':         'Добро пожаловать',
    '/patients':        'Пациенты',
    '/appointments':    'Приёмы',
    '/staff':           'Персонал',
    '/rooms':           'Кабинеты',
    '/profile':         'Профиль',
    '/lab/catalog':     'Каталог анализов',
    '/lab/worklist':    'Лаб. ворклист',
    '/lab/orders':      'Лаб. заказы',
    '/lab-dashboard':   'Лаборатория',
    '/reports':         'Отчёты',
    '/studies':         'Исследования',
    '/worklist':        'Ворклист радиологии',
    '/ris-dashboard':   'Радиология',
    '/dicom':           'DICOM Viewer',
    '/tutorials':       'Обучение',
    '/notifications':   'Уведомления',
  };

  constructor(private titleSvc: Title, private router: Router) {}

  initialize(): void {
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((e: any) => {
      const url = (e.urlAfterRedirects as string).split('?')[0];
      const pageTitle = this.routeTitles[url] ?? this.guessTitle(url);
      this.titleSvc.setTitle(`${pageTitle} · ${this.APP}`);
    });
  }

  private guessTitle(url: string): string {
    if (url.startsWith('/tutorials/')) return 'Туториал';
    if (url.startsWith('/patients/'))  return 'Карточка пациента';
    if (url.startsWith('/dicom/'))     return 'DICOM Viewer';
    if (url.startsWith('/lab/order/')) return 'Лаб. заказ';
    return this.APP;
  }
}
