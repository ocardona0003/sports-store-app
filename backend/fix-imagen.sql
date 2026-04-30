-- Revertir columna imagen_url a VARCHAR(500) — ya no se guarda base64
-- Solo se guarda el path: /uploads/productos/uuid.webp
ALTER TABLE productos MODIFY COLUMN imagen_url VARCHAR(500) NULL DEFAULT '';
