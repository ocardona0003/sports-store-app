const jwt      = require('jsonwebtoken');
const bcrypt   = require('bcryptjs');
const crypto   = require('crypto');
const { pool } = require('./db');
const logger   = require('./logger');

const ACCESS_SECRET  = process.env.JWT_SECRET        || 'dev_secret_change_me_32chars!!';
const ACCESS_EXP     = process.env.JWT_ACCESS_EXPIRES  || '15m';
const REFRESH_EXP    = process.env.JWT_REFRESH_EXPIRES || '7d';

// ── Helpers para generar tokens ────────────────────────────────────────────────
const signAccess = (payload) =>
  jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXP });

const signRefresh = (payload) =>
  jwt.sign(payload, ACCESS_SECRET, { expiresIn: REFRESH_EXP });

const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

// ── Guardar refresh token en BD ────────────────────────────────────────────────
const saveRefreshToken = async (usuarioId, refreshToken) => {
  const hash      = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días
  await pool.query(
    'INSERT INTO refresh_tokens (usuario_id, token_hash, expires_at) VALUES (?,?,?)',
    [usuarioId, hash, expiresAt]
  );
};

// ── Middleware: verifica access token ──────────────────────────────────────────
const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token      = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    logger.warn('Auth: token ausente', { url: req.originalUrl, ip: req.ip });
    return res.status(401).json({ success: false, error: 'Token requerido.', code: 'TOKEN_MISSING' });
  }

  try {
    const decoded = jwt.verify(token, ACCESS_SECRET);
    req.user = decoded;
    logger.debug('Auth OK', { userId: decoded.id, rol: decoded.rol, url: req.originalUrl });
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      logger.info('Auth: token expirado', { url: req.originalUrl });
      return res.status(401).json({ success: false, error: 'Token expirado.', code: 'TOKEN_EXPIRED' });
    }
    logger.warn('Auth: token inválido', { error: err.message, url: req.originalUrl });
    return res.status(401).json({ success: false, error: 'Token inválido.', code: 'TOKEN_INVALID' });
  }
};

// ── Middleware: verificar rol ──────────────────────────────────────────────────
const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'No autenticado.' });
  }
  if (!roles.includes(req.user.rol)) {
    logger.warn('Autorización denegada', {
      userId: req.user.id, rol: req.user.rol,
      rolesRequeridos: roles, url: req.originalUrl,
    });
    return res.status(403).json({
      success: false,
      error: `Acceso denegado. Se requiere rol: ${roles.join(' o ')}.`,
      code: 'FORBIDDEN',
    });
  }
  next();
};

