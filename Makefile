.PHONY: up down build logs restart clean dev help

help:
	@echo "HIS-MedSystem — comenzi disponibile:"
	@echo "  make up       - Pornește toate serviciile Docker"
	@echo "  make down     - Oprește toate serviciile"
	@echo "  make build    - Reconstruiește imaginile Docker"
	@echo "  make logs     - Afișează logurile"
	@echo "  make restart  - Repornește serviciile"
	@echo "  make clean    - Șterge toate containerele și volumele"
	@echo "  make dev      - Pornește doar PostgreSQL pentru dezvoltare"

up:
	docker-compose up -d
	@echo "HIS-MedSystem pornit la http://localhost"

down:
	docker-compose down
	@echo "HIS-MedSystem oprit"

build:
	docker-compose up --build -d
	@echo "Rebuild complet"

logs:
	docker-compose logs -f

logs-backend:
	docker logs his_backend -f

logs-frontend:
	docker logs his_frontend -f

restart:
	docker-compose restart
	@echo "Servicii repornite"

clean:
	docker-compose down -v --rmi all
	@echo "Curatat complet"

dev:
	docker-compose -f docker-compose.dev.yml up -d
	@echo "PostgreSQL pornit pentru dezvoltare locala"
	@echo "  Backend:  cd backend && npm run start:dev"
	@echo "  Frontend: cd frontend && ng serve"

status:
	docker-compose ps
