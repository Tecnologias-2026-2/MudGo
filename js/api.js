/* MudGo API client | helper inicial para integrar las pantallas con PHP.
   Debe cargarse después de configurar API_BASE y antes de los módulos de página. */
(function (global) {
  'use strict';
  const API_BASE = new URL('../backend/api', document.currentScript.src).pathname.replace(/\/$/, '');
  async function request(path, options = {}) {
    const response = await fetch(API_BASE + path, {
      method: options.method || 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      body: options.body === undefined ? undefined : JSON.stringify(options.body)
    });
    const payload = await response.json().catch(() => ({ success: false, message: 'Respuesta no válida del servidor.' }));
    if (!response.ok || !payload.success) throw new Error(payload.message || 'Error de comunicación con MudGo.');
    return payload.data;
  }
  global.MudGoAPI = {
    request,
    register: data => request('/auth/register', { method: 'POST', body: data }),
    login: data => request('/auth/login', { method: 'POST', body: data }),
    me: () => request('/auth/me'),
    logout: () => request('/auth/logout', { method: 'POST' }),
    requests: () => request('/solicitudes'),
    createRequest: data => request('/solicitudes', { method: 'POST', body: data }),
    confirmRequest: id => request(`/solicitudes/${id}/confirmar`, { method: 'POST' }),
    decideRequest: (id, decision) => request(`/solicitudes/${id}/${decision}`, { method: 'POST' }),
    vehicles: () => request('/vehiculos'),
    createVehicle: data => request('/vehiculos', { method: 'POST', body: data }),
    payments: () => request('/pagos'),
    createPayment: data => request('/pagos', { method: 'POST', body: data }),
    ratings: () => request('/calificaciones'),
    createRating: data => request('/calificaciones', { method: 'POST', body: data })
  };
})(window);
