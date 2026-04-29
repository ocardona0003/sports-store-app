const express = require('express');
const { body } = require('express-validator');
const ctrl = require('../controllers/carritoController');
const router = express.Router();

const validate = (req, res, next) => {
  const { validationResult } = require('express-validator');
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ success: false, errors: errors.array() });
  next();
};

router.get('/:sessionId',                           ctrl.getCart);
router.post('/:sessionId/items',
  [body('producto_id').isInt({ min:1 }), body('cantidad').optional().isInt({ min:1 })],
  validate, ctrl.addItem);
router.put('/:sessionId/items/:itemId',
  [body('cantidad').isInt({ min:1 })],
  validate, ctrl.updateItem);
router.delete('/:sessionId/items/:itemId',          ctrl.removeItem);

module.exports = router;
