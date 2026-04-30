const { pool } = require('../config/db');
const logger   = require('../config/logger');

const fetchCart = async (sessionId) => {
  const [rows] = await pool.query(
    `SELECT ci.id, ci.session_id, ci.cantidad,
            p.id AS producto_id, p.nombre, p.categoria,
            p.precio, p.stock, p.imagen_url
     FROM carrito_items ci JOIN productos p ON p.id = ci.producto_id
     WHERE ci.session_id = ?`,
    [sessionId]
  );
  return rows;
};

const getCart = async (req, res) => {
  try {
    const { sessionId } = req.params;
    logger.debug('carrito.getCart', { sessionId });
    const items = await fetchCart(sessionId);
    const total = items.reduce((s, i) => s + i.precio * i.cantidad, 0);
    logger.info('carrito.getCart OK', { sessionId, items: items.length, total: +total.toFixed(2) });
    res.json({ success: true, data: items, total: +total.toFixed(2) });
  } catch (err) {
    logger.error('carrito.getCart ERROR', { error: err.message });
    res.status(500).json({ success: false, error: 'Error al obtener carrito.' });
  }
};

const addItem = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { producto_id, cantidad = 1 } = req.body;
    const qty = Math.max(1, parseInt(cantidad));
    logger.info('carrito.addItem', { sessionId, producto_id, cantidad: qty });

    const [[prod]] = await pool.query('SELECT id, nombre, stock FROM productos WHERE id=? AND activo=1', [producto_id]);
    if (!prod) {
      logger.warn('carrito.addItem producto no encontrado', { producto_id });
      return res.status(404).json({ success: false, error: 'Producto no encontrado.' });
    }

    const [[existing]] = await pool.query(
      'SELECT id, cantidad FROM carrito_items WHERE session_id=? AND producto_id=?', [sessionId, producto_id]
    );
    const newQty = (existing?.cantidad || 0) + qty;

    if (prod.stock < newQty) {
      logger.warn('carrito.addItem stock insuficiente', { producto_id, stock: prod.stock, solicitado: newQty });
      return res.status(409).json({ success: false, error: `Stock insuficiente. Disponible: ${prod.stock}.`, availableStock: prod.stock });
    }

    if (existing) {
      await pool.query('UPDATE carrito_items SET cantidad=? WHERE id=?', [newQty, existing.id]);
    } else {
      await pool.query('INSERT INTO carrito_items (session_id, producto_id, cantidad) VALUES (?,?,?)', [sessionId, producto_id, qty]);
    }

    const items = await fetchCart(sessionId);
    const total = items.reduce((s, i) => s + i.precio * i.cantidad, 0);
    logger.info('carrito.addItem OK', { sessionId, producto: prod.nombre, newQty, total: +total.toFixed(2) });
    res.json({ success: true, data: items, total: +total.toFixed(2), message: `"${prod.nombre}" agregado al carrito.` });
  } catch (err) {
    logger.error('carrito.addItem ERROR', { error: err.message });
    res.status(500).json({ success: false, error: 'Error al agregar al carrito.' });
  }
};

const updateItem = async (req, res) => {
  try {
    const { sessionId, itemId } = req.params;
    const { cantidad } = req.body;
    const qty = Math.max(1, parseInt(cantidad));
    logger.info('carrito.updateItem', { sessionId, itemId, cantidad: qty });

    const [[item]] = await pool.query(
      'SELECT ci.id, ci.producto_id, p.stock FROM carrito_items ci JOIN productos p ON p.id=ci.producto_id WHERE ci.id=? AND ci.session_id=?',
      [itemId, sessionId]
    );
    if (!item) return res.status(404).json({ success: false, error: 'Item no encontrado.' });
    if (qty > item.stock) {
      logger.warn('carrito.updateItem stock insuficiente', { itemId, stock: item.stock, solicitado: qty });
      return res.status(409).json({ success: false, error: `Stock disponible: ${item.stock}.` });
    }

    await pool.query('UPDATE carrito_items SET cantidad=? WHERE id=?', [qty, itemId]);
    const items = await fetchCart(sessionId);
    const total = items.reduce((s, i) => s + i.precio * i.cantidad, 0);
    logger.info('carrito.updateItem OK', { itemId, newQty: qty });
    res.json({ success: true, data: items, total: +total.toFixed(2) });
  } catch (err) {
    logger.error('carrito.updateItem ERROR', { error: err.message });
    res.status(500).json({ success: false, error: 'Error al actualizar.' });
  }
};

const removeItem = async (req, res) => {
  try {
    const { sessionId, itemId } = req.params;
    logger.info('carrito.removeItem', { sessionId, itemId });
    await pool.query('DELETE FROM carrito_items WHERE id=? AND session_id=?', [itemId, sessionId]);
    const items = await fetchCart(sessionId);
    const total = items.reduce((s, i) => s + i.precio * i.cantidad, 0);
    logger.info('carrito.removeItem OK', { sessionId, itemId, remainingItems: items.length });
    res.json({ success: true, data: items, total: +total.toFixed(2), message: 'Producto eliminado del carrito.' });
  } catch (err) {
    logger.error('carrito.removeItem ERROR', { error: err.message });
    res.status(500).json({ success: false, error: 'Error al eliminar.' });
  }
};

module.exports = { getCart, addItem, updateItem, removeItem };
