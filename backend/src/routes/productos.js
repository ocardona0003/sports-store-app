const express = require('express');
const ctrl = require('../controllers/productosController');
const { handleUpload } = require('../config/upload');
const router = express.Router();

// Rutas públicas (tienda)
router.get('/',    ctrl.getAll);
router.get('/:id', ctrl.getOne);

// Rutas admin (con upload de imagen)
router.post('/admin',            handleUpload, ctrl.create);
router.put('/admin/:id',         handleUpload, ctrl.update);
router.delete('/admin/:id',      ctrl.remove);
router.delete('/admin/:id/imagen', ctrl.removeImage);

module.exports = router;
