-- ============================================================
-- MÓDULO ADMINISTRACIÓN  –  agregar a crud_db
-- ============================================================
USE crud_db;

-- ── Categorías ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categorias (
  id          INT           NOT NULL AUTO_INCREMENT,
  nombre      VARCHAR(80)   NOT NULL UNIQUE,
  descripcion VARCHAR(255)      NULL,
  activo      TINYINT(1)    NOT NULL DEFAULT 1,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed categorías iniciales (tomadas de los productos existentes)
INSERT IGNORE INTO categorias (nombre, descripcion) VALUES
  ('Calzado',    'Zapatillas, tenis y calzado deportivo'),
  ('Balones',    'Balones de fútbol, baloncesto y otros deportes'),
  ('Fitness',    'Equipamiento para gimnasio y entrenamiento en casa'),
  ('Ciclismo',   'Accesorios y equipamiento para ciclismo'),
  ('Natación',   'Gafas, trajes y accesorios para natación'),
  ('Tenis',      'Raquetas, pelotas y accesorios de tenis'),
  ('Boxeo',      'Guantes, sacos y equipamiento de boxeo y artes marciales'),
  ('Accesorios', 'Bolsas, mochilas y accesorios deportivos generales');
