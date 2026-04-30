const express = require('express');
const { body, validationResult } = require('express-validator');
const { authController, authenticate } = require('../config/auth');

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ success: false, errors: errors.array() });
  next();
};

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Autenticación y gestión de sesiones JWT
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Registrar nuevo usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre, email, password]
 *             properties:
 *               nombre:   { type: string, example: Ana García }
 *               email:    { type: string, format: email, example: ana@ejemplo.com }
 *               password: { type: string, minLength: 6, example: MiPass123! }
 *               rol:      { type: string, enum: [admin, empleado, cliente], default: cliente }
 *     responses:
 *       201: { description: Usuario registrado }
 *       409: { description: Email ya registrado }
 */
router.post('/register',
  [
    body('nombre').trim().notEmpty().withMessage('El nombre es requerido.'),
    body('email').isEmail().normalizeEmail().withMessage('Email inválido.'),
    body('password').isLength({ min: 6 }).withMessage('Contraseña mínimo 6 caracteres.'),
  ],
  validate,
  authController.register
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Iniciar sesión
 *     description: Retorna accessToken (15 min) y refreshToken (7 días)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:    { type: string, example: admin@sportsstore.com }
 *               password: { type: string, example: password }
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:  { type: string }
 *                     refreshToken: { type: string }
 *                     expiresIn:    { type: string, example: 15m }
 *       401: { description: Credenciales inválidas }
 */
router.post('/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  validate,
  authController.login
);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Renovar access token usando refresh token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200: { description: Nuevos tokens emitidos }
 *       401: { description: Refresh token inválido o expirado }
 */
router.post('/refresh', authController.refresh);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Cerrar sesión (revocar refresh token)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200: { description: Sesión cerrada }
 */
router.post('/logout', authenticate, authController.logout);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Obtener perfil del usuario autenticado
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Datos del usuario }
 *       401: { description: No autenticado }
 */
router.get('/me', authenticate, authController.me);

module.exports = router;
