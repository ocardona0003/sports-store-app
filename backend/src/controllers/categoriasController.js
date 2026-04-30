const { pool } = require('../config/db');
const logger   = require('../config/logger');

const getAll = async (req, res) => {
  try {
    const { includeInactive } = req.query;
    logger.debug('categorias.getAll', { includeInactive });
    const where = includeInactive === 'true' ? '' : 'WHERE activo = 1';
    const [rows] = await pool.query(`SELECT * FROM categorias ${where} ORDER BY nombre ASC`);
    logger.info('categorias.getAll OK', { count: rows.length });
    res.json({ success: true, data: rows });
  } catch (err) {
    logger.error('categorias.getAll ERROR', { error: err.message });
    res.status(500).json({ success: false, error: 'Error al obtener categorías.' });
  }
};

const getOne = async (req, res) => {
  try {
    const { id } = req.params;
    logger.debug('categorias.getOne', { id });
    const [[row]] = await pool.query('SELECT * FROM categorias WHERE id = ?', [id]);
    if (!row) {
      logger.warn('categorias.getOne NOT FOUND', { id });
      return res.status(404).json({ success: false, error: 'Categoría no encontrada.' });
    }
    logger.info('categorias.getOne OK', { id, nombre: row.nombre });
    res.json({ success: true, data: row });
  } catch (err) {
    logger.error('categorias.getOne ERROR', { error: err.message });
    res.status(500).json({ success: false, error: 'Error al obtener categoría.' });
  }
};

const create = async (req, res) => {
  try {
    const { nombre, descripcion = '' } = req.body;
    logger.info('categorias.create INICIO', { nombre });
    if (!nombre?.trim()) return res.status(422).json({ success: false, error: 'El nombre es requerido.' });

    const [[exists]] = await pool.query('SELECT id FROM categorias WHERE nombre = ?', [nombre.trim()]);
    if (exists) {
      logger.warn('categorias.create nombre duplicado', { nombre });
      return res.status(409).json({ success: false, error: 'Ya existe una categoría con ese nombre.' });
    }

    const [result] = await pool.query('INSERT INTO categorias (nombre, descripcion) VALUES (?, ?)', [nombre.trim(), descripcion.trim()]);
    const [[newRow]] = await pool.query('SELECT * FROM categorias WHERE id = ?', [result.insertId]);
    logger.info('categorias.create OK', { id: result.insertId, nombre });
    res.status(201).json({ success: true, data: newRow, message: 'Categoría creada correctamente.' });
  } catch (err) {
    logger.error('categorias.create ERROR', { error: err.message });
    res.status(500).json({ success: false, error: 'Error al crear categoría.' });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, activo } = req.body;
    logger.info('categorias.update INICIO', { id, nombre });

    const [[exists]] = await pool.query('SELECT id FROM categorias WHERE id = ?', [id]);
    if (!exists) {
      logger.warn('categorias.update NOT FOUND', { id });
      return res.status(404).json({ success: false, error: 'Categoría no encontrada.' });
    }
    if (nombre) {
      const [[dup]] = await pool.query('SELECT id FROM categorias WHERE nombre = ? AND id != ?', [nombre.trim(), id]);
      if (dup) {
        logger.warn('categorias.update nombre duplicado', { nombre });
        return res.status(409).json({ success: false, error: 'Ese nombre ya lo usa otra categoría.' });
      }
    }

    await pool.query(
      'UPDATE categorias SET nombre=COALESCE(?,nombre), descripcion=COALESCE(?,descripcion), activo=COALESCE(?,activo) WHERE id=?',
      [nombre?.trim()||null, descripcion?.trim()??null, activo??null, id]
    );

    const [[updated]] = await pool.query('SELECT * FROM categorias WHERE id = ?', [id]);
    logger.info('categorias.update OK', { id, nombre: updated.nombre });
    res.json({ success: true, data: updated, message: 'Categoría actualizada correctamente.' });
  } catch (err) {
    logger.error('categorias.update ERROR', { error: err.message });
    res.status(500).json({ success: false, error: 'Error al actualizar categoría.' });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    logger.info('categorias.remove INICIO', { id });
    const [[exists]] = await pool.query('SELECT id FROM categorias WHERE id = ?', [id]);
    if (!exists) return res.status(404).json({ success: false, error: 'Categoría no encontrada.' });

    const [[{ total }]] = await pool.query(
      'SELECT COUNT(*) AS total FROM productos WHERE categoria=(SELECT nombre FROM categorias WHERE id=?) AND activo=1', [id]
    );
    if (total > 0) {
      logger.warn('categorias.remove bloqueado por productos activos', { id, productosActivos: total });
      return res.status(409).json({ success: false, error: `No se puede eliminar: hay ${total} producto(s) activo(s) con esta categoría.` });
    }

    await pool.query('UPDATE categorias SET activo = 0 WHERE id = ?', [id]);
    logger.info('categorias.remove OK (soft delete)', { id });
    res.json({ success: true, message: 'Categoría desactivada correctamente.' });
  } catch (err) {
    logger.error('categorias.remove ERROR', { error: err.message });
    res.status(500).json({ success: false, error: 'Error al eliminar categoría.' });
  }
};

module.exports = { getAll, getOne, create, update, remove };
