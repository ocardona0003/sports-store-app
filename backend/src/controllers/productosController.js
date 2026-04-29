const { pool } = require('../config/db');

// GET /api/productos  ?categoria=&search=&page=&limit=
const getAll = async (req, res) => {
  try {
    const { categoria = '', search = '', page = 1, limit = 8 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = 'WHERE activo = 1';
    const params = [];

    if (categoria) {
      where += ' AND categoria = ?';
      params.push(categoria);
    }
    if (search) {
      where += ' AND (nombre LIKE ? OR descripcion LIKE ?)';
      const q = `%${search}%`;
      params.push(q, q);
    }

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM productos ${where}`, params
    );

    const [rows] = await pool.query(
      `SELECT * FROM productos ${where} ORDER BY id DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    // Categorías únicas (para el filtro del frontend)
    const [cats] = await pool.query(
      'SELECT DISTINCT categoria FROM productos WHERE activo=1 ORDER BY categoria'
    );

    res.json({
      success: true,
      data: rows,
      categorias: cats.map(c => c.categoria),
      pagination: {
        total,
        page:       parseInt(page),
        limit:      parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error('productos.getAll:', err);
    res.status(500).json({ success: false, error: 'Error al obtener productos.' });
  }
};

// GET /api/productos/:id
const getOne = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM productos WHERE id=? AND activo=1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, error: 'Producto no encontrado.' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error al obtener producto.' });
  }
};

module.exports = { getAll, getOne };
