const nodemailer = require('nodemailer');

// ─────────────────────────────────────────────────────────────────────────────
//  Email service  –  Gmail (puerto 465 SSL) + fallback Ethereal para dev
// ─────────────────────────────────────────────────────────────────────────────

const SMTP_TIMEOUT_MS  = 20_000;  // 20 s — suficiente para SSL de Gmail
const ETHEREAL_RETRIES = 3;
const SEND_RETRIES     = 2;

let transporter    = null;
let etherealCreds  = null;

// ── Ethereal (sólo dev, sin .env) ────────────────────────────────────────────
const createEtherealAccount = async () => {
  for (let i = 1; i <= ETHEREAL_RETRIES; i++) {
    try {
      const acc = await nodemailer.createTestAccount();
      console.log(`\n📧 Ethereal: ${acc.user}  |  https://ethereal.email\n`);
      return acc;
    } catch (err) {
      console.warn(`⚠️  Ethereal intento ${i}/${ETHEREAL_RETRIES}: ${err.message}`);
      if (i < ETHEREAL_RETRIES) await sleep(1500 * i);
    }
  }
  return null;
};

// ── Transporter principal ─────────────────────────────────────────────────────
const buildTransport = () => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '465');

  // Puerto 465 → implicit SSL  |  587 → STARTTLS
  const secure     = port === 465;
  const requireTLS = port === 587;

  console.log(`\n📨 Configurando SMTP: ${host}:${port} (${secure ? 'SSL' : 'STARTTLS'})`);

  return nodemailer.createTransport({
    host,
    port,
    secure,
    requireTLS,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    connectionTimeout : SMTP_TIMEOUT_MS,
    greetingTimeout   : SMTP_TIMEOUT_MS,
    socketTimeout     : SMTP_TIMEOUT_MS,
    tls: { rejectUnauthorized: false },
    pool: false,   // sin pool — cada envío abre y cierra su propia conexión
  });
};

// ── getTransporter ────────────────────────────────────────────────────────────
const getTransporter = async () => {
  // ── Credenciales en .env → usar SMTP real ─────────────────────────────────
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    if (!transporter) {
      transporter = buildTransport();

      try {
        await transporter.verify();
        console.log(`✅ SMTP verificado: ${process.env.SMTP_HOST}:${process.env.SMTP_PORT} (${process.env.SMTP_USER})\n`);
      } catch (err) {
        console.error(`❌ SMTP verify falló: ${err.message}`);
        console.error('   Verifica SMTP_HOST, SMTP_PORT, SMTP_USER y SMTP_PASS en .env\n');
        transporter = null;
        return null;
      }
    }
    return transporter;
  }

  // ── Sin .env → Ethereal para desarrollo ──────────────────────────────────
  if (!etherealCreds) etherealCreds = await createEtherealAccount();

  if (!etherealCreds) {
    console.warn('\n⚠️  Sin SMTP disponible. Configura SMTP_USER/SMTP_PASS en backend/.env\n');
    return null;
  }

  // Ethereal: recrea siempre (evita socket cerrado)
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: { user: etherealCreds.user, pass: etherealCreds.pass },
    connectionTimeout : SMTP_TIMEOUT_MS,
    greetingTimeout   : SMTP_TIMEOUT_MS,
    socketTimeout     : SMTP_TIMEOUT_MS,
    tls: { rejectUnauthorized: false },
    pool: false,
  });
};

