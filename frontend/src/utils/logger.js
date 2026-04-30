/**
 * Frontend Logger — Winston-style para el navegador
 *
 * Niveles: debug < info < warn < error
 * En producción (PROD) solo muestra warn y error.
 * Cada entrada lleva: timestamp, nivel con color, mensaje y metadata estructurada.
 *
 * Uso:
 *   import logger from '@/utils/logger'
 *   logger.info('Carrito abierto', { items: 3, total: 99.99 })
 *   logger.warn('Stock bajo', { producto: 'Nike Air', stock: 2 })
 *   logger.error('Checkout falló', { error: 'Stock insuficiente' })
 *   logger.debug('Objeto carrito', { ...cartData })
 */

const IS_PROD = import.meta.env.PROD;

// ── Colores por nivel ──────────────────────────────────────────────────────────
const STYLES = {
  debug: 'color:#6b6960;font-weight:500',
  info:  'color:#2d6a4f;font-weight:600',
  warn:  'color:#e76f51;font-weight:700',
  error: 'color:#c1121f;font-weight:700;background:#fde8ea;padding:1px 4px;border-radius:3px',
  http:  'color:#1d4e89;font-weight:500',
};

const LEVEL_RANK = { debug: 0, http: 1, info: 2, warn: 3, error: 4 };
const MIN_LEVEL  = IS_PROD ? 'warn' : 'debug';

// ── Historial en memoria (últimos 200 logs) ────────────────────────────────────
const history = [];
const MAX_HISTORY = 200;

const pad = (n) => String(n).padStart(2, '0');

const timestamp = () => {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${String(d.getMilliseconds()).padStart(3,'0')}`;
};

const shouldLog = (level) =>
  LEVEL_RANK[level] >= LEVEL_RANK[MIN_LEVEL];

const log = (level, message, meta = {}) => {
  if (!shouldLog(level)) return;

  const ts      = timestamp();
  const entry   = { ts, level, message, meta, time: Date.now() };

  // Guardar en historial
  history.push(entry);
  if (history.length > MAX_HISTORY) history.shift();

  // Construir output
  const label   = `[${level.toUpperCase().padEnd(5)}]`;
  const style   = STYLES[level] || STYLES.info;
  const hasMeta = meta && Object.keys(meta).length > 0;

  if (level === 'error') {
    console.group(`%c${ts} ${label} ${message}`, style);
    if (hasMeta) console.log('  📋 Detalles:', meta);
    console.groupEnd();
  } else if (hasMeta) {
    console.groupCollapsed(`%c${ts} ${label}%c ${message}`, style, 'color:inherit;font-weight:400');
    console.log('  📋', meta);
    console.groupEnd();
  } else {
    console.log(`%c${ts} ${label}%c ${message}`, style, 'color:inherit;font-weight:400');
  }
};

// ── API pública ────────────────────────────────────────────────────────────────
const logger = {
  debug: (msg, meta) => log('debug', msg, meta),
  http:  (msg, meta) => log('http',  msg, meta),
  info:  (msg, meta) => log('info',  msg, meta),
  warn:  (msg, meta) => log('warn',  msg, meta),
  error: (msg, meta) => log('error', msg, meta),

  /** Retorna los últimos N logs del historial */
  getHistory: (n = 50) => history.slice(-n),

  /** Imprime el historial completo en consola */
  printHistory: () => {
    console.group('📜 Log History');
    history.forEach(e => console.log(`${e.ts} [${e.level}] ${e.message}`, e.meta));
    console.groupEnd();
  },
};

// Exponer en window para debug desde DevTools: window.__logger.printHistory()
if (!IS_PROD) window.__logger = logger;

export default logger;
