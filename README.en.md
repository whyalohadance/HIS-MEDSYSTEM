<div align="center">

<img src="https://img.shields.io/badge/HIS-MedSystem-D5001C?style=for-the-badge&labelColor=000000" alt="HIS-MedSystem"/>

# HIS-MedSystem

**Hospital Information System** — Integrated Radiology and Laboratory Modules

*Engineered for Healthcare. Built for Performance.*

---

**Language**: [🇷🇴 Română](README.md) · 🇬🇧 English · [🇷🇺 Русский](README.ru.md)

[![Version](https://img.shields.io/badge/Version-v3.0.1-D5001C?style=flat-square&labelColor=000000)]()
[![Security](https://img.shields.io/badge/Security-Hardened-D5001C?style=flat-square&labelColor=000000)]()
[![Compliance](https://img.shields.io/badge/HIPAA%2FGDPR-Compliant-D5001C?style=flat-square&labelColor=000000)]()
[![License](https://img.shields.io/badge/License-Academic-D5001C?style=flat-square&labelColor=000000)]()

[**Quick Start**](#quick-start) · [**Documentation**](docs/) · [**Architecture**](docs/architecture/) · [**API**](docs/API.md) · [**Deployment**](docs/DEPLOYMENT.md)

</div>

---

## About the project

HIS-MedSystem is a comprehensive Hospital Information System developed as a graduation project at the Technical University College of Moldova (CUTM), Web Applications Administration specialty. The system integrates three critical medical modules into a unified, secure, and performant solution.

**Author:** Ceban Devid · **Group:** AAW-221 · **Year:** 2026

---

## Integrated modules

| Module | Features | Status |
|--------|----------|--------|
| **HIS** | Patients, appointments, medical records, reports | Production |
| **RIS** | DICOM viewer, studies, radiologist worklist | Production |
| **LIS** | Lab catalog, orders, results with auto-flag detection | Production |
| **Setup Wizard** | Initial clinic configuration, Mac-style intro | Production |
| **System Health** | Real-time monitoring (DB, disk, RAM, uptime) | Production |
| **Audit Log** | Automatic HIPAA/GDPR-compliant activity log | Production |
| **Backup Management** | Database backups with UI-based restore | Production |

---

## Security

Implemented according to industry standards for medical applications:

- **Rate Limiting** — 5 login attempts/minute, 100 req/min global (Throttler)
- **Account Lockout** — Automatic block after 5 failed attempts (15 minutes)
- **Lockout Overlay** — Full-screen countdown timer on block
- **Password Hardening** — Bcrypt cost 12, regex complexity validation
- **JWT + RBAC** — 5 roles (admin, doctor, receptionist, radiologist, lab_technician)
- **Helmet** — Security headers (X-Frame-Options, CSP, HSTS)
- **CORS Whitelist** — Configurable via .env
- **User Enumeration Protection** — Generic messages on failed login
- **Audit Trail** — All CRUD actions logged automatically
- **Restore Confirmation** — DB restore requires typing "RESTORE"

---

## Performance

Measured with Google Lighthouse and internal benchmarks:

| Category | Score |
|----------|-------|
| Performance | **91 / 100** |
| Accessibility | **94 / 100** |
| Best Practices | **97 / 100** |
| SEO | **100 / 100** |

**API Response**: 1–7ms · **Frontend Bundle**: 525 KB · **FCP**: < 600ms · **DB Indexes**: 43 optimized

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Angular 19 Frontend (Standalone Components · i18n RO/RU/EN) │
│  Setup Wizard · System Health · Audit · Backup · DICOM Viewer│
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTPS / REST + JWT
┌─────────────────────────┴───────────────────────────────────┐
│  NestJS 10 API                                               │
│  20 Modules · Global Interceptors (Audit, Validation)        │
│  Throttler · Helmet · Rate Limiting · RBAC Guards            │
└─────────────────────────┬───────────────────────────────────┘
                          │
              ┌───────────┴───────────┐
              │                       │
       ┌──────┴──────┐         ┌──────┴──────┐
       │ PostgreSQL  │         │   Backups   │
       │     16      │◀────────│  pg_dump    │
       │ 21 tables   │         │   gzip      │
       │ 43 indexes  │         │  /backups/  │
       └─────────────┘         └─────────────┘
```

---

## Technology stack

**Frontend**
- Angular 19 (Standalone Components, signals)
- TypeScript 5.3
- Chart.js 4 (analytics, dashboards)
- Cornerstone.js (DICOM viewer)
- ngx-translate (i18n three languages)
- Material Icons

**Backend**
- NestJS 10 (20 modules)
- TypeORM 0.3
- @nestjs/terminus (health checks)
- @nestjs/throttler (rate limiting)
- helmet (security headers)
- JWT + Passport.js
- bcryptjs (cost 12)
- class-validator

**Database**
- PostgreSQL 16-alpine
- 21 tables, 43 indexes, JSONB for audit changes
- ENUM types for type safety
- Timestamp types for audit trail

**Infrastructure**
- Docker Compose (3 containers)
- Nginx (reverse proxy, gzip, security headers)
- pg_dump + gzip for backups

---

## Quick start

```bash
# 1. Clone
git clone https://github.com/whyalohadance/HIS-MEDSYSTEM.git
cd HIS-MEDSYSTEM

# 2. Configure .env
cp .env.example .env

# 3. Start (production mode)
docker-compose up -d

# 4. Open in browser (after ~60 seconds)
open http://localhost
```

On first run the **Setup Wizard** appears with Mac-style animation — complete 7 steps to configure the clinic and create the administrator account.

For full server deployment (Ubuntu/Cloudflare/HTTPS), see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

---

## Development mode

Hot-reload — changes appear instantly without rebuild:

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

| Service | URL | Hot-reload |
|---------|-----|-----------|
| Frontend (ng serve) | http://localhost:4200 | Any change in `frontend/src/` |
| Backend (NestJS watch) | http://localhost:3000 | Any change in `backend/src/` |
| Swagger | http://localhost:3000/api/docs | — |

---

## Roles and permissions

| Role | Key features |
|------|-------------|
| **admin** | Full access · System Health · Audit Log · Backup · Staff · Configuration |
| **doctor** | Patients · Appointments · Medical records · My cabinet |
| **receptionist** | Appointments · Patients · Registration |
| **radiologist** | DICOM studies · Worklist · Radiology report |
| **lab_technician** | Lab orders · Worklist · Test catalog · Results |

### Demo accounts (password: `password123`)

| Email | Role |
|-------|------|
| admin@med.com | Administrator |
| doctor@med.com | Doctor |
| reception@med.com | Receptionist |
| radiolog@med.com | Radiologist |
| lab@med.com | Lab Technician |

---

## Administrative features

### System Health Dashboard

Real-time monitoring with 30-second auto-refresh:

- Backend API and PostgreSQL status (with ping time)
- Disk usage (progress bar + alerts)
- RAM heap memory (250 MB limit)
- Application uptime
- Database counters (patients, appointments, users, studies)
- Expandable error cards with possible causes

### Audit Log

Automatic logging compliant with HIPAA/GDPR Article 30:

- All CRUD actions (POST/PUT/PATCH/DELETE) auto-logged via global Interceptor
- Skip for internal endpoints (/health, /audit, /auth/refresh)
- Filters: user, action, resource, date range
- CSV export with UTF-8 BOM
- 30s auto-refresh (toggleable)
- DB indexing for fast queries

### Backup Management

- One-click backup creation (pg_dump | gzip)
- Backup list with metadata (size, date)
- Direct download via UI
- Restore with "RESTORE" text confirmation
- Auto-cleanup when exceeding 1 GB
- All operations audit-logged
- Storage in persistent Docker volume

---

## Useful commands

```bash
make up               # Start all containers (production)
make down             # Stop containers
make hot              # Start hot-reload dev mode
make logs             # View logs
make seed-demo        # Load demonstration data
make test             # Run full test suite
make backup           # Backup database
make restore          # Restore database
make clean            # Remove containers and volumes
```

---

## Project structure

```
HIS-MEDSYSTEM/
├── backend/                    NestJS 10 API
│   └── src/modules/            20 modules (auth, patients, audit, backup, health...)
├── frontend/                   Angular 19 SPA
│   └── src/app/
│       ├── features/           35 features (HIS, RIS, LIS, admin)
│       ├── shared/             Reusable components
│       └── core/               Services, guards, models
├── docs/                       Documentation
│   ├── API.md
│   ├── DEPLOYMENT.md           Complete deployment guide
│   ├── DOCKER.md
│   ├── architecture/           UML diagrams
│   └── reports/                Testing reports
├── scripts/                    Init DB, seeds
├── tests/                      API, E2E, security, smoke
├── backups/                    Volume for backups
├── docker-compose.yml          Production
├── docker-compose.dev.yml      Development hot-reload
└── .github/workflows/          CI/CD
```

---

## Documentation

- [Detailed installation](docs/INSTALLATION.md)
- [Server deployment](docs/DEPLOYMENT.md) — Ubuntu, HTTPS, Cloudflare
- [Architecture](docs/architecture/) — UML, ER, flow diagrams
- [API Reference](docs/API.md)
- [Docker](docs/DOCKER.md)
- [Testing](docs/TESTING.md)
- [Test reports](docs/reports/)

---

## Compliance

| Standard | Implementation |
|----------|---------------|
| **HIPAA** | Complete audit trail, access control, encryption |
| **GDPR Article 30** | Records of processing activities (audit logs) |
| **OWASP Top 10** | Protection against injection, broken auth, XSS, etc. |
| **ISO 27001** | Information security best practices |

---

## Status

**Implemented (v3.0.1):**

- HIS core (patients, appointments, medical records)
- RIS with DICOM viewer (Cornerstone.js)
- LIS with test catalog and auto-flag detection
- Setup Wizard with Mac-style intro (12 languages, infinite carousel)
- Security hardening (rate limit, lockout, helmet, CORS)
- System Health Dashboard (real-time, auto-refresh)
- Audit Log compliant with HIPAA/GDPR
- Backup Management with confirmed restore
- i18n three languages (RO/RU/EN)
- Dev mode with hot-reload and proxy config

**Planned (post-defense):**

- WebSocket alerts for critical events
- 24h metrics history with charts
- Lockout escalation (exponential backoff)
- Native mobile app (Capacitor)
- Billing module and CAS integration

---

## Academic context

**Author:** Ceban Devid  
**Institution:** Technical University College of Moldova (CUTM)  
**Specialty:** Web Applications Administration (AAW)  
**Group:** AAW-221  
**Academic year:** 2025–2026  
**Internship:** German Diagnostic Center (CDG), Chișinău  
**Period:** 21.04.2026 – 12.06.2026  
**GitHub:** [@whyalohadance](https://github.com/whyalohadance)

---

## License

Academic project developed as part of the graduation thesis. All rights reserved © 2026 Ceban Devid.

---

<div align="center">

Built with precision. Tested with rigor.

*If everything seems under control, you're not going fast enough. — Mario Andretti*

</div>
