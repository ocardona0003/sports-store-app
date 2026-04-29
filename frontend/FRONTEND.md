# 🎨 Frontend — Documentación

Aplicación SPA construida con **Vue 3 + Vite**.  
Incluye gestión de empleados (CRUD) y tienda deportiva (catálogo, carrito, checkout).

---

## Índice

1. [Requisitos](#1-requisitos)
2. [Instalación local](#2-instalación-local)
3. [Variables de entorno](#3-variables-de-entorno)
4. [Ejecutar en desarrollo](#4-ejecutar-en-desarrollo)
5. [Compilar para producción](#5-compilar-para-producción)
6. [Estructura del proyecto](#6-estructura-del-proyecto)
7. [Despliegue con Docker](#7-despliegue-con-docker)
8. [Despliegue completo (Frontend + Backend + MySQL)](#8-despliegue-completo-frontend--backend--mysql)
9. [Solución de problemas](#9-solución-de-problemas)

---

## 1. Requisitos

| Herramienta | Versión mínima | Verificar |
|-------------|----------------|-----------|
| Node.js     | 18.x           | `node -v` |
| npm         | 9.x            | `npm -v`  |
| Docker      | 24.x *(opcional)* | `docker -v` |
| Docker Compose | 2.x *(opcional)* | `docker compose version` |

---

## 2. Instalación local

```bash
# Entrar a la carpeta del frontend
cd frontend

# Instalar dependencias
npm install
```

No requiere archivo `.env` para desarrollo local — la URL del backend se configura
a través del proxy de Vite (ver siguiente sección).

---

## 3. Variables de entorno

### Desarrollo (proxy de Vite)

En desarrollo, Vite redirige automáticamente las llamadas `/api/*` al backend.
La configuración está en `frontend/vite.config.js`:

```js
server: {
  port: 5173,
  proxy: {
    '/api': { target: 'http://localhost:3000', changeOrigin: true },
  },
},
```

Si tu backend corre en un puerto diferente, cambia `http://localhost:3000` por el correcto.

### Producción

Para producción crea el archivo `frontend/.env.production`:

```env
VITE_API_URL=http://tu-servidor.com
```

Y actualiza el archivo `frontend/src/services/tienda.js` y `empleados.js` para usar:

```js
const BASE = import.meta.env.VITE_API_URL + '/api/empleados';
```

---

## 4. Ejecutar en desarrollo

```bash
cd frontend
npm run dev
```

La aplicación abre en `http://localhost:5173`.

> ⚠️ El backend debe estar corriendo en `http://localhost:3000` para que las llamadas API funcionen.

### Orden de inicio recomendado

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

---

## 5. Compilar para producción

```bash
cd frontend

# Genera los archivos estáticos en frontend/dist/
npm run build

# Previsualizar el build localmente
npm run preview
```

Los archivos compilados en `dist/` se sirven con cualquier servidor web estático
(Nginx, Apache, Netlify, Vercel, etc.).

---

## 6. Estructura del proyecto

```
frontend/
├── index.html                  # Punto de entrada HTML
├── vite.config.js              # Configuración de Vite y proxy
├── package.json
└── src/
    ├── main.js                 # Monta la app Vue
    ├── App.vue                 # Componente raíz con navegación por tabs
    ├── assets/
    │   └── main.css            # Design system (variables CSS, botones, formularios)
    ├── views/
    │   ├── TiendaView.vue      # Vista principal de la tienda
    │   └── EmpleadosView.vue   # CRUD de empleados
    ├── components/
    │   ├── ProductCard.vue     # Tarjeta de producto con controles de cantidad
    │   ├── CartDrawer.vue      # Panel lateral del carrito
    │   ├── CheckoutModal.vue   # Modal de finalizar compra
    │   ├── OrderSuccessModal.vue  # Confirmación post-compra
    │   ├── OrderHistory.vue    # Historial de compras por email
    │   ├── EmpleadoForm.vue    # Modal crear/editar empleado
    │   └── ConfirmDialog.vue   # Diálogo de confirmación de borrado
    └── services/
        ├── tienda.js           # Llamadas HTTP: productos, carrito, órdenes
        └── empleados.js        # Llamadas HTTP: empleados
```

---

## 7. Despliegue con Docker

### 7.1 Crear `Dockerfile` en `frontend/`

```dockerfile
# frontend/Dockerfile

# ── Etapa 1: Build ─────────────────────────────────────────
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# URL del backend en producción (se inyecta en build time)
ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ── Etapa 2: Servir con Nginx ───────────────────────────────
FROM nginx:alpine

# Copiar archivos compilados
COPY --from=builder /app/dist /usr/share/nginx/html

# Configuración de Nginx para Vue Router (SPA)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 7.2 Crear `nginx.conf` en `frontend/`

```nginx
# frontend/nginx.conf
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Compresión gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript
               text/xml application/xml image/svg+xml;

    # Cache para assets con hash en el nombre
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # SPA fallback: todas las rutas sirven index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy al backend para evitar CORS (opcional en producción)
    location /api/ {
        proxy_pass http://backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### 7.3 Crear `.dockerignore` en `frontend/`

```
node_modules
dist
.env*
*.log
.git
```

### 7.4 Construir la imagen

```bash
cd frontend

docker build \
  --build-arg VITE_API_URL=http://tu-servidor.com \
  -t sports-frontend:1.0 \
  .
```

> Reemplaza `http://tu-servidor.com` por la URL real de tu backend.

### 7.5 Ejecutar el contenedor

```bash
docker run -d \
  --name sports-frontend \
  -p 80:80 \
  sports-frontend:1.0
```

La aplicación queda accesible en `http://localhost`.

### 7.6 Ver logs de Nginx

```bash
docker logs -f sports-frontend
```

---

## 8. Despliegue completo (Frontend + Backend + MySQL)

Crea o actualiza `docker-compose.yml` en la **raíz del proyecto** (`crud-app/`):

```yaml
# crud-app/docker-compose.yml
version: '3.9'

services:

  # ── MySQL ──────────────────────────────────────────────────────────────────
  mysql:
    image: mysql:8.0
    container_name: sports-mysql
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: crud_db
      MYSQL_USER: appuser
      MYSQL_PASSWORD: apppassword
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      - ./backend/database.sql:/docker-entrypoint-initdb.d/01-database.sql
      - ./backend/tienda.sql:/docker-entrypoint-initdb.d/02-tienda.sql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-prootpassword"]
      interval: 10s
      timeout: 5s
      retries: 10
      start_period: 30s
    networks:
      - sports-net

  # ── Backend ────────────────────────────────────────────────────────────────
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: sports-backend
    restart: unless-stopped
    depends_on:
      mysql:
        condition: service_healthy
    ports:
      - "3000:3000"
    environment:
      PORT: 3000
      DB_HOST: mysql
      DB_PORT: 3306
      DB_USER: appuser
      DB_PASSWORD: apppassword
      DB_NAME: crud_db
      SMTP_HOST: smtp.gmail.com
      SMTP_PORT: 465
      SMTP_USER: ${SMTP_USER}
      SMTP_PASS: ${SMTP_PASS}
      EMAIL_FROM: ${EMAIL_FROM}
    networks:
      - sports-net

  # ── Frontend ───────────────────────────────────────────────────────────────
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        # El frontend en producción llama al backend por /api (proxy Nginx)
        # Si backend tiene IP/dominio público, ponlo aquí
        VITE_API_URL: http://localhost:3000
    container_name: sports-frontend
    restart: unless-stopped
    depends_on:
      - backend
    ports:
      - "80:80"
    networks:
      - sports-net

networks:
  sports-net:
    driver: bridge

volumes:
  mysql_data:
```

Crea también `crud-app/.env` con las variables sensibles:

```env
# crud-app/.env
SMTP_USER=tucorreo@gmail.com
SMTP_PASS=abcdefghijklmnop
EMAIL_FROM=tucorreo@gmail.com
```

### Levantar todo el stack

```bash
cd crud-app

# Primera vez: construye imágenes y levanta contenedores
docker compose up -d --build

# Verificar que todo está corriendo
docker compose ps
```

Salida esperada:

```
NAME               STATUS          PORTS
sports-mysql       healthy         0.0.0.0:3306->3306/tcp
sports-backend     running         0.0.0.0:3000->3000/tcp
sports-frontend    running         0.0.0.0:80->80/tcp
```

Acceder a la aplicación: **`http://localhost`**

### Comandos de gestión

```bash
# Ver logs de todos los servicios
docker compose logs -f

# Ver logs de un servicio específico
docker compose logs -f frontend
docker compose logs -f backend
docker compose logs -f mysql

# Detener todos los servicios (conserva datos)
docker compose down

# Detener y borrar volúmenes (elimina datos de MySQL)
docker compose down -v

# Reconstruir solo el frontend tras cambios en código
docker compose up -d --build frontend

# Reiniciar un servicio sin reconstruir
docker compose restart backend
```

---

## 9. Solución de problemas

### ❌ La app carga pero las llamadas API fallan (404 o CORS)

En **desarrollo**: verifica que el backend esté corriendo en el puerto que apunta
el proxy en `vite.config.js`:

```js
proxy: {
  '/api': { target: 'http://localhost:3000', changeOrigin: true },
}
```

En **Docker**: verifica que el bloque `location /api/` en `nginx.conf` apunte
al nombre correcto del servicio backend (`backend:3000`).

### ❌ Pantalla en blanco después del build

La app usa Vue Router con historial HTML5. Nginx debe redirigir todas las rutas
a `index.html`. Verifica que `nginx.conf` tenga:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### ❌ La imagen de Docker es muy grande

Asegúrate de que el `.dockerignore` excluye `node_modules` y `dist`. Con el
build multietapa la imagen final de Nginx pesa menos de 30 MB.

### ❌ El carrito se pierde al recargar la página

El `session_id` se guarda en `localStorage`. Si borras el almacenamiento del
navegador, se genera uno nuevo y el carrito anterior queda huérfano en la BD.

### ❌ `ERR_CONNECTION_REFUSED` al llamar al backend desde Docker

El nombre `backend` en el proxy de Nginx funciona solo dentro de la red Docker.
Para acceder desde fuera del contenedor (ej. Postman), usa `http://localhost:3000`.
