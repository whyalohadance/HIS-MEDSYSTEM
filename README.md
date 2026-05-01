# 🏥 HIS-MedSystem

> **Sistemul Informațional Spitalicesc complet — HIS + RIS + LIS**

Sistem medical full-stack pentru gestionarea spitalelor și clinicilor: pacienți, programări, radiologie cu DICOM Viewer și laborator cu auto-verificare valori normale.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Angular](https://img.shields.io/badge/Angular-19-DD0031?logo=angular)](https://angular.io/)
[![NestJS](https://img.shields.io/badge/NestJS-10-E0234E?logo=nestjs)](https://nestjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql)](https://www.postgresql.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org/)

---

## 📋 Cuprins

- [Despre proiect](#-despre-proiect)
- [Funcționalități](#-funcționalități)
- [Stack tehnologic](#-stack-tehnologic)
- [Roluri și permisiuni](#-roluri-și-permisiuni)
- [Instalare](#-instalare)
- [Docker](#-docker)
- [Conturi de testare](#-conturi-de-testare)
- [API Documentation](#-api-documentation)
- [Capturi de ecran](#-capturi-de-ecran)
- [Echipa](#-echipa)

---

## 🎯 Despre proiect

**HIS-MedSystem** este o aplicație web modernă pentru gestionarea proceselor medicale într-un spital sau clinică. Proiectul include trei module integrate:

- **HIS** (Hospital Information System) — gestionarea pacienților, programărilor, cabinetelor
- **RIS** (Radiology Information System) — investigații imagistice cu DICOM Viewer integrat
- **LIS** (Laboratory Information System) — analize de laborator cu auto-verificare a valorilor normale

Proiectul este dezvoltat ca lucrare de practică pentru specialitatea **Administrarea Aplicațiilor Web** la **CUTM** (Colegiul Universității Tehnice a Moldovei), 2026.

---

## ✨ Funcționalități

### 🏥 HIS — Gestiune spital
- ✅ Gestiunea completă a pacienților (CRUD, căutare, filtrare)
- ✅ Programări cu calendar și verificare disponibilitate medici
- ✅ Cabinete cu servicii și prețuri configurabile
- ✅ Auto-completare programări la sfârșitul timpului (Cron)
- ✅ Rapoarte PDF/Excel multilingve (RO/RU/EN)
- ✅ Notificări programate (Cron, 2 ore înainte)
- ✅ Card pacient cu istoric complet (programări, analize, radiologie, dinamică)

### 📷 RIS — Radiologie
- ✅ DICOM Viewer integrat cu Cornerstone.js
- ✅ Suport multi-frame și multi-file
- ✅ Instrumente: riglă, adnotări, Pixel Probe (HU)
- ✅ Window/Level presets (Creier, Os, Plămâni, etc.)
- ✅ Cine Mode pentru navigare automată prin secțiuni
- ✅ Concluzia radiologului cu șabloane
- ✅ Atașarea capturilor de ecran la concluzie
- ✅ Export PDF profesional pentru pacient

### 🔬 LIS — Laborator
- ✅ Catalog teste (admin) cu categorii și prețuri
- ✅ 8 categorii: hematology, biochemistry, urine, hormones, etc.
- ✅ Worklist pentru laborant cu prioritizare
- ✅ Auto-verificare valori normale (normal/low/high/critical)
- ✅ PDF rezultate cu semnătura laborantului
- ✅ Grafic dinamică indicatori în card pacient

### 🔐 Securitate & Acces
- ✅ Autentificare JWT
- ✅ 5 roluri cu permisiuni granulare
- ✅ Guards pe rute frontend și backend
- ✅ Protecția datelor pacientului

### 🌐 Multilingv & Mobile
- ✅ 3 limbi: Română, Rusă, Engleză
- ✅ Design responsiv (mobile, tablet, desktop)
- ✅ Bottom Navigation pe mobil
- ✅ Animații și tranziții fluide

---

## 🛠 Stack tehnologic

### Backend
- **NestJS** 10 — framework Node.js modular
- **TypeORM** — ORM pentru PostgreSQL
- **PostgreSQL** 16 — bază de date relațională
- **JWT** — autentificare
- **PDFKit** — generare PDF cu cyrilic (Roboto)
- **ExcelJS** — export Excel
- **@nestjs/schedule** — Cron jobs
- **Swagger** — documentație API

### Frontend
- **Angular** 19 — framework SPA modern
- **TypeScript** 5
- **SCSS** — stiluri organizate
- **Cornerstone.js** — DICOM rendering
- **Chart.js** 4 — grafice dinamică
- **@ngx-translate** — internaționalizare
- **Material Icons** — iconițe
- **RxJS** — programare reactivă

### DevOps
- **Docker** + **docker-compose** — containerizare
- **Makefile** — comenzi rapide
- **GitHub Actions** ready

---

## 👥 Roluri și permisiuni

| Funcționalitate | Admin | Doctor | Reception | Radiolog | Lab |
|----------------|:-----:|:------:|:---------:|:--------:|:---:|
| Gestiune utilizatori | ✅ | ❌ | ❌ | ❌ | ❌ |
| Gestiune pacienți | ✅ | ✅ | ✅ | ❌ | ❌ |
| Programări create | ✅ | ❌ | ✅ | ❌ | ❌ |
| Programări vizualizare | ✅ | ✅ | ✅ | ❌ | ❌ |
| Schimbare status programare | ✅ | ❌ | ✅ | ❌ | ❌ |
| Note medicale | ✅ | ✅ | ❌ | ❌ | ❌ |
| RIS Worklist | ✅ | ❌ | ❌ | ✅ | ❌ |
| DICOM Viewer | ✅ | ✅ | ❌ | ✅ | ❌ |
| Concluzia radiologică | ✅ | ❌ | ❌ | ✅ | ❌ |
| LIS Worklist | ✅ | ❌ | ❌ | ❌ | ✅ |
| Comenzi analize | ✅ | ✅ | ❌ | ❌ | ❌ |
| Rezultate analize | ✅ | ❌ | ❌ | ❌ | ✅ |
| Catalog teste (admin LIS) | ✅ | ❌ | ❌ | ❌ | ❌ |
| Rapoarte | ✅ | ❌ | ✅ | ❌ | ❌ |

---

## 🚀 Instalare

### Cerințe preliminare
- Node.js 18+ și npm
- PostgreSQL 14+
- Git

### Pași

1. **Clonează repository-ul**
```bash
git clone https://github.com/whyalohadance/HIS-MEDSYSTEM.git
cd HIS-MEDSYSTEM
```

2. **Configurează baza de date**
```bash
# Creează DB
psql -U postgres -c "CREATE DATABASE medical_db;"
psql -U postgres -c "CREATE USER medical_user WITH PASSWORD 'medical123';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE medical_db TO medical_user;"
```

3. **Configurează backend**
```bash
cd backend
cp .env.example .env
# Editează .env după nevoie
npm install
npm run start:dev
```

4. **Configurează frontend**
```bash
cd frontend
npm install
ng serve
```

5. **Accesează aplicația**
- Frontend: http://localhost:4200
- Backend API: http://localhost:3000/api
- Swagger Docs: http://localhost:3000/api/docs

---

## 🐳 Docker

Pentru lansare rapidă cu Docker:

```bash
# Pornește toate serviciile
make up

# Sau direct
docker-compose up -d

# Oprire
make down

# Logs
make logs
```

Vezi `docker-compose.yml` pentru configurare.

---

## 🔑 Conturi de testare

Toate conturile au parola: `password123`

| Email | Rol | Acces |
|-------|-----|-------|
| `admin@med.com` | Admin | Acces complet la sistem |
| `doctor@med.com` | Doctor | Pacienți, programări, concluzii |
| `reception@med.com` | Reception | Programări, pacienți |
| `radiolog@med.com` | Radiolog | RIS, DICOM Viewer, concluzii |
| `lab@med.com` | Laborant | LIS, rezultate analize |

---

## 📡 API Documentation

API documentation completă (Swagger) este disponibilă la:
```
http://localhost:3000/api/docs
```

### Endpoints principale:
- `POST /api/auth/login` — autentificare
- `GET /api/patients` — lista pacienți
- `POST /api/appointments` — creare programare
- `GET /api/studies/worklist` — RIS worklist
- `GET /api/lab/worklist` — LIS worklist
- `GET /api/reports/pdf` — raport PDF
- `GET /api/lab/orders/:id/pdf` — PDF rezultate analize
- `GET /api/studies/:id/report-pdf` — PDF concluzia radiologică

Vezi [Swagger](http://localhost:3000/api/docs) pentru lista completă.

---

## 📁 Structura proiectului

```
HIS-MEDSYSTEM/
├── backend/                    # NestJS API
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/          # Autentificare JWT
│   │   │   ├── users/         # Utilizatori
│   │   │   ├── patients/      # Pacienți
│   │   │   ├── appointments/  # Programări
│   │   │   ├── rooms/         # Cabinete
│   │   │   ├── studies/       # RIS — investigații
│   │   │   ├── lab/           # LIS — laborator
│   │   │   ├── reports/       # Rapoarte PDF/Excel
│   │   │   └── notifications/ # Notificări
│   │   ├── common/
│   │   │   ├── filters/       # Exception filters
│   │   │   └── guards/        # Role guards
│   │   └── main.ts
│   └── fonts/                 # Roboto pentru PDF
│
├── frontend/                   # Angular 19
│   ├── src/
│   │   └── app/
│   │       ├── core/          # Services, guards, interceptors
│   │       ├── features/      # Pagini principale
│   │       │   ├── auth/      # Login
│   │       │   ├── dashboard/ # Dashboards
│   │       │   ├── patients/  # Pacienți
│   │       │   ├── lab-*/     # LIS pagini
│   │       │   ├── studies/   # RIS pagini
│   │       │   └── dicom-viewer/
│   │       └── shared/        # Componente comune
│   └── public/i18n/           # Traduceri RO/RU/EN
│
├── docker-compose.yml
├── Makefile
└── README.md
```

---

## 📸 Capturi de ecran

### Login
Pagina de login cu animații Apple-style și autentificare rapidă demo accounts.

### Dashboard Admin
Statistici generale, programări de azi, accesi rapide.

### DICOM Viewer
Vizualizator DICOM profesional cu instrumente de măsurare, adnotări, Pixel Probe.

### LIS Worklist
Lista comenzi de analiză cu prioritizare și status în timp real.

### Card Pacient
Tab-uri: Informații, Programări, Analize, Radiologie, Dinamică.

---

## 👨‍💻 Echipa

**Dezvoltator:** Ceban Devid  
**Specialitate:** Administrarea Aplicațiilor Web (AAW)  
**Instituție:** Colegiul Universității Tehnice a Moldovei (CUTM)  
**Anul:** 2026  
**Locul practicii:** Centrul de Diagnostic German (CDG), Chișinău

---

## 📄 Licență

Acest proiect este licențiat sub licența MIT — vezi fișierul [LICENSE](LICENSE) pentru detalii.

---

## 🤝 Contribuții

Acest proiect este realizat în cadrul stagiului de practică. Pentru întrebări sau sugestii, contactează autorul.

---

<div align="center">

**Made with ❤️ in Moldova**

⭐ Dacă proiectul ți-a fost util, lasă o stea pe GitHub!

</div>
