const express = require('express');
const { body, validationResult } = require('express-validator');
const ctrl = require('../controllers/categoriasController');
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
 *   name: Categorias
 *   description: Gestión de categorías de productos
 */

/**
 * @swagger
 * /api/categorias:
 *   get:
 *     tags: [Categorias]
 *     summary: Listar categorías activas
 *     parameters:
 *       - in: query
 *         name: includeInactive
 *         schema: { type: string, enum: ['true','false'] }
 *     responses:
 *       200:
 *         description: Lista de categorías
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Categoria' }
 *   post:
 *     tags: [Categorias]
 *     summary: Crear categoría (admin)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre]
 *             properties:
 *               nombre:      { type: string }
 *               descripcion: { type: string }
 *     responses:
 *       201: { description: Categoría creada }
 */
router.get('/',    ctrl.getAll);
router.get('/:id', ctrl.getOne);
router.post('/',   authenticate, authorize('admin'),
  [body('nombre').trim().notEmpty().withMessage('El nombre es requerido.')],
  validate, ctrl.create);
router.put('/:id',    authenticate, authorize('admin'), ctrl.update);
router.delete('/:id', authenticate, authorize('admin'), ctrl.remove);

module.exports = router;
