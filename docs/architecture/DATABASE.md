# Database Schema

> PostgreSQL 16. 18 tables. 40 indexes. Zero compromises on integrity.

---

## Overview

| Metric | Value |
|--------|-------|
| Engine | PostgreSQL 16-alpine |
| Tables | 18 |
| Indexes | 40 |
| ENUM types | 14 |
| Foreign keys | 3 (database level) + 7 (application level) |
| Migrations | TypeORM auto-sync + manual |

---

## Core Tables

### users

Staff accounts and authentication.

| Column | Type | Constraint |
|--------|------|------------|
| id | serial | PK |
| email | varchar | UNIQUE, NOT NULL |
| password | varchar | bcrypt hash |
| firstName | varchar | NOT NULL |
| lastName | varchar | NOT NULL |
| role | enum | admin, doctor, reception, radiologist, lab_technician |
| isActive | boolean | default true |
| phone | varchar | nullable |
| specialization | varchar | nullable |
| createdAt | timestamp | auto |
| updatedAt | timestamp | auto |

Indexes: `email`, `role`

---

### patients

Patient demographics and contact information.

| Column | Type | Constraint |
|--------|------|------------|
| id | serial | PK |
| firstName | varchar | NOT NULL |
| lastName | varchar | NOT NULL |
| dateOfBirth | date | NOT NULL |
| gender | enum | male, female |
| email | varchar | nullable |
| phone | varchar | nullable |
| address | text | nullable |
| bloodType | varchar | nullable |
| createdAt | timestamp | auto |
| updatedAt | timestamp | auto |

---

### appointments

Patient visits to specific rooms with specific doctors.

| Column | Type | Constraint |
|--------|------|------------|
| id | serial | PK |
| patientId | int | FK → patients |
| doctorId | int | FK → users (nullable for lab) |
| roomId | int | FK → rooms |
| date | date | NOT NULL |
| time | time | NOT NULL |
| duration | int | minutes |
| price | decimal | MDL |
| examination | varchar | service name |
| status | enum | scheduled, in_progress, completed, cancelled |
| diagnosis | text | nullable |
| treatment | text | nullable |
| notes | text | nullable |
| createdAt | timestamp | auto |

Indexes: `date`, `patientId`, `doctorId`, `status`

---

### rooms

Physical cabinets with services and assigned staff.

| Column | Type | Constraint |
|--------|------|------------|
| id | serial | PK |
| number | varchar | NOT NULL |
| name | varchar | NOT NULL |
| type | enum | consultation, radiology, laboratory, procedure |
| floor | int | nullable |
| isActive | boolean | default true |
| assignedDoctorIds | int[] | array of user ids |
| services | jsonb | array of {name, price, duration} |

---

## RIS Tables

### studies

Radiological investigations.

| Column | Type | Constraint |
|--------|------|------------|
| id | serial | PK |
| appointmentId | int | nullable FK |
| patientId | int | FK → patients |
| radiologistId | int | FK → users |
| type | varchar | MRI, CT, X-Ray, Ultrasound |
| bodyPart | varchar | nullable |
| status | enum | pending, in_progress, completed |
| priority | enum | routine, urgent, stat |
| findings | text | nullable |
| conclusion | text | nullable |
| dicomFilePath | varchar | nullable |
| createdAt | timestamp | auto |

Indexes: `patientId`, `status`, `type`

---

## LIS Tables

### lab_tests

Master catalog of available tests.

| Column | Type | Constraint |
|--------|------|------------|
| id | serial | PK |
| name | varchar | NOT NULL |
| code | varchar | UNIQUE |
| category | enum | hematology, biochemistry, urine, hormones, ... |
| price | decimal | MDL |
| turnaroundTime | int | hours |
| sampleType | enum | blood, urine, stool, saliva, other |
| parameters | jsonb | array of {name, unit, refMin, refMax} |
| description | text | nullable |
| isActive | boolean | default true |

---

### lab_orders

Patient test orders.

| Column | Type | Constraint |
|--------|------|------------|
| id | serial | PK |
| orderNumber | varchar | UNIQUE |
| patientId | int | FK → patients |
| testId | int | FK → lab_tests |
| priority | enum | routine, urgent, stat |
| status | enum | pending, in_progress, completed, cancelled |
| clinicalInfo | text | nullable |
| scheduledAt | timestamp | nullable |
| results | jsonb | array of {paramName, value, flag} |
| completedBy | int | nullable FK → users |
| completedAt | timestamp | nullable |
| createdAt | timestamp | auto |

Indexes: `patientId`, `status`, `priority`

---

## Performance Indexes

Strategic indexing for hot paths:

```sql
-- Appointments (most queried table)
idx_appointments_date
idx_appointments_patientId
idx_appointments_doctorId
idx_appointments_status

-- Studies (RIS lookup)
idx_studies_patientId
idx_studies_status
idx_studies_type

-- Lab orders
idx_lab_orders_patientId
idx_lab_orders_status
idx_lab_orders_priority

-- Auth
idx_users_email
idx_users_role

-- Notifications
idx_notifications_userId
idx_notifications_isRead
```

---

## ENUM Types

| Enum | Values |
|------|--------|
| user_role | admin, doctor, reception, radiologist, lab_technician |
| gender | male, female |
| appointment_status | scheduled, in_progress, completed, cancelled |
| room_type | consultation, radiology, laboratory, procedure |
| priority | routine, urgent, stat |
| study_status | pending, in_progress, completed |
| order_status | pending, in_progress, completed, cancelled |
| sample_type | blood, urine, stool, saliva, other |
| flag_type | normal, low, high, critical_low, critical_high |
| ... | (14 total) |
