import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { TranslateModule } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-tutorial-detail',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="detail-page" *ngIf="tutorial">
      <div class="bg-decoration"></div>

      <div class="back-bar">
        <button class="btn-back" (click)="goBack()">
          <span class="material-icons">arrow_back</span>
          {{ 'TUTORIALS.BACK' | translate }}
        </button>
      </div>

      <header class="tutorial-header" [style.--c]="tutorial.color">
        <div class="header-icon">
          <span class="material-icons">{{ tutorial.icon }}</span>
        </div>
        <div class="header-info">
          <h1>{{ tutorial.title }}</h1>
          <p>{{ tutorial.description }}</p>
          <div class="meta">
            <span class="meta-item">
              <span class="material-icons">schedule</span>
              {{ tutorial.duration }} {{ 'TUTORIALS.MIN' | translate }}
            </span>
            <span class="meta-item">
              <span class="material-icons">trending_up</span>
              {{ getDifficultyLabel(tutorial.difficulty) }}
            </span>
            <span class="meta-item" *ngIf="tutorial.role !== 'all'">
              <span class="material-icons">person</span>
              {{ getRoleLabel(tutorial.role) }}
            </span>
          </div>
        </div>
      </header>

      <article class="content-card">
        <div [ngSwitch]="tutorial.id">

          <div *ngSwitchCase="'admin-overview'">
            <h2>👨‍💼 Роль администратора</h2>
            <p>Администратор — главная роль в системе. Имеет доступ ко всему функционалу.</p>
            <h3>1. Управление персоналом</h3>
            <p>Раздел <strong>Персонал (/staff)</strong> показывает обзор всех сотрудников:</p>
            <ul>
              <li>4 KPI карточки: всего, активных, неактивных, врачей</li>
              <li>График топ-5 по активности за неделю</li>
              <li>Поиск + фильтры по ролям</li>
              <li>Цветовая индикация загруженности</li>
            </ul>
            <h3>2. Управление кабинетами</h3>
            <p>Раздел <strong>Кабинеты (/rooms)</strong> — все физические кабинеты клиники:</p>
            <ul>
              <li><strong>Consultation</strong> — терапевты, кардиологи</li>
              <li><strong>Radiology</strong> — МРТ, КТ, рентген</li>
              <li><strong>Laboratory</strong> — анализы крови, мочи</li>
            </ul>
            <h3>3. Каталог анализов</h3>
            <p>В <strong>/lab/catalog</strong> создавайте тесты с параметрами:</p>
            <ul>
              <li>Название и код (CBC, GLU, TSH)</li>
              <li>Категория и цена</li>
              <li>Параметры с нормами для auto-flag</li>
            </ul>
            <h3>4. Отчёты</h3>
            <p>Раздел <strong>Отчёты (/reports)</strong> — аналитика клиники:</p>
            <ul>
              <li>Доход за период, статистика по приёмам</li>
              <li>Топ услуг, годовая динамика</li>
              <li>PDF/Excel экспорт</li>
            </ul>
          </div>

          <div *ngSwitchCase="'doctor-workflow'">
            <h2>🩺 Рабочий процесс врача</h2>
            <p>Врач имеет доступ только к своим пациентам и приёмам.</p>
            <h3>1. Просмотр приёмов на день</h3>
            <p>На <strong>Dashboard (/dashboard)</strong> видно:</p>
            <ul>
              <li>Сегодняшние приёмы хронологически</li>
              <li>Уведомления о готовых анализах</li>
            </ul>
            <h3>2. Работа с карточкой пациента</h3>
            <p>5 вкладок в карточке:</p>
            <ul>
              <li><strong>Информация</strong> — демография, контакты, группа крови</li>
              <li><strong>Приёмы</strong> — история визитов</li>
              <li><strong>Анализы</strong> — результаты лаборатории</li>
              <li><strong>Радиология</strong> — снимки МРТ/КТ</li>
              <li><strong>Динамика</strong> — графики показателей</li>
            </ul>
            <h3>3. Назначение лечения</h3>
            <ol>
              <li>Жалобы и анамнез</li>
              <li>Диагноз (с кодом МКБ-10)</li>
              <li>Назначения и рекомендации</li>
              <li>Заказ анализов (если нужно)</li>
            </ol>
          </div>

          <div *ngSwitchCase="'reception-booking'">
            <h2>💼 Рабочий процесс ресепшн</h2>
            <p>Ресепшн отвечает за регистрацию пациентов и запись на приёмы.</p>
            <h3>1. Регистрация нового пациента</h3>
            <p>В <strong>/patients</strong> → кнопка <em>Создать пациента</em>: ФИО, дата рождения, контакты, адрес, группа крови.</p>
            <h3>2. Пошаговый мастер создания приёма</h3>
            <ol>
              <li><strong>Шаг 1:</strong> Выбор пациента (autocomplete)</li>
              <li><strong>Шаг 2:</strong> Выбор кабинета</li>
              <li><strong>Шаг 3:</strong> Выбор услуги</li>
              <li><strong>Шаг 4:</strong> Дата и время</li>
              <li><strong>Шаг 5:</strong> Выбор доктора (с проверкой свободности)</li>
            </ol>
            <h3>3. Особенности по типам кабинетов</h3>
            <ul>
              <li><strong>Consultation</strong> — обязательно выбрать доктора</li>
              <li><strong>Radiology</strong> — авто-выбор радиолога + создание Study</li>
              <li><strong>Laboratory</strong> — без доктора + создание LabOrder</li>
            </ul>
          </div>

          <div *ngSwitchCase="'radiologist-dicom'">
            <h2>📷 Работа с радиологией</h2>
            <p>Радиолог работает с DICOM-изображениями и составляет заключения.</p>
            <h3>1. Worklist</h3>
            <ul>
              <li><strong>Pending</strong> — ожидают обработки</li>
              <li><strong>In progress</strong> — в работе</li>
              <li><strong>Completed</strong> — завершены</li>
            </ul>
            <h3>2. Инструменты DICOM Viewer</h3>
            <ul>
              <li><strong>Zoom / Pan</strong> — масштаб и перемещение</li>
              <li><strong>Window/Level</strong> — пресеты Brain/Bone/Lung</li>
              <li><strong>Ruler</strong> — измерение в мм</li>
              <li><strong>HU Value</strong> — плотность ткани</li>
              <li><strong>Annotations</strong> — текстовые пометки</li>
            </ul>
            <h3>3. Заключение</h3>
            <ol>
              <li><strong>Findings</strong> — что видно на снимке</li>
              <li><strong>Conclusion</strong> — диагноз</li>
              <li>Прикрепите скриншоты, используйте шаблоны</li>
            </ol>
          </div>

          <div *ngSwitchCase="'lab-results'">
            <h2>🔬 Ввод результатов анализов</h2>
            <p>Лаборант обрабатывает заказы с автоматической интерпретацией.</p>
            <h3>1. Приоритеты Worklist</h3>
            <ul>
              <li><strong>🔴 STAT</strong> — критически срочно</li>
              <li><strong>🟡 Urgent</strong> — срочно</li>
              <li><strong>🟢 Routine</strong> — плановые</li>
            </ul>
            <h3>2. Auto-flag система</h3>
            <ul>
              <li><strong>🟢 Normal</strong> — в пределах референса</li>
              <li><strong>🟡 Low / High</strong> — отклонение</li>
              <li><strong>🔴 Critical</strong> — критические значения</li>
            </ul>
            <h3>3. Завершение заказа</h3>
            <ol>
              <li>Введите все параметры → Save Results</li>
              <li>Проверьте флаги → Complete Order</li>
              <li>Врач получит уведомление</li>
            </ol>
          </div>

          <div *ngSwitchCase="'system-overview'">
            <h2>ℹ️ О системе HIS-MedSystem</h2>
            <h3>Три модуля</h3>
            <ul>
              <li><strong>HIS</strong> — управление пациентами, приёмами, расписанием</li>
              <li><strong>RIS</strong> — радиология с DICOM viewer'ом</li>
              <li><strong>LIS</strong> — лаборатория с auto-flag интерпретацией</li>
            </ul>
            <h3>Технологический стек</h3>
            <ul>
              <li><strong>Frontend</strong>: Angular 19 (Standalone Components)</li>
              <li><strong>Backend</strong>: NestJS 10 + TypeScript</li>
              <li><strong>Database</strong>: PostgreSQL 16 с TypeORM</li>
              <li><strong>DICOM</strong>: Cornerstone.js</li>
              <li><strong>Containers</strong>: Docker + Docker Compose</li>
            </ul>
            <h3>Метрики качества</h3>
            <ul>
              <li>272 автоматических теста (100% pass rate)</li>
              <li>Lighthouse 95.5/100 average</li>
              <li>Защита от SQL injection, XSS, JWT атак</li>
            </ul>
          </div>

          <div *ngSwitchCase="'languages'">
            <h2>🌍 Языки и переводы</h2>
            <p>Система поддерживает 3 языка: Русский, Romanian, English.</p>
            <h3>Переключение языка</h3>
            <p>Кнопка в правом верхнем углу → выпадающее меню. Выбор сохраняется в браузере.</p>
            <h3>Что переводится</h3>
            <ul>
              <li>Все элементы интерфейса</li>
              <li>Системные сообщения и уведомления</li>
              <li>Статусы (Pending, Completed и т.д.)</li>
            </ul>
            <h3>Что НЕ переводится</h3>
            <ul>
              <li>Имена пациентов и данные истории болезни</li>
              <li>Числовые результаты анализов</li>
            </ul>
          </div>

          <div *ngSwitchCase="'security-basics'">
            <h2>🔒 Безопасность данных</h2>
            <h3>Пароли</h3>
            <ul>
              <li>Хешируются через <code>bcrypt</code> с 10 раундами</li>
              <li>Никогда не возвращаются в API responses</li>
            </ul>
            <h3>Роли доступа (RBAC)</h3>
            <ul>
              <li>Каждый endpoint защищён <code>JwtAuthGuard</code> + <code>RolesGuard</code></li>
              <li>5 ролей: Admin / Doctor / Reception / Radiologist / Lab</li>
            </ul>
            <h3>JWT токены</h3>
            <ul>
              <li>HS256, 24ч expiration, хранятся в localStorage</li>
            </ul>
            <h3>Защита от атак</h3>
            <ul>
              <li><strong>SQL Injection</strong> — TypeORM parameterized queries</li>
              <li><strong>XSS</strong> — Angular auto-sanitization</li>
              <li><strong>CSRF</strong> — JWT в headers</li>
            </ul>
          </div>

          <div *ngSwitchDefault>
            <p>{{ 'TUTORIALS.IN_DEVELOPMENT' | translate }}</p>
          </div>
        </div>
      </article>

      <div class="action-bar">
        <button class="btn-complete" *ngIf="!completed" (click)="markComplete()">
          <span class="material-icons">check_circle</span>
          {{ 'TUTORIALS.MARK_COMPLETE' | translate }}
        </button>
        <div class="completed-badge" *ngIf="completed">
          <span class="material-icons">verified</span>
          {{ 'TUTORIALS.COMPLETED_MSG' | translate }}
        </div>
        <button class="btn-next" (click)="goBack()">
          <span>{{ 'TUTORIALS.BACK' | translate }}</span>
          <span class="material-icons">arrow_forward</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .detail-page {
      min-height: 100vh;
      background: #f4f6f9;
      color: #1f2937;
      padding: 32px;
      position: relative;
    }

    .bg-decoration {
      position: fixed; inset: 0;
      background: radial-gradient(circle at 20% 30%, rgba(26,115,232,0.05) 0%, transparent 50%);
      pointer-events: none; z-index: 0;
    }

    .back-bar {
      max-width: 800px;
      margin: 0 auto 24px;
      position: relative; z-index: 1;
    }

    .btn-back {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      background: white;
      border: 1.5px solid #e2e8f0;
      border-radius: 10px;
      color: #718096;
      cursor: pointer;
      font-family: inherit;
      font-size: 13px;
      transition: all 0.15s;
    }

    .btn-back:hover { color: #1a73e8; border-color: #1a73e8; }
    .btn-back .material-icons { font-size: 16px; }

    .tutorial-header {
      max-width: 800px;
      margin: 0 auto 32px;
      display: flex;
      gap: 24px;
      padding: 32px;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      position: relative; z-index: 1;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }

    .tutorial-header::before {
      content: '';
      position: absolute;
      top: 0; left: 0;
      width: 4px; height: 100%;
      background: var(--c, #1a73e8);
    }

    .header-icon {
      width: 64px; height: 64px;
      border-radius: 16px;
      background: var(--c, #1a73e8);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }

    .header-icon .material-icons { color: white; font-size: 32px; }
    .header-info h1 { margin: 0 0 8px; font-size: 24px; color: #0f2d52; }
    .header-info p { margin: 0 0 16px; color: #718096; }

    .meta { display: flex; flex-wrap: wrap; gap: 12px; }

    .meta-item { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: #718096; }
    .meta-item .material-icons { font-size: 16px; color: var(--c, #1a73e8); }

    .content-card {
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      position: relative; z-index: 1;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }

    .content-card h2 { color: #0f2d52; font-size: 22px; margin: 0 0 16px; }
    .content-card h3 { color: #1a73e8; margin: 28px 0 12px; font-size: 16px; }
    .content-card p { color: #475569; line-height: 1.7; margin: 0 0 12px; }
    .content-card ul, .content-card ol { color: #475569; line-height: 1.8; padding-left: 24px; margin: 0 0 12px; }
    .content-card li { margin: 6px 0; }
    .content-card strong { color: #0f2d52; }
    .content-card em { color: #718096; font-style: italic; }

    .content-card code {
      background: rgba(26,115,232,0.08);
      color: #1557b0;
      padding: 1px 6px;
      border-radius: 4px;
      font-size: 90%;
      font-family: ui-monospace, monospace;
    }

    .action-bar {
      max-width: 800px;
      margin: 32px auto 0;
      display: flex;
      justify-content: space-between;
      gap: 12px;
      position: relative; z-index: 1;
    }

    .btn-complete, .btn-next {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      border-radius: 12px;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      font-size: 14px;
      border: none;
    }

    .btn-complete {
      background: linear-gradient(135deg, #22c55e, #16a34a);
      color: white;
    }

    .btn-next {
      background: #f4f6f9;
      color: #475569;
      border: 1.5px solid #e2e8f0;
      margin-left: auto;
    }

    .btn-next:hover { background: #e2e8f0; color: #1a73e8; border-color: #1a73e8; }

    .completed-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      background: rgba(34, 197, 94, 0.08);
      border: 1px solid rgba(34, 197, 94, 0.3);
      border-radius: 12px;
      color: #16a34a;
      font-weight: 600;
    }

    @media (max-width: 768px) {
      .detail-page { padding: 16px; }
      .tutorial-header { flex-direction: column; gap: 16px; padding: 20px; }
      .content-card { padding: 24px; }
      .action-bar { flex-direction: column; }
      .btn-next { margin-left: 0; }
    }
  `]
})
export class TutorialDetailComponent implements OnInit {
  tutorial: any = null;
  tutorialId = '';
  completed = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private cdr: ChangeDetectorRef,
  ) {}

  async ngOnInit() {
    this.tutorialId = this.route.snapshot.params['id'];
    await this.loadTutorial();
    await this.loadProgress();
  }

  async loadTutorial() {
    try {
      const res: any = await firstValueFrom(this.api.get('/tutorials/list'));
      this.tutorial = (res?.data || []).find((t: any) => t.id === this.tutorialId);
      this.cdr.detectChanges();
    } catch {}
  }

  async loadProgress() {
    try {
      const res: any = await firstValueFrom(this.api.get('/tutorials/progress'));
      this.completed = (res?.data || []).some((p: any) =>
        p.tutorialId === this.tutorialId && p.completed,
      );
      this.cdr.detectChanges();
    } catch {}
  }

  async markComplete() {
    try {
      await firstValueFrom(this.api.post(`/tutorials/complete/${this.tutorialId}`, {}));
      this.completed = true;
      this.cdr.detectChanges();
    } catch {}
  }

  goBack() {
    this.router.navigate(['/tutorials']);
  }

  getDifficultyLabel(d: string): string {
    const map: Record<string, string> = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };
    return map[d] || d;
  }

  getRoleLabel(r: string): string {
    const map: Record<string, string> = {
      admin: 'Admin',
      doctor: 'Doctor',
      reception: 'Reception',
      radiologist: 'Radiologist',
      lab_technician: 'Lab',
    };
    return map[r] || r;
  }
}
