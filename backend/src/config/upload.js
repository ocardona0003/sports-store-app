const multer  = require('multer');
const sharp   = require('sharp');
const path    = require('path');
const fs      = require('fs');
const { v4: uuidv4 } = require('uuid');

// ── Carpeta donde se guardan las imágenes ─────────────────────────────────────
const UPLOADS_DIR = path.join(__dirname, '../../uploads/productos');

// Crear carpeta si no existe
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  console.log(`📁 Carpeta de imágenes creada: ${UPLOADS_DIR}`);
}

// ── Multer: almacenamiento en memoria (sharp procesa antes de escribir al disco)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido. Use JPG, PNG, WebP o GIF.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max entrada
});

// ── Procesar y guardar imagen en disco ────────────────────────────────────────
const processAndSave = async (buffer, originalName) => {
  const filename  = `${uuidv4()}.webp`;
  const outputPath = path.join(UPLOADS_DIR, filename);

  // Redimensionar a máx 800px de ancho y convertir a WebP (calidad 80)
  await sharp(buffer)
    .resize({ width: 800, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(outputPath);

  // Retorna la ruta pública relativa que se guarda en la BD
  return `/uploads/productos/${filename}`;
};

// ── Eliminar imagen del disco ─────────────────────────────────────────────────
const deleteImage = (imagePath) => {
  if (!imagePath || imagePath.startsWith('http')) return; // no borrar URLs externas
  const fullPath = path.join(__dirname, '../..', imagePath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
    console.log(`🗑️  Imagen eliminada: ${fullPath}`);
  }
};

// ── Middleware de subida única ─────────────────────────────────────────────────
const uploadSingle = upload.single('imagen');

// Wrapper que maneja errores de multer
const handleUpload = (req, res, next) => {
  uploadSingle(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, error: 'La imagen supera el límite de 10 MB.' });
      }
      return res.status(400).json({ success: false, error: `Error de subida: ${err.message}` });
    }
    if (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
    next();
  });
};

module.exports = { handleUpload, processAndSave, deleteImage, UPLOADS_DIR };
