import { apiFetch } from '../stores/auth.js';

const BASE = '/api/empleados';

export const empleadosService = {
  getAll:           (p = {}) => apiFetch(`${BASE}?` + new URLSearchParams(p)),
  getOne:           (id)     => apiFetch(`${BASE}/${id}`),
  getDepartamentos: ()       => apiFetch(`${BASE}/departamentos`),
  create:  (body)            => apiFetch(BASE, { method: 'POST', body: JSON.stringify(body) }),
  update:  (id, body)        => apiFetch(`${BASE}/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  remove:  (id)              => apiFetch(`${BASE}/${id}`, { method: 'DELETE' }),
};
