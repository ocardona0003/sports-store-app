import { apiFetch } from '../stores/auth.js';

// ── Categorías (requieren auth admin) ──────────────────────────────────────
export const categoriasApi = {
  getAll:  (params = {}) => apiFetch('/api/categorias?' + new URLSearchParams(params)),
  getOne:  (id)           => apiFetch(`/api/categorias/${id}`),
  create:  (body)         => apiFetch('/api/categorias',       { method: 'POST',   body: JSON.stringify(body) }),
  update:  (id, body)     => apiFetch(`/api/categorias/${id}`, { method: 'PUT',    body: JSON.stringify(body) }),
  remove:  (id)           => apiFetch(`/api/categorias/${id}`, { method: 'DELETE' }),
};

// ── Productos admin (requieren auth admin) ──────────────────────────────────
const buildFormData = (fields, imageFile) => {
  const fd = new FormData();
  Object.entries(fields).forEach(([k, v]) => {
    if (v !== null && v !== undefined && k !== 'imagen_url') fd.append(k, v);
  });
  if (imageFile instanceof File) {
    fd.append('imagen', imageFile);
  } else if (imageFile?._externalUrl) {
    fd.append('imagen_url', imageFile._externalUrl);
  }
  return fd;
};

export const adminProductosApi = {
  getAll: (params = {}) =>
    apiFetch('/api/productos?' + new URLSearchParams({ ...params, admin: 'true' })),

  create: (fields, imageFile) =>
    apiFetch('/api/productos/admin', { method: 'POST', body: buildFormData(fields, imageFile) }),

  update: (id, fields, imageFile) =>
    apiFetch(`/api/productos/admin/${id}`, { method: 'PUT', body: buildFormData(fields, imageFile) }),

  remove:      (id) => apiFetch(`/api/productos/admin/${id}`,        { method: 'DELETE' }),
  removeImage: (id) => apiFetch(`/api/productos/admin/${id}/imagen`, { method: 'DELETE' }),
};
