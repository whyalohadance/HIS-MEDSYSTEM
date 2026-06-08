# Demo Data — HIS-MedSystem

Scripturi SQL pentru încărcarea datelor demo în baza de date, pentru screenshot-uri impresionante ale dashboard-ului.

## Cerințe prealabile

1. Setup Wizard finalizat (admin user creat, id=1)
2. Toate containerele sunt pornite și `healthy`:
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.dev.yml ps
   ```

## Utilizare

### Pasul 1: Catalog teste laborator

```bash
docker exec -i his_postgres psql -U medical_user -d medical_db \
  < scripts/demo-data/lab-tests-catalog.sql
```

### Pasul 2: Date demo principale

```bash
docker exec -i his_postgres psql -U medical_user -d medical_db \
  < scripts/demo-data/demo-data.sql
```

### Pasul 3: Backup pentru uz ulterior

```bash
mkdir -p ~/Documents/his-defense-prep
docker exec his_postgres pg_dump -U medical_user medical_db \
  | gzip > ~/Documents/his-defense-prep/demo-backup.sql.gz
echo "Backup creat: $(du -sh ~/Documents/his-defense-prep/demo-backup.sql.gz)"
```

## Restaurare din backup

După un `docker-compose down -v` (ștergere volume):

```bash
# 1. Pornire curată
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
# Așteptați ~60 secunde până BD este ready

# 2. Setup Wizard — manual prin UI (http://localhost:4200)

# 3. Restaurare date demo
gunzip -c ~/Documents/his-defense-prep/demo-backup.sql.gz \
  | docker exec -i his_postgres psql -U medical_user -d medical_db
```

## Parole utilizatori demo

| Utilizator | Rol | Parola |
|------------|-----|--------|
| maria.popescu@cdg.md | doctor | `Demo1234` |
| petru.ionescu@cdg.md | doctor | `Demo1234` |
| ana.georgescu@cdg.md | doctor | `Demo1234` |
| vasile.munteanu@cdg.md | doctor | `Demo1234` |
| elena.stoica@cdg.md | doctor | `Demo1234` |
| cristina.lupu@cdg.md | receptionist | `Demo1234` |
| mihaela.vasilescu@cdg.md | receptionist | `Demo1234` |
| andrei.costin@cdg.md | radiologist | `Demo1234` |
| diana.marinescu@cdg.md | radiologist | `Demo1234` |
| sergiu.pavel@cdg.md | lab_technician | `Demo1234` |
| natalia.rusu@cdg.md | lab_technician | `Demo1234` |
| igor.cazacu@cdg.md | lab_technician | `Demo1234` |

## Ce se creează

| Tabel | Cantitate | Detalii |
|-------|-----------|---------|
| users | 12 | 5 medici, 2 recepționiste, 2 radiologi, 3 laboranți |
| rooms | 10 | consultation × 5, procedure × 2, radiology × 2, laboratory × 1 |
| patients | 60 | Nume moldovenești + rusofone, Chișinău |
| appointments | 200 | 25 azi + 50 săpt. curentă + 125 ultimele 90 zile |
| studies (RIS) | 30 | CT, MRI, X-Ray, US — ultimele 60 zile |
| lab_orders (LIS) | 100 | Priorităţi mixte — ultimele 30 zile |
| lab_tests | 30 | Din `lab-tests-catalog.sql` |

**Total ~440 înregistrări** — dashboardul arată excelent pentru prezentare.

## Enum-uri verificate

Valorile corecte extrase din BD:

```
rooms_type:           consultation, radiology, laboratory, procedure, surgery
studies_priority:     routine, urgent, stat
lab_orders_priority:  routine, urgent, stat
lab_tests_category:   hematology, biochemistry, urine, hormones,
                      immunology, microbiology, coagulation, cardiac
```
