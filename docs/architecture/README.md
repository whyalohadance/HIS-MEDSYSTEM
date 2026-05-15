# Architecture

> Form follows function. Performance is non-negotiable.

---

## System Overview

HIS-MedSystem is a three-tier web application optimized for hospital workflows.

```
┌──────────────────────────────────────────────────────┐
│  Presentation Tier                                    │
│  Angular 19 SPA with SSR-ready architecture          │
│  Port 80 (Nginx reverse proxy)                       │
└──────────────────┬───────────────────────────────────┘
                   │ REST / JSON
┌──────────────────┴───────────────────────────────────┐
│  Application Tier                                     │
│  NestJS 10 modular API                               │
│  Port 3000 (internal)                                │
│  JWT auth, RBAC, validation, rate limiting           │
└──────────────────┬───────────────────────────────────┘
                   │ TypeORM
┌──────────────────┴───────────────────────────────────┐
│  Data Tier                                            │
│  PostgreSQL 16-alpine                                │
│  Port 5432 (internal)                                │
│  18 tables, 40 indexes, 14 enum types                │
└───────────────────────────────────────────────────────┘
```

---

## Core Design Principles

### Modularity
Each business domain is a separate NestJS module with its own controllers, services, entities, and DTOs.

### Type Safety
Full TypeScript across stack. Strict mode enabled. Zero `any` types in business logic.

### Security First
- Every endpoint authenticated by default
- Role guards mandatory for protected routes
- All inputs validated via class-validator DTOs
- No direct SQL — everything through TypeORM

### Performance
- Database indexes on all foreign keys and search columns
- Lazy-loaded routes in Angular
- Gzip compression in Nginx
- Connection pooling in TypeORM

---

## Module Structure

### Backend Modules

```
src/modules/
├── auth/              JWT authentication, login, refresh
├── users/             Staff management, RBAC
├── patients/          Patient records and medical history
├── appointments/      Booking, scheduling, conflict resolution
├── rooms/             Cabinets with services and pricing
├── studies/           RIS — radiology investigations
├── lab/               LIS — laboratory orders and tests
├── reports/           Analytics and reporting
└── notifications/     Real-time alerts and reminders
```

### Frontend Features

```
src/app/features/
├── auth/              Login, password recovery
├── dashboard/         Role-specific dashboards
├── patients/          Patient list and detailed cards
├── appointments/      Calendar and creation flow
├── rooms/             Cabinet management
├── staff/             Team overview and KPIs
├── profile/           User profile (admin control center)
├── ris-dashboard/     Radiology home
├── worklist/          RIS worklist
├── studies/           Studies list
├── dicom-viewer/      DICOM image viewer
├── lab-dashboard/     Lab home
├── lab-worklist/      Lab worklist
├── lab-orders/        Lab orders management
├── lab-catalog/       Test catalog with parameters
└── reports/           Analytics and charts
```

---

## Data Flow Example: Booking Radiology

```
Reception                Backend                  Database
   │                        │                        │
   │  POST /appointments    │                        │
   │  (roomType: radiology) │                        │
   ├───────────────────────►│                        │
   │                        │  INSERT appointment    │
   │                        ├───────────────────────►│
   │                        │                        │
   │                        │  Trigger: auto-create  │
   │                        │  Study from appointment│
   │                        ├───────────────────────►│
   │                        │                        │
   │                        │  Notify: radiologist   │
   │                        │  (in-app + cron)       │
   │                        ├──────────────►         │
   │                        │                        │
   │  201 Created + ids     │                        │
   │◄───────────────────────┤                        │
```

---

## Security Architecture

### Authentication Flow

1. Client sends credentials to `POST /api/auth/login`
2. Server validates against bcrypt-hashed password
3. JWT signed with HS256, 24h expiration
4. Client stores token, sends as `Authorization: Bearer <token>`
5. `JwtAuthGuard` validates on every protected request
6. `RolesGuard` enforces RBAC after authentication

### Role Hierarchy

```
admin            — Full system access
  ├─ doctor      — Patients, own appointments, lab orders
  ├─ reception   — Booking, patient registration, reports
  ├─ radiologist — Studies, DICOM viewer, reports
  └─ lab_technician — Lab orders, results entry, catalog
```

---

## Infrastructure

### Docker Compose Services

| Service | Image | Port |
|---------|-------|------|
| frontend | nginx:alpine | 80 |
| backend | node:20-alpine | 3000 (internal) |
| postgres | postgres:16-alpine | 5432 (internal) |

### Nginx Configuration
- Reverse proxy to backend at `/api/*`
- Serve Angular SPA at all other routes
- Gzip compression enabled
- Static file caching headers

### Health Checks
All services have configured health checks with restart policies. Backend checks `GET /api/health`, database checks `pg_isready`.
