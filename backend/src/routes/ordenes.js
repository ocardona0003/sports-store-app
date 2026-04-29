const express = require('express');
const { body } = require('express-validator');
const ctrl = require('../controllers/ordenesController');
const router = express.Router();

const validate = (req, res, next) => {
  const { validationResult } = require('express-validator');
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ success: false, errors: errors.array() });
  next();
};

router.post('/checkout',
  [
    body('session_id').notEmpty(),
    body('cliente_nombre').trim().notEmpty().withMessage('El nombre es requerido.'),
    body('cliente_email').isEmail().withMessage('Email inválido.'),
  ],
  validate, ctrl.checkout);

router.get('/',    ctrl.getHistory);
router.get('/:id', ctrl.getOne);

module.exports = router;
