# Deployment Guide

> From local development to production. Documented for clarity.

---

## Local Development

```bash
git clone https://github.com/whyalohadance/HIS-MEDSYSTEM.git
cd HIS-MEDSYSTEM
docker-compose up -d
```

### Services

| Service | Port | URL |
|---------|------|-----|
| Frontend | 80 | http://localhost |
| Backend API | 3000 | http://localhost:3000/api |
| PostgreSQL | 5432 | localhost:5432 |

---

## Initial Setup

```bash
# Seed demonstration data
make seed-demo

# Or manually
bash scripts/seed-all-data.sh
```

---

## Environment Variables

Configure via `.env` or `docker-compose.yml`:

```env
POSTGRES_DB=medical_db
POSTGRES_USER=medical_user
POSTGRES_PASSWORD=<secret>

JWT_SECRET=<random-256-bit>
JWT_EXPIRATION=24h

NODE_ENV=production
TZ=Europe/Chisinau
```

---

## Production Checklist

Before deploying to production:

- [ ] Change all default passwords
- [ ] Generate strong JWT_SECRET (256-bit random)
- [ ] Configure HTTPS via Let's Encrypt
- [ ] Set up automated backups
- [ ] Configure log rotation (already in docker-compose.yml)
- [ ] Set resource limits (already configured)
- [ ] Configure SMTP for notifications
- [ ] Set up monitoring (Prometheus + Grafana recommended)
- [ ] Run full test suite
- [ ] Document recovery procedures

---

## Backup Strategy

```bash
# Backup database
make backup
# Files saved to: backups/medical_db_YYYY-MM-DD_HH-MM.sql.gz

# Restore from backup
make restore FILE=backups/medical_db_2026-05-14_12-00.sql.gz
```

---

## Makefile Commands Reference

```bash
make up               # Start all containers
make down             # Stop all containers
make logs             # View logs (all services)
make seed-demo        # Load demonstration data
make test             # Run full test suite
make backup           # Backup PostgreSQL database
make restore          # Restore database from backup
make clean            # Remove containers and volumes
make rebuild          # Rebuild images without cache
```

---

## Health Verification

```bash
# Check all services running
docker-compose ps

# Check backend health
curl http://localhost:3000/api/health

# Check API docs
open http://localhost:3000/api/docs
```
