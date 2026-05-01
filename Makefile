.PHONY: help up down restart logs logs-be logs-fe logs-db build dev dev-down clean backup shell-be shell-db shell-fe ps

help:
	@echo "🏥 HIS-MedSystem — Доступные команды:"
	@echo ""
	@echo "📦 Production:"
	@echo "  make up          - Запустить все сервисы"
	@echo "  make down        - Остановить все сервисы"
	@echo "  make restart     - Перезапустить"
	@echo "  make logs        - Показать логи"
	@echo "  make build       - Пересобрать образы"
	@echo ""
	@echo "💻 Development:"
	@echo "  make dev         - Запустить только PostgreSQL + pgAdmin"
	@echo "  make dev-down    - Остановить dev окружение"
	@echo ""
	@echo "🛠 Утилиты:"
	@echo "  make clean       - Удалить контейнеры и тома"
	@echo "  make backup      - Бекап базы данных"
	@echo "  make shell-be    - Войти в контейнер backend"
	@echo "  make shell-db    - Войти в PostgreSQL"

up:
	@echo "🚀 Запуск HIS-MedSystem..."
	docker-compose up -d
	@echo "✅ Запущено! Frontend: http://localhost · Backend: http://localhost:3000"

down:
	@echo "🛑 Остановка HIS-MedSystem..."
	docker-compose down

restart:
	@echo "🔄 Перезапуск..."
	docker-compose restart

logs:
	docker-compose logs -f

logs-be:
	docker-compose logs -f backend

logs-fe:
	docker-compose logs -f frontend

logs-db:
	docker-compose logs -f postgres

build:
	@echo "🔨 Пересборка образов..."
	docker-compose build --no-cache

dev:
	@echo "💻 Запуск dev окружения (PostgreSQL + pgAdmin)..."
	docker-compose -f docker-compose.dev.yml up -d
	@echo "✅ PostgreSQL: localhost:5432"
	@echo "✅ pgAdmin: http://localhost:5050 (admin@his.local / admin)"
	@echo ""
	@echo "Теперь запусти backend и frontend локально:"
	@echo "  cd backend && npm run start:dev"
	@echo "  cd frontend && ng serve"

dev-down:
	docker-compose -f docker-compose.dev.yml down

clean:
	@echo "⚠️  Это удалит ВСЕ данные!"
	@read -p "Вы уверены? [y/N]: " confirm && [ "$$confirm" = "y" ] || exit 1
	docker-compose down -v
	docker-compose -f docker-compose.dev.yml down -v
	@echo "✅ Очищено"

backup:
	@echo "💾 Создание бекапа БД..."
	@mkdir -p backups
	docker-compose exec -T postgres pg_dump -U medical_user medical_db > backups/backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "✅ Бекап сохранён в backups/"

shell-be:
	docker-compose exec backend sh

shell-db:
	docker-compose exec postgres psql -U medical_user -d medical_db

shell-fe:
	docker-compose exec frontend sh

ps:
	docker-compose ps
