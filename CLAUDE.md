# HIS-MedSystem — Project Brain

## Описание проекта
Hospital Information System — полноценная медицинская система для управления пациентами, приёмами, персоналом и отчётами.

## Структура проекта
- Backend: ./backend/ — NestJS + PostgreSQL 16 + TypeORM (порт 3000)
- Frontend: ./frontend/ — Angular 19 Standalone Components (порт 4200)
- GitHub: github.com/whyalohadance/HIS-MEDSYSTEM

## Как запустить
Terminal 1 — Backend: cd backend && npm run start:dev
Terminal 2 — Frontend: cd frontend && ng serve
База данных: pg_isready -h localhost -p 5432

## База данных
DB: medical_db | User: medical_user | Password: medical123
Host: localhost:5432 | JWT Secret: medical_super_secret_key_2024

## Тестовые аккаунты
Admin: admin@med.com / password123
Doctor: doctor@med.com / password123
Receptionist: reception@med.com / password123

## Роли и доступ
- admin — полный доступ ко всему
- doctor — свои пациенты, результаты, приёмы
- receptionist — пациенты, приёмы, кабинеты

## Технологии Backend
NestJS, TypeORM (synchronize: true), JWT + bcryptjs + Passport,
PDFKit (PDF отчёты), ExcelJS (Excel отчёты), Multer (загрузка файлов),
Mammoth (конвертация .docx в HTML), @nestjs/schedule (cron jobs)

## Технологии Frontend
Angular 19 Standalone Components, Chart.js (графики),
SCSS с CSS переменными, тёмная тема через class dark-theme на body,
Bottom navigation на мобильных до 768px

## Правила — ВСЕГДА делай
- После изменений frontend: npx ng build --configuration=development
- После изменений backend: npm run build
- Каждую задачу завершай git commit с понятным сообщением
- Используй существующие ApiService и AuthService
- Токен JWT в localStorage под ключом 'token'

## Правила — НИКОГДА не делай
- Не меняй порты (backend: 3000, frontend: 4200)
- Не удаляй существующие модули NestJS без причины
- Не меняй структуру БД напрямую — только через entities
- Не добавляй npm пакеты без необходимости

## Цветовая палитра
primary: #1a73e8 | dark: #0f2d52 | success: #34a853
danger: #ea4335 | warning: #f9ab00 | bg-light: #f4f6f9
bg-dark (тёмная тема): #0f172a | card-dark: #1e293b

## Breakpoints мобильная адаптация
xs: 0-480px — маленькие телефоны
sm: 480-768px — телефоны (bottom nav вместо sidebar)
md: 768-1024px — планшеты
lg: 1024-1440px — ноутбуки
xl: 1440px+ — десктопы

## Частые проблемы и решения
Порт занят: kill -9 $(lsof -ti:3000) или kill -9 $(lsof -ti:4200)
Enum ошибка PostgreSQL: ALTER TYPE users_role_enum OWNER TO medical_user;
CORS uploads: файлы доступны без токена по http://localhost:3000/uploads/filename

## Модули Backend
- auth — JWT login/register
- users — CRUD пользователей, /users/doctors
- patients — CRUD пациентов
- appointments — приёмы + cron автозавершение 35 мин
- results — результаты + mammoth preview + upload
- rooms — кабинеты + /rooms/available
- notifications — уведомления + cron за 2 часа
- reports — PDF + Excel + cron 1го числа
- schedules — расписание врачей
- examinations — типы обследований
- upload — multer загрузка файлов

## Страницы Frontend
- /auth/login — вход с анимацией (на мобильных без анимации)
- /dashboard — Chart.js графики + очередь на сегодня
- /patients — список + поиск + пагинация (10 на страницу)
- /patients/:id — карточка пациента + история + результаты + mammoth просмотр
- /appointments — фильтры + autocomplete поиск пациента + цена MDL
- /staff — персонал + статус в реальном времени (зелёный/жёлтый)
- /rooms — кабинеты + доступность по дате/времени (только admin)
- /results — результаты + upload файлов
- /reports — PDF/Excel отчёты + сводка (только admin)
- /notifications — уведомления
- /profile — профиль пользователя
- /schedules — расписание (только admin)
- /examinations — обследования (только admin)

## Мобильная версия
На экранах до 768px:
- Sidebar скрыт, вместо него Bottom Navigation Bar внизу экрана
- 5 вкладок: Главная, Пациенты, Приёмы, Уведомления, Профиль
- Все формы в одну колонку
- Статистика 2x2 грид
- Минимальная высота кнопок 48px
- font-size для input: 16px (предотвращает zoom на iOS)
- Safe area для iPhone notch: env(safe-area-inset-bottom)

## Стиль работы Claude Code
- Будь краток — только необходимый код без объяснений
- Не спрашивай подтверждения на мелкие правки — просто делай
- После каждого изменения сразу проверяй билд
- Используй && для цепочки команд
- Если задача ясна — выполняй немедленно
- Всегда завершай задачу git commit && git push
- При ошибке — сам диагностируй и исправляй без вопросов

## Приоритеты при разработке
1. Сначала backend (проверь npm run build)
2. Потом frontend (проверь ng build)
3. Потом git commit && git push

## Быстрые команды
- Перезапуск backend: kill -9 $(lsof -ti:3000) && cd backend && npm run start:dev
- Перезапуск frontend: kill -9 $(lsof -ti:4200) && cd frontend && ng serve
- Проверка БД: psql postgresql://medical_user:medical123@localhost:5432/medical_db -c "SELECT NOW();"
