#!/bin/bash
set -e

echo "🚀 Инициализация HIS-MedSystem..."

# Проверка что docker запущен
if ! docker info > /dev/null 2>&1; then
  echo "❌ Docker не запущен!"
  exit 1
fi

# Запуск docker-compose
echo "🐳 Запуск контейнеров..."
docker-compose up -d

# Ждём пока PostgreSQL запустится
echo "⏳ Ожидание PostgreSQL..."
sleep 10

# Ждём пока backend запустится
echo "⏳ Ожидание Backend..."
until curl -s http://localhost:3000/api/health > /dev/null 2>&1; do
  echo "  Backend ещё не готов, ждём..."
  sleep 3
done

echo "✅ Backend готов!"

echo "✅ Готово! Открой:"
echo "   Frontend: http://localhost"
echo "   API Docs: http://localhost:3000/api/docs"
echo "   pgAdmin:  http://localhost:5050 (только с профилем dev)"
