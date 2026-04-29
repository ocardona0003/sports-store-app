const BASE = '/api/empleados';

const handleRes = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error en la solicitud');
  return data;
};

export const empleadosService = {
  getAll:   (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return fetch(`${BASE}?${qs}`).then(handleRes);
  },
  getOne:   (id)     => fetch(`${BASE}/${id}`).then(handleRes),
  create:   (body)   => fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(handleRes),
  update:   (id, body) => fetch(`${BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(handleRes),
  remove:   (id)     => fetch(`${BASE}/${id}`, { method: 'DELETE' }).then(handleRes),
  getDepartamentos: () => fetch(`${BASE}/departamentos`).then(handleRes),
};
