const express = require('express');
const { body, param, validationResult } = require('express-validator');
const ctrl = require('../controllers/empleadosController');

const router = express.Router();

// Middleware de validación
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }
  next();
};

const empleadoRules = [
  body('nombre').trim().notEmpty().withMessage('El nombre es requerido.').isLength({ max: 100 }),
  body('apellido').trim().notEmpty().withMessage('El apellido es requerido.').isLength({ max: 100 }),
  body('email').isEmail().withMessage('Email inválido.').normalizeEmail(),
  body('departamento').trim().notEmpty().withMessage('El departamento es requerido.'),
  body('cargo').trim().notEmpty().withMessage('El cargo es requerido.'),
  body('salario').isFloat({ min: 0 }).withMessage('El salario debe ser un número positivo.'),
  body('telefono').optional({ nullable: true }).isLength({ max: 20 }),
];

router.get('/',                  ctrl.getAll);
router.get('/departamentos',     ctrl.getDepartamentos);
router.get('/:id',               ctrl.getOne);
router.post('/',     empleadoRules, validate, ctrl.create);
router.put('/:id',  empleadoRules, validate, ctrl.update);
router.delete('/:id',            ctrl.remove);

module.exports = router;
