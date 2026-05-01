# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Копируем package files
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci

# Копируем исходники
COPY . .

# Билдим production версию
RUN npm run build -- --configuration=production

# Stage 2: Nginx
FROM nginx:alpine AS production

# Удаляем дефолтный конфиг nginx
RUN rm /etc/nginx/conf.d/default.conf

# Копируем наш конфиг
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Копируем готовый билд (Angular project name: medical-app)
COPY --from=builder /app/dist/medical-app/browser /usr/share/nginx/html

# Открываем порт 80
EXPOSE 80

# Запуск nginx в foreground режиме
CMD ["nginx", "-g", "daemon off;"]
