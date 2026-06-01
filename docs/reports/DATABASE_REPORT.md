# 💾 Database Integrity Report

> PostgreSQL 16 — проверка целостности связей, индексов, orphan записей, качества данных

**Запуск:** 2026-05-14  
**Инструмент:** `tests/database/db-integrity-test.sh`  
**База:** `medical_db` (PostgreSQL 16-alpine, Docker container `his_postgres`)

---

## 📊 Сводка

| Метрика | Значение | Статус |
|---------|----------|--------|
| Таблиц | 18 | 🟢 OK |
| Foreign Keys | 3 | 🟡 Частичное покрытие |
| Индексов (до фикса) | 27 | 🟡 8 ключевых отсутствовали |
| Индексов (после фикса) | 40 | 🟢 OK |
| Orphan записей (до фикса) | 2 | 🔴 Найдено |
| Orphan записей (после фикса) | 0 | 🟢 OK |
| Дублирующихся email | 0 | 🟢 OK |
| ENUM типов | 14 | 🟢 OK |
| CHECK constraints | 118 | 🟢 OK |

---

## 🗄️ Таблицы и количество записей

| Таблица | Записей | Размер | Назначение |
|---------|---------|--------|------------|
| `appointments` | 25 | 32 KB | Приёмы пациентов |
| `patients` | 11 | 32 KB | Пациенты |
| `users` | 5 | 48 KB | Пользователи (5 ролей) |
| `studies` | 11 | 48 KB | RIS исследования |
| `lab_orders` | 11 | 48 KB | LIS заказы анализов |
| `lab_tests` | 14 | 48 KB | Каталог анализов |
| `lab_results` | 0 | — | Результаты анализов |
| `notifications` | 5 | 80 KB | Уведомления |
| `rooms` | 4 | 32 KB | Кабинеты |
| `annotations` | 0 | — | DICOM аннотации |
| `dicom_images` | 0 | — | DICOM изображения |
| `examinations` | 0 | — | Осмотры |
| `measurements` | 0 | — | DICOM измерения |
| `modalities` | 0 | — | Модальности RIS |
| `results` | 0 | — | Результаты |
| `reviews` | 0 | — | Заключения |
| `schedules` | 0 | — | Расписание |
| `series` | 0 | — | DICOM серии |

---

## 🔗 Foreign Keys

Найдено 3 FK-ограничения (TypeORM с `synchronize: true` создаёт FK только для явных `@ManyToOne`):

| Откуда | Куда | ON DELETE | ON UPDATE |
|--------|------|-----------|-----------|
| `appointments.patientId` | `patients.id` | NO ACTION | NO ACTION |
| `appointments.doctorId` | `users.id` | NO ACTION | NO ACTION |
| `patients.doctorId` | `users.id` | NO ACTION | NO ACTION |

> ⚠️ Связи `lab_orders→patients`, `studies→patients`, `notifications→users`, `lab_results→lab_orders` не имеют DB-уровня FK.  
> Целостность для этих связей обеспечивается только на уровне приложения (TypeORM + NestJS).

---

## 📑 ENUM Типы

14 PostgreSQL ENUM типов обеспечивают строгую типизацию:

| ENUM | Значения |
|------|---------|
| `appointments_status_enum` | scheduled, in_progress, completed, cancelled |
| `lab_orders_priority_enum` | routine, urgent, stat |
| `lab_orders_status_enum` | pending, in_progress, completed, cancelled |
| `lab_results_flag_enum` | normal, low, high, critical_low, critical_high |
| `lab_tests_category_enum` | hematology, biochemistry, urine, hormones, immunology, microbiology, coagulation, cardiac |
| `measurements_type_enum` | length, angle, ellipse, annotation |
| `modalities_type_enum` | mri, ct, xray, ultrasound, pet, mammography |
| `notifications_priority_enum` | low, normal, high, critical |
| `notifications_type_enum` | appointment_reminder, lab_result_ready, lab_critical, study_report_ready, monthly_report, system |
| `rooms_type_enum` | consultation, radiology, laboratory, procedure, surgery |
| `studies_priority_enum` | routine, urgent, stat |
| `studies_status_enum` | pending, scheduled, in_progress, completed, cancelled |
| `studies_type_enum` | mri, ct, xray, ultrasound, pet, mammography |
| `users_role_enum` | admin, doctor, patient, receptionist, radiologist, lab_technician |

---

## 📊 Индексы — После оптимизации

### Добавленные индексы (миграция `1747224000000-AddPerformanceIndexes.ts`)

| Индекс | Таблица | Колонка | Зачем |
|--------|---------|---------|-------|
| `idx_appointments_date` | appointments | date | Фильтрация по дате в расписании |
| `idx_appointments_patientId` | appointments | patientId | JOIN с patients, history |
| `idx_appointments_doctorId` | appointments | doctorId | Расписание доктора |
| `idx_appointments_status` | appointments | status | Фильтр completed/scheduled |
| `idx_studies_patientId` | studies | patientId | RIS история пациента |
| `idx_studies_status` | studies | status | RIS worklist фильтр |
| `idx_studies_type` | studies | type | Фильтр по модальности |
| `idx_lab_orders_patientId` | lab_orders | patientId | LIS история пациента |
| `idx_lab_orders_status` | lab_orders | status | LIS worklist фильтр |
| `idx_lab_orders_priority` | lab_orders | priority | Сортировка STAT/urgent |
| `idx_users_role` | users | role | RoleGuard, дашборды по роли |
| `idx_notifications_userId` | notifications | userId | Уведомления пользователя |
| `idx_notifications_isRead` | notifications | isRead | Счётчик непрочитанных |

