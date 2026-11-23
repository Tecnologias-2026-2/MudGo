/* ==========================================================================
   MudGo · Service Worker (PWA)
   Estrategia: precache del "app shell" y respuesta "network first" para las
   páginas (si no hay conexión se usa la copia guardada).
   ========================================================================== */
const CACHE = 'mudgo-v1';
const SHELL = [
  './', 'index.html', 'login.html', 'registro.html',
  'dashboard-cliente.html', 'solicitar-mudanza.html', 'cotizacion.html', 'confirmar-solicitud.html',
  'estado-solicitud.html', 'pago.html', 'servicio-confirmado.html', 'seguimiento.html',
  'servicio-finalizado.html', 'calificar.html', 'historial-cliente.html', 'perfil-cliente.html',
  'dashboard-proveedor.html', 'solicitudes-proveedor.html', 'solicitud-aceptada.html', 'servicio-proveedor.html',
  'vehiculos-proveedor.html', 'historial-proveedor.html', 'perfil-proveedor.html',
  'admin-dashboard.html', 'admin-usuarios.html', 'admin-proveedores.html', 'admin-servicios.html',
  'css/app.css', 'css/landing.css', 'styles.css',
  'js/app.js', 'js/cliente.js', 'js/proveedor.js', 'js/admin.js', 'script.js',
  'manifest.json', 'assets/icon-192.png', 'assets/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Páginas: primero red, si falla, caché
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res; })
        .catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('index.html')))
    );
    return;
  }

  // Recursos propios: caché primero, actualizando en segundo plano
  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(req).then(cached => {
        const network = fetch(req).then(res => {
          if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
          return res;
        }).catch(() => cached);
        return cached || network;
      })
    );
  }
});
