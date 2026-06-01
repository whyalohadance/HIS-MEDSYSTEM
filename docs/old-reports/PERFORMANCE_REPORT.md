# ⚡ Performance Test Report

> Puppeteer headless Chromium + axios — API timing + frontend load metrics

**Запуск:** 2026-05-14  
**Инструмент:** `tests/e2e/performance-test.js`

---

## 📊 ОБЩАЯ СТАТИСТИКА

| Метрика | Значение | Статус |
|---------|----------|--------|
| API endpoints | 10 | 🟢 OK |
| Frontend pages | 9 | 🟢 OK |
| Рекомендаций | 0 | 🟢 Отлично |
| **Оценка** | **Отлично** | 🟢 |

---

## 📦 BUNDLE SIZE

| Type | Size | Files |
|------|------|-------|
| JavaScript | 470 KB | 14 |
| CSS | 55 KB | 1 |
| **TOTAL** | **525 KB** | **15** |

### Топ-3 по размеру

| Файл | Размер | Тип |
|------|--------|-----|
| `chunk-IXZBVNGN.js` | 204 KB | JS |
| `main-3FHH6CJL.js` | 111 KB | JS |
| `chunk-R2MEBPQ2.js` | 74 KB | JS |

> ✅ 525 KB total — в пределах нормы для Angular 19 с Chart.js, Cornerstone.js, ngx-translate и Material Icons (рекомендуемый порог < 2 MB).

---

## 📡 API RESPONSE TIMES

> Среднее по 5 запросам, без авторизационного overhead

| Endpoint | Avg | Min | Max | Статус |
|----------|-----|-----|-----|--------|
| `GET /patients` | 3ms | 3ms | 4ms | 🟢 Fast |
| `GET /appointments` | 5ms | 4ms | 6ms | 🟢 Fast |
| `GET /rooms` | 3ms | 2ms | 3ms | 🟢 Fast |
| `GET /users` | 2ms | 2ms | 3ms | 🟢 Fast |
| `GET /studies` | 3ms | 3ms | 5ms | 🟢 Fast |
| `GET /lab/tests` | 3ms | 2ms | 4ms | 🟢 Fast |
| `GET /lab/orders` | 3ms | 3ms | 3ms | 🟢 Fast |
| `GET /notifications` | 3ms | 3ms | 4ms | 🟢 Fast |
| `GET /reports/summary` | 7ms | 6ms | 8ms | 🟢 Fast |
| `GET /health` | 1ms | 0ms | 1ms | 🟢 Fast |

> ✅ Все эндпоинты < 10ms — отличное время ответа. TypeORM с PostgreSQL через Docker localhost работает очень быстро.

---

## 🎨 FRONTEND LOAD TIMES

> `networkidle2` — все сетевые запросы завершены

| Страница | Load | FCP | DOMContentLoaded | Статус |
|---------|------|-----|-----------------|--------|
| `/dashboard` | 580ms | 0ms | — | 🟢 Fast |
| `/patients` | 569ms | 0ms | — | 🟢 Fast |
| `/appointments` | 574ms | 0ms | — | 🟢 Fast |
| `/rooms` | 581ms | 0ms | — | 🟢 Fast |
| `/staff` | 565ms | 0ms | — | 🟢 Fast |
| `/lab-catalog` | 891ms | 52ms | — | 🟢 Fast |
| `/reports` | 571ms | 0ms | — | 🟢 Fast |
| `/notifications` | 562ms | 0ms | — | 🟢 Fast |
| `/profile` | 577ms | 0ms | — | 🟢 Fast |

> ✅ Все страницы < 1 секунды. Angular SPA — последующие навигации быстрее первой загрузки (cached bundles).  
> `/lab-catalog` — чуть медленнее (891ms) из-за загрузки каталога тестов.

---

## ✅ ВСЁ В НОРМЕ

Никаких проблем с производительностью не обнаружено.

**Пороговые значения:**
- 🟢 Fast: API < 100ms, Pages < 1500ms
- 🟡 OK: API 100-300ms, Pages 1500-3000ms
- 🔴 Slow: API > 500ms, Pages > 3000ms

---
_Автоматически сгенерировано — 2026-05-14_
