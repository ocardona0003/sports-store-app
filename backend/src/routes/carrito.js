const express = require('express');
const { body, validationResult } = require('express-validator');
const ctrl = require('../controllers/carritoController');
const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ success: false, errors: errors.array() });
  next();
};

/**
 * @swagger
 * tags:
 *   name: Carrito
 *   description: Gestión del carrito de compras por sesión anónima
 */

/**
 * @swagger
 * /api/carrito/{sessionId}:
 *   get:
 *     tags: [Carrito]
 *     summary: Obtener carrito de una sesión
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema: { type: string }
 *         description: ID de sesión del cliente
 *     responses:
 *       200:
 *         description: Items del carrito con totales
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/CarritoItem' }
 *                 total: { type: number, example: 259.98 }
 */
router.get('/:sessionId', ctrl.getCart);

/**
 * @swagger
 * /api/carrito/{sessionId}/items:
 *   post:
 *     tags: [Carrito]
 *     summary: Agregar producto al carrito
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [producto_id]
 *             properties:
 *               producto_id: { type: integer, example: 1 }
 *               cantidad:    { type: integer, default: 1, example: 2 }
 *     responses:
 *       200: { description: Carrito actualizado }
 *       409: { description: Stock insuficiente }
 */
router.post('/:sessionId/items',
  [body('producto_id').isInt({ min: 1 }), body('cantidad').optional().isInt({ min: 1 })],
  validate, ctrl.addItem);

/**
 * @swagger
 * /api/carrito/{sessionId}/items/{itemId}:
 *   put:
 *     tags: [Carrito]
 *     summary: Actualizar cantidad de un item
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [cantidad]
 *             properties:
 *               cantidad: { type: integer, minimum: 1 }
 *     responses:
 *       200: { description: Cantidad actualizada }
 *   delete:
 *     tags: [Carrito]
 *     summary: Eliminar item del carrito
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Item eliminado }
 */
router.put('/:sessionId/items/:itemId',
  [body('cantidad').isInt({ min: 1 })], validate, ctrl.updateItem);
router.delete('/:sessionId/items/:itemId', ctrl.removeItem);

module.exports = router;
