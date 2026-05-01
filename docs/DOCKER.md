# 🐳 Docker — Гид по развертыванию

## Быстрый старт

```bash
# 1. Клонируй репозиторий
git clone https://github.com/whyalohadance/HIS-MEDSYSTEM.git
cd HIS-MEDSYSTEM

# 2. Скопируй .env
cp .env.example .env

# 3. Запусти всё
make up

# Готово! 🎉
# Frontend: http://localhost
# Backend:  http://localhost:3000
# pgAdmin:  http://localhost:5050 (только с профилем dev)
```

## Архитектура контейнеров

```
┌──────────────────────────────────────┐
│         his_network (bridge)         │
│                                      │
│  ┌─────────────┐    ┌─────────────┐  │
│  │  frontend   │───▶│   backend   │  │
│  │  (nginx)    │    │  (NestJS)   │  │
│  │  :80        │    │   :3000     │  │
│  └─────────────┘    └──────┬──────┘  │
│                             │         │
│                             ▼         │
│                     ┌─────────────┐   │
│                     │  postgres   │   │
│                     │   :5432     │   │
│                     └─────────────┘   │
└──────────────────────────────────────┘
```

## Команды Makefile

| Команда | Описание |
|---------|----------|
| `make up` | Запустить production окружение |
| `make down` | Остановить всё |
| `make restart` | Перезапустить контейнеры |
| `make logs` | Логи всех сервисов |
| `make logs-be` | Логи только backend |
| `make build` | Пересобрать образы без кеша |
| `make dev` | Только PostgreSQL + pgAdmin для разработки |
| `make dev-down` | Остановить dev окружение |
| `make backup` | Бекап БД в backups/ |
| `make shell-be` | Зайти в backend контейнер |
| `make shell-db` | Подключиться к PostgreSQL |
| `make clean` | Удалить ВСЕ данные ⚠️ |

## Рабочий процесс разработки

```bash
# Запусти только PostgreSQL
make dev

# В отдельных терминалах:
cd backend && npm run start:dev
cd frontend && ng serve
```

## pgAdmin

Доступен через профиль `dev`:

```bash
# Production compose с pgAdmin
docker-compose --profile dev up -d

# Dev compose (pgAdmin включён по умолчанию)
make dev
```

Адрес: http://localhost:5050  
Email: `admin@his.local` / Пароль: `admin`

## Production deploy на VPS (Ubuntu 22.04+)

```bash
# 1. Установи Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# 2. Клонируй проект
git clone https://github.com/whyalohadance/HIS-MEDSYSTEM.git
cd HIS-MEDSYSTEM

# 3. Настрой .env (ВАЖНО: смени JWT_SECRET!)
cp .env.example .env
nano .env

# 4. Запусти
make up
```

### nginx reverse proxy для домена

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

SSL через certbot:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Troubleshooting

### Backend не запускается
```bash
make logs-be
```

### PostgreSQL не подключается
```bash
make shell-db
# Проверь что DB существует
\l
```

### Frontend отдаёт 502
```bash
make logs-fe
make ps  # проверь статус контейнеров
```

### Очистить и начать заново
```bash
make clean
make up
```

### Проверить healthcheck
```bash
docker inspect his_backend | python3 -c "import sys,json; d=json.load(sys.stdin); print(d[0]['State']['Health'])"
```
