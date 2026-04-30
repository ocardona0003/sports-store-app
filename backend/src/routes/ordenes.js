const express = require('express');
const { body, validationResult } = require('express-validator');
const ctrl = require('../controllers/ordenesController');
const { authenticate, authorize } = require('../config/auth');
const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ success: false, errors: errors.array() });
  next();
};

/**
 * @swagger
 * tags:
 *   name: Ordenes
 *   description: Checkout e historial de compras
 */

/**
 * @swagger
 * /api/ordenes/checkout:
 *   post:
 *     tags: [Ordenes]
 *     summary: Finalizar compra (checkout)
 *     description: Valida stock, registra la orden en transacción SQL y envía email de confirmación
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [session_id, cliente_nombre, cliente_email]
 *             properties:
 *               session_id:     { type: string }
 *               cliente_nombre: { type: string, example: Ana García }
 *               cliente_email:  { type: string, format: email }
 *               notas:          { type: string }
 *     responses:
 *       201: { description: Orden creada y email enviado }
 *       400: { description: Carrito vacío }
 *       409: { description: Stock insuficiente }
 */
router.post('/checkout',
  [
    body('session_id').notEmpty(),
    body('cliente_nombre').trim().notEmpty().withMessage('El nombre es requerido.'),
    body('cliente_email').isEmail().withMessage('Email inválido.'),
  ],
  validate, ctrl.checkout);

/**
 * @swagger
 * /api/ordenes:
 *   get:
 *     tags: [Ordenes]
 *     summary: Historial de órdenes por email
 *     parameters:
 *       - in: query
 *         name: email
 *         required: true
 *         schema: { type: string, format: email }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *     responses:
 *       200: { description: Lista de órdenes }
 */
router.get('/', ctrl.getHistory);

/**
 * @swagger
 * /api/ordenes/admin/all:
 *   get:
 *     tags: [Ordenes]
 *     summary: Todas las órdenes (admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *     responses:
 *       200: { description: Todas las órdenes }
 *       403: { description: Sin permisos }
 */
router.get('/admin/all', authenticate, authorize('admin'), ctrl.getAllAdmin);

/**
 * @swagger
 * /api/ordenes/{id}:
 *   get:
 *     tags: [Ordenes]
 *     summary: Detalle de una orden
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Detalle de la orden con items }
 *       404: { description: Orden no encontrada }
 */
router.get('/:id', ctrl.getOne);

module.exports = router;
