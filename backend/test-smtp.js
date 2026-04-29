require('dotenv').config();
const net = require('net');
const tls = require('tls');
const nodemailer = require('nodemailer');

const HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const PORT = parseInt(process.env.SMTP_PORT || '587');
const USER = process.env.SMTP_USER || '';
const PASS = process.env.SMTP_PASS || '';

console.log('\n🔍 DIAGNÓSTICO SMTP');
console.log('═'.repeat(50));
console.log(`Host : ${HOST}`);
console.log(`Port : ${PORT}`);
console.log(`User : ${USER || '(no configurado)'}`);
console.log(`Pass : ${PASS ? '✅ configurada (' + PASS.length + ' chars)' : '❌ vacía'}`);
console.log('═'.repeat(50));

// Test 1: DNS
console.log('\n1️⃣  Resolviendo DNS...');
const dns = require('dns');
dns.lookup(HOST, (err, addr) => {
  if (err) {
    console.log(`   ❌ DNS falló: ${err.message}`);
  } else {
    console.log(`   ✅ DNS OK → ${addr}`);
  }
});

// Test 2: TCP en puerto 587
console.log(`\n2️⃣  Probando TCP ${HOST}:${PORT}...`);
const sock587 = new net.Socket();
sock587.setTimeout(6000);
sock587.connect(PORT, HOST, () => {
  console.log(`   ✅ TCP ${PORT} OK — conexión establecida`);
  sock587.destroy();
});
sock587.on('timeout', () => { console.log(`   ❌ TCP ${PORT} TIMEOUT — puerto bloqueado`); sock587.destroy(); });
sock587.on('error',   (e) => { console.log(`   ❌ TCP ${PORT} ERROR: ${e.message}`); });

// Test 3: TCP en puerto 465 (SSL)
setTimeout(() => {
  console.log(`\n3️⃣  Probando TCP ${HOST}:465...`);
  const sock465 = new net.Socket();
  sock465.setTimeout(6000);
  sock465.connect(465, HOST, () => {
    console.log(`   ✅ TCP 465 OK — conexión establecida`);
    sock465.destroy();
  });
  sock465.on('timeout', () => { console.log(`   ❌ TCP 465 TIMEOUT — puerto bloqueado`); sock465.destroy(); });
  sock465.on('error',   (e) => { console.log(`   ❌ TCP 465 ERROR: ${e.message}`); });
}, 1000);

// Test 4: Nodemailer verify (si hay credenciales)
setTimeout(async () => {
  if (!USER || !PASS) {
    console.log('\n4️⃣  Nodemailer verify: ⚠️  SMTP_USER/SMTP_PASS no configurados en .env');
    console.log('\n💡 Agrega en backend/.env:');
    console.log('   SMTP_HOST=smtp.gmail.com');
    console.log('   SMTP_PORT=587');
    console.log('   SMTP_USER=tucorreo@gmail.com');
    console.log('   SMTP_PASS=tuapppassword');
    return;
  }

  console.log('\n4️⃣  Nodemailer verify con credenciales...');

  const configs = [
    { label: 'Puerto 587 + STARTTLS', port: 587, secure: false, requireTLS: true  },
    { label: 'Puerto 587 sin TLS',    port: 587, secure: false, requireTLS: false },
    { label: 'Puerto 465 + SSL',      port: 465, secure: true,  requireTLS: false },
  ];

  for (const cfg of configs) {
    try {
      const t = nodemailer.createTransport({
        host: HOST, port: cfg.port, secure: cfg.secure,
        requireTLS: cfg.requireTLS,
        auth: { user: USER, pass: PASS },
        connectionTimeout: 8000, greetingTimeout: 8000, socketTimeout: 8000,
        tls: { rejectUnauthorized: false },
      });
      await t.verify();
      console.log(`   ✅ ${cfg.label} → FUNCIONA`);
      t.close();
    } catch (e) {
      console.log(`   ❌ ${cfg.label} → ${e.message}`);
    }
  }

  console.log('\n' + '═'.repeat(50));
  console.log('Diagnóstico completo.\n');
}, 3000);
