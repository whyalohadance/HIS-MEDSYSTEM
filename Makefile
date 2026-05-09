.DEFAULT_GOAL := help
.PHONY: help up down restart logs logs-be logs-fe logs-db build rebuild dev dev-down \
        status shell-be shell-fe shell-db backup restore seed seed-demo reset-db \
        pgadmin clean clean-all prune health deploy update

# ============================================
# Colors
# ============================================
CYAN   := \033[0;36m
GREEN  := \033[0;32m
YELLOW := \033[1;33m
RED    := \033[0;31m
NC     := \033[0m

help: ## Показать список команд
	@echo ""
	@echo "$(CYAN)╔═══════════════════════════════════════════╗$(NC)"
	@echo "$(CYAN)║   🏥 HIS-MedSystem — Команды управления   ║$(NC)"
	@echo "$(CYAN)╚═══════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(GREEN)📦 Запуск/Остановка:$(NC)"
	@echo "  $(YELLOW)make up$(NC)              Запустить production"
	@echo "  $(YELLOW)make down$(NC)            Остановить"
	@echo "  $(YELLOW)make restart$(NC)         Перезапустить"
	@echo "  $(YELLOW)make dev$(NC)             Только БД (для local dev)"
	@echo ""
	@echo "$(GREEN)🔧 Разработка:$(NC)"
	@echo "  $(YELLOW)make build$(NC)           Пересобрать образы"
	@echo "  $(YELLOW)make rebuild$(NC)         Полная пересборка с нуля"
	@echo "  $(YELLOW)make logs$(NC)            Все логи (follow)"
	@echo "  $(YELLOW)make logs-be$(NC)         Только backend"
	@echo "  $(YELLOW)make logs-fe$(NC)         Только frontend"
	@echo "  $(YELLOW)make logs-db$(NC)         Только postgres"
	@echo "  $(YELLOW)make status$(NC)          Статус + ресурсы"
	@echo ""
	@echo "$(GREEN)🐚 Shell:$(NC)"
	@echo "  $(YELLOW)make shell-be$(NC)        Войти в backend"
	@echo "  $(YELLOW)make shell-fe$(NC)        Войти в frontend"
	@echo "  $(YELLOW)make shell-db$(NC)        PostgreSQL psql"
	@echo ""
	@echo "$(GREEN)💾 База данных:$(NC)"
	@echo "  $(YELLOW)make backup$(NC)          Создать бекап БД"
	@echo "  $(YELLOW)make restore FILE=...$(NC) Восстановить из бекапа"
	@echo "  $(YELLOW)make seed$(NC)            Создать тестовые аккаунты"
	@echo "  $(YELLOW)make seed-demo$(NC)       Заполнить все модули demo данными"
	@echo "  $(YELLOW)make reset-db$(NC)        Сбросить БД (ОПАСНО!)"
	@echo ""
	@echo "$(GREEN)🛠 Утилиты:$(NC)"
	@echo "  $(YELLOW)make pgadmin$(NC)         Запустить pgAdmin"
	@echo "  $(YELLOW)make health$(NC)          Проверить здоровье"
	@echo "  $(YELLOW)make clean$(NC)           Остановить (данные сохраняются)"
	@echo "  $(YELLOW)make clean-all$(NC)       Полная очистка + данные (ОПАСНО!)"
	@echo "  $(YELLOW)make prune$(NC)           Очистить Docker cache"
	@echo ""
	@echo "$(GREEN)🚀 Production:$(NC)"
	@echo "  $(YELLOW)make deploy$(NC)          backup → build → restart"
	@echo "  $(YELLOW)make update$(NC)          git pull → deploy"
	@echo ""

up: ## Запустить все сервисы
	@echo "$(CYAN)🚀 Запуск HIS-MedSystem...$(NC)"
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "$(YELLOW)⚠️  .env создан из .env.example — проверь JWT_SECRET!$(NC)"; \
	fi
	docker-compose up -d
	@echo ""
	@echo "$(GREEN)✅ Запущено!$(NC)"
	@echo "   🌐 Frontend:    $(CYAN)http://localhost$(NC)"
	@echo "   🔌 Backend API: $(CYAN)http://localhost:3000$(NC)"
	@echo "   📚 API Docs:    $(CYAN)http://localhost:3000/api/docs$(NC)"
	@echo ""
	@echo "$(YELLOW)Дождитесь полной загрузки (~30 сек), затем: make health$(NC)"

down: ## Остановить все сервисы
	@echo "$(YELLOW)🛑 Остановка...$(NC)"
	docker-compose down
	@echo "$(GREEN)✅ Остановлено (данные сохранены)$(NC)"

restart: ## Перезапустить
	@echo "$(YELLOW)🔄 Перезапуск...$(NC)"
	docker-compose restart
	@echo "$(GREEN)✅ Перезапущено$(NC)"

build: ## Пересобрать образы
	@echo "$(CYAN)🔨 Сборка образов...$(NC)"
	docker-compose build

rebuild: ## Полная пересборка с нуля
	@echo "$(CYAN)🔨 Полная пересборка (--no-cache)...$(NC)"
	docker-compose down
	docker-compose build --no-cache
	docker-compose up -d
	@echo "$(GREEN)✅ Готово$(NC)"

dev: ## Запустить только БД для локальной разработки
	@echo "$(CYAN)💻 Запуск dev окружения (только PostgreSQL)...$(NC)"
	docker-compose up -d postgres
	@echo ""
	@echo "$(GREEN)✅ PostgreSQL запущен$(NC) — localhost:5432"
	@echo ""
	@echo "$(YELLOW)Запусти локально:$(NC)"
	@echo "  cd backend  && npm run start:dev"
	@echo "  cd frontend && ng serve"

dev-down: ## Остановить dev (только БД)
	docker-compose stop postgres

logs: ## Все логи (follow)
	docker-compose logs -f --tail=100

logs-be: ## Логи backend
	docker-compose logs -f --tail=100 backend

logs-fe: ## Логи frontend
	docker-compose logs -f --tail=100 frontend

logs-db: ## Логи postgres
	docker-compose logs -f --tail=100 postgres

status: ## Статус контейнеров + ресурсы
	@echo "$(CYAN)📊 Контейнеры:$(NC)"
	@docker-compose ps
	@echo ""
	@echo "$(CYAN)💾 Использование ресурсов:$(NC)"
	@docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}" 2>/dev/null || true

shell-be: ## Войти в backend container
	docker-compose exec backend sh

shell-fe: ## Войти в frontend container
	docker-compose exec frontend sh

shell-db: ## PostgreSQL psql
	docker-compose exec postgres psql -U $${DB_USERNAME:-medical_user} -d $${DB_DATABASE:-medical_db}

backup: ## Создать бекап БД
	@mkdir -p backups
	@TIMESTAMP=$$(date +%Y%m%d_%H%M%S); \
	FILE="backups/backup_$$TIMESTAMP.sql"; \
	echo "$(CYAN)💾 Создание бекапа → $$FILE$(NC)"; \
	docker-compose exec -T postgres pg_dump \
		-U $${DB_USERNAME:-medical_user} $${DB_DATABASE:-medical_db} > "$$FILE"; \
	SIZE=$$(du -h "$$FILE" | cut -f1); \
	echo "$(GREEN)✅ Бекап сохранён: $$FILE ($$SIZE)$(NC)"

restore: ## Восстановить из бекапа: make restore FILE=backups/backup_xxx.sql
	@if [ -z "$(FILE)" ]; then \
		echo "$(RED)❌ Укажи файл: make restore FILE=backups/backup_xxx.sql$(NC)"; exit 1; \
	fi
	@if [ ! -f "$(FILE)" ]; then \
		echo "$(RED)❌ Файл $(FILE) не найден$(NC)"; exit 1; \
	fi
	@echo "$(YELLOW)⚠️  Восстановление из $(FILE)...$(NC)"
	@read -p "Это перезапишет текущую БД! Продолжить? [y/N]: " confirm && [ "$$confirm" = "y" ] || exit 1
	docker-compose exec -T postgres psql \
		-U $${DB_USERNAME:-medical_user} $${DB_DATABASE:-medical_db} < "$(FILE)"
	@echo "$(GREEN)✅ База восстановлена$(NC)"

seed: ## Создать тестовые аккаунты (admin/doctor/reception/radiolog/lab)
	@echo "$(CYAN)🌱 Создание тестовых аккаунтов...$(NC)"
	@if [ -f backend/seed-docker.js ]; then \
		docker cp backend/seed-docker.js his_backend:/app/seed-docker.js; \
		docker exec his_backend node /app/seed-docker.js; \
	else \
		echo "$(YELLOW)⚠️  Файл backend/seed-docker.js не найден$(NC)"; \
	fi

seed-demo: ## Заполнить ВСЕ модули demo данными (кабинеты, тесты, приёмы, заказы)
	@echo "$(CYAN)🎬 Загрузка demo данных...$(NC)"
	@bash scripts/seed-all-data.sh

reset-db: ## Сбросить БД — УДАЛИТ ВСЕ ДАННЫЕ!
	@echo "$(RED)⚠️  ЭТО УДАЛИТ ВСЕ ДАННЫЕ В БД!$(NC)"
	@read -p "Точно? Напиши 'yes': " confirm && [ "$$confirm" = "yes" ] || exit 1
	docker-compose down
	docker volume rm his-medsystem_postgres_data 2>/dev/null || true
	docker-compose up -d
	@echo "$(GREEN)✅ БД сброшена и запущена заново$(NC)"

pgadmin: ## Запустить pgAdmin (http://localhost:5050)
	@echo "$(CYAN)🔧 Запуск pgAdmin...$(NC)"
	docker-compose --profile tools up -d pgadmin
	@echo "$(GREEN)✅ pgAdmin: http://localhost:5050$(NC)"
	@echo "   Email:    $${PGADMIN_EMAIL:-admin@his.local}"
	@echo "   Password: $${PGADMIN_PASSWORD:-admin}"

clean: ## Остановить контейнеры (данные сохраняются)
	docker-compose down --remove-orphans
	@echo "$(GREEN)✅ Контейнеры остановлены (volumes целы)$(NC)"

clean-all: ## Полная очистка включая volumes — УДАЛИТ ВСЕ ДАННЫЕ!
	@echo "$(RED)⚠️  ЭТО УДАЛИТ ВСЕ ДАННЫЕ ВКЛЮЧАЯ БД И UPLOADS!$(NC)"
	@read -p "Точно? Напиши 'destroy': " confirm && [ "$$confirm" = "destroy" ] || exit 1
	docker-compose down -v --remove-orphans
	@echo "$(GREEN)✅ Полная очистка выполнена$(NC)"

prune: ## Очистить Docker build cache
	@echo "$(CYAN)🧹 Очистка Docker cache...$(NC)"
	docker builder prune -f --filter until=24h
	docker image prune -f
	@echo "$(GREEN)✅ Очищено$(NC)"

health: ## Проверить здоровье всех сервисов
	@echo "$(CYAN)🩺 Проверка здоровья:$(NC)"
	@echo ""
	@echo "$(YELLOW)📦 Контейнеры:$(NC)"
	@docker-compose ps
	@echo ""
	@printf "$(YELLOW)🌐 Frontend:$(NC) "
	@curl -sf http://localhost > /dev/null 2>&1 && echo "$(GREEN)✅ OK$(NC)" || echo "$(RED)❌ Не отвечает$(NC)"
	@printf "$(YELLOW)🔌 Backend: $(NC) "
	@curl -sf http://localhost:3000/api/health > /dev/null 2>&1 && echo "$(GREEN)✅ OK$(NC)" || echo "$(RED)❌ Не отвечает$(NC)"
	@printf "$(YELLOW)🗄  Postgres:$(NC) "
	@docker-compose exec -T postgres pg_isready -U $${DB_USERNAME:-medical_user} > /dev/null 2>&1 \
		&& echo "$(GREEN)✅ OK$(NC)" || echo "$(RED)❌ Не готов$(NC)"

deploy: ## Полный deploy: backup → build → down → up
	@echo "$(CYAN)🚀 Deploy HIS-MedSystem...$(NC)"
	@$(MAKE) backup
	@$(MAKE) build
	@$(MAKE) down
	@$(MAKE) up
	@echo "$(YELLOW)Ожидание запуска...$(NC)"
	@$(MAKE) health
	@echo "$(GREEN)✅ Deploy завершён$(NC)"

update: ## Обновить из git → deploy
	@echo "$(CYAN)📥 Обновление из git...$(NC)"
	git pull origin main
	@$(MAKE) deploy
