# 🏥 HIS-MedSystem

<div align="center">

**Hospital Information System — Sistem Informațional Spitalicesc**

![Angular](https://img.shields.io/badge/Angular-19-DD0031?style=for-the-badge&logo=angular&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-10-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-Auth-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![i18n](https://img.shields.io/badge/i18n-RO%20%7C%20RU%20%7C%20EN-FF6B35?style=for-the-badge)
![Swagger](https://img.shields.io/badge/Swagger-API%20Docs-85EA2D?style=for-the-badge&logo=swagger&logoColor=black)

**Dezvoltat de Ceban Devid — CUTM, Administrarea Aplicațiilor Web, 2026**

</div>

---

## 📖 Despre proiect

**HIS-MedSystem** este o aplicație web full-stack completă pentru instituții medicale cu 3 roluri distincte (Administrator, Medic, Recepționist), multilingvism complet (RO/RU/EN), design responsive pentru toate dispozitivele și containerizare Docker.

---

## ✨ Ce include proiectul

### 🔐 Autentificare și securitate
- JWT tokens cu expirare 7 zile
- Parole criptate cu bcryptjs (salt rounds: 10)
- 3 roluri cu acces diferențiat: Admin, Doctor, Receptionist
- Guards pe fiecare rută și endpoint
- Rate limiting anti-atac brute-force

### 👥 Gestionarea pacienților
- CRUD complet cu ID unic din 6 cifre (000001, 000002...)
- Cardul pacientului cu istoricul complet al consultațiilor
- Rezultate medicale — previzualizare PDF, Word (mammoth), imagini
- Căutare după nume, telefon, email, ID
- Paginare 10 pacienți per pagină

### 📅 Programări medicale
- Autocomplete inteligent la căutarea pacienților (nume, telefon, dată naștere)
- Selectarea cabinetului disponibil la ora și data dorită
- Prețul consultației în MDL
- Filtre avansate: dată, medic, status
- Auto-finalizare după 35 minute prin cron job
- Adăugare rezultat direct din programare (doar medici)
- Paginare 10 programări per pagină

### 📊 Dashboard analitic (diferit per rol)
- **Admin**: statistici globale, grafice Chart.js, coada de azi
- **Doctor**: programările mele azi, pacienții mei, statistici personale
- **Receptionist**: toate programările azi, status medici, cabinete libere
- Grafice: Bar chart lunar + Donut chart distribuție statusuri
- Coada cu numere de ordine: 001, 002, 003...

### 📄 Rapoarte lunare
- **PDF** cu font Roboto — suport complet chirilică și română
- **Excel** cu 5 sheet-uri: rezumat, programări, pacienți, personal, cabinete
- Notificare automată administrator pe 1 ale lunii
- Descărcare directă din browser

### 🔔 Notificări automate
- Notificare cu 2 ore înainte de programare
- Sistem de chei pentru traduceri dinamice multilingv
- Contor notificări necitite în header în timp real

### 🌍 Multilingvism complet
- **3 limbi**: Română, Rusă, Engleză
- Comutator în header cu steaguri emoji
- Traduceri complete pentru toate paginile și componentele
- Date picker personalizat (fără zoom nedorit pe iOS)
- Preferință salvată în localStorage

### 📱 Design responsive
- Adaptat pentru telefoane (320px–768px)
- Bottom Navigation Bar pe mobile
- Adaptat pentru tablete (768px–1024px)
- Adaptat pentru desktop și monitoare mari (1440px+)
- Dark/Light mode cu salvare preferință
- Animație de intrare pe pagina de login

### 🎨 UI/UX modern
- Toast notifications pentru succes și eroare
- Confirm Dialog pentru acțiuni distructive
- Pagina 404 personalizată
- Skeleton loading
- Animații și tranziții fluide
- Dark theme complet

### 🩺 Cabinetul medicului
- Pagina dedicată `/my-cabinet` pentru doctori
- Programările mele azi cu butoane acțiune
- Lista pacienților mei cu acces rapid la card
- Orarul săptămânal cu cabinete alocate
- Statistici personale lunare

### 🐳 Docker
- docker-compose cu 3 servicii: PostgreSQL, Backend, Frontend
- Multi-stage builds pentru imagini optimizate
- Healthchecks pentru toate serviciile
- Volumes persistente pentru uploads și fonts
- Makefile cu comenzi scurte
- `.env` pentru configurare securizată

### 📚 Documentație API
- Swagger UI la `/api/docs`
- Toate endpoint-urile documentate
- Autentificare Bearer JWT direct din Swagger
- Grupate pe module cu tags

---

## 🚀 Pornire rapidă

### Cu Docker (recomandat — 1 comandă):
```bash
git clone https://github.com/whyalohadance/HIS-MEDSYSTEM.git
cd HIS-MEDSYSTEM
cp .env.example .env
make up
```

| Serviciu | URL |
|----------|-----|
| 🌐 Frontend | http://localhost |
| ⚙️ Backend API | http://localhost:3000 |
| 📚 Swagger Docs | http://localhost:3000/api/docs |

### Pentru dezvoltare locală:
```bash
# Terminal 1 — Backend
cd backend && npm install && npm run start:dev

# Terminal 2 — Frontend
cd frontend && npm install && ng serve
```

Frontend: http://localhost:4200 | Backend: http://localhost:3000

---

## 🐳 Comenzi Docker

```bash
make up           # Pornește toate serviciile
make down         # Oprește toate serviciile
make build        # Rebuild după modificări
make logs         # Loguri în timp real
make dev          # Doar PostgreSQL pentru dezvoltare
make restart      # Repornește serviciile
make clean        # Șterge tot
make status       # Status containere
make help         # Toate comenzile disponibile
```

---

## 👥 Conturi de test

| Rol | Email | Parolă | Acces |
|-----|-------|--------|-------|
| 🔴 Administrator | admin@med.com | password123 | Complet |
| 🔵 Medic | doctor@med.com | password123 | Propriu |
| 🟢 Recepționist | reception@med.com | password123 | Programări |

---

## 🔐 Matrice acces roluri

| Funcționalitate | Admin | Doctor | Recepție |
|----------------|-------|--------|----------|
| Dashboard complet | ✅ | ✅ | ✅ |
| CRUD Pacienți | ✅ | ❌ | ✅ |
| Creare programări | ✅ | ❌ | ✅ |
| Adăugare rezultate | ✅ | ✅ | ❌ |
| Rapoarte PDF/Excel | ✅ | ❌ | ❌ |
| Gestionare personal | ✅ | ❌ | ❌ |
| Cabinetul meu | ❌ | ✅ | ❌ |
| Cabinete și orare | ✅ | ❌ | 👁️ |
| Swagger Docs | ✅ | ✅ | ✅ |

---

## 🛠 Stack tehnologic

| Strat | Tehnologie | Versiune |
|-------|-----------|---------|
| Frontend | Angular Standalone Components | 19 |
| Backend | NestJS | 10 |
| Baza de date | PostgreSQL | 16 |
| ORM | TypeORM (synchronize: true) | Latest |
| Autentificare | JWT + bcryptjs + Passport | — |
| Grafice | Chart.js | 4 |
| PDF | PDFKit + font Roboto | — |
| Excel | ExcelJS | — |
| Upload | Multer | — |
| Word preview | Mammoth | — |
| Cron jobs | @nestjs/schedule | — |
| Multilingvism | @ngx-translate/core | — |
| API Docs | Swagger (@nestjs/swagger) | — |
| Docker | docker-compose | Latest |
| Stilizare | SCSS + CSS Variables | — |

---

## 🏗 Arhitectura sistemului

```
┌──────────────────────┐      HTTP/REST + JWT      ┌──────────────────────┐
│     Angular 19       │ ←───────────────────────→ │      NestJS 10       │
│   localhost:4200     │                            │   localhost:3000     │
│                      │                            │   /api/docs (Swagger)│
│  ├── Dashboard       │                            │                      │
│  ├── Patients        │                            │  ├── Auth Module     │
│  ├── Appointments    │                            │  ├── Users Module    │
│  ├── Staff           │                            │  ├── Patients Module │
│  ├── Rooms           │                            │  ├── Appointments    │
│  ├── Reports         │                            │  ├── Results Module  │
│  ├── My Cabinet      │                            │  ├── Reports Module  │
│  ├── Notifications   │                            │  ├── Notifications   │
│  └── i18n RO/RU/EN   │                            │  └── Upload Module   │
└──────────────────────┘                            └──────────┬───────────┘
                                                               │ TypeORM
                                                    ┌──────────▼───────────┐
                                                    │    PostgreSQL 16      │
                                                    │     medical_db        │
                                                    └──────────────────────┘
```

---

## 📁 Structura proiectului

```
HIS-MEDSYSTEM/
├── backend/                    # NestJS API
│   ├── src/modules/            # 11 module NestJS
│   ├── fonts/                  # Roboto pentru PDF
│   ├── uploads/                # Fișiere medicale
│   └── Dockerfile
├── frontend/                   # Angular 19
│   ├── src/app/
│   │   ├── core/               # Services, Guards, Models
│   │   ├── features/           # 15+ pagini
│   │   └── shared/             # Componente reutilizabile
│   ├── public/i18n/            # Traduceri RO/RU/EN
│   ├── nginx.conf
│   └── Dockerfile
├── docker-compose.yml          # Producție
├── docker-compose.dev.yml      # Doar PostgreSQL
├── Makefile                    # Comenzi scurte
├── .env.example                # Șablon configurare
├── CLAUDE.md                   # AI Development guide
└── README.md
```

---

## 📞 Contact

**Ceban Devid**  
Colegiul Universității Tehnice a Moldovei (CUTM)  
Specialitatea: Administrarea Aplicațiilor Web (AAW)  
Chișinău, Moldova — 2026  
GitHub: https://github.com/whyalohadance

---

<div align="center">

Dezvoltat cu ❤️ pentru CUTM — Administrarea Aplicațiilor Web 2026

[📚 API Docs](http://localhost:3000/api/docs) • [💻 GitHub](https://github.com/whyalohadance/HIS-MEDSYSTEM)

</div>
