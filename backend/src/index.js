require('dotenv').config();
const express      = require('express');
const cors         = require('cors');
const path         = require('path');
const swaggerUi    = require('swagger-ui-express');
const swaggerSpec  = require('./config/swagger');
const logger       = require('./config/logger');
const { testConnection } = require('./config/db');

// ── Rutas ─────────────────────────────────────────────────────────────────────
const authRouter       = require('./routes/auth');
const empleadosRouter  = require('./routes/empleados');
const productosRouter  = require('./routes/productos');
const carritoRouter    = require('./routes/carrito');
const ordenesRouter    = require('./routes/ordenes');
const categoriasRouter = require('./routes/categorias');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors({ origin: 'http://localhost:5173', optionsSuccessStatus: 200 }));

// ── Body parsers ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ── HTTP Logger (Winston) ─────────────────────────────────────────────────────
app.use(logger.httpMiddleware);

// ── Imágenes estáticas ────────────────────────────────────────────────────────
const uploadsPath = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath));
logger.info('Imágenes estáticas habilitadas', { path: uploadsPath });

// ── Swagger UI ────────────────────────────────────────────────────────────────
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: '🏆 Sports Store API Docs',
  customCss: `
    .swagger-ui .topbar { background: #1c1b18; }
    .swagger-ui .info .title { color: #1c1b18; }
    .swagger-ui .btn.authorize { background: #2d6a4f; border-color: #2d6a4f; }
    .swagger-ui .opblock.opblock-post .opblock-summary { border-color: #2d6a4f; }
  `,
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    tryItOutEnabled: false,
  },
}));
app.get('/api/docs.json', (_, res) => res.json(swaggerSpec));
logger.info('Swagger UI disponible en /api/docs');

// ── Rutas API ─────────────────────────────────────────────────────────────────
app.use('/api/auth',       authRouter);
app.use('/api/empleados',  empleadosRouter);
app.use('/api/productos',  productosRouter);
app.use('/api/carrito',    carritoRouter);
app.use('/api/ordenes',    ordenesRouter);
app.use('/api/categorias', categoriasRouter);

app.get('/api/health', (_, res) => {
  logger.debug('Health check solicitado');
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  logger.warn('Ruta no encontrada', { method: req.method, url: req.originalUrl });
  res.status(404).json({ success: false, error: `Ruta no encontrada: ${req.method} ${req.path}` });
});

// ── Error global ──────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error('Error no controlado', { error: err.message, stack: err.stack, url: req.originalUrl });
  res.status(500).json({ success: false, error: 'Error interno del servidor.' });
});

// ── Arrancar ──────────────────────────────────────────────────────────────────
const start = async () => {
  await testConnection();
  app.listen(PORT, () => {
    logger.info(`API iniciada`, { port: PORT, env: process.env.NODE_ENV || 'development' });
    console.log(`\n🚀  http://localhost:${PORT}`);
    console.log(`📖  Swagger: http://localhost:${PORT}/api/docs`);
    console.log(`🔐  Auth:    http://localhost:${PORT}/api/auth/login\n`);
  });
};


start();


