const express = require('express');
const { body, validationResult } = require('express-validator');
const ctrl = require('../controllers/categoriasController');
const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ success: false, errors: errors.array() });
  next();
};

router.get('/',    ctrl.getAll);
router.get('/:id', ctrl.getOne);
router.post('/',   [body('nombre').trim().notEmpty().withMessage('El nombre es requerido.')], validate, ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
