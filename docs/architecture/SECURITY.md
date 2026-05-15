# Security Model

> Healthcare data demands absolute protection. We deliver.

---

## Security Posture

| Audit Category | Tests | Pass Rate |
|----------------|-------|-----------|
| JWT validation | 5 | 100% |
| RBAC enforcement | 4 | 100% |
| SQL injection | 7 | 100% |
| XSS protection | 4 | 100% |
| Password security | 3 | 100% |
| CORS | 2 | 100% |
| Rate limiting | 1 | 100% |
| **Total** | **28** | **100%** |

---

## Authentication

### Flow

```
Client                       Server                       Database
   │                            │                            │
   │  POST /auth/login          │                            │
   │  {email, password}         │                            │
   ├───────────────────────────►│                            │
   │                            │  SELECT user               │
   │                            ├───────────────────────────►│
   │                            │◄───────────────────────────┤
   │                            │                            │
   │                            │  bcrypt.compare()          │
   │                            │                            │
   │                            │  jwt.sign(HS256, 24h)      │
   │                            │                            │
   │  200 OK + accessToken      │                            │
   │◄───────────────────────────┤                            │
```

### Token Specifications

| Property | Value |
|----------|-------|
| Algorithm | HS256 |
| Expiration | 24 hours |
| Payload | userId, email, role |
| Storage | Client-side (localStorage) |
| Transmission | Authorization header |

---

## Authorization (RBAC)

### Role Definitions

| Role | Description | Scope |
|------|-------------|-------|
| admin | System administrator | Full access |
| doctor | Medical doctor | Own patients, appointments, lab orders |
| reception | Front desk | Patient registration, booking, reports |
| radiologist | Radiology specialist | Studies, DICOM viewer |
| lab_technician | Laboratory worker | Lab orders, results entry |

### Permission Matrix

| Endpoint | admin | doctor | reception | radiologist | lab |
|----------|-------|--------|-----------|-------------|-----|
| /patients GET | ✓ | ✓ | ✓ | ✗ | ✗ |
| /patients POST | ✓ | ✗ | ✓ | ✗ | ✗ |
| /patients DELETE | ✓ | ✗ | ✗ | ✗ | ✗ |
| /users GET | ✓ | ✗ | ✗ | ✗ | ✗ |
| /users POST | ✓ | ✗ | ✗ | ✗ | ✗ |
| /studies GET | ✓ | ✗ | ✗ | ✓ | ✗ |
| /lab/orders GET | ✓ | ✓ | ✗ | ✗ | ✓ |
| /reports GET | ✓ | ✗ | ✓ | ✗ | ✗ |

---

## Threat Protection

### SQL Injection

**Defense**: TypeORM parameterized queries exclusively. No raw SQL with user input.

Verified payloads blocked:
- `' OR '1'='1`
- `'; DROP TABLE patients; --`
- `1' OR 1=1 --`
- `admin'--`

### XSS

**Defense**: Angular auto-sanitization + class-validator DTOs strip dangerous content.

### CSRF

**Defense**: JWT in `Authorization` header (not cookies) eliminates CSRF vectors.

### Brute Force

**Defense**: Rate limiting on `/auth/login` via `@nestjs/throttler`.

---

## Password Security

| Aspect | Implementation |
|--------|----------------|
| Hashing | bcrypt, 10 rounds |
| Minimum length | 6 characters |
| Storage | Never in plaintext, never in API responses |
| Reset | Admin-triggered through profile interface |
