const { pool } = require('../config/db');
const { sendOrderConfirmation } = require('../config/email');

// POST /api/ordenes/checkout
const checkout = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { session_id, cliente_nombre, cliente_email, notas = '' } = req.body;

    if (!session_id || !cliente_nombre || !cliente_email) {
      return res.status(400).json({ success: false, error: 'session_id, cliente_nombre y cliente_email son requeridos.' });
    }

    // 1 ── Obtener carrito
    const [items] = await conn.query(
      `SELECT ci.id AS carrito_item_id, ci.cantidad,
              p.id AS producto_id, p.nombre, p.precio, p.stock
       FROM carrito_items ci
       JOIN productos p ON p.id = ci.producto_id
       WHERE ci.session_id = ?`,
      [session_id]
    );

    if (!items.length) {
      return res.status(400).json({ success: false, error: 'El carrito está vacío.' });
    }

    // 2 ── Validar stock de TODOS los productos
    const stockErrors = items.filter(i => i.stock < i.cantidad);
    if (stockErrors.length) {
      return res.status(409).json({
        success: false,
        error: 'Stock insuficiente para completar la compra.',
        stockErrors: stockErrors.map(i => ({
          producto_id: i.producto_id,
          nombre: i.nombre,
          solicitado: i.cantidad,
          disponible: i.stock,
        })),
      });
    }

    const total = items.reduce((s, i) => s + i.precio * i.cantidad, 0);

    await conn.beginTransaction();

    // 3 ── Insertar orden
    const [ordenResult] = await conn.query(
      'INSERT INTO ordenes (session_id, cliente_nombre, cliente_email, total, notas) VALUES (?,?,?,?,?)',
      [session_id, cliente_nombre, cliente_email, +total.toFixed(2), notas]
    );
    const ordenId = ordenResult.insertId;

    // 4 ── Insertar orden_items y descontar stock
    for (const item of items) {
      const subtotal = +(item.precio * item.cantidad).toFixed(2);
      await conn.query(
        'INSERT INTO orden_items (orden_id, producto_id, nombre, precio, cantidad, subtotal) VALUES (?,?,?,?,?,?)',
        [ordenId, item.producto_id, item.nombre, item.precio, item.cantidad, subtotal]
      );
      await conn.query(
        'UPDATE productos SET stock = stock - ? WHERE id = ?',
        [item.cantidad, item.producto_id]
      );
    }

    // 5 ── Vaciar carrito
    await conn.query('DELETE FROM carrito_items WHERE session_id = ?', [session_id]);

    await conn.commit();

    // 6 ── Construir objeto de orden completo para email
    const orden = {
      id: ordenId,
      cliente_nombre,
      cliente_email,
      total: +total.toFixed(2),
      notas,
      created_at: new Date(),
      items: items.map(i => ({
        nombre:   i.nombre,
        cantidad: i.cantidad,
        precio:   i.precio,
        subtotal: +(i.precio * i.cantidad).toFixed(2),
      })),
    };

    // 7 ── Enviar email (no bloqueante)
    sendOrderConfirmation(orden);

    res.status(201).json({
      success: true,
      message: '¡Compra realizada exitosamente! Recibirás un email de confirmación.',
      data: orden,
    });
  } catch (err) {
    await conn.rollback();
    console.error('checkout error:', err);
    res.status(500).json({ success: false, error: 'Error al procesar la compra.' });
  } finally {
    conn.release();
  }
};

// GET /api/ordenes?email=
const getHistory = async (req, res) => {
  try {
    const { email, page = 1, limit = 10 } = req.query;
    if (!email) return res.status(400).json({ success: false, error: 'El email es requerido.' });

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const [[{ total }]] = await pool.query(
      'SELECT COUNT(*) AS total FROM ordenes WHERE cliente_email=?', [email]
    );

    const [ordenes] = await pool.query(
      'SELECT * FROM ordenes WHERE cliente_email=? ORDER BY id DESC LIMIT ? OFFSET ?',
      [email, parseInt(limit), offset]
    );

    // Adjuntar items a cada orden
    for (const o of ordenes) {
      const [items] = await pool.query(
        'SELECT * FROM orden_items WHERE orden_id=?', [o.id]
      );
      o.items = items;
    }

    res.json({
      success: true,
      data: ordenes,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error al obtener historial.' });
  }
};

// GET /api/ordenes/:id
const getOne = async (req, res) => {
  try {
    const [[orden]] = await pool.query('SELECT * FROM ordenes WHERE id=?', [req.params.id]);
    if (!orden) return res.status(404).json({ success: false, error: 'Orden no encontrada.' });
    const [items] = await pool.query('SELECT * FROM orden_items WHERE orden_id=?', [orden.id]);
    res.json({ success: true, data: { ...orden, items } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error al obtener orden.' });
  }
};

module.exports = { checkout, getHistory, getOne };
