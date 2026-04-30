require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const { testConnection } = require('./config/db');
const empleadosRouter  = require('./routes/empleados');
const productosRouter  = require('./routes/productos');
const carritoRouter    = require('./routes/carrito');
const ordenesRouter    = require('./routes/ordenes');
const categoriasRouter = require('./routes/categorias');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors({ origin: 'http://localhost:5173', optionsSuccessStatus: 200 }));

// ── Body parsers (JSON para rutas normales, multipart lo maneja multer) ───────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Servir imágenes estáticas desde /uploads ──────────────────────────────────
const uploadsPath = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath));
console.log(`📁 Imágenes servidas desde: ${uploadsPath}`);

// ── Rutas API ─────────────────────────────────────────────────────────────────
app.use('/api/empleados',  empleadosRouter);
app.use('/api/productos',  productosRouter);
app.use('/api/carrito',    carritoRouter);
app.use('/api/ordenes',    ordenesRouter);
app.use('/api/categorias', categoriasRouter);

app.get('/api/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use((req, res) =>
  res.status(404).json({ success: false, error: `Ruta no encontrada: ${req.method} ${req.path}` })
);

// ── Arrancar ──────────────────────────────────────────────────────────────────
const start = async () => {
  await testConnection();
  app.listen(PORT, () => {
    console.log(`\n🚀 API en http://localhost:${PORT}`);
    console.log(`🖼️  Imágenes en http://localhost:${PORT}/uploads/productos/`);
    console.log(`📦 Productos: http://localhost:${PORT}/api/productos`);
    console.log(`🗂️  Categorías: http://localhost:${PORT}/api/categorias`);
    console.log(`🛒 Carrito:   http://localhost:${PORT}/api/carrito`);
    console.log(`📋 Órdenes:  http://localhost:${PORT}/api/ordenes\n`);
  });
};

start();
