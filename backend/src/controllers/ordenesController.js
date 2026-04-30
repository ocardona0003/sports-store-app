const { pool } = require('../config/db');
const { sendOrderConfirmation } = require('../config/email');
const logger = require('../config/logger');

const checkout = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { session_id, cliente_nombre, cliente_email, notas = '' } = req.body;
    logger.info('ordenes.checkout INICIO', { session_id, cliente_email });

    if (!session_id || !cliente_nombre || !cliente_email) {
      return res.status(400).json({ success: false, error: 'session_id, cliente_nombre y cliente_email son requeridos.' });
    }

    const [items] = await conn.query(
      `SELECT ci.id AS carrito_item_id, ci.cantidad,
              p.id AS producto_id, p.nombre, p.precio, p.stock
       FROM carrito_items ci JOIN productos p ON p.id = ci.producto_id
       WHERE ci.session_id = ?`, [session_id]
    );
    logger.debug('ordenes.checkout carrito', { session_id, items: items.length, contenido: items.map(i => ({ nombre: i.nombre, cant: i.cantidad, stock: i.stock })) });

    if (!items.length) {
      logger.warn('ordenes.checkout carrito vacío', { session_id });
      return res.status(400).json({ success: false, error: 'El carrito está vacío.' });
    }

    const stockErrors = items.filter(i => i.stock < i.cantidad);
    if (stockErrors.length) {
      logger.warn('ordenes.checkout stock insuficiente', { session_id, errores: stockErrors.map(i => ({ nombre: i.nombre, stock: i.stock, solicitado: i.cantidad })) });
      return res.status(409).json({ success: false, error: 'Stock insuficiente para completar la compra.',
        stockErrors: stockErrors.map(i => ({ producto_id: i.producto_id, nombre: i.nombre, solicitado: i.cantidad, disponible: i.stock })) });
    }

    const total = items.reduce((s, i) => s + i.precio * i.cantidad, 0);
    logger.debug('ordenes.checkout total calculado', { total: +total.toFixed(2) });

    await conn.beginTransaction();

    const [ordenResult] = await conn.query(
      'INSERT INTO ordenes (session_id, cliente_nombre, cliente_email, total, notas) VALUES (?,?,?,?,?)',
      [session_id, cliente_nombre, cliente_email, +total.toFixed(2), notas]
    );
    const ordenId = ordenResult.insertId;
    logger.info('ordenes.checkout orden creada', { ordenId, total: +total.toFixed(2) });

    for (const item of items) {
      const subtotal = +(item.precio * item.cantidad).toFixed(2);
      await conn.query(
        'INSERT INTO orden_items (orden_id, producto_id, nombre, precio, cantidad, subtotal) VALUES (?,?,?,?,?,?)',
        [ordenId, item.producto_id, item.nombre, item.precio, item.cantidad, subtotal]
      );
      await conn.query('UPDATE productos SET stock = stock - ? WHERE id = ?', [item.cantidad, item.producto_id]);
      logger.debug('ordenes.checkout item procesado', { producto: item.nombre, cantidad: item.cantidad, subtotal });
    }

    await conn.query('DELETE FROM carrito_items WHERE session_id = ?', [session_id]);
    await conn.commit();
    logger.info('ordenes.checkout transacción completada', { ordenId, items: items.length });

    const orden = { id: ordenId, cliente_nombre, cliente_email, total: +total.toFixed(2), notas, created_at: new Date(),
      items: items.map(i => ({ nombre: i.nombre, cantidad: i.cantidad, precio: i.precio, subtotal: +(i.precio * i.cantidad).toFixed(2) })) };

    sendOrderConfirmation(orden);
    logger.info('ordenes.checkout email de confirmación enviado', { ordenId, cliente_email });

    res.status(201).json({ success: true, message: '¡Compra realizada exitosamente! Recibirás un email de confirmación.', data: orden });
  } catch (err) {
    await conn.rollback();
    logger.error('ordenes.checkout ERROR - rollback ejecutado', { error: err.message, stack: err.stack });
    res.status(500).json({ success: false, error: 'Error al procesar la compra.' });
  } finally {
    conn.release();
  }
};

const getHistory = async (req, res) => {
  try {
    const { email, page = 1, limit = 10 } = req.query;
    if (!email) return res.status(400).json({ success: false, error: 'El email es requerido.' });
    logger.debug('ordenes.getHistory', { email, page });

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM ordenes WHERE cliente_email=?', [email]);
    const [ordenes] = await pool.query('SELECT * FROM ordenes WHERE cliente_email=? ORDER BY id DESC LIMIT ? OFFSET ?', [email, parseInt(limit), offset]);

    for (const o of ordenes) {
      const [items] = await pool.query('SELECT * FROM orden_items WHERE orden_id=?', [o.id]);
      o.items = items;
    }
    logger.info('ordenes.getHistory OK', { email, total, retornadas: ordenes.length });
    res.json({ success: true, data: ordenes, pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) } });
  } catch (err) {
    logger.error('ordenes.getHistory ERROR', { error: err.message });
    res.status(500).json({ success: false, error: 'Error al obtener historial.' });
  }
};

const getOne = async (req, res) => {
  try {
    logger.debug('ordenes.getOne', { id: req.params.id });
    const [[orden]] = await pool.query('SELECT * FROM ordenes WHERE id=?', [req.params.id]);
    if (!orden) {
      logger.warn('ordenes.getOne NOT FOUND', { id: req.params.id });
      return res.status(404).json({ success: false, error: 'Orden no encontrada.' });
    }
    const [items] = await pool.query('SELECT * FROM orden_items WHERE orden_id=?', [orden.id]);
    logger.info('ordenes.getOne OK', { id: orden.id, items: items.length, total: orden.total });
    res.json({ success: true, data: { ...orden, items } });
  } catch (err) {
    logger.error('ordenes.getOne ERROR', { error: err.message });
    res.status(500).json({ success: false, error: 'Error al obtener orden.' });
  }
};

const getAllAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    logger.info('ordenes.getAllAdmin', { page, requestedBy: req.user?.id });
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM ordenes');
    const [ordenes] = await pool.query('SELECT * FROM ordenes ORDER BY id DESC LIMIT ? OFFSET ?', [parseInt(limit), offset]);
    for (const o of ordenes) {
      const [items] = await pool.query('SELECT * FROM orden_items WHERE orden_id=?', [o.id]);
      o.items = items;
    }
    logger.info('ordenes.getAllAdmin OK', { total, retornadas: ordenes.length });
    res.json({ success: true, data: ordenes, pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) } });
  } catch (err) {
    logger.error('ordenes.getAllAdmin ERROR', { error: err.message });
    res.status(500).json({ success: false, error: 'Error al obtener órdenes.' });
  }
};

module.exports = { checkout, getHistory, getOne, getAllAdmin };
