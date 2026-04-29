require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const { testConnection } = require('./config/db');
const empleadosRouter  = require('./routes/empleados');
const productosRouter  = require('./routes/productos');
const carritoRouter    = require('./routes/carrito');
const ordenesRouter    = require('./routes/ordenes');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: 'http://localhost:5173', optionsSuccessStatus: 200 }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/empleados',  empleadosRouter);
app.use('/api/productos',  productosRouter);
app.use('/api/carrito',    carritoRouter);
app.use('/api/ordenes',    ordenesRouter);

app.get('/api/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use((req, res) =>
  res.status(404).json({ success: false, error: `Ruta no encontrada: ${req.method} ${req.path}` })
);

const start = async () => {
  await testConnection();
  app.listen(PORT, () => {
    console.log(`\n🚀 Servidor en http://localhost:${PORT}`);
    console.log(`📦 Productos: http://localhost:${PORT}/api/productos`);
    console.log(`🛒 Carrito:   http://localhost:${PORT}/api/carrito`);
    console.log(`📋 Órdenes:  http://localhost:${PORT}/api/ordenes\n`);
  });
};

start();
