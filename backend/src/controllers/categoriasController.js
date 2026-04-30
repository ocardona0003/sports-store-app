const { pool } = require('../config/db');

// GET /api/categorias
const getAll = async (req, res) => {
  try {
    const { includeInactive } = req.query;
    const where = includeInactive === 'true' ? '' : 'WHERE activo = 1';
    const [rows] = await pool.query(
      `SELECT * FROM categorias ${where} ORDER BY nombre ASC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('categorias.getAll:', err);
    res.status(500).json({ success: false, error: 'Error al obtener categorías.' });
  }
};

// GET /api/categorias/:id
const getOne = async (req, res) => {
  try {
    const [[row]] = await pool.query('SELECT * FROM categorias WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ success: false, error: 'Categoría no encontrada.' });
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error al obtener categoría.' });
  }
};

// POST /api/categorias
const create = async (req, res) => {
  try {
    const { nombre, descripcion = '' } = req.body;
    if (!nombre?.trim()) return res.status(422).json({ success: false, error: 'El nombre es requerido.' });

    // Verificar duplicado
    const [[exists]] = await pool.query('SELECT id FROM categorias WHERE nombre = ?', [nombre.trim()]);
    if (exists) return res.status(409).json({ success: false, error: 'Ya existe una categoría con ese nombre.' });

    const [result] = await pool.query(
      'INSERT INTO categorias (nombre, descripcion) VALUES (?, ?)',
      [nombre.trim(), descripcion.trim()]
    );
    const [[newRow]] = await pool.query('SELECT * FROM categorias WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, data: newRow, message: 'Categoría creada correctamente.' });
  } catch (err) {
    console.error('categorias.create:', err);
    res.status(500).json({ success: false, error: 'Error al crear categoría.' });
  }
};

// PUT /api/categorias/:id
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, activo } = req.body;

    const [[exists]] = await pool.query('SELECT id FROM categorias WHERE id = ?', [id]);
    if (!exists) return res.status(404).json({ success: false, error: 'Categoría no encontrada.' });

    if (nombre) {
      const [[dup]] = await pool.query('SELECT id FROM categorias WHERE nombre = ? AND id != ?', [nombre.trim(), id]);
      if (dup) return res.status(409).json({ success: false, error: 'Ese nombre ya lo usa otra categoría.' });
    }

    await pool.query(
      `UPDATE categorias SET
         nombre      = COALESCE(?, nombre),
         descripcion = COALESCE(?, descripcion),
         activo      = COALESCE(?, activo)
       WHERE id = ?`,
      [nombre?.trim() || null, descripcion?.trim() ?? null, activo ?? null, id]
    );

    const [[updated]] = await pool.query('SELECT * FROM categorias WHERE id = ?', [id]);
    res.json({ success: true, data: updated, message: 'Categoría actualizada correctamente.' });
  } catch (err) {
    console.error('categorias.update:', err);
    res.status(500).json({ success: false, error: 'Error al actualizar categoría.' });
  }
};

// DELETE /api/categorias/:id  (soft delete)
const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const [[exists]] = await pool.query('SELECT id FROM categorias WHERE id = ?', [id]);
    if (!exists) return res.status(404).json({ success: false, error: 'Categoría no encontrada.' });

    // Verificar si hay productos con esta categoría
    const [[{ total }]] = await pool.query(
      'SELECT COUNT(*) AS total FROM productos WHERE categoria = (SELECT nombre FROM categorias WHERE id = ?) AND activo = 1',
      [id]
    );
    if (total > 0) {
      return res.status(409).json({
        success: false,
        error: `No se puede eliminar: hay ${total} producto(s) activo(s) con esta categoría.`,
      });
    }

    await pool.query('UPDATE categorias SET activo = 0 WHERE id = ?', [id]);
    res.json({ success: true, message: 'Categoría desactivada correctamente.' });
  } catch (err) {
    console.error('categorias.remove:', err);
    res.status(500).json({ success: false, error: 'Error al eliminar categoría.' });
  }
};

module.exports = { getAll, getOne, create, update, remove };
