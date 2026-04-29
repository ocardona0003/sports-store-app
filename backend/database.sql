-- Crear base de datos
CREATE DATABASE IF NOT EXISTS crud_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE crud_db;

-- Tabla de empleados
CREATE TABLE IF NOT EXISTS empleados (
  id          INT           NOT NULL AUTO_INCREMENT,
  nombre      VARCHAR(100)  NOT NULL,
  apellido    VARCHAR(100)  NOT NULL,
  email       VARCHAR(150)  NOT NULL UNIQUE,
  telefono    VARCHAR(20)       NULL,
  departamento VARCHAR(80)  NOT NULL,
  cargo       VARCHAR(100)  NOT NULL,
  salario     DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  activo      TINYINT(1)    NOT NULL DEFAULT 1,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_departamento (departamento),
  INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Datos de ejemplo
INSERT INTO empleados (nombre, apellido, email, telefono, departamento, cargo, salario) VALUES
  ('Ana',      'García',    'ana.garcia@empresa.com',    '555-1001', 'Ingeniería',  'Desarrolladora Senior',  75000.00),
  ('Carlos',   'Méndez',    'carlos.mendez@empresa.com', '555-1002', 'Diseño',      'UX Designer',            62000.00),
  ('Sofía',    'Ramírez',   'sofia.ramirez@empresa.com', '555-1003', 'Marketing',   'Gerente de Marketing',   85000.00),
  ('Diego',    'Torres',    'diego.torres@empresa.com',  '555-1004', 'Ingeniería',  'DevOps Engineer',        78000.00),
  ('Valentina','López',     'vlopez@empresa.com',        '555-1005', 'RRHH',        'Analista de Recursos',   55000.00),
  ('Andrés',   'Fuentes',   'afuentes@empresa.com',      '555-1006', 'Finanzas',    'Contador',               60000.00);
