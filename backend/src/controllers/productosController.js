const { pool } = require('../config/db');
const { processAndSave, deleteImage } = require('../config/upload');
const logger = require('../config/logger');

const getAll = async (req, res) => {
  try {
    const { categoria = '', search = '', page = 1, limit = 8, admin = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    logger.debug('productos.getAll', { categoria, search, page, admin });

    let where = admin === 'true' ? 'WHERE 1=1' : 'WHERE activo = 1';
    const params = [];
    if (categoria) { where += ' AND categoria = ?'; params.push(categoria); }
    if (search) {
      where += ' AND (nombre LIKE ? OR descripcion LIKE ?)';
      const q = `%${search}%`; params.push(q, q);
    }

    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM productos ${where}`, params);
    const [rows] = await pool.query(`SELECT * FROM productos ${where} ORDER BY id DESC LIMIT ? OFFSET ?`, [...params, parseInt(limit), offset]);
    const [cats] = await pool.query('SELECT DISTINCT categoria FROM productos WHERE activo=1 ORDER BY categoria');

    logger.info('productos.getAll OK', { total, retornados: rows.length });
    res.json({ success: true, data: rows, categorias: cats.map(c => c.categoria),
      pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) } });
  } catch (err) {
    logger.error('productos.getAll ERROR', { error: err.message });
    res.status(500).json({ success: false, error: 'Error al obtener productos.' });
  }
};

const getOne = async (req, res) => {
  try {
    const { id } = req.params;
    logger.debug('productos.getOne', { id });
    const [[row]] = await pool.query('SELECT * FROM productos WHERE id = ?', [id]);
    if (!row) {
      logger.warn('productos.getOne NOT FOUND', { id });
      return res.status(404).json({ success: false, error: 'Producto no encontrado.' });
    }
    logger.info('productos.getOne OK', { id, nombre: row.nombre });
    res.json({ success: true, data: row });
  } catch (err) {
    logger.error('productos.getOne ERROR', { error: err.message });
    res.status(500).json({ success: false, error: 'Error al obtener producto.' });
  }
};

const create = async (req, res) => {
  try {
    const { nombre, categoria, descripcion = '', precio, stock, activo = 1 } = req.body;
    logger.info('productos.create INICIO', { nombre, categoria, precio, stock });

    if (!nombre?.trim() || !categoria?.trim() || precio == null || stock == null) {
      return res.status(422).json({ success: false, error: 'nombre, categoria, precio y stock son requeridos.' });
    }

    let imagen_url = '';
    if (req.file) {
      logger.debug('productos.create procesando imagen', { size: req.file.size, mimetype: req.file.mimetype });
      imagen_url = await processAndSave(req.file.buffer, req.file.originalname);
      logger.info('productos.create imagen guardada', { path: imagen_url });
    }

    const data = { nombre: nombre.trim(), categoria: categoria.trim(), descripcion: descripcion.trim(),
      precio: parseFloat(precio), stock: parseInt(stock), imagen_url, activo };
    logger.debug('productos.create datos a insertar', data);

    const [result] = await pool.query(
      'INSERT INTO productos (nombre, categoria, descripcion, precio, stock, imagen_url, activo) VALUES (?,?,?,?,?,?,?)',
      [data.nombre, data.categoria, data.descripcion, data.precio, data.stock, data.imagen_url, data.activo]
    );

    const [[newRow]] = await pool.query('SELECT * FROM productos WHERE id = ?', [result.insertId]);
    logger.info('productos.create OK', { id: result.insertId, nombre, imagen_url });
    res.status(201).json({ success: true, data: newRow, message: 'Producto creado correctamente.' });
  } catch (err) {
    logger.error('productos.create ERROR', { error: err.message, stack: err.stack });
    res.status(500).json({ success: false, error: 'Error al crear producto.' });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    logger.info('productos.update INICIO', { id, body: req.body });

    const [[existing]] = await pool.query('SELECT * FROM productos WHERE id = ?', [id]);
    if (!existing) {
      logger.warn('productos.update NOT FOUND', { id });
      return res.status(404).json({ success: false, error: 'Producto no encontrado.' });
    }

    let imagen_url = existing.imagen_url;
    if (req.file) {
      logger.debug('productos.update nueva imagen', { oldPath: existing.imagen_url });
      deleteImage(existing.imagen_url);
      imagen_url = await processAndSave(req.file.buffer, req.file.originalname);
      logger.info('productos.update imagen reemplazada', { newPath: imagen_url });
    }

    const { nombre, categoria, descripcion, precio, stock, activo } = req.body;
    await pool.query(
      `UPDATE productos SET nombre=COALESCE(?,nombre), categoria=COALESCE(?,categoria),
       descripcion=COALESCE(?,descripcion), precio=COALESCE(?,precio), stock=COALESCE(?,stock),
       imagen_url=?, activo=COALESCE(?,activo) WHERE id=?`,
      [nombre?.trim()||null, categoria?.trim()||null, descripcion?.trim()??null,
       precio!=null?parseFloat(precio):null, stock!=null?parseInt(stock):null,
       imagen_url, activo??null, id]
    );

    const [[updated]] = await pool.query('SELECT * FROM productos WHERE id = ?', [id]);
    logger.info('productos.update OK', { id, nombre: updated.nombre });
    res.json({ success: true, data: updated, message: 'Producto actualizado correctamente.' });
  } catch (err) {
    logger.error('productos.update ERROR', { error: err.message });
    res.status(500).json({ success: false, error: 'Error al actualizar producto.' });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    logger.info('productos.remove INICIO', { id });
    const [[existing]] = await pool.query('SELECT * FROM productos WHERE id = ?', [id]);
    if (!existing) {
      logger.warn('productos.remove NOT FOUND', { id });
      return res.status(404).json({ success: false, error: 'Producto no encontrado.' });
    }
    await pool.query('UPDATE productos SET activo = 0 WHERE id = ?', [id]);
    logger.info('productos.remove OK (soft delete)', { id, nombre: existing.nombre });
    res.json({ success: true, message: 'Producto desactivado correctamente.' });
  } catch (err) {
    logger.error('productos.remove ERROR', { error: err.message });
    res.status(500).json({ success: false, error: 'Error al eliminar producto.' });
  }
};

const removeImage = async (req, res) => {
  try {
    const { id } = req.params;
    logger.info('productos.removeImage', { id });
    const [[existing]] = await pool.query('SELECT * FROM productos WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ success: false, error: 'Producto no encontrado.' });
    deleteImage(existing.imagen_url);
    await pool.query('UPDATE productos SET imagen_url = "" WHERE id = ?', [id]);
    logger.info('productos.removeImage OK', { id, deletedPath: existing.imagen_url });
    res.json({ success: true, message: 'Imagen eliminada.' });
  } catch (err) {
    logger.error('productos.removeImage ERROR', { error: err.message });
    res.status(500).json({ success: false, error: 'Error al eliminar imagen.' });
  }
};

module.exports = { getAll, getOne, create, update, remove, removeImage };
