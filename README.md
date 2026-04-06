# HIS-MedSystem — Hospital Information System

![NestJS](https://img.shields.io/badge/NestJS-v10-E0234E?style=flat-square&logo=nestjs)
![Angular](https://img.shields.io/badge/Angular-v19-DD0031?style=flat-square&logo=angular)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-316192?style=flat-square&logo=postgresql)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)
![JWT](https://img.shields.io/badge/Auth-JWT-000000?style=flat-square&logo=jsonwebtokens)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

> Sistem informațional spitalicesc complet pentru gestionarea pacienților, programărilor, personalului medical și rapoartelor.

---

## Cuprins

- [Descriere](#descriere)
- [Funcționalitate](#funcționalitate)
- [Tehnologii](#tehnologii)
- [Structura proiectului](#structura-proiectului)
- [Instalare și pornire](#instalare-și-pornire)
- [Variabile de mediu](#variabile-de-mediu)
- [Roluri și acces](#roluri-și-acces)
- [API Endpoints](#api-endpoints)
- [Pagini Frontend](#pagini-frontend)
- [Conturi de test](#conturi-de-test)

---

## Descriere

**HIS-MedSystem** este o platformă web modernă pentru automatizarea proceselor clinice. Sistemul acoperă ciclul complet al vizitei medicale: de la înregistrarea pacientului și programarea la medic, până la emiterea rezultatelor și generarea rapoartelor administrative.

---

## Funcționalitate

### Pacienti
- Înregistrare, editare și căutare pacienți
- Card individual cu istoricul medical complet
- Vizualizare rezultate și fișiere atașate (`.docx` → HTML preview via Mammoth)

### Programări
- Creare și gestionare programări cu filtrare avansată
- Autocompletare căutare pacient
- Prețuri în MDL, durata implicită 35 min
- Finalizare automată prin cron job

### Personal medical
- Gestionare utilizatori: medici, recepționeri, administratori
- Status în timp real (disponibil / ocupat)
- Vizualizare specializare și cabinet alocat

### Cabinete
- Administrare cabinete medicale
- Verificare disponibilitate pe dată și oră

### Rezultate
- Încărcare fișiere (`.docx`, `.jpg` etc.)
- Previzualizare documentelor Word direct în browser

### Rapoarte
- Export PDF și Excel
- Raport automat generat în prima zi a lunii (cron)
- Statistici sumare pentru administrator

### Notificări
- Notificări automate cu 2 ore înainte de programare
- Panoul notificărilor cu marcare citit/necitit

### Orar medici
- Administrare program de lucru pe zile
- Vizualizare disponibilitate per medic

---

## Tehnologii

### Backend
| Tehnologie | Scop |
|---|---|
| NestJS | Framework principal |
| PostgreSQL 16 | Baza de date |
| TypeORM | ORM + migrații automate |
| JWT + Passport | Autentificare |
| bcryptjs | Hashing parole |
| PDFKit | Generare rapoarte PDF |
| ExcelJS | Generare rapoarte Excel |
| Multer | Upload fișiere |
| Mammoth | Conversie .docx → HTML |
| @nestjs/schedule | Cron jobs |

### Frontend
| Tehnologie | Scop |
|---|---|
| Angular 19 | Framework SPA (Standalone Components) |
| Chart.js | Grafice și statistici |
| SCSS + CSS Variables | Stilizare, tema întunecată |
| Angular Router | Navigare + Guards |

---

## Structura proiectului

```
HIS-MEDSYSTEM/
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/            # Autentificare JWT
│   │   │   ├── users/           # Gestionare utilizatori
│   │   │   ├── patients/        # Gestionare pacienți
│   │   │   ├── appointments/    # Programări + cron
│   │   │   ├── results/         # Rezultate medicale
│   │   │   ├── rooms/           # Cabinete
│   │   │   ├── notifications/   # Notificări + cron
│   │   │   ├── reports/         # PDF/Excel + cron
│   │   │   ├── schedules/       # Orar medici
│   │   │   ├── examinations/    # Tipuri examinări
│   │   │   └── upload/          # Upload fișiere Multer
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── uploads/                 # Fișiere încărcate
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── core/
    │   │   │   ├── models/      # Interfețe TypeScript
    │   │   │   ├── services/    # ApiService, AuthService
    │   │   │   └── guards/      # AuthGuard, RoleGuard
    │   │   ├── features/
    │   │   │   ├── auth/        # Login
    │   │   │   ├── dashboard/   # Pagina principală
    │   │   │   ├── patients/    # Pacienți
    │   │   │   ├── appointments/# Programări
    │   │   │   ├── staff/       # Personal
    │   │   │   ├── rooms/       # Cabinete
    │   │   │   ├── results/     # Rezultate
    │   │   │   ├── reports/     # Rapoarte
    │   │   │   ├── notifications/
    │   │   │   ├── schedules/   # Orar
    │   │   │   └── examinations/
    │   │   └── shared/
    │   │       ├── components/  # Header, Sidebar, Bottom Nav
    │   │       └── layout/
    │   └── styles/
    └── package.json
```

---

## Instalare și pornire

### Cerințe
- Node.js ≥ 18
- PostgreSQL 16
- Angular CLI (`npm install -g @angular/cli`)

### 1. Clonare repository

```bash
git clone https://github.com/whyalohadance/HIS-MEDSYSTEM.git
cd HIS-MEDSYSTEM
```

### 2. Configurare baza de date

```bash
psql -U postgres
```

```sql
CREATE USER medical_user WITH PASSWORD 'medical123';
CREATE DATABASE medical_db OWNER medical_user;
GRANT ALL PRIVILEGES ON DATABASE medical_db TO medical_user;
\q
```

### 3. Backend

```bash
cd backend
npm install
npm run start:dev
```

Backend rulează pe: `http://localhost:3000`

### 4. Frontend

```bash
cd frontend
npm install
ng serve
```

Frontend rulează pe: `http://localhost:4200`

### Verificare baza de date

```bash
pg_isready -h localhost -p 5432
```

---

## Variabile de mediu

Backend folosește valorile din `app.module.ts` / `ormconfig`:

| Variabilă | Valoare implicită |
|---|---|
| DB_HOST | localhost |
| DB_PORT | 5432 |
| DB_NAME | medical_db |
| DB_USER | medical_user |
| DB_PASS | medical123 |
| JWT_SECRET | medical_super_secret_key_2024 |
| PORT | 3000 |

---

## Roluri și acces

| Rol | Acces |
|---|---|
| **admin** | Acces complet: personal, cabinete, rapoarte, orar, examinări |
| **doctor** | Propriii pacienți, programări, rezultate medicale |
| **receptionist** | Pacienți, programări, cabinete |

---

## API Endpoints

### Auth
| Metodă | Endpoint | Descriere |
|---|---|---|
| POST | `/auth/login` | Autentificare, returnează JWT |
| POST | `/auth/register` | Înregistrare utilizator nou |

### Users
| Metodă | Endpoint | Descriere |
|---|---|---|
| GET | `/users` | Listă utilizatori (admin) |
| GET | `/users/doctors` | Lista medicilor |
| POST | `/users` | Creare utilizator |
| PATCH | `/users/:id` | Actualizare utilizator |
| DELETE | `/users/:id` | Ștergere utilizator |

### Patients
| Metodă | Endpoint | Descriere |
|---|---|---|
| GET | `/patients` | Listă pacienți (cu căutare) |
| GET | `/patients/:id` | Detalii pacient |
| POST | `/patients` | Adăugare pacient |
| PATCH | `/patients/:id` | Actualizare pacient |
| DELETE | `/patients/:id` | Ștergere pacient |

### Appointments
| Metodă | Endpoint | Descriere |
|---|---|---|
| GET | `/appointments` | Listă programări |
| GET | `/appointments/:id` | Detalii programare |
| POST | `/appointments` | Creare programare |
| PATCH | `/appointments/:id` | Actualizare programare |
| DELETE | `/appointments/:id` | Ștergere programare |

### Results
| Metodă | Endpoint | Descriere |
|---|---|---|
| GET | `/results` | Listă rezultate |
| GET | `/results/:id` | Detalii rezultat |
| GET | `/results/:id/preview` | Previzualizare .docx |
| POST | `/results` | Creare rezultat |
| PATCH | `/results/:id` | Actualizare rezultat |
| DELETE | `/results/:id` | Ștergere rezultat |

### Rooms
| Metodă | Endpoint | Descriere |
|---|---|---|
| GET | `/rooms` | Lista cabinetelor |
| GET | `/rooms/available` | Cabinete disponibile pe interval |
| POST | `/rooms` | Creare cabinet |
| PATCH | `/rooms/:id` | Actualizare cabinet |
| DELETE | `/rooms/:id` | Ștergere cabinet |

### Reports
| Metodă | Endpoint | Descriere |
|---|---|---|
| GET | `/reports/pdf` | Generare raport PDF |
| GET | `/reports/excel` | Generare raport Excel |
| GET | `/reports/summary` | Statistici sumare |

### Notifications
| Metodă | Endpoint | Descriere |
|---|---|---|
| GET | `/notifications` | Notificările utilizatorului |
| PATCH | `/notifications/:id/read` | Marcare ca citit |

### Schedules
| Metodă | Endpoint | Descriere |
|---|---|---|
| GET | `/schedules` | Orar medici |
| POST | `/schedules` | Creare orar |
| PATCH | `/schedules/:id` | Actualizare orar |
| DELETE | `/schedules/:id` | Ștergere orar |

### Upload
| Metodă | Endpoint | Descriere |
|---|---|---|
| POST | `/upload` | Încărcare fișier |
| GET | `/uploads/:filename` | Accesare fișier (public) |

---

## Pagini Frontend

| Rută | Acces | Descriere |
|---|---|---|
| `/auth/login` | Public | Autentificare |
| `/dashboard` | Toate rolurile | Statistici, grafice, programări azi |
| `/patients` | Admin, Doctor, Receptionist | Lista pacienților |
| `/patients/:id` | Admin, Doctor, Receptionist | Card pacient + istoric + rezultate |
| `/appointments` | Toate rolurile | Gestionare programări |
| `/staff` | Admin | Gestionare personal |
| `/rooms` | Admin | Gestionare cabinete |
| `/results` | Admin, Doctor | Rezultate medicale |
| `/reports` | Admin | Rapoarte PDF/Excel |
| `/notifications` | Toate rolurile | Notificări |
| `/profile` | Toate rolurile | Profilul utilizatorului |
| `/schedules` | Admin | Orar medici |
| `/examinations` | Admin | Tipuri examinări |

---

## Conturi de test

| Rol | Email | Parolă |
|---|---|---|
| Administrator | admin@med.com | password123 |
| Medic | doctor@med.com | password123 |
| Recepționer | reception@med.com | password123 |

---

## Licență

Distribuit sub licența **MIT**. Vezi fișierul `LICENSE` pentru detalii.
