const { pool } = require('../config/db');
const { processAndSave, deleteImage } = require('../config/upload');

// GET /api/productos  ?categoria=&search=&page=&limit=&admin=true
const getAll = async (req, res) => {
  try {
    const { categoria = '', search = '', page = 1, limit = 8, admin = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = admin === 'true' ? 'WHERE 1=1' : 'WHERE activo = 1';
    const params = [];

    if (categoria) { where += ' AND categoria = ?'; params.push(categoria); }
    if (search) {
      where += ' AND (nombre LIKE ? OR descripcion LIKE ?)';
      const q = `%${search}%`; params.push(q, q);
    }

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM productos ${where}`, params
    );
    const [rows] = await pool.query(
      `SELECT * FROM productos ${where} ORDER BY id DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    const [cats] = await pool.query(
      'SELECT DISTINCT categoria FROM productos WHERE activo=1 ORDER BY categoria'
    );

    res.json({
      success: true, data: rows,
      categorias: cats.map(c => c.categoria),
      pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) {
    console.error('productos.getAll:', err);
    res.status(500).json({ success: false, error: 'Error al obtener productos.' });
  }
};

// GET /api/productos/:id
const getOne = async (req, res) => {
  try {
    const [[row]] = await pool.query('SELECT * FROM productos WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ success: false, error: 'Producto no encontrado.' });
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error al obtener producto.' });
  }
};

// POST /api/productos/admin  (multipart/form-data)
const create = async (req, res) => {
  try {
    const { nombre, categoria, descripcion = '', precio, stock, activo = 1 } = req.body;

    if (!nombre?.trim() || !categoria?.trim() || precio == null || stock == null) {
      return res.status(422).json({ success: false, error: 'nombre, categoria, precio y stock son requeridos.' });
    }

    // Procesar imagen si viene adjunta
    let imagen_url = '';
    if (req.file) {
      imagen_url = await processAndSave(req.file.buffer, req.file.originalname);
    }

    const [result] = await pool.query(
      'INSERT INTO productos (nombre, categoria, descripcion, precio, stock, imagen_url, activo) VALUES (?,?,?,?,?,?,?)',
      [nombre.trim(), categoria.trim(), descripcion.trim(), parseFloat(precio), parseInt(stock), imagen_url, activo]
    );

    const [[newRow]] = await pool.query('SELECT * FROM productos WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, data: newRow, message: 'Producto creado correctamente.' });
  } catch (err) {
    console.error('productos.create:', err);
    res.status(500).json({ success: false, error: 'Error al crear producto.' });
  }
};

// PUT /api/productos/admin/:id  (multipart/form-data)
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const [[existing]] = await pool.query('SELECT * FROM productos WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ success: false, error: 'Producto no encontrado.' });

    const { nombre, categoria, descripcion, precio, stock, activo } = req.body;

    // Si viene nueva imagen: procesar y eliminar la anterior
    let imagen_url = existing.imagen_url;
    if (req.file) {
      deleteImage(existing.imagen_url);          // borrar la vieja del disco
      imagen_url = await processAndSave(req.file.buffer, req.file.originalname);
    }

    await pool.query(
      `UPDATE productos SET
         nombre      = COALESCE(?, nombre),
         categoria   = COALESCE(?, categoria),
         descripcion = COALESCE(?, descripcion),
         precio      = COALESCE(?, precio),
         stock       = COALESCE(?, stock),
         imagen_url  = ?,
         activo      = COALESCE(?, activo)
       WHERE id = ?`,
      [
        nombre?.trim()      || null,
        categoria?.trim()   || null,
        descripcion?.trim() ?? null,
        precio != null ? parseFloat(precio) : null,
        stock  != null ? parseInt(stock)   : null,
        imagen_url,
        activo ?? null,
        id,
      ]
    );

    const [[updated]] = await pool.query('SELECT * FROM productos WHERE id = ?', [id]);
    res.json({ success: true, data: updated, message: 'Producto actualizado correctamente.' });
  } catch (err) {
    console.error('productos.update:', err);
    res.status(500).json({ success: false, error: 'Error al actualizar producto.' });
  }
};

// DELETE /api/productos/admin/:id
const remove = async (req, res) => {
  try {
    const [[existing]] = await pool.query('SELECT * FROM productos WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ success: false, error: 'Producto no encontrado.' });

    // Soft delete — no borrar imagen del disco por si hay órdenes que la referencian
    await pool.query('UPDATE productos SET activo = 0 WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Producto desactivado correctamente.' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error al eliminar producto.' });
  }
};

// DELETE /api/productos/admin/:id/imagen — quitar imagen del producto
const removeImage = async (req, res) => {
  try {
    const [[existing]] = await pool.query('SELECT * FROM productos WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ success: false, error: 'Producto no encontrado.' });

    deleteImage(existing.imagen_url);
    await pool.query('UPDATE productos SET imagen_url = "" WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Imagen eliminada.' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error al eliminar imagen.' });
  }
};

module.exports = { getAll, getOne, create, update, remove, removeImage };
