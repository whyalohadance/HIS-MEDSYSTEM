<div align="center">

<img src="https://img.shields.io/badge/HIS-MedSystem-D5001C?style=for-the-badge&labelColor=000000" alt="HIS-MedSystem"/>

# HIS-MedSystem

**Госпитальная Информационная Система** — Интегрированные модули Радиологии и Лаборатории

*Разработано для здравоохранения. Создано для производительности.*

---

**Язык**: [🇷🇴 Română](README.md) · [🇬🇧 English](README.en.md) · 🇷🇺 Русский

[![Версия](https://img.shields.io/badge/%D0%92%D0%B5%D1%80%D1%81%D0%B8%D1%8F-v3.0.1-D5001C?style=flat-square&labelColor=000000)]()
[![Безопасность](https://img.shields.io/badge/%D0%91%D0%B5%D0%B7%D0%BE%D0%BF%D0%B0%D1%81%D0%BD%D0%BE%D1%81%D1%82%D1%8C-Hardened-D5001C?style=flat-square&labelColor=000000)]()
[![Соответствие](https://img.shields.io/badge/HIPAA%2FGDPR-Compliant-D5001C?style=flat-square&labelColor=000000)]()
[![Лицензия](https://img.shields.io/badge/%D0%9B%D0%B8%D1%86%D0%B5%D0%BD%D0%B7%D0%B8%D1%8F-Academic-D5001C?style=flat-square&labelColor=000000)]()

[**Быстрая установка**](#быстрая-установка) · [**Документация**](docs/) · [**Архитектура**](docs/architecture/) · [**API**](docs/API.md) · [**Деплой**](docs/DEPLOYMENT.md)

</div>

---

## О проекте

HIS-MedSystem — это комплексная госпитальная информационная система, разработанная как дипломный проект в Колледже Технического Университета Молдовы (CUTM), специальность Администрирование Веб-Приложений. Система объединяет три критически важных медицинских модуля в единое, защищённое и производительное решение.

**Автор:** Ceban Devid · **Группа:** AAW-221 · **Год:** 2026

---

## Интегрированные модули

| Модуль | Возможности | Статус |
|--------|-------------|--------|
| **HIS** | Пациенты, записи, медкарты, отчёты | Production |
| **RIS** | DICOM viewer, исследования, worklist радиологов | Production |
| **LIS** | Каталог анализов, заявки, результаты с авто-флагами | Production |
| **Setup Wizard** | Первоначальная настройка клиники, Mac-style анимация | Production |
| **System Health** | Мониторинг в реальном времени (БД, диск, RAM, uptime) | Production |
| **Audit Log** | Автоматический журнал согласно HIPAA/GDPR | Production |
| **Backup Management** | Резервные копии БД с восстановлением через UI | Production |

---

## Безопасность

Реализована согласно отраслевым стандартам для медицинских приложений:

- **Rate Limiting** — 5 попыток входа/минуту, 100 req/min глобально (Throttler)
- **Account Lockout** — Автоматическая блокировка после 5 неудачных попыток (15 минут)
- **Lockout Overlay** — Полноэкранный таймер обратного отсчёта при блокировке
- **Password Hardening** — Bcrypt cost 12, regex-валидация сложности
- **JWT + RBAC** — 5 ролей (admin, doctor, receptionist, radiologist, lab_technician)
- **Helmet** — Security headers (X-Frame-Options, CSP, HSTS)
- **CORS Whitelist** — Настраиваемый через .env
- **User Enumeration Protection** — Общие сообщения при неудачной авторизации
- **Audit Trail** — Все CRUD-действия логируются автоматически
- **Restore Confirmation** — Восстановление БД требует ввода "RESTORE"

---

## Производительность

Измерено с помощью Google Lighthouse и внутренних бенчмарков:

| Категория | Балл |
|-----------|------|
| Performance | **91 / 100** |
| Accessibility | **94 / 100** |
| Best Practices | **97 / 100** |
| SEO | **100 / 100** |

**API Response**: 1–7ms · **Frontend Bundle**: 525 KB · **FCP**: < 600ms · **DB Indexes**: 43 оптимизированных

---

## Архитектура

```
┌─────────────────────────────────────────────────────────────┐
│  Angular 19 Frontend (Standalone Components · i18n RO/RU/EN) │
│  Setup Wizard · System Health · Audit · Backup · DICOM Viewer│
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTPS / REST + JWT
┌─────────────────────────┴───────────────────────────────────┐
│  NestJS 10 API                                               │
│  20 модулей · Глобальные Interceptors (Audit, Validation)    │
│  Throttler · Helmet · Rate Limiting · RBAC Guards            │
└─────────────────────────┬───────────────────────────────────┘
                          │
              ┌───────────┴───────────┐
              │                       │
       ┌──────┴──────┐         ┌──────┴──────┐
       │ PostgreSQL  │         │   Backups   │
       │     16      │◀────────│  pg_dump    │
       │ 21 таблица  │         │   gzip      │
       │ 43 индекса  │         │  /backups/  │
       └─────────────┘         └─────────────┘
```

---

## Технологический стек

**Frontend**
- Angular 19 (Standalone Components, signals)
- TypeScript 5.3
- Chart.js 4 (аналитика, дашборды)
- Cornerstone.js (DICOM viewer)
- ngx-translate (i18n три языка)
- Material Icons

**Backend**
- NestJS 10 (20 модулей)
- TypeORM 0.3
- @nestjs/terminus (health checks)
- @nestjs/throttler (rate limiting)
- helmet (security headers)
- JWT + Passport.js
- bcryptjs (cost 12)
- class-validator

**База данных**
- PostgreSQL 16-alpine
- 21 таблица, 43 индекса, JSONB для audit changes
- ENUM types для type safety
- Timestamp типы для audit trail

**Инфраструктура**
- Docker Compose (3 контейнера)
- Nginx (reverse proxy, gzip, security headers)
- pg_dump + gzip для резервных копий

---

## Быстрая установка

```bash
# 1. Клонируйте репозиторий
git clone https://github.com/whyalohadance/HIS-MEDSYSTEM.git
cd HIS-MEDSYSTEM

# 2. Настройте .env
cp .env.example .env

# 3. Запуск (production режим)
docker-compose up -d

# 4. Откройте в браузере (через ~60 секунд)
open http://localhost
```

При первом запуске появится **Setup Wizard** с Mac-style анимацией — пройдите 7 шагов для настройки клиники и создания администратора.

Для полного развёртывания на сервере (Ubuntu/Cloudflare/HTTPS) смотрите [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

---

## Режим разработки

Hot-reload — изменения применяются мгновенно без rebuild:

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

| Сервис | URL | Hot-reload |
|--------|-----|-----------|
| Frontend (ng serve) | http://localhost:4200 | Любое изменение в `frontend/src/` |
| Backend (NestJS watch) | http://localhost:3000 | Любое изменение в `backend/src/` |
| Swagger | http://localhost:3000/api/docs | — |

---

## Роли и права доступа

| Роль | Ключевые возможности |
|------|----------------------|
| **admin** | Полный доступ · System Health · Audit Log · Backup · Персонал · Настройки |
| **doctor** | Пациенты · Записи · Медкарты · Мой кабинет |
| **receptionist** | Записи · Пациенты · Регистрация |
| **radiologist** | DICOM исследования · Worklist · Заключение радиолога |
| **lab_technician** | Заявки лаборатории · Worklist · Каталог анализов · Результаты |

### Демо-аккаунты (пароль: `password123`)

| Email | Роль |
|-------|------|
| admin@med.com | Администратор |
| doctor@med.com | Врач |
| reception@med.com | Регистратор |
| radiolog@med.com | Радиолог |
| lab@med.com | Лаборант |

---

## Административные функции

### System Health Dashboard

Мониторинг в реальном времени с авто-обновлением каждые 30 секунд:

- Статус Backend API и PostgreSQL (с ping временем)
- Использование диска (progress bar + алерты)
- Память RAM heap (лимит 250 MB)
- Uptime приложения
- Счётчики БД (пациенты, записи, пользователи, исследования)
- Раскрывающиеся карточки ошибок с возможными причинами

### Audit Log

Автоматическое логирование согласно HIPAA/GDPR Article 30:

- Все CRUD-действия (POST/PUT/PATCH/DELETE) автологируются через глобальный Interceptor
- Skip для служебных endpoint'ов (/health, /audit, /auth/refresh)
- Фильтры: пользователь, действие, ресурс, диапазон дат
- CSV экспорт с UTF-8 BOM
- Авто-обновление 30s (переключаемое)
- DB индексация для быстрых запросов

### Backup Management

- Создание backup одним кликом (pg_dump | gzip)
- Список backup'ов с метаданными (размер, дата)
- Прямое скачивание через UI
- Restore с текстовым подтверждением "RESTORE"
- Auto-cleanup при превышении 1 GB
- Все операции логируются в audit
- Хранение в персистентном Docker volume

---

## Полезные команды

```bash
make up               # Запуск всех контейнеров (production)
make down             # Остановка контейнеров
make hot              # Запуск hot-reload dev режима
make logs             # Просмотр логов
make seed-demo        # Загрузка демо-данных
make test             # Запуск полного набора тестов
make backup           # Резервная копия БД
make restore          # Восстановление БД
make clean            # Удаление контейнеров и volumes
```

---

## Структура проекта

```
HIS-MEDSYSTEM/
├── backend/                    NestJS 10 API
│   └── src/modules/            20 модулей (auth, patients, audit, backup, health...)
├── frontend/                   Angular 19 SPA
│   └── src/app/
│       ├── features/           35 features (HIS, RIS, LIS, admin)
│       ├── shared/             Переиспользуемые компоненты
│       └── core/               Services, guards, models
├── docs/                       Документация
│   ├── API.md
│   ├── DEPLOYMENT.md           Полное руководство по деплою
│   ├── DOCKER.md
│   ├── architecture/           UML диаграммы
│   └── reports/                Отчёты тестирования
├── scripts/                    Init DB, seed'ы
├── tests/                      API, E2E, security, smoke
├── backups/                    Volume для backup'ов
├── docker-compose.yml          Production
├── docker-compose.dev.yml      Development hot-reload
└── .github/workflows/          CI/CD
```

---

## Документация

- [Подробная установка](docs/INSTALLATION.md)
- [Деплой на сервер](docs/DEPLOYMENT.md) — Ubuntu, HTTPS, Cloudflare
- [Архитектура](docs/architecture/) — UML, ER, flow диаграммы
- [API Reference](docs/API.md)
- [Docker](docs/DOCKER.md)
- [Testing](docs/TESTING.md)
- [Отчёты тестирования](docs/reports/)

---

## Соответствие стандартам

| Стандарт | Реализация |
|----------|-----------|
| **HIPAA** | Полный audit trail, access control, encryption |
| **GDPR Article 30** | Records of processing activities (audit logs) |
| **OWASP Top 10** | Защита от injection, broken auth, XSS и др. |
| **ISO 27001** | Information security best practices |

---

## Статус

**Реализовано (v3.0.1):**

- HIS core (пациенты, записи, медкарты)
- RIS с DICOM viewer (Cornerstone.js)
- LIS с каталогом анализов и auto-flag detection
- Setup Wizard с Mac-style intro (12 языков, бесконечная карусель)
- Security hardening (rate limit, lockout, helmet, CORS)
- System Health Dashboard (real-time, авто-обновление)
- Audit Log согласно HIPAA/GDPR
- Backup Management с подтверждённым restore
- i18n три языка (RO/RU/EN)
- Dev режим с hot-reload и proxy config

**Запланировано (после защиты):**

- WebSocket алерты для критических событий
- История метрик за 24 часа с графиками
- Эскалация блокировок (exponential backoff)
- Нативное мобильное приложение (Capacitor)
- Модуль биллинга и интеграция CAS

---

## Академический контекст

**Автор:** Ceban Devid  
**Учреждение:** Колледж Технического Университета Молдовы (CUTM)  
**Специальность:** Администрирование Веб-Приложений (AAW)  
**Группа:** AAW-221  
**Учебный год:** 2025–2026  
**Практика:** Centrul de Diagnostic German (CDG), Кишинёв  
**Период:** 21.04.2026 – 12.06.2026  
**GitHub:** [@whyalohadance](https://github.com/whyalohadance)

---

## Лицензия

Академический проект, разработанный в рамках дипломной работы. Все права защищены © 2026 Ceban Devid.

---

<div align="center">

Создано с точностью. Проверено с тщательностью.

</div>
