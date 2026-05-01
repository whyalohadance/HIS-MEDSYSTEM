# 🤖 CLAUDE.md — Контекст проекта HIS-MedSystem

> Файл-памятка для Claude Code — полный контекст проекта для эффективной работы.

---

## 🎯 ОБЩЕЕ

**Проект:** HIS-MedSystem — медицинская информационная система  
**Автор:** Ceban Devid  
**Учебное заведение:** CUTM (Colegiul Universității Tehnice a Moldovei)  
**Специальность:** Administrarea Aplicațiilor Web (AAW)  
**Год:** 2026  
**Практика:** Centrul de Diagnostic German (CDG), Chișinău

---

## 📂 ПУТИ К ФАЙЛАМ

```
~/Documents/GitHub/HIS-MEDSYSTEM/
├── backend/    — NestJS + PostgreSQL
└── frontend/   — Angular 19
```

**GitHub:** https://github.com/whyalohadance/HIS-MEDSYSTEM

---

## 🚀 ЗАПУСК

```bash
# Backend
cd ~/Documents/GitHub/HIS-MEDSYSTEM/backend
npm run start:dev

# Frontend (новый терминал)
cd ~/Documents/GitHub/HIS-MEDSYSTEM/frontend
ng serve

# Или Docker
cd ~/Documents/GitHub/HIS-MEDSYSTEM
make up
```

**Порты:**
- Backend: 3000
- Frontend: 4200
- PostgreSQL: 5432

---

## 🗄 БАЗА ДАННЫХ

```
DB:       medical_db
User:     medical_user
Password: medical123
Host:     localhost:5432
```

---

## 👥 АККАУНТЫ (все с паролем password123)

| Email | Роль | Описание |
|-------|------|----------|
| admin@med.com | admin | Полный доступ |
| doctor@med.com | doctor | Пациенты, приёмы, заключения |
| reception@med.com | receptionist | Расписание, регистрация |
| radiolog@med.com | radiologist | RIS, DICOM Viewer |
| lab@med.com | lab_technician | LIS, результаты анализов |

---

## 🏗 АРХИТЕКТУРА

### Backend модули:
- **auth** — JWT authentication
- **users** — пользователи и роли
- **patients** — пациенты
- **appointments** — приёмы (с Cron auto-complete)
- **rooms** — кабинеты с услугами и докторами
- **studies** — RIS (исследования + DICOM)
- **lab** — LIS (анализы)
- **reports** — PDF/Excel отчёты
- **notifications** — уведомления

### Frontend pages:
- /auth/login
- /dashboard, /lab-dashboard, /ris-dashboard
- /patients, /patients/:id
- /appointments
- /studies, /worklist, /dicom, /dicom/:id
- /lab/orders, /lab/worklist, /lab/order/:id, /lab/catalog
- /reports
- /staff, /rooms (admin only)
- /profile, /notifications

---

## 🎨 ЦВЕТА

- Primary: #1a73e8 (синий — HIS)
- RIS: #7c3aed (фиолетовый)
- LIS: #10b981 (зелёный)
- Dark: #0f2d52
- Success: #10b981 / #047857
- Warning: #f59e0b / #d97706
- Danger: #ef4444 / #dc2626

---

## 📦 РЕАЛИЗОВАННЫЕ ФУНКЦИИ

### HIS
- [x] JWT auth + 5 ролей + RoleGuard
- [x] CRUD пациенты + tabs в карточке (Info/Appointments/Lab/Studies/Dynamics)
- [x] Programări с проверкой свободных докторов
- [x] Cabinete с услугами и прайсом
- [x] Auto-complete приёмов по времени (Cron каждую минуту)
- [x] Notificări с Cron 2 часа до приёма
- [x] Reports PDF (PDFKit + Roboto) + Excel (ExcelJS)
- [x] Multilingvism RO/RU/EN (@ngx-translate)
- [x] Mobile + Bottom Navigation
- [x] Toast + ConfirmDialog + 404
- [x] Docker + docker-compose + Makefile
- [x] Swagger /api/docs
- [x] GlobalExceptionFilter

