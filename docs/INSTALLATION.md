# 📥 Ghid de instalare HIS-MedSystem

## Cerințe sistem

- **Node.js** 18+ și npm
- **PostgreSQL** 14+
- **Git**
- **Docker** (opțional, pentru deployment)

## Instalare locală pas cu pas

### 1. Clonare repository

```bash
git clone https://github.com/whyalohadance/HIS-MEDSYSTEM.git
cd HIS-MEDSYSTEM
```

### 2. Configurare PostgreSQL

```bash
# Conectare la PostgreSQL ca superuser
sudo -u postgres psql

# Creează DB și utilizator
CREATE DATABASE medical_db;
CREATE USER medical_user WITH PASSWORD 'medical123';
GRANT ALL PRIVILEGES ON DATABASE medical_db TO medical_user;
\q
```

### 3. Backend

```bash
cd backend
cp .env.example .env

# Editează .env dacă e nevoie
nano .env

# Instalează dependențe
npm install

# Pornește în modul dezvoltare
npm run start:dev
```

Backend va rula la `http://localhost:3000`

### 4. Frontend

```bash
cd frontend
npm install
ng serve
```

Frontend va rula la `http://localhost:4200`

### 5. Verificare instalare

Deschide browserul:
- Frontend: http://localhost:4200
- API Docs: http://localhost:3000/api/docs

Loghează-te cu `admin@med.com` / `password123`.

## Probleme cunoscute

### "Cannot find module './common/filters/http-exception.filter'"
Asigură-te că fișierul există în backend/src/common/filters/.

### CORS error
Verifică că în .env: `FRONTEND_URL=http://localhost:4200`

### PDF gol
Verifică că fonturile Roboto sunt în backend/fonts/.
