const { pool } = require('../config/db');

// Devuelve los items del carrito con datos del producto
const fetchCart = async (sessionId) => {
  const [rows] = await pool.query(
    `SELECT ci.id, ci.session_id, ci.cantidad,
            p.id AS producto_id, p.nombre, p.categoria,
            p.precio, p.stock, p.imagen_url
     FROM carrito_items ci
     JOIN productos p ON p.id = ci.producto_id
     WHERE ci.session_id = ?`,
    [sessionId]
  );
  return rows;
};

// GET /api/carrito/:sessionId
const getCart = async (req, res) => {
  try {
    const items = await fetchCart(req.params.sessionId);
    const total = items.reduce((s, i) => s + i.precio * i.cantidad, 0);
    res.json({ success: true, data: items, total: +total.toFixed(2) });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error al obtener carrito.' });
  }
};

// POST /api/carrito/:sessionId/items  { producto_id, cantidad }
const addItem = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { producto_id, cantidad = 1 } = req.body;
    const qty = Math.max(1, parseInt(cantidad));

    // Verificar stock
    const [[prod]] = await pool.query(
      'SELECT id, nombre, stock FROM productos WHERE id=? AND activo=1', [producto_id]
    );
    if (!prod) return res.status(404).json({ success: false, error: 'Producto no encontrado.' });

    // ¿Ya está en el carrito?
    const [[existing]] = await pool.query(
      'SELECT id, cantidad FROM carrito_items WHERE session_id=? AND producto_id=?',
      [sessionId, producto_id]
    );

    const newQty = (existing?.cantidad || 0) + qty;
    if (prod.stock < newQty) {
      return res.status(409).json({
        success: false,
        error: `Stock insuficiente. Disponible: ${prod.stock}.`,
        availableStock: prod.stock,
      });
    }

    if (existing) {
      await pool.query(
        'UPDATE carrito_items SET cantidad=? WHERE id=?',
        [newQty, existing.id]
      );
    } else {
      await pool.query(
        'INSERT INTO carrito_items (session_id, producto_id, cantidad) VALUES (?,?,?)',
        [sessionId, producto_id, qty]
      );
    }

    const items = await fetchCart(sessionId);
    const total = items.reduce((s, i) => s + i.precio * i.cantidad, 0);
    res.json({ success: true, data: items, total: +total.toFixed(2), message: `"${prod.nombre}" agregado al carrito.` });
  } catch (err) {
    console.error('carrito.addItem:', err);
    res.status(500).json({ success: false, error: 'Error al agregar al carrito.' });
  }
};

// PUT /api/carrito/:sessionId/items/:itemId  { cantidad }
const updateItem = async (req, res) => {
  try {
    const { sessionId, itemId } = req.params;
    const { cantidad } = req.body;
    const qty = Math.max(1, parseInt(cantidad));

    const [[item]] = await pool.query(
      'SELECT ci.id, ci.producto_id, p.stock FROM carrito_items ci JOIN productos p ON p.id=ci.producto_id WHERE ci.id=? AND ci.session_id=?',
      [itemId, sessionId]
    );
    if (!item) return res.status(404).json({ success: false, error: 'Item no encontrado.' });

    if (qty > item.stock) {
      return res.status(409).json({ success: false, error: `Stock disponible: ${item.stock}.`, availableStock: item.stock });
    }

    await pool.query('UPDATE carrito_items SET cantidad=? WHERE id=?', [qty, itemId]);

    const items = await fetchCart(sessionId);
    const total = items.reduce((s, i) => s + i.precio * i.cantidad, 0);
    res.json({ success: true, data: items, total: +total.toFixed(2) });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error al actualizar.' });
  }
};

// DELETE /api/carrito/:sessionId/items/:itemId
const removeItem = async (req, res) => {
  try {
    const { sessionId, itemId } = req.params;
    await pool.query('DELETE FROM carrito_items WHERE id=? AND session_id=?', [itemId, sessionId]);
    const items = await fetchCart(sessionId);
    const total = items.reduce((s, i) => s + i.precio * i.cantidad, 0);
    res.json({ success: true, data: items, total: +total.toFixed(2), message: 'Producto eliminado del carrito.' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error al eliminar.' });
  }
};

module.exports = { getCart, addItem, updateItem, removeItem };
