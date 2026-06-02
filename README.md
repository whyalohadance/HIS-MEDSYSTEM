<div align="center">

<img src="https://img.shields.io/badge/HIS-MedSystem-D5001C?style=for-the-badge&labelColor=000000" alt="HIS-MedSystem"/>

# HIS-MedSystem

**Sistem Informațional Spitalicesc** — Module Radiologie și Laborator Integrate

*Inginerie pentru Sănătate. Construit pentru Performanță.*

---

**Limbă**: 🇷🇴 Română · [🇬🇧 English](README.en.md) · [🇷🇺 Русский](README.ru.md)

[![Versiune](https://img.shields.io/badge/Versiune-v3.0.1-D5001C?style=flat-square&labelColor=000000)]()
[![Securitate](https://img.shields.io/badge/Securitate-Hardened-D5001C?style=flat-square&labelColor=000000)]()
[![Conformitate](https://img.shields.io/badge/HIPAA%2FGDPR-Compliant-D5001C?style=flat-square&labelColor=000000)]()
[![Licență](https://img.shields.io/badge/Licen%C8%9B%C4%83-Academic-D5001C?style=flat-square&labelColor=000000)]()

[**Instalare rapidă**](#instalare-rapidă) · [**Documentație**](docs/) · [**Arhitectură**](docs/architecture/) · [**API**](docs/API.md) · [**Deployment**](docs/DEPLOYMENT.md)

</div>

---

## Despre proiect

HIS-MedSystem este un sistem informațional spitalicesc complet, dezvoltat ca proiect de licență la Colegiul Universității Tehnice a Moldovei (CUTM), specialitatea Administrarea Aplicațiilor Web. Sistemul integrează trei module medicale critice într-o soluție unificată, securizată și performantă.

**Autor:** Ceban Devid · **Grupa:** AAW-221 · **An:** 2026

---

## Module integrate

| Modul | Funcționalități | Status |
|-------|-----------------|--------|
| **HIS** | Pacienți, programări, fișe medicale, rapoarte | Production |
| **RIS** | Vizualizator DICOM, studii, worklist radiologi | Production |
| **LIS** | Catalog analize, comenzi laborator, rezultate | Production |
| **Setup Wizard** | Configurare inițială clinică, animație Mac-style | Production |
| **System Health** | Monitorizare în timp real (DB, disc, RAM, uptime) | Production |
| **Audit Log** | Jurnal automat conform HIPAA/GDPR | Production |
| **Backup Management** | Copii de rezervă cu restore din UI | Production |

---

## Securitate

Implementată conform standardelor industriei pentru aplicații medicale:

- **Rate Limiting** — 5 încercări/minut pe login, 100 req/min global (Throttler)
- **Account Lockout** — Blocare automată după 5 încercări eșuate (15 minute)
- **Lockout Overlay** — Ecran complet cu cronometru de blocare
- **Password Hardening** — Bcrypt cost 12, regex complexity validation
- **JWT + RBAC** — 5 roluri (admin, doctor, receptionist, radiologist, lab_technician)
- **Helmet** — Security headers (X-Frame-Options, CSP, HSTS)
- **CORS Whitelist** — Configurabil prin .env
- **User Enumeration Protection** — Mesaje generice la autentificare eșuată
- **Audit Trail** — Toate acțiunile CRUD logate automat
- **Restore Confirmation** — Restaurarea DB necesită tastarea "RESTORE"

---

## Performanță

Măsurată cu Google Lighthouse și benchmark-uri interne:

| Categorie | Scor |
|-----------|------|
| Performance | **91 / 100** |
| Accessibility | **94 / 100** |
| Best Practices | **97 / 100** |
| SEO | **100 / 100** |

**API Response**: 1–7ms · **Frontend Bundle**: 525 KB · **FCP**: < 600ms · **DB Indexes**: 43 optimizate

---

## Arhitectură

```
┌─────────────────────────────────────────────────────────────┐
│  Angular 19 Frontend (Standalone Components · i18n RO/RU/EN) │
│  Setup Wizard · System Health · Audit · Backup · DICOM Viewer│
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTPS / REST + JWT
┌─────────────────────────┴───────────────────────────────────┐
│  NestJS 10 API                                               │
│  20 Module · Global Interceptors (Audit, Validation)         │
│  Throttler · Helmet · Rate Limiting · RBAC Guards            │
└─────────────────────────┬───────────────────────────────────┘
                          │
              ┌───────────┴───────────┐
              │                       │
       ┌──────┴──────┐         ┌──────┴──────┐
       │ PostgreSQL  │         │   Backups   │
       │     16      │◀────────│  pg_dump    │
       │ 21 tabele   │         │   gzip      │
       │ 43 indecși  │         │  /backups/  │
       └─────────────┘         └─────────────┘
```

---

## Stack tehnologic

**Frontend**
- Angular 19 (Standalone Components, signals)
- TypeScript 5.3
- Chart.js 4 (analytics, dashboards)
- Cornerstone.js (DICOM viewer)
- ngx-translate (i18n trei limbi)
- Material Icons

**Backend**
- NestJS 10 (20 module)
- TypeORM 0.3
- @nestjs/terminus (health checks)
- @nestjs/throttler (rate limiting)
- helmet (security headers)
- JWT + Passport.js
- bcryptjs (cost 12)
- class-validator

**Bază de date**
- PostgreSQL 16-alpine
- 21 tabele, 43 indecși, JSONB pentru audit changes
- ENUM types pentru type safety
- Timestamp audit trail

**Infrastructură**
- Docker Compose (3 containere)
- Nginx (reverse proxy, gzip, security headers)
- pg_dump + gzip pentru backup-uri

---

## Instalare rapidă

```bash
# 1. Clone
git clone https://github.com/whyalohadance/HIS-MEDSYSTEM.git
cd HIS-MEDSYSTEM

# 2. Configurare .env
cp .env.example .env

# 3. Start (production mode)
docker-compose up -d

# 4. Deschide în browser (după ~60 secunde)
open http://localhost
```

La prima rulare apare **Setup Wizard** cu animație Mac-style — completați 7 pași pentru configurarea clinicii și crearea contului administrator.

Pentru deployment complet pe server (Ubuntu/Cloudflare/HTTPS), vedeți [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

---

## Mod dezvoltare

Hot-reload — modificările apar instantaneu fără rebuild:

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

| Serviciu | URL | Hot-reload |
|----------|-----|-----------|
| Frontend (ng serve) | http://localhost:4200 | Orice modificare în `frontend/src/` |
| Backend (NestJS watch) | http://localhost:3000 | Orice modificare în `backend/src/` |
| Swagger | http://localhost:3000/api/docs | — |

---

## Roluri și permisiuni

| Rol | Funcționalități cheie |
|-----|----------------------|
| **admin** | Acces total · System Health · Audit Log · Backup · Personal · Configurare |
| **doctor** | Pacienți · Programări · Fișe medicale · Cabinetul meu |
| **receptionist** | Programări · Pacienți · Înregistrare |
| **radiologist** | Studii DICOM · Worklist · Raport radiologic |
| **lab_technician** | Comenzi laborator · Worklist · Catalog analize · Rezultate |

### Conturi demo (parola: `password123`)

| Email | Rol |
|-------|-----|
| admin@med.com | Administrator |
| doctor@med.com | Doctor |
| reception@med.com | Recepționist |
| radiolog@med.com | Radiolog |
| lab@med.com | Laborant |

---

## Funcționalități administrative

### System Health Dashboard

Monitorizare în timp real cu auto-refresh la 30 secunde:

- Status Backend API și PostgreSQL (cu ping time)
- Utilizare disc (progress bar + alerte)
- Memorie RAM heap (limită 250 MB)
- Uptime aplicație
- Contoare baze de date (pacienți, programări, utilizatori, studii)
- Card-uri expandabile cu cauze posibile pentru erori

### Audit Log

Jurnalizare automată conform HIPAA/GDPR Article 30:

- Toate acțiunile CRUD (POST/PUT/PATCH/DELETE) logate prin Interceptor global
- Skip pentru endpoint-uri interne (/health, /audit, /auth/refresh)
- Filtre: utilizator, acțiune, resursă, interval de date
- Export CSV cu BOM UTF-8
- Auto-refresh 30s (toggle)
- Indexare DB pentru queries rapide

### Backup Management

- Creare backup cu un click (pg_dump | gzip)
- Listă backup-uri cu metadata (dimensiune, dată)
- Download direct prin UI
- Restore cu confirmare textuală "RESTORE"
- Auto-cleanup la depășirea 1 GB
- Toate operațiile audit-logate
- Stocare în volume Docker persistent

---

## Comenzi utile

```bash
make up               # Start toate containerele (production)
make down             # Oprire containere
make hot              # Start hot-reload dev mode
make logs             # Vizualizare logs
make seed-demo        # Date de demonstrație
make test             # Rulează test suite complet
make backup           # Backup bază de date
make restore          # Restore bază de date
make clean            # Eliminare containere și volume
```

---

## Structura proiectului

```
HIS-MEDSYSTEM/
├── backend/                    NestJS 10 API
│   └── src/modules/            20 module (auth, patients, audit, backup, health...)
├── frontend/                   Angular 19 SPA
│   └── src/app/
│       ├── features/           35 features (HIS, RIS, LIS, admin)
│       ├── shared/             Componente reutilizabile
│       └── core/               Services, guards, models
├── docs/                       Documentație
│   ├── API.md
│   ├── DEPLOYMENT.md
│   ├── DOCKER.md
│   ├── architecture/           Diagrame UML
│   └── reports/                Rapoarte de testare
├── scripts/                    Init DB, seed-uri
├── tests/                      API, E2E, security, smoke
├── backups/                    Volume pentru backup-uri
├── docker-compose.yml          Production
├── docker-compose.dev.yml      Development hot-reload
└── .github/workflows/          CI/CD
```

---

## Documentație

- [Instalare detaliată](docs/INSTALLATION.md)
- [Deployment pe server](docs/DEPLOYMENT.md) — Ubuntu, HTTPS, Cloudflare
- [Arhitectură](docs/architecture/) — diagrame UML, ER, flow
- [API Reference](docs/API.md)
- [Docker](docs/DOCKER.md)
- [Testing](docs/TESTING.md)
- [Rapoarte testare](docs/reports/)

---

## Conformitate

| Standard | Implementare |
|----------|-------------|
| **HIPAA** | Audit trail complet, access control, encryption |
| **GDPR Article 30** | Records of processing activities (audit logs) |
| **OWASP Top 10** | Protecție injection, broken auth, XSS, etc. |
| **ISO 27001** | Information security best practices |

---

## Status

**Implementat (v3.0.1):**

- HIS core (pacienți, programări, fișe)
- RIS cu DICOM viewer (Cornerstone.js)
- LIS cu catalog analize și auto-flag detection
- Setup Wizard cu Mac-style intro (12 limbi, carusel infinit)
- Security hardening (rate limit, lockout, helmet, CORS)
- System Health Dashboard (real-time, auto-refresh)
- Audit Log conform HIPAA/GDPR
- Backup Management cu restore confirmat
- i18n trei limbi (RO/RU/EN)
- Dev mode cu hot-reload și proxy config

**Planificat (post-defensiune):**

- WebSocket alerts pentru evenimente critice
- Istoricul metricilor pe 24h cu grafice
- Escalare blocaj exponențial (exponential backoff)
- Mobile app native (Capacitor)
- Modul facturare și integrare CAS

---

## Context academic

**Autor:** Ceban Devid  
**Instituție:** Colegiul Universității Tehnice a Moldovei (CUTM)  
**Specialitatea:** Administrarea Aplicațiilor Web (AAW)  
**Grupa:** AAW-221  
**An academic:** 2025–2026  
**Practică:** Centrul de Diagnostic German (CDG), Chișinău  
**Perioada:** 21.04.2026 – 12.06.2026  
**GitHub:** [@whyalohadance](https://github.com/whyalohadance)

---

## Licență

Proiect academic dezvoltat în cadrul tezei de licență. Toate drepturile rezervate © 2026 Ceban Devid.

---

<div align="center">

Construit cu precizie. Testat cu rigoare.

*Dacă totul pare sub control, nu mergi suficient de repede. — Mario Andretti*

</div>
