# 🖥️ Backend — Documentación

API REST construida con **Node.js + Express + MySQL**.  
Gestiona empleados, catálogo de productos, carrito de compras, órdenes y envío de emails.

---

## Índice

1. [Requisitos](#1-requisitos)
2. [Instalación local](#2-instalación-local)
3. [Variables de entorno](#3-variables-de-entorno)
4. [Configuración de base de datos](#4-configuración-de-base-de-datos)
5. [Configuración SMTP (Gmail)](#5-configuración-smtp-gmail)
6. [Ejecutar en desarrollo](#6-ejecutar-en-desarrollo)
7. [Endpoints disponibles](#7-endpoints-disponibles)
8. [Despliegue con Docker](#8-despliegue-con-docker)
9. [Despliegue completo (Backend + MySQL) con Docker Compose](#9-despliegue-completo-backend--mysql-con-docker-compose)
10. [Solución de problemas](#10-solución-de-problemas)

---

## 1. Requisitos

| Herramienta | Versión mínima | Verificar |
|-------------|----------------|-----------|
| Node.js     | 18.x           | `node -v` |
| npm         | 9.x            | `npm -v`  |
| MySQL       | 8.0            | `mysql --version` |
| Docker      | 24.x *(opcional)* | `docker -v` |
| Docker Compose | 2.x *(opcional)* | `docker compose version` |

---

## 2. Instalación local

```bash
# Entrar a la carpeta del backend
cd backend

# Instalar dependencias
npm install

# Crear archivo de entorno
cp .env.example .env
```

Edita `.env` con tus valores reales (ver sección siguiente).

---

## 3. Variables de entorno

Archivo: `backend/.env`

```env
# ── Servidor ────────────────────────────────────────────────
PORT=3000

# ── MySQL ───────────────────────────────────────────────────
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_password_segura
DB_NAME=crud_db

# ── SMTP (Gmail) ────────────────────────────────────────────
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=tucorreo@gmail.com
SMTP_PASS=abcdefghijklmnop
EMAIL_FROM=tucorreo@gmail.com
```

### Descripción de cada variable

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `PORT` | Puerto en que escucha la API | `3000` |
| `DB_HOST` | Host del servidor MySQL | `localhost` o IP del contenedor |
| `DB_PORT` | Puerto MySQL | `3306` |
| `DB_USER` | Usuario de MySQL | `root` |
| `DB_PASSWORD` | Contraseña de MySQL | `MiPass123!` |
| `DB_NAME` | Nombre de la base de datos | `crud_db` |
| `SMTP_HOST` | Servidor SMTP | `smtp.gmail.com` |
| `SMTP_PORT` | Puerto SMTP (`465` = SSL, `587` = STARTTLS) | `465` |
| `SMTP_USER` | Correo del remitente | `tucorreo@gmail.com` |
| `SMTP_PASS` | App Password de Gmail (16 caracteres, sin espacios) | `abcdefghijklmnop` |
| `EMAIL_FROM` | Nombre/email que aparece como remitente | `tucorreo@gmail.com` |

> ⚠️ **Nunca** subas el archivo `.env` a un repositorio. Está incluido en `.gitignore`.

---

## 4. Configuración de base de datos

### 4.1 Crear la base de datos y tabla de empleados

```bash
mysql -u root -p < database.sql
```

Este script crea:
- Base de datos `crud_db`
- Tabla `empleados` con índices
- 6 registros de ejemplo

### 4.2 Crear tablas del módulo Tienda

```bash
mysql -u root -p < tienda.sql
```

Este script crea:
- Tabla `productos` — catálogo deportivo
- Tabla `carrito_items` — carrito por sesión
- Tabla `ordenes` — historial de compras
- Tabla `orden_items` — detalle de cada orden
- 12 productos de ejemplo

### 4.3 Esquema completo de tablas

```
crud_db
├── empleados        (id, nombre, apellido, email, telefono,
│                     departamento, cargo, salario, activo)
├── productos        (id, nombre, categoria, descripcion,
│                     precio, stock, imagen_url, activo)
├── carrito_items    (id, session_id, producto_id, cantidad)
├── ordenes          (id, session_id, cliente_nombre,
│                     cliente_email, total, estado, notas)
└── orden_items      (id, orden_id, producto_id, nombre,
                      precio, cantidad, subtotal)
```

### 4.4 Verificar conexión

Al iniciar el servidor verás:

```
✅ Conexión a MySQL establecida correctamente
```

Si ves un error, revisa `DB_HOST`, `DB_PORT`, `DB_USER` y `DB_PASSWORD` en `.env`.

---

## 5. Configuración SMTP (Gmail)

El servidor envía un email HTML de confirmación al finalizar cada compra.

### 5.1 Habilitar verificación en 2 pasos

1. Ir a [myaccount.google.com/security](https://myaccount.google.com/security)
2. Activar **Verificación en 2 pasos** si no está activa

### 5.2 Crear App Password

1. Ir a [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Seleccionar **"Otro (nombre personalizado)"**
3. Escribir `Sports Store` → clic en **Generar**
4. Copiar las **16 letras** generadas

### 5.3 Configurar en `.env`

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=tucorreo@gmail.com
SMTP_PASS=abcdefghijklmnop
EMAIL_FROM=tucorreo@gmail.com
```

> ⚠️ Escribe `SMTP_PASS` **sin espacios**. La App Password tiene 16 caracteres exactos.

### 5.4 Verificar configuración

Al iniciar el servidor con credenciales correctas:

```
📨 Configurando SMTP: smtp.gmail.com:465 (SSL)
✅ SMTP verificado: smtp.gmail.com:465 (tucorreo@gmail.com)
```

Si las credenciales son incorrectas:

```
❌ SMTP verify falló: Invalid login: 535-5.7.8 Username and Password not accepted
```

### 5.5 Modo desarrollo sin SMTP

Si no configuras `SMTP_USER`/`SMTP_PASS`, el servidor crea automáticamente una cuenta
en [Ethereal](https://ethereal.email) para simular el envío. El email no llega realmente
pero puedes verlo en el link que aparece en consola:

```
📧 Ethereal: test.user@ethereal.email  |  https://ethereal.email
✅ Email enviado → cliente@ejemplo.com
   Preview: https://ethereal.email/message/ABC123
```

---

## 6. Ejecutar en desarrollo

```bash
cd backend

# Con recarga automática (nodemon)
npm run dev

# Sin recarga automática
npm start
```

El servidor arranca en `http://localhost:3000`.

---

## 7. Endpoints disponibles

### Health check
```
GET /api/health
```

### Empleados
```
GET    /api/empleados              Lista con búsqueda y paginación
GET    /api/empleados/departamentos  Departamentos únicos
GET    /api/empleados/:id          Detalle
POST   /api/empleados              Crear
PUT    /api/empleados/:id          Actualizar
DELETE /api/empleados/:id          Eliminar
```

### Productos
```
GET /api/productos          Lista con filtro por categoría y paginación
GET /api/productos/:id      Detalle
```

### Carrito
```
GET    /api/carrito/:sessionId                    Ver carrito
POST   /api/carrito/:sessionId/items              Agregar producto
PUT    /api/carrito/:sessionId/items/:itemId      Actualizar cantidad
DELETE /api/carrito/:sessionId/items/:itemId      Eliminar producto
```

### Órdenes
```
POST /api/ordenes/checkout      Finalizar compra (valida stock, envía email)
GET  /api/ordenes?email=        Historial por email
GET  /api/ordenes/:id           Detalle de orden
```

---

## 8. Despliegue con Docker

### 8.1 Crear `Dockerfile` en la carpeta `backend/`

```dockerfile
# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

# Instalar dependencias primero (aprovecha cache de capas)
COPY package*.json ./
RUN npm ci --omit=dev

# Copiar código fuente
COPY . .

# Exponer puerto
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["node", "src/index.js"]
```

### 8.2 Crear `.dockerignore` en `backend/`

```
node_modules
.env
*.log
.git
```

### 8.3 Construir la imagen

```bash
cd backend
docker build -t sports-backend:1.0 .
```

### 8.4 Ejecutar el contenedor

```bash
docker run -d \
  --name sports-backend \
  -p 3000:3000 \
  -e PORT=3000 \
  -e DB_HOST=host.docker.internal \
  -e DB_PORT=3306 \
  -e DB_USER=root \
  -e DB_PASSWORD=tu_password \
  -e DB_NAME=crud_db \
  -e SMTP_HOST=smtp.gmail.com \
  -e SMTP_PORT=465 \
  -e SMTP_USER=tucorreo@gmail.com \
  -e SMTP_PASS=abcdefghijklmnop \
  -e EMAIL_FROM=tucorreo@gmail.com \
  sports-backend:1.0
```

> 💡 `host.docker.internal` apunta al MySQL de tu máquina local desde dentro del contenedor.  
> En Linux puede requerir `--add-host=host.docker.internal:host-gateway`.

### 8.5 Ver logs

```bash
docker logs -f sports-backend
```

---

## 9. Despliegue completo (Backend + MySQL) con Docker Compose

Crea el archivo `docker-compose.yml` en la **raíz del proyecto** (`crud-app/`):

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

networks:
  sports-net:
    driver: bridge

volumes:
  mysql_data:
```

Crea también un archivo `.env` en la raíz del proyecto para las variables sensibles:

```env
# crud-app/.env  (para Docker Compose)
SMTP_USER=tucorreo@gmail.com
SMTP_PASS=abcdefghijklmnop
EMAIL_FROM=tucorreo@gmail.com
```

### Levantar todo

```bash
cd crud-app

# Primera vez: construye imágenes e inicia servicios
docker compose up -d --build

# Ver estado
docker compose ps

# Ver logs en tiempo real
docker compose logs -f backend
```

### Comandos útiles

```bash
# Detener todos los servicios
docker compose down

# Detener y eliminar volúmenes (borra datos de MySQL)
docker compose down -v

# Reconstruir solo el backend tras cambios
docker compose up -d --build backend

# Acceder a MySQL dentro del contenedor
docker compose exec mysql mysql -u appuser -papppassword crud_db
```

---

## 10. Solución de problemas

### ❌ `ECONNREFUSED` al conectar a MySQL

- Verifica que MySQL esté corriendo: `mysql -u root -p`
- En Docker, asegúrate de que el servicio `mysql` esté `healthy` antes de iniciar `backend`
- Revisa `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` en `.env`

### ❌ `Access denied for user`

```bash
# Crear usuario y dar permisos manualmente
mysql -u root -p
CREATE USER 'appuser'@'%' IDENTIFIED BY 'apppassword';
GRANT ALL PRIVILEGES ON crud_db.* TO 'appuser'@'%';
FLUSH PRIVILEGES;
```

### ❌ `Table doesn't exist`

No se ejecutaron los scripts SQL. Ejecuta manualmente:

```bash
mysql -u root -p crud_db < backend/database.sql
mysql -u root -p crud_db < backend/tienda.sql
```

### ❌ Email con Timeout

1. Verifica que el puerto 465 esté abierto: `telnet smtp.gmail.com 465`
2. Confirma que `SMTP_PASS` tiene exactamente 16 caracteres sin espacios
3. Asegúrate de que la verificación en 2 pasos esté activa en Google
4. La App Password debe haberse generado en [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)

### ❌ Puerto 3000 en uso

```bash
# Ver qué proceso usa el puerto
lsof -i :3000       # macOS / Linux
netstat -ano | findstr :3000  # Windows

# Cambiar el puerto en .env
PORT=3001
```
