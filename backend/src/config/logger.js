const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs   = require('fs');

// Asegurar que exista la carpeta de logs
const LOGS_DIR = path.join(__dirname, '../../logs');
if (!fs.existsSync(LOGS_DIR)) fs.mkdirSync(LOGS_DIR, { recursive: true });

const { combine, timestamp, printf, colorize, errors, json, splat } = winston.format;

// ── Formato consola ────────────────────────────────────────────────────────────
const consoleFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  let line = `${timestamp} [${level}] ${message}`;
  if (stack) line += `\n${stack}`;
  const extras = Object.keys(meta).filter(k => k !== 'service');
  if (extras.length) line += `  ${JSON.stringify(Object.fromEntries(extras.map(k => [k, meta[k]])), null, 0)}`;
  return line;
});

// ── Transports ─────────────────────────────────────────────────────────────────
const transports = [
  // Todos los logs rotados diariamente
  new DailyRotateFile({
    filename:    path.join(LOGS_DIR, 'app-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize:     '20m',
    maxFiles:    '14d',
    zippedArchive: true,
    format: combine(timestamp(), errors({ stack: true }), splat(), json()),
  }),
  // Solo errores en archivo separado
  new DailyRotateFile({
    level:       'error',
    filename:    path.join(LOGS_DIR, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize:     '20m',
    maxFiles:    '30d',
    zippedArchive: true,
    format: combine(timestamp(), errors({ stack: true }), splat(), json()),
  }),
];

// Consola en desarrollo
if (process.env.NODE_ENV !== 'production') {
  transports.push(new winston.transports.Console({
    format: combine(
      colorize({ all: true }),
      timestamp({ format: 'HH:mm:ss' }),
      errors({ stack: true }),
      splat(),
      consoleFormat,
    ),
  }));
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  defaultMeta: { service: 'sports-api' },
  transports,
  exceptionHandlers: [
    new DailyRotateFile({
      filename:    path.join(LOGS_DIR, 'exceptions-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
    }),
  ],
  rejectionHandlers: [
    new DailyRotateFile({
      filename:    path.join(LOGS_DIR, 'rejections-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
    }),
  ],
});

// ── Middleware HTTP logger ──────────────────────────────────────────────────────
logger.httpMiddleware = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    const meta = {
      method:  req.method,
      url:     req.originalUrl,
      status:  res.statusCode,
      ms,
      ip:      req.ip,
      user:    req.user?.id || 'anon',
    };
    if (res.statusCode >= 500)      logger.error('HTTP', meta);
    else if (res.statusCode >= 400) logger.warn('HTTP', meta);
    else                            logger.http('HTTP', meta);
  });
  next();
};

module.exports = logger;
