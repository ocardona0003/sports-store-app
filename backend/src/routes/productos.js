const express = require('express');
const ctrl = require('../controllers/productosController');
const { handleUpload } = require('../config/upload');
const { authenticate, authorize } = require('../config/auth');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Productos
 *   description: Catálogo de productos deportivos
 */

/**
 * @swagger
 * /api/productos:
 *   get:
 *     tags: [Productos]
 *     summary: Listar productos con paginación y filtros
 *     parameters:
 *       - in: query
 *         name: categoria
 *         schema: { type: string }
 *         description: Filtrar por categoría
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Búsqueda por nombre/descripción
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 8 }
 *       - in: query
 *         name: admin
 *         schema: { type: string, enum: ['true','false'] }
 *         description: true para ver también inactivos (requiere auth)
 *     responses:
 *       200:
 *         description: Lista de productos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Producto' }
 *                 pagination: { $ref: '#/components/schemas/Pagination' }
 *                 categorias:
 *                   type: array
 *                   items: { type: string }
 */
router.get('/', ctrl.getAll);

/**
 * @swagger
 * /api/productos/{id}:
 *   get:
 *     tags: [Productos]
 *     summary: Obtener producto por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Producto encontrado }
 *       404: { description: Producto no encontrado }
 */
router.get('/:id', ctrl.getOne);

/**
 * @swagger
 * /api/productos/admin:
 *   post:
 *     tags: [Productos]
 *     summary: Crear producto (admin)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [nombre, categoria, precio, stock]
 *             properties:
 *               nombre:      { type: string }
 *               categoria:   { type: string }
 *               descripcion: { type: string }
 *               precio:      { type: number }
 *               stock:       { type: integer }
 *               activo:      { type: integer, enum: [0,1] }
 *               imagen:      { type: string, format: binary }
 *     responses:
 *       201: { description: Producto creado }
 *       401: { description: No autenticado }
 *       403: { description: Sin permisos }
 */
router.post('/admin', authenticate, authorize('admin'), handleUpload, ctrl.create);

/**
 * @swagger
 * /api/productos/admin/{id}:
 *   put:
 *     tags: [Productos]
 *     summary: Actualizar producto (admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:      { type: string }
 *               categoria:   { type: string }
 *               descripcion: { type: string }
 *               precio:      { type: number }
 *               stock:       { type: integer }
 *               activo:      { type: integer }
 *               imagen:      { type: string, format: binary }
 *     responses:
 *       200: { description: Producto actualizado }
 *       404: { description: No encontrado }
 *   delete:
 *     tags: [Productos]
 *     summary: Desactivar producto (admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Producto desactivado }
 */
router.put('/admin/:id',  authenticate, authorize('admin'), handleUpload, ctrl.update);
router.delete('/admin/:id', authenticate, authorize('admin'), ctrl.remove);
router.delete('/admin/:id/imagen', authenticate, authorize('admin'), ctrl.removeImage);

module.exports = router;
