-- ============================================================
-- AUTENTICACIÓN JWT  –  agregar a crud_db
-- ============================================================
USE crud_db;

CREATE TABLE IF NOT EXISTS usuarios (
  id           INT           NOT NULL AUTO_INCREMENT,
  nombre       VARCHAR(100)  NOT NULL,
  email        VARCHAR(150)  NOT NULL UNIQUE,
  password     VARCHAR(255)  NOT NULL,
  rol          ENUM('admin','empleado','cliente') NOT NULL DEFAULT 'cliente',
  activo       TINYINT(1)    NOT NULL DEFAULT 1,
  created_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_email (email),
  INDEX idx_rol   (rol)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de refresh tokens (invalidación por logout)
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id           INT           NOT NULL AUTO_INCREMENT,
  usuario_id   INT           NOT NULL,
  token_hash   VARCHAR(255)  NOT NULL UNIQUE,
  expires_at   DATETIME      NOT NULL,
  created_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_usuario (usuario_id),
  CONSTRAINT fk_rt_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Usuario admin inicial  (password: Admin123!)
-- bcrypt hash de "Admin123!" con salt 10
INSERT IGNORE INTO usuarios (nombre, email, password, rol) VALUES
  ('Administrador', 'admin@sportsstore.com',
   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'),
  ('Demo Empleado', 'empleado@sportsstore.com',
   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'empleado');
-- NOTA: El hash anterior es de "password". Cámbialo antes de producción.
-- Para generar un hash real: node -e "require('bcryptjs').hash('Admin123!',10).then(console.log)"