const resetTransporter = () => {
  if (transporter) {
    try { transporter.close(); } catch {}
    transporter = null;
  }
};

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ── Template HTML ─────────────────────────────────────────────────────────────
const buildOrderHTML = (orden) => {
  const filas = orden.items.map(i => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #eee">${i.nombre}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:center">${i.cantidad}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:right">$${Number(i.precio).toFixed(2)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:right;font-weight:600">$${Number(i.subtotal).toFixed(2)}</td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f3ef;font-family:'Helvetica Neue',Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0">
  <tr><td align="center" style="padding:40px 20px">
    <table width="560" cellpadding="0" cellspacing="0"
           style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">

      <tr><td style="background:linear-gradient(135deg,#1c1b18,#2d6a4f);padding:32px 36px">
        <h1 style="margin:0;color:#fff;font-size:22px">🏆 Sports Store</h1>
        <p style="margin:6px 0 0;color:rgba(255,255,255,.7);font-size:14px">Confirmación de pedido</p>
      </td></tr>

      <tr><td style="padding:32px 36px">
        <p style="margin:0 0 6px;font-size:16px;color:#1c1b18">
          Hola, <strong>${orden.cliente_nombre}</strong> 👋
        </p>
        <p style="margin:0 0 24px;color:#6b6960;font-size:14px">
          Tu compra ha sido procesada exitosamente.
        </p>

        <table width="100%" cellpadding="0" cellspacing="0"
               style="background:#f4f3ef;border-radius:8px;margin-bottom:24px">
          <tr>
            <td style="padding:14px 18px">
              <span style="font-size:12px;color:#6b6960;text-transform:uppercase;font-weight:600">
                N° de Pedido
              </span><br>
              <span style="font-size:20px;font-weight:700;color:#1c1b18;font-family:monospace">
                #${String(orden.id).padStart(6,'0')}
              </span>
            </td>
            <td style="padding:14px 18px;text-align:right">
              <span style="font-size:12px;color:#6b6960;text-transform:uppercase;font-weight:600">
                Fecha
              </span><br>
              <span style="font-size:14px;color:#1c1b18">
                ${new Date(orden.created_at).toLocaleDateString('es-ES',{dateStyle:'long'})}
              </span>
            </td>
          </tr>
        </table>

        <table width="100%" cellpadding="0" cellspacing="0"
               style="border:1px solid #e2e0d8;border-radius:8px;overflow:hidden">
          <thead>
            <tr style="background:#1c1b18">
              <th style="padding:10px 12px;text-align:left;color:#fff;font-size:12px">Producto</th>
              <th style="padding:10px 12px;text-align:center;color:#fff;font-size:12px">Cant.</th>
              <th style="padding:10px 12px;text-align:right;color:#fff;font-size:12px">Precio</th>
              <th style="padding:10px 12px;text-align:right;color:#fff;font-size:12px">Subtotal</th>
            </tr>
          </thead>
          <tbody>${filas}</tbody>
          <tfoot>
            <tr style="background:#d8f3dc">
              <td colspan="3" style="padding:12px;text-align:right;font-weight:700;color:#1b4332">
                TOTAL
              </td>
              <td style="padding:12px;text-align:right;font-weight:700;font-size:16px;color:#1b4332">
                $${Number(orden.total).toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>

        <p style="margin:24px 0 0;font-size:13px;color:#6b6960;line-height:1.6">
          Gracias por tu compra.<br>
          ¿Preguntas? Escríbenos a
          <a href="mailto:soporte@sportsstore.com" style="color:#2d6a4f">
            soporte@sportsstore.com
          </a>
        </p>
      </td></tr>

      <tr><td style="background:#f4f3ef;padding:20px 36px;text-align:center;font-size:12px;color:#6b6960">
        © ${new Date().getFullYear()} Sports Store — Mensaje automático.
      </td></tr>

    </table>
  </td></tr>
</table>
</body></html>`;
};

// ── sendOrderConfirmation ─────────────────────────────────────────────────────
const sendOrderConfirmation = async (orden) => {
  for (let attempt = 1; attempt <= SEND_RETRIES; attempt++) {
    try {
      const transport = await getTransporter();

      if (!transport) {
        console.log(`📭 Email omitido — sin SMTP disponible. Orden #${orden.id} guardada.`);
        return { ok: false, skipped: true };
      }

      const info = await transport.sendMail({
        from   : `"Sports Store" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
        to     : orden.cliente_email,
        subject: `✅ Confirmación de pedido #${String(orden.id).padStart(6,'0')} — Sports Store`,
        html   : buildOrderHTML(orden),
      });

      const preview = nodemailer.getTestMessageUrl(info);
      console.log(`\n✅ Email enviado → ${orden.cliente_email}`);
      console.log(`   Orden: #${String(orden.id).padStart(6,'0')} | ID: ${info.messageId}`);
      if (preview) console.log(`   Preview: ${preview}`);
      console.log('');

      return { ok: true, messageId: info.messageId, previewUrl: preview || null };

    } catch (err) {
      const isConnErr = /socket|ECONNREFUSED|ETIMEDOUT|ESOCKET|timeout/i
        .test((err.message || '') + (err.code || ''));

      console.error(`❌ Email intento ${attempt}/${SEND_RETRIES}: ${err.message}`);

      if (isConnErr) resetTransporter();

      if (attempt < SEND_RETRIES) {
        await sleep(3000);
        continue;
      }

      console.warn(`⚠️  Email no enviado para orden #${orden.id} — la compra fue registrada igualmente.`);
      return { ok: false, error: err.message };
    }
  }
};

module.exports = { sendOrderConfirmation };
