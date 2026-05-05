# ============================================
# Stage 1: Builder
# ============================================
FROM node:20-alpine AS builder

RUN apk add --no-cache tzdata
ENV TZ=Europe/Chisinau

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Angular project name: medical-app
RUN npm run build -- --configuration=production

# ============================================
# Stage 2: Nginx
# ============================================
FROM nginx:alpine AS production

RUN apk add --no-cache tzdata wget
ENV TZ=Europe/Chisinau

# Дефолтный конфиг nginx удаляем
RUN rm /etc/nginx/conf.d/default.conf

# Наш конфиг
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Angular build output (project name: medical-app)
COPY --from=builder /app/dist/medical-app/browser /usr/share/nginx/html

HEALTHCHECK --interval=30s --timeout=3s --start-period=15s \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
