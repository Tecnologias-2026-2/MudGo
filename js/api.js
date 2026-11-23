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
    if (!response.ok || !payload.success) {
      const error = new Error(payload.message || 'Error de comunicación con MudGo.');
      error.status = response.status;
      throw error;
    }
    return payload.data;
  }
  global.MudGoAPI = {
    request,
    register: data => request('/auth/register', { method: 'POST', body: data }),
    login: data => request('/auth/login', { method: 'POST', body: data }),
    me: () => request('/auth/me'),
    logout: () => request('/auth/logout', { method: 'POST' }),
    requests: () => request('/solicitudes'),
    getRequest: id => request(`/solicitudes/${encodeURIComponent(id)}`),
    createRequest: data => request('/solicitudes', { method: 'POST', body: data }),
    confirmRequest: id => request(`/solicitudes/${id}/confirmar`, { method: 'POST' }),
    decideRequest: (id, decision) => request(`/solicitudes/${id}/${decision}`, { method: 'POST' }),
    providerProfile: () => request('/proveedor/perfil'),
    profile: () => request('/perfil'),
    updateProfile: data => request('/perfil', { method: 'PATCH', body: data }),
    changePassword: data => request('/auth/change-password', { method: 'POST', body: data }),
    addresses: () => request('/cliente/direcciones'),
    addAddress: data => request('/cliente/direcciones', { method: 'POST', body: data }),
    deleteAddress: id => request(`/cliente/direcciones/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    preferences: () => request('/preferencias'),
    updatePreferences: data => request('/preferencias', { method: 'PATCH', body: data }),
    providerDocuments: () => request('/proveedor/documentos'),
    uploadProviderDocument: async (type, file) => {
      const form = new FormData(); form.append('tipo', type); form.append('archivo', file);
      const response = await fetch(API_BASE + '/proveedor/documentos', { method: 'POST', credentials: 'include', body: form });
      const payload = await response.json().catch(() => ({success:false,message:'Respuesta no válida del servidor.'}));
      if (!response.ok || !payload.success) throw new Error(payload.message || 'No se pudo subir el documento.');
      return payload.data;
    },
    updateProviderProfile: data => request('/proveedor/perfil', { method: 'PATCH', body: data }),
    setProviderAvailability: disponible => request('/proveedor/disponibilidad', { method: 'PATCH', body: { disponible } }),
    vehicles: () => request('/vehiculos'),
    createVehicle: data => request('/vehiculos', { method: 'POST', body: data }),
    payments: () => request('/pagos'),
    createPayment: data => request('/pagos', { method: 'POST', body: data }),
    ratings: () => request('/calificaciones'),
    createRating: data => request('/calificaciones', { method: 'POST', body: data }),
    updateRequestStatus: (id, estado) => request(`/solicitudes/${id}/estado`, { method: 'PATCH', body: { estado } }),
    updateVehicle: (id, data) => request(`/vehiculos/${id}`, { method: 'PATCH', body: data }),
    deleteVehicle: id => request(`/vehiculos/${id}`, { method: 'DELETE' }),
    adminDashboard: () => request('/admin/dashboard'),
    adminUsers: () => request('/admin/usuarios'),
    setUserStatus: (id, estado) => request(`/admin/usuarios/${id}/estado`, { method: 'PATCH', body: { estado } })
  };
})(window);
