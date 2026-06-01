# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:20-alpine AS deps

WORKDIR /app

# Системные зависимости (нативные модули + tzdata)
RUN apk add --no-cache python3 make g++ tzdata
ENV TZ=Europe/Chisinau

COPY package*.json ./
RUN npm ci

# ============================================
# Stage 2: Builder
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache tzdata
ENV TZ=Europe/Chisinau

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# ============================================
# Stage 3: Production runtime
# ============================================
FROM node:20-alpine AS production

# wget (healthcheck), tzdata, curl, postgresql-client (pg_dump/psql), gzip
RUN apk add --no-cache wget tzdata curl postgresql-client gzip
ENV TZ=Europe/Chisinau

WORKDIR /app

# Production зависимости
COPY package*.json ./
RUN npm ci --only=production --omit=dev && npm cache clean --force

# Скомпилированный билд
COPY --from=builder /app/dist ./dist

# Шрифты для PDF-отчётов
COPY --from=builder /app/fonts ./fonts

# Папки для файлов (перемонтируются как Docker volumes)
RUN mkdir -p uploads dicom backups && chown -R node:node uploads dicom backups

# Непривилегированный пользователь
USER node

EXPOSE 3000

CMD ["node", "dist/main.js"]
