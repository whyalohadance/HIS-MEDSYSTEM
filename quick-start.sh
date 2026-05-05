#!/bin/bash
set -e

echo "╔════════════════════════════════════════════╗"
echo "║   🏥 HIS-MedSystem — Quick Start          ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# Проверка Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker не установлен"
    echo "Установи: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! docker compose version &> /dev/null && ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose не найден"
    exit 1
fi

# Создание директорий
mkdir -p backups backend/uploads backend/dicom

# Проверка .env
if [ ! -f .env ]; then
    echo "📝 Создаю .env из .env.example..."
    cp .env.example .env

    # Генерация JWT_SECRET
    if command -v openssl &> /dev/null; then
        SECRET=$(openssl rand -hex 32)
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|change-this-to-random-string-min-32-characters-very-important-secret|$SECRET|" .env
        else
            sed -i "s|change-this-to-random-string-min-32-characters-very-important-secret|$SECRET|" .env
        fi
        echo "✅ JWT_SECRET сгенерирован"
    else
        echo "⚠️  openssl не найден — замени JWT_SECRET в .env вручную!"
    fi
fi

# Запуск
echo ""
echo "🐳 Запуск Docker..."
docker-compose up -d

echo ""
echo "⏳ Ожидание готовности сервисов..."
TIMEOUT=90
ELAPSED=0

while [ $ELAPSED -lt $TIMEOUT ]; do
    if curl -sf http://localhost:3000/api/health > /dev/null 2>&1; then
        break
    fi
    printf "."
    sleep 3
    ELAPSED=$((ELAPSED + 3))
done
echo ""

# Проверка
echo ""
echo "🩺 Проверка сервисов..."
if curl -sf http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "  ✅ Backend готов"
else
    echo "  ⚠️  Backend ещё не готов — подожди ~30 сек и проверь: make health"
fi

if curl -sf http://localhost > /dev/null 2>&1; then
    echo "  ✅ Frontend готов"
else
    echo "  ⚠️  Frontend ещё не готов"
fi

echo ""
echo "╔════════════════════════════════════════════╗"
echo "║              ✅ Готово!                    ║"
echo "╚════════════════════════════════════════════╝"
echo ""
echo "  🌐 Frontend:  http://localhost"
echo "  🔌 Backend:   http://localhost:3000/api/health"
echo "  📚 API Docs:  http://localhost:3000/api/docs"
echo ""
echo "  👤 Тестовые аккаунты (пароль: password123):"
echo "     admin@med.com       → Admin"
echo "     doctor@med.com      → Doctor"
echo "     reception@med.com   → Reception"
echo "     radiolog@med.com    → Radiologist"
echo "     lab@med.com         → Lab Technician"
echo ""
echo "  📖 Все команды: make help"
echo ""
