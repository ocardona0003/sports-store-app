# 👥 CRUD Empleados — Node.js + Vue 3 + MySQL

CRUD completo con backend REST y frontend SPA. Tabla de empleados con búsqueda, filtros y paginación.

---

## 🗂️ Estructura

```
crud-app/
├── backend/                  # Node.js + Express + MySQL
│   ├── src/
│   │   ├── index.js          # Servidor Express
│   │   ├── config/db.js      # Pool de conexiones MySQL
│   │   ├── controllers/
│   │   │   └── empleadosController.js
│   │   └── routes/
│   │       └── empleados.js
│   ├── database.sql          # Script SQL (crear DB + tabla + datos)
│   ├── package.json
│   └── .env.example
│
└── frontend/                 # Vue 3 + Vite
    ├── src/
    │   ├── App.vue           # Vista principal (tabla CRUD)
    │   ├── main.js
    │   ├── assets/main.css   # Design system
    │   ├── components/
    │   │   ├── EmpleadoForm.vue    # Modal crear/editar
    │   │   └── ConfirmDialog.vue   # Modal confirmar borrado
    │   └── services/
    │       └── empleados.js  # Capa de llamadas HTTP
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## 🚀 Instalación y uso

### 1. Base de datos MySQL

```bash
mysql -u root -p < backend/database.sql
```

Esto crea la base de datos `crud_db`, la tabla `empleados` y carga 6 registros de ejemplo.

### 2. Backend

```bash
cd backend

# Copiar y editar variables de entorno
cp .env.example .env
# Edita .env con tus credenciales de MySQL

npm install
npm run dev      # Puerto 3000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev      # Puerto 5173
```

Abre http://localhost:5173 en tu navegador.

---

## 🌐 API Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/empleados` | Listar (búsqueda, filtro, paginación) |
| GET | `/api/empleados/:id` | Obtener uno |
| POST | `/api/empleados` | Crear |
| PUT | `/api/empleados/:id` | Actualizar |
| DELETE | `/api/empleados/:id` | Eliminar |
| GET | `/api/empleados/departamentos` | Departamentos únicos |

### Parámetros de query para GET /api/empleados

| Param | Tipo | Descripción | Default |
|-------|------|-------------|---------|
| `search` | string | Busca en nombre, apellido, email, cargo | — |
| `departamento` | string | Filtra por departamento exacto | — |
| `page` | number | Página actual | 1 |
| `limit` | number | Registros por página | 10 |

---

## ✅ Funcionalidades

- **Listar** con búsqueda en tiempo real (debounce 350ms)
- **Filtro** por departamento
- **Paginación** con navegación por páginas
- **Crear** con validación cliente + servidor
- **Editar** modal prellenado con datos actuales
- **Eliminar** con diálogo de confirmación
- **Toasts** de éxito / error
- Verificación de email duplicado en create y update
- Validación con `express-validator` en el servidor
- Pool de conexiones MySQL con `mysql2/promise`
- CORS configurado para desarrollo

---

## 🔧 Variables de entorno (backend/.env)

```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=crud_db
```

---

## 🏆 Módulo Tienda Deportiva

### Setup adicional

```bash
# Crear tablas de la tienda y cargar 12 productos de ejemplo
mysql -u root -p crud_db < backend/tienda.sql
```

### Nuevas tablas MySQL

| Tabla | Descripción |
|-------|-------------|
| `productos` | Catálogo con nombre, categoría, precio, stock, imagen |
| `carrito_items` | Items del carrito por `session_id` (anónimo) |
| `ordenes` | Historial de compras con datos del cliente |
| `orden_items` | Detalle de cada orden (snapshot de precio/nombre) |

### Nuevos endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/productos` | Catálogo con paginación y filtros |
| GET | `/api/productos/:id` | Detalle de producto |
| GET | `/api/carrito/:sessionId` | Ver carrito |
| POST | `/api/carrito/:sessionId/items` | Agregar al carrito |
| PUT | `/api/carrito/:sessionId/items/:itemId` | Actualizar cantidad |
| DELETE | `/api/carrito/:sessionId/items/:itemId` | Eliminar item |
| POST | `/api/ordenes/checkout` | Finalizar compra |
| GET | `/api/ordenes?email=` | Historial por email |
| GET | `/api/ordenes/:id` | Detalle de orden |

### Flujo de checkout

1. Valida que el carrito no esté vacío
2. Verifica stock de **todos** los productos
3. Si hay stock insuficiente → devuelve error detallado
4. Crea la orden y sus ítems en una **transacción SQL**
5. Descuenta el stock de cada producto
6. Vacía el carrito
7. Envía email de confirmación con Nodemailer (Ethereal en dev)

### Email en desarrollo

El servidor crea automáticamente una cuenta Ethereal al arrancar.
El preview URL aparece en los logs:
```
📧 Ethereal test account: abc@ethereal.email
   Ver emails en: https://ethereal.email
```

Para usar tu propio SMTP, agrega en `.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu@gmail.com
SMTP_PASS=app_password
```
