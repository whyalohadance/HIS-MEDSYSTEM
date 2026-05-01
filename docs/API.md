# 📡 API Documentation

Documentația completă în Swagger: http://localhost:3000/api/docs

## Authentication

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@med.com",
  "password": "password123"
}
```

Răspuns:
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "user": {
      "id": 1,
      "email": "admin@med.com",
      "role": "admin"
    }
  }
}
```

## Endpoints principale

### Patients
- `GET /api/patients` — listă pacienți
- `GET /api/patients/:id` — detalii pacient
- `POST /api/patients` — creare pacient
- `PATCH /api/patients/:id` — actualizare
- `DELETE /api/patients/:id` — ștergere

### Appointments
- `GET /api/appointments` — listă programări
- `GET /api/appointments?date=2026-04-30` — programări pentru o zi
- `POST /api/appointments` — creare programare
- `PATCH /api/appointments/:id/status` — schimbare status (admin/reception)

### Studies (RIS)
- `GET /api/studies` — listă investigații
- `GET /api/studies/worklist` — worklist radiolog
- `GET /api/studies/:id` — detalii
- `POST /api/studies/:id/report` — salvează concluzia
- `GET /api/studies/:id/report-pdf?lang=ro` — PDF concluzia

### Lab (LIS)
- `GET /api/lab/tests` — catalog teste
- `GET /api/lab/orders` — listă comenzi
- `GET /api/lab/worklist` — worklist laborant
- `POST /api/lab/orders` — creare comandă
- `GET /api/lab/orders/:id/results` — rezultate
- `POST /api/lab/orders/:id/results` — salvează rezultate
- `GET /api/lab/orders/:id/pdf?lang=ro` — PDF rezultate
- `GET /api/lab/patient/:id/history` — istoric pacient

### Reports
- `GET /api/reports/pdf?month=4&year=2026&lang=ro` — raport lunar PDF
- `GET /api/reports/excel?month=4&year=2026&lang=ro` — raport Excel