// ── Auth controller (se exporta para el router) ────────────────────────────────
const authController = {

  // POST /api/auth/register
  register: async (req, res) => {
    try {
      const { nombre, email, password, rol = 'cliente' } = req.body;
      logger.info('Auth: intento de registro', { email, rol });

      const [[exists]] = await pool.query('SELECT id FROM usuarios WHERE email = ?', [email]);
      if (exists) {
        logger.warn('Auth: email ya registrado', { email });
        return res.status(409).json({ success: false, error: 'El email ya está registrado.' });
      }

      const hash = await bcrypt.hash(password, 10);
      const [result] = await pool.query(
        'INSERT INTO usuarios (nombre, email, password, rol) VALUES (?,?,?,?)',
        [nombre.trim(), email.toLowerCase(), hash, rol]
      );

      const userId = result.insertId;
      logger.info('Auth: usuario registrado', { userId, email, rol });

      const payload      = { id: userId, nombre, email, rol };
      const accessToken  = signAccess(payload);
      const refreshToken = signRefresh(payload);
      await saveRefreshToken(userId, refreshToken);

      res.status(201).json({
        success: true,
        message: 'Usuario registrado correctamente.',
        data: { user: { id: userId, nombre, email, rol }, accessToken, refreshToken },
      });
    } catch (err) {
      logger.error('Auth: error en registro', { error: err.message, stack: err.stack });
      res.status(500).json({ success: false, error: 'Error al registrar usuario.' });
    }
  },

  // POST /api/auth/login
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      logger.info('Auth: intento de login', { email, ip: req.ip });

      const [[user]] = await pool.query(
        'SELECT id, nombre, email, password, rol, activo FROM usuarios WHERE email = ?',
        [email.toLowerCase()]
      );

      if (!user || !user.activo) {
        logger.warn('Auth: usuario no encontrado o inactivo', { email });
        return res.status(401).json({ success: false, error: 'Credenciales inválidas.' });
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        logger.warn('Auth: contraseña incorrecta', { email });
        return res.status(401).json({ success: false, error: 'Credenciales inválidas.' });
      }

      const payload      = { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol };
      const accessToken  = signAccess(payload);
      const refreshToken = signRefresh(payload);
      await saveRefreshToken(user.id, refreshToken);

      logger.info('Auth: login exitoso', { userId: user.id, email, rol: user.rol });

      res.json({
        success: true,
        message: `Bienvenido, ${user.nombre}`,
        data: {
          user:         { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol },
          accessToken,
          refreshToken,
          expiresIn:    ACCESS_EXP,
        },
      });
    } catch (err) {
      logger.error('Auth: error en login', { error: err.message, stack: err.stack });
      res.status(500).json({ success: false, error: 'Error al iniciar sesión.' });
    }
  },

  // POST /api/auth/refresh
  refresh: async (req, res) => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json({ success: false, error: 'refreshToken requerido.', code: 'REFRESH_MISSING' });
      }

      // Verificar firma y expiración del refresh token
      let decoded;
      try {
        decoded = jwt.verify(refreshToken, ACCESS_SECRET);
      } catch (err) {
        logger.warn('Auth: refresh token inválido/expirado', { error: err.message });
        return res.status(401).json({ success: false, error: 'Refresh token inválido o expirado.', code: 'REFRESH_INVALID' });
      }

      // Verificar que el token está en BD (no fue revocado por logout)
      const hash = hashToken(refreshToken);
      const [[stored]] = await pool.query(
        'SELECT id FROM refresh_tokens WHERE token_hash = ? AND expires_at > NOW()',
        [hash]
      );

      if (!stored) {
        logger.warn('Auth: refresh token no encontrado en BD (revocado?)', { userId: decoded.id });
        return res.status(401).json({ success: false, error: 'Refresh token revocado.', code: 'REFRESH_REVOKED' });
      }

      // Verificar usuario sigue activo
      const [[user]] = await pool.query(
        'SELECT id, nombre, email, rol, activo FROM usuarios WHERE id = ?',
        [decoded.id]
      );
      if (!user || !user.activo) {
        return res.status(401).json({ success: false, error: 'Usuario inactivo.' });
      }

      // Rotar: eliminar viejo refresh token, emitir nuevos
      await pool.query('DELETE FROM refresh_tokens WHERE token_hash = ?', [hash]);

      const payload         = { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol };
      const newAccessToken  = signAccess(payload);
      const newRefreshToken = signRefresh(payload);
      await saveRefreshToken(user.id, newRefreshToken);

      logger.info('Auth: tokens renovados', { userId: user.id });

      res.json({
        success: true,
        data: { accessToken: newAccessToken, refreshToken: newRefreshToken, expiresIn: ACCESS_EXP },
      });
    } catch (err) {
      logger.error('Auth: error en refresh', { error: err.message });
      res.status(500).json({ success: false, error: 'Error al renovar token.' });
    }
  },

  // POST /api/auth/logout
  logout: async (req, res) => {
    try {
      const { refreshToken } = req.body;
      if (refreshToken) {
        const hash = hashToken(refreshToken);
        await pool.query('DELETE FROM refresh_tokens WHERE token_hash = ?', [hash]);
        logger.info('Auth: logout, refresh token revocado', { userId: req.user?.id });
      }
      res.json({ success: true, message: 'Sesión cerrada correctamente.' });
    } catch (err) {
      logger.error('Auth: error en logout', { error: err.message });
      res.status(500).json({ success: false, error: 'Error al cerrar sesión.' });
    }
  },

  // GET /api/auth/me
  me: async (req, res) => {
    try {
      const [[user]] = await pool.query(
        'SELECT id, nombre, email, rol, activo, created_at FROM usuarios WHERE id = ?',
        [req.user.id]
      );
      if (!user) return res.status(404).json({ success: false, error: 'Usuario no encontrado.' });
      logger.debug('Auth: perfil consultado', { userId: req.user.id });
      res.json({ success: true, data: user });
    } catch (err) {
      logger.error('Auth: error en /me', { error: err.message });
      res.status(500).json({ success: false, error: 'Error al obtener perfil.' });
    }
  },
};

module.exports = { authenticate, authorize, authController, signAccess, signRefresh };