### Уже существовавшие индексы (27 → 40 итого)

- PK индексы на всех 18 таблицах
- `UQ_97672ac88f789774dd47f7c8be3` — `users.email` (UNIQUE)
- `UQ_3bed40012bc1f5da8608ad8b87d` — `lab_orders.orderNumber` (UNIQUE)
- `UQ_e0a0642e9736dd46997306a6079` — `studies.studyInstanceUID` (UNIQUE)
- `UQ_26ffad4a105868c4a2870f9f314` — `series.seriesInstanceUID` (UNIQUE)
- `UQ_e9f1555fa24d052dd044f6b718c` — `dicom_images.sopInstanceUID` (UNIQUE)
- `UQ_b7756de508bcd61121c5aa28b56` — `lab_tests.code` (UNIQUE)
- `IDX_*` × 3 — `notifications` (составные индексы)

---

## 🚨 Найденные проблемы и исправления

### ❌ Проблема 1: Orphan lab_orders (ИСПРАВЛЕНО)

**Описание:** 2 записи в `lab_orders` ссылались на несуществующих пациентов (id 27, 29).  
**Причина:** Тестовые данные из API-тестов — пациенты были созданы и удалены, заказы остались.  
**Исправление:** `DELETE FROM lab_orders WHERE id IN (12, 13)` — записи удалены.

```
До:  lab_orders без пациентов = 2  ❌
После: lab_orders без пациентов = 0  ✅
```

---

### ⚠️ Проблема 2: Отсутствие performance-индексов (ИСПРАВЛЕНО)

**Описание:** 8 из 9 ключевых индексов отсутствовали.  
**Причина:** TypeORM `synchronize: true` создаёт только PK и UNIQUE индексы, но не индексы для FK-колонок и часто используемых фильтров без явного `@Index()` декоратора.  
**Исправление:** Создана миграция + применены 13 индексов напрямую через SQL.

```
До:  27 индексов, 8 ключевых отсутствуют  ⚠️
После: 40 индексов, все ключевые покрыты  ✅
```

---

### ⚠️ Проблема 3: Частичное покрытие FK (НЕ КРИТИЧНО)

**Описание:** Только 3 из ~10 логических связей имеют DB-уровень FK.  
**Отсутствуют FK для:** `lab_orders.patientId`, `lab_orders.testId`, `studies.patientId`, `notifications.userId`, `lab_results.orderId`.  
**Причина:** TypeORM не всегда генерирует FK при `synchronize: true` для optional/nullable relations.  
**Рекомендация:** Добавить `@ManyToOne(() => Patient, { onDelete: 'CASCADE' })` с явным указанием.

---

### ⚠️ Проблема 4: NO ACTION каскады (НЕ КРИТИЧНО)

**Описание:** Все 3 существующих FK имеют `ON DELETE NO ACTION`.  
**Риск:** Удаление пациента без удаления связанных appointments вызовет ошибку FK нарушения.  
**Рекомендация:** Рассмотреть `ON DELETE CASCADE` или `ON DELETE SET NULL` для `appointments.patientId`.

---

## ✅ Качество данных

| Проверка | Результат | Статус |
|----------|-----------|--------|
| Пациенты без email | 0 | 🟢 |
| Пациенты без даты рождения | 0 | 🟢 |
| Активных пользователей | 5 / 5 | 🟢 |
| Деактивированных пользователей | 0 | 🟢 |
| Дубликаты email в users | 0 | 🟢 |
| Дубликаты email в patients | 0 | 🟢 |
| Дублирующиеся приёмы | 0 | 🟢 |

### Распределение приёмов по статусам

| Статус | Количество |
|--------|-----------|
| completed | 24 |
| scheduled | 1 |

### Распределение ролей

| Роль | Количество |
|------|-----------|
| admin | 1 |
| doctor | 1 |
| radiologist | 1 |
| lab_technician | 1 |
| receptionist | 1 |

### Lab orders

| Статус | Количество |
|--------|-----------|
| pending | 9 |
| in_progress | 2 |

### Уведомления

- Всего: 5
- Непрочитанных: 4

---

## 🎯 Рекомендации

| Приоритет | Рекомендация | Действие |
|-----------|-------------|---------|
| 🟢 Выполнено | Очистить orphan lab_orders | DELETE — сделано |
| 🟢 Выполнено | Добавить performance-индексы | 13 индексов — сделано |
| 🟡 Средний | Добавить FK для lab_orders.patientId | `@ManyToOne` с `onDelete: 'CASCADE'` в TypeORM |
| 🟡 Средний | Добавить FK для studies.patientId | Аналогично |
| 🟡 Средний | Cascade DELETE для appointments.patientId | Изменить NO ACTION → CASCADE |
| 🟡 Средний | Добавить `@Index()` декораторы в TypeORM entities | Для автоматического создания при пересборке |
| 🔵 Низкий | Добавить `@Index()` для `notifications.userId` | Уже добавлен через SQL, нужно в entity |

---

## 📈 Последняя активность

| Таблица | Последняя запись |
|---------|-----------------|
| lab_orders | 2026-05-13 14:31 |
| appointments | 2026-05-13 09:09 |
| studies | 2026-05-09 11:49 |
| patients | 2026-05-08 09:30 |

---

_Автоматически сгенерировано — 2026-05-14_
