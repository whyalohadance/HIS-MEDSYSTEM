# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Копируем package files
COPY package*.json ./

# Устанавливаем ВСЕ зависимости (включая dev для билда)
RUN npm ci

# Копируем исходники
COPY . .

# Билдим приложение
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS production

WORKDIR /app

# Устанавливаем wget для healthcheck
RUN apk add --no-cache wget

# Копируем package files
COPY package*.json ./

# Устанавливаем ТОЛЬКО production зависимости
RUN npm ci --only=production && npm cache clean --force

# Копируем готовый билд из builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/fonts ./fonts

# Создаём папку для uploads
RUN mkdir -p uploads && chown -R node:node uploads

# Используем непривилегированного пользователя
USER node

# Открываем порт
EXPOSE 3000

# Запуск
CMD ["node", "dist/main"]
