const { pool } = require('../config/db');

// ── Listar todos (con búsqueda y paginación) ──────────────────────────────────
const getAll = async (req, res) => {
  try {
    const { search = '', page = 1, limit = 10, departamento = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = 'WHERE 1=1';
    const params = [];

    if (search) {
      where += ' AND (nombre LIKE ? OR apellido LIKE ? OR email LIKE ? OR cargo LIKE ?)';
      const q = `%${search}%`;
      params.push(q, q, q, q);
    }
    if (departamento) {
      where += ' AND departamento = ?';
      params.push(departamento);
    }

    // Total de registros para paginación
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM empleados ${where}`,
      params
    );

    // Datos paginados
    const [rows] = await pool.query(
      `SELECT * FROM empleados ${where} ORDER BY id DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      success: true,
      data: rows,
      pagination: {
        total,
        page:       parseInt(page),
        limit:      parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error('getAll error:', err);
    res.status(500).json({ success: false, error: 'Error al obtener empleados.' });
  }
};

// ── Obtener uno por ID ────────────────────────────────────────────────────────
const getOne = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM empleados WHERE id = ?', [req.params.id]);
    if (!rows.length) {
      return res.status(404).json({ success: false, error: 'Empleado no encontrado.' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error al obtener empleado.' });
  }
};

// ── Crear ─────────────────────────────────────────────────────────────────────
const create = async (req, res) => {
  try {
    const { nombre, apellido, email, telefono, departamento, cargo, salario, activo = 1 } = req.body;

    // Verificar email duplicado
    const [exists] = await pool.query('SELECT id FROM empleados WHERE email = ?', [email]);
    if (exists.length) {
      return res.status(409).json({ success: false, error: 'El email ya está registrado.' });
    }

    const [result] = await pool.query(
      `INSERT INTO empleados (nombre, apellido, email, telefono, departamento, cargo, salario, activo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [nombre, apellido, email, telefono || null, departamento, cargo, parseFloat(salario), activo]
    );

    const [newRow] = await pool.query('SELECT * FROM empleados WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, data: newRow[0], message: 'Empleado creado correctamente.' });
  } catch (err) {
    console.error('create error:', err);
    res.status(500).json({ success: false, error: 'Error al crear empleado.' });
  }
};

// ── Actualizar ────────────────────────────────────────────────────────────────
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, email, telefono, departamento, cargo, salario, activo } = req.body;

    const [exists] = await pool.query('SELECT id FROM empleados WHERE id = ?', [id]);
    if (!exists.length) {
      return res.status(404).json({ success: false, error: 'Empleado no encontrado.' });
    }

    // Verificar email duplicado (excluyendo el actual)
    if (email) {
      const [dup] = await pool.query('SELECT id FROM empleados WHERE email = ? AND id != ?', [email, id]);
      if (dup.length) {
        return res.status(409).json({ success: false, error: 'El email ya lo usa otro empleado.' });
      }
    }

    await pool.query(
      `UPDATE empleados
         SET nombre = ?, apellido = ?, email = ?, telefono = ?,
             departamento = ?, cargo = ?, salario = ?, activo = ?
       WHERE id = ?`,
      [nombre, apellido, email, telefono || null, departamento, cargo, parseFloat(salario), activo ?? 1, id]
    );

    const [updated] = await pool.query('SELECT * FROM empleados WHERE id = ?', [id]);
    res.json({ success: true, data: updated[0], message: 'Empleado actualizado correctamente.' });
  } catch (err) {
    console.error('update error:', err);
    res.status(500).json({ success: false, error: 'Error al actualizar empleado.' });
  }
};

// ── Eliminar ──────────────────────────────────────────────────────────────────
const remove = async (req, res) => {
  try {
    const [exists] = await pool.query('SELECT id FROM empleados WHERE id = ?', [req.params.id]);
    if (!exists.length) {
      return res.status(404).json({ success: false, error: 'Empleado no encontrado.' });
    }

    await pool.query('DELETE FROM empleados WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Empleado eliminado correctamente.' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error al eliminar empleado.' });
  }
};

// ── Departamentos únicos (para filtro) ───────────────────────────────────────
const getDepartamentos = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT DISTINCT departamento FROM empleados ORDER BY departamento ASC'
    );
    res.json({ success: true, data: rows.map(r => r.departamento) });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error al obtener departamentos.' });
  }
};

module.exports = { getAll, getOne, create, update, remove, getDepartamentos };
