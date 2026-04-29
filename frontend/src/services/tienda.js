const r = async (res) => {
  const d = await res.json();
  if (!res.ok) throw new Error(d.error || 'Error en la solicitud');
  return d;
};

export const productosApi = {
  getAll: (p = {}) => fetch('/api/productos?' + new URLSearchParams(p)).then(r),
  getOne: (id)     => fetch(`/api/productos/${id}`).then(r),
};

export const carritoApi = {
  get:    (sid)             => fetch(`/api/carrito/${sid}`).then(r),
  add:    (sid, body)       => fetch(`/api/carrito/${sid}/items`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  }).then(r),
  update: (sid, iid, body)  => fetch(`/api/carrito/${sid}/items/${iid}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  }).then(r),
  remove: (sid, iid)        => fetch(`/api/carrito/${sid}/items/${iid}`, { method: 'DELETE' }).then(r),
};

export const ordenesApi = {
  checkout: (body)    => fetch('/api/ordenes/checkout', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  }).then(r),
  history:  (email, p = {}) => fetch('/api/ordenes?' + new URLSearchParams({ email, ...p })).then(r),
  getOne:   (id)      => fetch(`/api/ordenes/${id}`).then(r),
};
