const express = require('express');
const ctrl = require('../controllers/productosController');
const router = express.Router();
router.get('/',    ctrl.getAll);
router.get('/:id', ctrl.getOne);
module.exports = router;
