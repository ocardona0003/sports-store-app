const express = require('express');
const { body, validationResult } = require('express-validator');
const ctrl = require('../controllers/empleadosController');
const { authenticate, authorize } = require('../config/auth');
const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ success: false, errors: errors.array() });
  next();
};

const empleadoRules = [
  body('nombre').trim().notEmpty().withMessage('El nombre es requerido.').isLength({ max: 100 }),
  body('apellido').trim().notEmpty().withMessage('El apellido es requerido.').isLength({ max: 100 }),
  body('email').isEmail().withMessage('Email inválido.').normalizeEmail(),
  body('departamento').trim().notEmpty().withMessage('El departamento es requerido.'),
  body('cargo').trim().notEmpty().withMessage('El cargo es requerido.'),
  body('salario').isFloat({ min: 0 }).withMessage('El salario debe ser positivo.'),
  body('telefono').optional({ nullable: true }).isLength({ max: 20 }),
];

/**
 * @swagger
 * tags:
 *   name: Empleados
 *   description: Gestión de empleados (requiere autenticación)
 */

/**
 * @swagger
 * /api/empleados:
 *   get:
 *     tags: [Empleados]
 *     summary: Listar empleados con búsqueda y paginación
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: departamento
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Lista de empleados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Empleado' }
 *                 pagination: { $ref: '#/components/schemas/Pagination' }
 *       401: { description: No autenticado }
 *   post:
 *     tags: [Empleados]
 *     summary: Crear empleado (admin)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Empleado'
 *     responses:
 *       201: { description: Empleado creado }
 *       403: { description: Sin permisos }
 */
router.get('/',              authenticate,                             ctrl.getAll);
router.get('/departamentos', authenticate,                             ctrl.getDepartamentos);
router.get('/:id',           authenticate,                             ctrl.getOne);
router.post('/',             authenticate, authorize('admin'),         empleadoRules, validate, ctrl.create);
router.put('/:id',           authenticate, authorize('admin'),         empleadoRules, validate, ctrl.update);
router.delete('/:id',        authenticate, authorize('admin'),         ctrl.remove);

module.exports = router;
