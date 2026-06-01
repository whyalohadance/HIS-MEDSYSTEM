# 🧪 Smoke Test Report

**Запуск:** 2026-05-20T10:07:36.851Z
**Завершён:** 2026-05-20T10:07:37.471Z

## 📊 Сводка

| Метрика | Значение |
|---------|----------|
| Всего тестов | 44 |
| ✅ Прошло | 44 |
| ❌ Провалилось | 0 |
| Pass rate | 100% |

## ADMIN (13/13)

| Test | Status |
|------|--------|
| Login | ✅ |
| GET /health | ✅ |
| GET /patients | ✅ |
| GET /appointments | ✅ |
| GET /rooms | ✅ |
| GET /users | ✅ |
| GET /studies | ✅ |
| GET /lab/tests | ✅ |
| GET /lab/orders | ✅ |
| GET /reports/stats | ✅ |
| GET /tutorials/list | ✅ |
| GET /tutorials/progress | ✅ |
| POST /tutorials/complete/system-overview | ✅ |

## DOCTOR (8/8)

| Test | Status |
|------|--------|
| Login | ✅ |
| GET /health | ✅ |
| GET /patients | ✅ |
| GET /appointments | ✅ |
| GET /tutorials/list | ✅ |
| GET /tutorials/progress | ✅ |
| Forbidden: /users | ✅ |
| POST /tutorials/complete/system-overview | ✅ |

## RECEPTION (8/8)

| Test | Status |
|------|--------|
| Login | ✅ |
| GET /health | ✅ |
| GET /patients | ✅ |
| GET /appointments | ✅ |
| GET /tutorials/list | ✅ |
| GET /tutorials/progress | ✅ |
| Forbidden: /users | ✅ |
| POST /tutorials/complete/system-overview | ✅ |

## RADIOLOG (7/7)

| Test | Status |
|------|--------|
| Login | ✅ |
| GET /health | ✅ |
| GET /studies | ✅ |
| GET /tutorials/list | ✅ |
| GET /tutorials/progress | ✅ |
| Forbidden: /users | ✅ |
| POST /tutorials/complete/system-overview | ✅ |

## LAB (8/8)

| Test | Status |
|------|--------|
| Login | ✅ |
| GET /health | ✅ |
| GET /lab/orders | ✅ |
| GET /lab/tests | ✅ |
| GET /tutorials/list | ✅ |
| GET /tutorials/progress | ✅ |
| Forbidden: /users | ✅ |
| POST /tutorials/complete/system-overview | ✅ |

