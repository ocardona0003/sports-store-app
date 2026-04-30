const { pool } = require('../config/db');
const logger   = require('../config/logger');

const getAll = async (req, res) => {
  try {
    const { search = '', page = 1, limit = 10, departamento = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    logger.debug('empleados.getAll', { search, page, limit, departamento });

    let where = 'WHERE 1=1';
    const params = [];
    if (search) {
      where += ' AND (nombre LIKE ? OR apellido LIKE ? OR email LIKE ? OR cargo LIKE ?)';
      const q = `%${search}%`;
      params.push(q, q, q, q);
    }
    if (departamento) { where += ' AND departamento = ?'; params.push(departamento); }

    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM empleados ${where}`, params);
    const [rows] = await pool.query(
      `SELECT * FROM empleados ${where} ORDER BY id DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    logger.info('empleados.getAll OK', { total, retornados: rows.length, page });
    res.json({ success: true, data: rows, pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) } });
  } catch (err) {
    logger.error('empleados.getAll ERROR', { error: err.message, stack: err.stack });
    res.status(500).json({ success: false, error: 'Error al obtener empleados.' });
  }
};

const getDepartamentos = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT DISTINCT departamento FROM empleados ORDER BY departamento ASC');
    logger.debug('empleados.getDepartamentos OK', { count: rows.length });
    res.json({ success: true, data: rows.map(r => r.departamento) });
  } catch (err) {
    logger.error('empleados.getDepartamentos ERROR', { error: err.message });
    res.status(500).json({ success: false, error: 'Error al obtener departamentos.' });
  }
};

const getOne = async (req, res) => {
  try {
    const { id } = req.params;
    logger.debug('empleados.getOne', { id });
    const [rows] = await pool.query('SELECT * FROM empleados WHERE id = ?', [id]);
    if (!rows.length) {
      logger.warn('empleados.getOne NOT FOUND', { id });
      return res.status(404).json({ success: false, error: 'Empleado no encontrado.' });
    }
    logger.info('empleados.getOne OK', { id, email: rows[0].email });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    logger.error('empleados.getOne ERROR', { error: err.message });
    res.status(500).json({ success: false, error: 'Error al obtener empleado.' });
  }
};

const create = async (req, res) => {
  try {
    const { nombre, apellido, email, telefono, departamento, cargo, salario, activo = 1 } = req.body;
    logger.info('empleados.create INICIO', { nombre, email, departamento, cargo });

    const [exists] = await pool.query('SELECT id FROM empleados WHERE email = ?', [email]);
    if (exists.length) {
      logger.warn('empleados.create email duplicado', { email });
      return res.status(409).json({ success: false, error: 'El email ya está registrado.' });
    }

    const [result] = await pool.query(
      'INSERT INTO empleados (nombre, apellido, email, telefono, departamento, cargo, salario, activo) VALUES (?,?,?,?,?,?,?,?)',
      [nombre, apellido, email, telefono || null, departamento, cargo, parseFloat(salario), activo]
    );

    const [newRow] = await pool.query('SELECT * FROM empleados WHERE id = ?', [result.insertId]);
    logger.info('empleados.create OK', { id: result.insertId, email, departamento });
    res.status(201).json({ success: true, data: newRow[0], message: 'Empleado creado correctamente.' });
  } catch (err) {
    logger.error('empleados.create ERROR', { error: err.message, stack: err.stack });
    res.status(500).json({ success: false, error: 'Error al crear empleado.' });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, email, telefono, departamento, cargo, salario, activo } = req.body;
    logger.info('empleados.update INICIO', { id, email });

    const [exists] = await pool.query('SELECT id FROM empleados WHERE id = ?', [id]);
    if (!exists.length) {
      logger.warn('empleados.update NOT FOUND', { id });
      return res.status(404).json({ success: false, error: 'Empleado no encontrado.' });
    }
    if (email) {
      const [dup] = await pool.query('SELECT id FROM empleados WHERE email = ? AND id != ?', [email, id]);
      if (dup.length) {
        logger.warn('empleados.update email duplicado', { email, id });
        return res.status(409).json({ success: false, error: 'El email ya lo usa otro empleado.' });
      }
    }

    await pool.query(
      'UPDATE empleados SET nombre=?, apellido=?, email=?, telefono=?, departamento=?, cargo=?, salario=?, activo=? WHERE id=?',
      [nombre, apellido, email, telefono || null, departamento, cargo, parseFloat(salario), activo ?? 1, id]
    );

    const [updated] = await pool.query('SELECT * FROM empleados WHERE id = ?', [id]);
    logger.info('empleados.update OK', { id, email });
    res.json({ success: true, data: updated[0], message: 'Empleado actualizado correctamente.' });
  } catch (err) {
    logger.error('empleados.update ERROR', { error: err.message });
    res.status(500).json({ success: false, error: 'Error al actualizar empleado.' });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    logger.info('empleados.remove INICIO', { id });
    const [exists] = await pool.query('SELECT id FROM empleados WHERE id = ?', [id]);
    if (!exists.length) {
      logger.warn('empleados.remove NOT FOUND', { id });
      return res.status(404).json({ success: false, error: 'Empleado no encontrado.' });
    }
    await pool.query('DELETE FROM empleados WHERE id = ?', [id]);
    logger.info('empleados.remove OK', { id });
    res.json({ success: true, message: 'Empleado eliminado correctamente.' });
  } catch (err) {
    logger.error('empleados.remove ERROR', { error: err.message });
    res.status(500).json({ success: false, error: 'Error al eliminar empleado.' });
  }
};

module.exports = { getAll, getDepartamentos, getOne, create, update, remove };
