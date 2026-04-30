import { createApp } from 'vue';
import App from './App.vue';
import './assets/main.css';
import logger from './utils/logger.js';

// Log de inicio de la aplicación
logger.info('🛒 Compra Carrito — Aplicación iniciada', {
  version:   '2.0.0',
  entorno:   import.meta.env.MODE,
  url:       window.location.href,
  timestamp: new Date().toISOString(),
});

// Capturar errores no manejados en el frontend
window.addEventListener('error', (e) => {
  logger.error('Error global no manejado', {
    message:  e.message,
    filename: e.filename,
    lineno:   e.lineno,
    colno:    e.colno,
  });
});

window.addEventListener('unhandledrejection', (e) => {
  logger.error('Promise rechazada no manejada', {
    reason: e.reason?.message || String(e.reason),
  });
});

// Log cuando el usuario recarga o abandona la página
window.addEventListener('beforeunload', () => {
  logger.info('Página cerrada/recargada por el usuario', {
    url:       window.location.href,
    timestamp: new Date().toISOString(),
  });
});

createApp(App).mount('#app');
logger.info('App Vue montada en #app');