### RIS (Radiology)
- [x] Studies CRUD + Worklist + Stats
- [x] DICOM Viewer (Cornerstone.js)
- [x] Multi-frame + Multi-file navigation
- [x] Линейка (SVG overlay) с pixelSpacing → мм
- [x] Аннотации с текстом
- [x] Pixel Probe + Hounsfield Units + tissue detection
- [x] Window/Level пресеты (8: Default, Мозг, Кости, Лёгкие, и т.д.)
- [x] Cine Mode (1-30 FPS, loop)
- [x] Заключение радиолога с шаблонами (Норма/Воспаление/Образование)
- [x] Прикрепление снимков к заключению
- [x] PDF заключение с шапкой, скриншотами, подписью
- [x] Сохранение измерений и аннотаций в БД
- [x] Экспорт PNG со всеми измерениями
- [x] Иерархия Patient→Study→Series→Image

### LIS (Laboratory)
- [x] LabTest catalog (admin) с 8 категориями
- [x] LabOrder с приоритетами (routine/urgent/stat)
- [x] LabResult с auto-flag (normal/low/high/critical)
- [x] Worklist для лаборанта
- [x] Статистика для admin
- [x] Назначение анализов из приёма
- [x] PDF результатов с шапкой, таблицей, подписью
- [x] График динамики показателей (Chart.js)
- [x] Auto-create LabOrder при booking лабораторного кабинета

### Dashboards
- [x] Admin Dashboard
- [x] Doctor Dashboard
- [x] Reception Dashboard
- [x] Lab Dashboard (статистика, weekly chart, today summary)
- [x] RIS Dashboard (по модальностям, срочные, weekly chart)
- [x] Auto-redirect после логина по роли

### UX
- [x] Login Apple-style + анимация смены языка
- [x] Demo accounts кнопки (5 ролей)
- [x] Dark theme DICOM Viewer
- [x] Toast уведомления
- [x] Confirm dialogs
- [x] Loading spinners
- [x] Empty states
- [x] Hover эффекты

---

## ⚠️ ВАЖНО — НЕ ДЕЛАТЬ

- ❌ НЕ устанавливать cornerstone-tools npm (конфликт с core 2.6)
- ❌ НЕ использовать display:none для логотипа на login (только opacity)
- ❌ НЕ хардкодить тексты — всегда translate pipe
- ❌ НЕ забывать ChangeDetectorRef + detectChanges() в subscribe
- ❌ НЕ создавать login.component.ts inline — отдельные .html и .scss
- ❌ НЕ менять порты 3000/4200
- ❌ НЕ использовать import { Response } from 'express' — только import type
- ❌ НЕ использовать import * as PDFDocument from 'pdfkit' — только const PDFDocument = require('pdfkit')

---

## 🔧 ТИПИЧНЫЕ КОМАНДЫ ОТЛАДКИ

```bash
# Получить токен админа
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@med.com","password":"password123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['accessToken'])")

# Проверить health
curl -s http://localhost:3000/api/health

# Проверить endpoint с токеном
curl -s http://localhost:3000/api/patients -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

# Перезапустить backend
kill -9 $(lsof -ti:3000) 2>/dev/null && cd backend && npm run start:dev

# Пересобрать frontend
cd frontend && npx ng build --configuration=development
```

---

## 📝 СТРУКТУРА ОТВЕТОВ API

Все ответы имеют формат:
```json
{
  "success": true,
  "data": { ... },
  "message": "..." // опционально
}
```

Ошибки:
```json
{
  "success": false,
  "requestId": "uuid",
  "error": {
    "code": 400,
    "message": "..."
  },
  "timestamp": "2026-..."
}
```

---

## 🎓 ДЛЯ ПРАКТИКИ (CUTM)

**Период:** 21.04.2026 – 12.06.2026 (8 недель, 300 часов)  
**Место:** Centrul de Diagnostic German (CDG), Chișinău  
**Темы:** Анализ, проектирование, разработка, тестирование, деплой
