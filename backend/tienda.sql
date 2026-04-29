-- ============================================================
-- MÓDULO TIENDA DEPORTIVA  –  agregar a crud_db
-- ============================================================
USE crud_db;

-- ── Productos ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS productos (
  id           INT            NOT NULL AUTO_INCREMENT,
  nombre       VARCHAR(150)   NOT NULL,
  categoria    VARCHAR(80)    NOT NULL,
  descripcion  TEXT               NULL,
  precio       DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
  stock        INT            NOT NULL DEFAULT 0,
  imagen_url   VARCHAR(500)       NULL,
  activo       TINYINT(1)     NOT NULL DEFAULT 1,
  created_at   DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_categoria (categoria),
  INDEX idx_activo    (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Carrito (sesión por usuario_token – clave simple para no requerir auth) ──
CREATE TABLE IF NOT EXISTS carrito_items (
  id           INT            NOT NULL AUTO_INCREMENT,
  session_id   VARCHAR(64)    NOT NULL,
  producto_id  INT            NOT NULL,
  cantidad     INT            NOT NULL DEFAULT 1,
  created_at   DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_session_producto (session_id, producto_id),
  INDEX idx_session (session_id),
  CONSTRAINT fk_carrito_producto
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Órdenes / Historial ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ordenes (
  id              INT            NOT NULL AUTO_INCREMENT,
  session_id      VARCHAR(64)    NOT NULL,
  cliente_nombre  VARCHAR(150)   NOT NULL,
  cliente_email   VARCHAR(150)   NOT NULL,
  total           DECIMAL(10,2)  NOT NULL,
  estado          ENUM('pendiente','completada','cancelada') NOT NULL DEFAULT 'completada',
  notas           TEXT               NULL,
  created_at      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_email     (cliente_email),
  INDEX idx_estado    (estado),
  INDEX idx_session   (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Detalle de cada orden ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orden_items (
  id           INT            NOT NULL AUTO_INCREMENT,
  orden_id     INT            NOT NULL,
  producto_id  INT                NULL,          -- NULL si el producto fue eliminado
  nombre       VARCHAR(150)   NOT NULL,          -- snapshot al momento de compra
  precio       DECIMAL(10,2)  NOT NULL,
  cantidad     INT            NOT NULL,
  subtotal     DECIMAL(10,2)  NOT NULL,
  PRIMARY KEY (id),
  INDEX idx_orden (orden_id),
  CONSTRAINT fk_item_orden
    FOREIGN KEY (orden_id) REFERENCES ordenes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Seed productos ────────────────────────────────────────────────────────────
INSERT INTO productos (nombre, categoria, descripcion, precio, stock, imagen_url) VALUES
('Nike Air Zoom Pegasus 40',
 'Calzado',
 'Zapatillas de running con amortiguación React y suela de tracción multidireccional.',
 129.99, 50,
 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80'),

('Adidas Ultraboost 23',
 'Calzado',
 'Zapatillas premium con sistema Boost de retorno de energía.',
 189.99, 35,
 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600&q=80'),

('Spalding NBA Street Basketball',
 'Balones',
 'Balón oficial NBA para uso en exteriores con cuero sintético de alta durabilidad.',
 45.99, 80,
 'https://images.unsplash.com/photo-1546519638405-a9bba0d3dc0b?w=600&q=80'),

('Adidas Tango Fútbol',
 'Balones',
 'Balón de fútbol con superficie termoadhesiva para mayor control.',
 39.99, 120,
 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=600&q=80'),

('Manduka PRO Yoga Mat',
 'Fitness',
 'Colchoneta de yoga premium 6mm, antideslizante, látex-free. Garantía de por vida.',
 119.99, 40,
 'https://images.unsplash.com/photo-1601925228006-53ee5bfd6ee5?w=600&q=80'),

('Mancuernas Ajustables PowerBlock 5-50 lb',
 'Fitness',
 'Set ajustable que reemplaza 16 pares. Sistema de ajuste rápido y diseño compacto.',
 299.99, 15,
 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&q=80'),

('Guantes de Gimnasio Harbinger',
 'Fitness',
 'Almohadillas de cuero para palma, correa de muñeca ajustable y ventilación dorsal.',
 24.99, 200,
 'https://images.unsplash.com/photo-1581009137042-c552e485697a?w=600&q=80'),

('Casco Giro Agilis MIPS',
 'Ciclismo',
 'Casco con tecnología MIPS para protección rotacional. Certificación CPSC/CE.',
 89.99, 25,
 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80'),

('Speedo Biofuse 2.0 Goggles',
 'Natación',
 'Gafas anti-empañamiento UV, silicona suave. Piscina y aguas abiertas.',
 34.99, 60,
 'https://images.unsplash.com/photo-1519315901367-f34ff9154487?w=600&q=80'),

('Wilson Clash 100 Pro v2',
 'Tenis',
 'Raqueta con tecnología FreeFlex: flexibilidad + estabilidad. Marco de carbono.',
 249.99, 20,
 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=600&q=80'),

('Everlast Pro Style Elite Guantes',
 'Boxeo',
 'Relleno EverFoam alta densidad, cierre velcro. Disponibles 12, 14 y 16 oz.',
 59.99, 45,
 'https://images.unsplash.com/photo-1517438476312-10d79c077509?w=600&q=80'),

('Nike Brasilia Bolsa Deportiva 41L',
 'Accesorios',
 'Bolsa 100% poliéster reciclado, compartimento zapatos separado, múltiples bolsillos.',
 49.99, 3,
 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80');
