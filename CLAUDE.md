# HIS-MedSystem — Project Brain for Claude Code

## Что это за проект
HIS-MedSystem (Hospital Information System) — полноценная медицинская веб-система.
Разработана студентом Ceban Devid, CUTM (Colegiul Universității Tehnice a Moldovei), специальность AAW.
GitHub: https://github.com/whyalohadance/HIS-MEDSYSTEM

## Структура проекта
- Backend: ~/Documents/GitHub/HIS-MEDSYSTEM/backend (NestJS, порт 3000)
- Frontend: ~/Documents/GitHub/HIS-MEDSYSTEM/frontend (Angular 19, порт 4200)
- База данных: PostgreSQL 16, medical_db

## Как запустить
Terminal 1: cd ~/Documents/GitHub/HIS-MEDSYSTEM/backend && npm run start:dev
Terminal 2: cd ~/Documents/GitHub/HIS-MEDSYSTEM/frontend && ng serve
Docker: cd ~/Documents/GitHub/HIS-MEDSYSTEM && make up

## База данных
Host: localhost:5432
DB: medical_db | User: medical_user | Password: medical123
JWT Secret: medical_super_secret_key_2024

## Тестовые аккаунты
admin@med.com / password123 — полный доступ
doctor@med.com / password123 — медицинский доступ
reception@med.com / password123 — запись пациентов
radiolog@med.com / password123 — RIS + DICOM Viewer

## Роли и доступ
- admin: всё
- doctor: пациенты, приёмы, результаты, My Cabinet
- receptionist: пациенты, приёмы, кабинеты
- radiologist: RIS исследования, Worklist, DICOM Viewer

## Технологии Backend
NestJS 10, TypeORM (synchronize: true), PostgreSQL 16
JWT + bcryptjs + Passport, Multer (upload), Mammoth (docx→HTML)
PDFKit + шрифт Roboto (кириллица!), ExcelJS, @nestjs/schedule (cron)
Swagger UI на /api/docs

## Технологии Frontend
Angular 19 Standalone Components, SCSS + CSS Variables
@ngx-translate/core — 3 языка: RO/RU/EN
Chart.js — графики на dashboard
Cornerstone.js — DICOM Viewer
i18n файлы: frontend/public/i18n/ro.json, ru.json, en.json

## Структура Frontend
src/app/features/ — страницы:
  auth/login/ — страница логина с анимацией (2 файла: .html + .scss отдельно!)
  dashboard/ — дашборд (разный для каждой роли)
  patients/ — список пациентов
  patient-card/ — карточка пациента
  appointments/ — приёмы
  staff/ — персонал
  rooms/ — кабинеты
  reports/ — отчёты PDF/Excel
  studies/ — RIS исследования
  worklist/ — список работ радиолога
  dicom-viewer/ — DICOM Viewer
  my-cabinet/ — кабинет доктора
  not-found/ — страница 404

src/app/shared/components/ — компоненты:
  sidebar/ — боковое меню (role-based)
  header/ — шапка (язык RO/RU/EN, темная тема, уведомления)
  bottom-nav/ — нижняя навигация на мобильных
  toast/ — всплывающие уведомления
  confirm-dialog/ — диалог подтверждения
  dicom-viewer/ — компонент просмотра DICOM
  date-picker/ — кастомный выбор даты

src/app/core/services/ — сервисы:
  auth.service.ts — авторизация
  api.service.ts — HTTP запросы (добавляет JWT автоматически)
  language.service.ts — переключение языков
  toast.service.ts — toast уведомления
  confirm.service.ts — confirm диалог

## Важные детали
- Токен JWT хранится в localStorage под ключом 'token'
- Пользователь хранится в localStorage под ключом 'user'
- Темная тема: class 'dark-theme' на body
- Bottom nav показывается только до 768px
- Sidebar скрыт на мобильных (до 768px)
- Страница логина: login.component.html и login.component.scss ОТДЕЛЬНЫЕ ФАЙЛЫ
- Анимация логина: animState = 'logo' → 'moving' → 'form'
- Логотип в центре (фаза logo), потом в левой панели (фаза form)

## Цветовая палитра
primary: #1a73e8 (синий)
dark: #0f2d52 (тёмно-синий)
success: #34a853 (зелёный)
danger: #ea4335 (красный)
warning: #f9ab00 (жёлтый)
bg-light: #f4f6f9
bg-dark: #0f172a
card-dark: #1e293b

## Breakpoints
xs: 0-480px | sm: 480-768px | md: 768-1024px | lg: 1024-1440px | xl: 1440px+

## Частые проблемы
Порт занят: kill -9 $(lsof -ti:3000) или kill -9 $(lsof -ti:4200)
CORS: проверь main.ts — app.enableCors({origin: ['http://localhost:4200']})
JSON невалидный: python3 -c "import json; json.load(open('файл.json'))"

## Backend модули (src/modules/)
auth, users, patients, appointments, results, rooms, reports,
notifications, schedules, examinations, upload, studies (RIS)

## Правила работы — ВСЕГДА
- После изменений frontend: npx ng build --configuration=development
- После изменений backend: npm run build
- Каждую задачу завершай: git add . && git commit -m "..." && git push origin main
- Используй ApiService для HTTP запросов (не fetch напрямую)
- Добавляй TranslateModule в imports каждого нового компонента
- Проверяй валидность JSON: python3 -c "import json; json.load(open(...))"

## Правила работы — НИКОГДА
- Не меняй порты (3000 и 4200)
- Не удаляй существующие модули без причины
- Не хардкодируй тексты — используй translate pipe
- Не забывай про dark theme при добавлении новых стилей
- Не используй display:none для скрытия логотипа — используй opacity

## Docker
docker-compose.yml — продакшен (3 контейнера)
docker-compose.dev.yml — только PostgreSQL
make up — запустить всё
make down — остановить
make logs — логи

## RIS модуль (Radiology Information System)
Study entity: studyId (STU-YYYYMMDD-XXXX), type (mri/ct/xray/ultrasound/pet),
status (pending/scheduled/in_progress/completed/cancelled),
priority (routine/urgent/stat), findings, conclusion
Modality entity: оборудование (МРТ Siemens 3T, КТ GE Revolution, etc.)
Доступ: только admin и radiologist
DICOM Viewer: Cornerstone.js, маршрут /dicom и /dicom/:id
