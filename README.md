<div align="center">

<img src="https://img.shields.io/badge/HIS-MedSystem-D5001C?style=for-the-badge&labelColor=000000" alt="HIS-MedSystem"/>

# HIS-MedSystem

**Hospital Information System** — Radiology and Laboratory Modules Integrated

*Engineered for Healthcare. Built for Performance.*

---

[![Lighthouse Score](https://img.shields.io/badge/Lighthouse-95.5%2F100-D5001C?style=flat-square&labelColor=000000)]()
[![Tests](https://img.shields.io/badge/Tests-272%20Passing-D5001C?style=flat-square&labelColor=000000)]()
[![Coverage](https://img.shields.io/badge/Coverage-Production%20Ready-D5001C?style=flat-square&labelColor=000000)]()
[![License](https://img.shields.io/badge/License-Academic-D5001C?style=flat-square&labelColor=000000)]()

[**Live Demo**](#getting-started) · [**Documentation**](docs/) · [**Architecture**](docs/architecture/) · [**API**](docs/API.md)

</div>

---

## Overview

HIS-MedSystem is a comprehensive Hospital Information System designed for modern medical facilities. The platform integrates three critical healthcare modules into a unified, secure, and performant solution.

| Module | Purpose | Status |
|--------|---------|--------|
| **HIS** | Hospital workflow management, appointments, patient records | Production |
| **RIS** | Radiology Information System with DICOM viewer | Production |
| **LIS** | Laboratory Information System with auto-flag detection | Production |

---

## Performance

Engineered to industrial standards. Measured by Google Lighthouse and custom benchmarks.

| Category | Score |
|----------|-------|
| Performance | **91 / 100** |
| Accessibility | **94 / 100** |
| Best Practices | **97 / 100** |
| SEO | **100 / 100** |

**API Response Time**: 1–7ms (average)  
**Frontend Bundle**: 525 KB  
**First Contentful Paint**: < 600ms  
**Database Indexes**: 40 optimized

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Angular 19 Frontend                                         │
│  SSR · Lazy Loading · i18n (RU/RO/EN)                       │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTPS / REST
┌─────────────────────────┴───────────────────────────────────┐
│  NestJS 10 Backend API                                       │
│  JWT Auth · RBAC · Validation · Rate Limiting               │
└─────────────────────────┬───────────────────────────────────┘
                          │
               ┌──────────┴──────────┐
               │                     │
        ┌──────┴──────┐     ┌────────┴───────┐
        │ PostgreSQL  │     │   Cron Jobs    │
        │     16      │     │   Schedulers   │
        └─────────────┘     └────────────────┘
```

---

## Technology Stack

**Frontend**
- Angular 19 (Standalone Components)
- TypeScript 5.3
- Chart.js 4 (Analytics)
- Cornerstone.js (DICOM Viewer)
- ngx-translate (i18n)

**Backend**
- NestJS 10
- TypeORM 0.3
- JWT (Passport.js)
- bcryptjs (Password hashing)
- class-validator (DTO validation)

**Database**
- PostgreSQL 16-alpine
- 18 tables, 40 indexes
- ENUM types for type safety

**Infrastructure**
- Docker Compose
- Nginx (reverse proxy, gzip)
- Health checks
- Auto-restart policies

---

## Features

### Patient Management
- Complete medical records with history
- Appointment scheduling with conflict detection
- Multi-tab patient cards (info, visits, labs, radiology, dynamics)
- Edit modal with role-based field access

### RIS (Radiology)
- Worklist management with priority sorting
- DICOM viewer with measurements (length, HU, angle)
- Multi-frame series support
- Auto-generated reports with templates
- Window/Level presets (Brain, Bone, Lung, Abdomen)
- PDF export

### LIS (Laboratory)
- Test catalog with parameters and reference ranges
- Auto-flag detection (Normal / Low / High / Critical)
- Priority handling (Routine / Urgent / STAT)
- Sample type management (Blood / Urine / Stool / Saliva)
- Result entry with validation
- PDF reports

### Security
- JWT authentication with refresh tokens
- Role-Based Access Control (5 roles)
- SQL injection protection (TypeORM parameterized)
- XSS sanitization
- CORS strictly configured
- Bcrypt password hashing

### Internationalization
- Russian, Romanian, English
- 100+ translation keys per language
- Dynamic language switching
- APP_INITIALIZER ensures translations load before render

---

## Quality Engineering

Every commit is verified by automated test suite.

| Test Category | Tests | Pass Rate |
|---------------|-------|-----------|
| API E2E | 67 | 100% |
| Security | 28 | 100% |
| Mobile / Responsive | 150 | 100% |
| Performance | 19 | 100% |
| Database Integrity | — | Verified |
| Lighthouse Audit | 8 pages | 95.5/100 avg |
| **Total** | **272** | **100%** |

See detailed reports in [`docs/reports/`](docs/reports/).

---

## Getting Started

### Prerequisites
- Docker 20+
- Docker Compose 2+
- 4 GB RAM minimum

### Quick Start

```bash
git clone https://github.com/whyalohadance/HIS-MEDSYSTEM.git
cd HIS-MEDSYSTEM

# Start all services
docker-compose up -d

# Seed demo data
make seed-demo
```

Access the application at **http://localhost**

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Administrator | admin@med.com | password123 |
| Doctor | doctor@med.com | password123 |
| Reception | reception@med.com | password123 |
| Radiologist | radiolog@med.com | password123 |
| Lab Technician | lab@med.com | password123 |

---

## Commands

```bash
make up               # Start all containers
make down             # Stop all containers
make logs             # View logs
make seed-demo        # Load demonstration data
make test             # Run full test suite
make backup           # Backup database
make restore          # Restore database
make clean            # Remove containers and volumes
```

---

## Project Structure

```
HIS-MEDSYSTEM/
├── backend/              NestJS API server
│   ├── src/
│   │   ├── modules/      Feature modules (patients, appointments, ...)
│   │   ├── database/     Migrations and seeds
│   │   └── shared/       Guards, decorators, filters
│   └── Dockerfile
│
├── frontend/             Angular SPA
│   ├── src/app/
│   │   ├── features/     Page-level components
│   │   ├── shared/       Reusable components
│   │   ├── core/         Services, interceptors, guards
│   │   └── public/i18n/  Translation files
│   └── Dockerfile
│
├── tests/                Automated test suite
│   ├── api/              API E2E tests
│   ├── security/         Security audit
│   ├── e2e/              Browser tests (Puppeteer)
│   └── database/         DB integrity checks
│
├── docs/                 Technical documentation
├── scripts/              Utility scripts
└── docker-compose.yml    Infrastructure as code
```

---

## Documentation

- [Architecture Overview](docs/architecture/README.md)
- [Database Schema](docs/architecture/DATABASE.md)
- [Security Model](docs/architecture/SECURITY.md)
- [Testing Strategy](docs/TESTING.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [API Reference](docs/API.md)

## Test Reports

Latest verified reports:

- [API Test Report](docs/reports/api-tests.md)
- [Security Audit](docs/reports/security.md)
- [Mobile Responsiveness](docs/reports/mobile.md)
- [Performance Benchmarks](docs/reports/performance.md)
- [Database Integrity](docs/reports/database.md)
- [Lighthouse Audit](docs/reports/lighthouse.md)

---

## Academic Context

This project was developed as part of practical training at **Centrul de Diagnostic German (CDG)**, Chișinău, Moldova.

**Training Period**: 21.04.2026 — 12.06.2026  
**Institution**: CUTM (Colegiul Universității Tehnice a Moldovei)  
**Specialization**: Administrarea Aplicațiilor Web (AAW)  
**Student**: Ceban Devid

---

## License

This project is released for academic and educational purposes. See [LICENSE](LICENSE) for details.

---

<div align="center">

Built with precision. Tested with rigor.

*If everything seems under control, you're not going fast enough. — Mario Andretti*

</div>
