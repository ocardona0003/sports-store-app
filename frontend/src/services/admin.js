const r = async (res) => {
  const d = await res.json();
  if (!res.ok) throw new Error(d.error || 'Error en la solicitud');
  return d;
};

const h = { 'Content-Type': 'application/json' };

// ── Categorías ──────────────────────────────────────────────────────────────
export const categoriasApi = {
  getAll:  (params = {}) => fetch('/api/categorias?' + new URLSearchParams(params)).then(r),
  getOne:  (id)           => fetch(`/api/categorias/${id}`).then(r),
  create:  (body)         => fetch('/api/categorias',       { method: 'POST',   headers: h, body: JSON.stringify(body) }).then(r),
  update:  (id, body)     => fetch(`/api/categorias/${id}`, { method: 'PUT',    headers: h, body: JSON.stringify(body) }).then(r),
  remove:  (id)           => fetch(`/api/categorias/${id}`, { method: 'DELETE' }).then(r),
};

// ── Productos admin ─────────────────────────────────────────────────────────
// Construye un FormData con los campos del producto + imagen si existe
const buildFormData = (fields, imageFile) => {
  const fd = new FormData();

  // Campos de texto
  Object.entries(fields).forEach(([key, val]) => {
    if (val !== null && val !== undefined && key !== 'imagen_url') {
      fd.append(key, val);
    }
  });

  if (imageFile) {
    if (imageFile instanceof File) {
      // Archivo real: multer lo procesará en el backend
      fd.append('imagen', imageFile);
    } else if (imageFile._externalUrl) {
      // URL externa: se envía como campo de texto
      fd.append('imagen_url', imageFile._externalUrl);
    }
  }

  return fd;
};

export const adminProductosApi = {
  getAll: (params = {}) =>
    fetch('/api/productos?' + new URLSearchParams({ ...params, admin: 'true' })).then(r),

  create: (fields, imageFile) =>
    fetch('/api/productos/admin', {
      method: 'POST',
      body: buildFormData(fields, imageFile),
      // No poner Content-Type: el navegador lo setea con el boundary correcto para multipart
    }).then(r),

  update: (id, fields, imageFile) =>
    fetch(`/api/productos/admin/${id}`, {
      method: 'PUT',
      body: buildFormData(fields, imageFile),
    }).then(r),

  remove:      (id) => fetch(`/api/productos/admin/${id}`,        { method: 'DELETE' }).then(r),
  removeImage: (id) => fetch(`/api/productos/admin/${id}/imagen`, { method: 'DELETE' }).then(r),
};
