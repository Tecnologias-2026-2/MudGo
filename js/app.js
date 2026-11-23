/* ==========================================================================
   MudGo · Núcleo compartido de la aplicación
   - Iconos SVG, layout (sidebar / barra móvil), utilidades de UI
   - Datos dinámicos desde la API y borradores temporales del flujo de solicitud.
   ========================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------------ */
  /* Iconos (estilo Lucide, trazo 2px)                                   */
  /* ------------------------------------------------------------------ */
  const ICON_PATHS = {
    home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
    plusCircle: '<circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/>',
    locate: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2.5"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    truck: '<path d="M10 17h4V5H2v12h3"/><path d="M14 9h4l4 4v4h-3"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    arrowRight: '<path d="M5 12h14M12 5l7 7-7 7"/>',
    arrowLeft: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
    arrowDown: '<path d="M12 5v14M19 12l-7 7-7-7"/>',
    chevronRight: '<path d="m9 18 6-6-6-6"/>',
    chevronLeft: '<path d="m15 18-6-6 6-6"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    checkCircle: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    xCircle: '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    shieldCheck: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
    mapPin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    star: '<path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/>',
    dollar: '<path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
    loader: '<path d="M21 12a9 9 0 1 1-6.22-8.56"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    alert: '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/>',
    eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    trash: '<path d="M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6M9 6V4h6v2"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
    card: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
    activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
    box: '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.3 7 12 12l8.7-5M12 22V12"/>',
    ban: '<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>',
    play: '<path d="m6 3 14 9-14 9z"/>',
    flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22v-7"/>'
  };

  function icon(name, extraClass) {
    const p = ICON_PATHS[name] || ICON_PATHS.info;
    return '<svg class="' + (extraClass || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>';
  }

  /* ------------------------------------------------------------------ */
  /* Utilidades                                                          */
  /* ------------------------------------------------------------------ */
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  const numFmt = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 });
  function money(n) { return (n < 0 ? '-$' : '$') + numFmt.format(Math.abs(Math.round(n || 0))); }
  function moneyShort(n) {
    if (n >= 1e6) return '$' + (n / 1e6).toFixed(1).replace('.', ',').replace(',0', '') + 'M';
    if (n >= 1e3) return '$' + Math.round(n / 1e3) + 'K';
    return money(n);
  }

  const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  function parseDate(iso) {
    if (!iso) return null;
    const [y, m, d] = String(iso).split('-').map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
  }
  function capital(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  /** "Domingo, 10 de agosto 2026" */
  function dateLong(d) {
    d = d instanceof Date ? d : parseDate(d);
    if (!d) return '';
    return DIAS[d.getDay()] + ', ' + d.getDate() + ' de ' + MESES[d.getMonth()] + ' ' + d.getFullYear();
  }
  /** "Dom 10 Ago" */
  function dateShort(d) {
    d = d instanceof Date ? d : parseDate(d);
    if (!d) return '';
    return DIAS[d.getDay()].slice(0, 3) + ' ' + d.getDate() + ' ' + capital(MESES[d.getMonth()].slice(0, 3));
  }
  /** "10 Ago 2026" */
  function dateMed(d) {
    d = d instanceof Date ? d : parseDate(d);
    if (!d) return '';
    return String(d.getDate()).padStart(2, '0') + ' ' + capital(MESES[d.getMonth()].slice(0, 3)) + ' ' + d.getFullYear();
  }
  /** "08:00 AM" */
  function time12(hhmm) {
    if (!hhmm) return '';
    let [h, m] = hhmm.split(':').map(Number);
    const ap = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return String(h).padStart(2, '0') + ':' + String(m || 0).padStart(2, '0') + ' ' + ap;
  }
  function todayISO(offsetDays) {
    const d = new Date();
    d.setDate(d.getDate() + (offsetDays || 0));
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function initials(name) {
    return String(name || '').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
  }
  function stars(n, max) {
    max = max || 5;
    const full = Math.round(n || 0);
    let s = '';
    for (let i = 1; i <= max; i++) s += i <= full ? '★' : '<span class="off">★</span>';
    return '<span class="stars" aria-label="' + (n || 0) + ' de ' + max + ' estrellas">' + s + '</span>';
  }
  function params() { return new URLSearchParams(location.search); }
  function go(url, delay) {
    if (delay) setTimeout(() => { location.href = url; }, delay);
    else location.href = url;
  }

  /* ------------------------------------------------------------------ */
  /* Almacenamiento local (con respaldo en memoria)                      */
  /* ------------------------------------------------------------------ */
  const memory = {};
  const store = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem('mudgo.' + key);
        return raw == null ? (key in memory ? memory[key] : fallback) : JSON.parse(raw);
      } catch (e) { return key in memory ? memory[key] : fallback; }
    },
    set(key, value) {
      memory[key] = value;
      try { localStorage.setItem('mudgo.' + key, JSON.stringify(value)); } catch (e) { /* sin almacenamiento */ }
      return value;
    },
    remove(key) {
      delete memory[key];
      try { localStorage.removeItem('mudgo.' + key); } catch (e) { /* nada */ }
    }
  };

  /* ------------------------------------------------------------------ */
  /* Datos: no se mantienen registros ficticios en el cliente.            */
  /* Toda información de usuarios, solicitudes y servicios procede de API. */
  /* ------------------------------------------------------------------ */
  const DATA = {
    cliente: {}, proveedor: {}, proveedores: [], usuarios: [], historialCliente: [],
    solicitudesProveedor: [], historialProveedor: [], vehiculos: [], serviciosAdmin: []
  };

  const ESTADO_BADGE = {
    'Finalizado': 'green', 'Finalizada': 'green', 'Activo': 'green', 'Aceptada': 'green', 'Disponible': 'green', 'Confirmado': 'blue',
    'En curso': 'blue', 'Pendiente': 'orange', 'Esperando proveedor': 'orange', 'Inactivo': 'gray', 'No disponible': 'gray',
    'Cancelado': 'red', 'Cancelada': 'red', 'Rechazada': 'red', 'Suspendido': 'red'
  };
  function badge(text, tone, dot) {
    tone = tone || ESTADO_BADGE[text] || 'gray';
    return '<span class="badge badge--' + tone + (dot ? ' badge--dot' : '') + '">' + esc(text) + '</span>';
  }

  /* ------------------------------------------------------------------ */
  /* Cotización y solicitud del cliente                                   */
  /* ------------------------------------------------------------------ */
  const TARIFAS = {
    porKm: 3870,
    volumen: { pequeno: 35000, mediano: 60000, grande: 95000 },
    vehiculo: { van: 30000, 'camion-pequeno': 38000, 'camion-mediano': 45000, 'camion-grande': 65000 },
    ayudante: 18000,
    comision: 0.05
  };
  const LABELS = {
    volumen: { pequeno: 'Pequeño', mediano: 'Mediano', grande: 'Grande' },
    volumenDetalle: { pequeno: 'Pequeño (1 habitación)', mediano: 'Mediano (2–3 habitaciones)', grande: 'Grande (casa completa)' },
    vehiculo: { van: 'Van', 'camion-pequeno': 'Camión pequeño', 'camion-mediano': 'Camión mediano', 'camion-grande': 'Camión grande' }
  };

  /** Distancia no disponible: no se inventa sin un servicio cartográfico. */
  function estimateDistance() { return 1; /* Base demostrativa; no representa distancia cartográfica. */ }

  function calcQuote(r) {
    const round = n => Math.round(n / 1000) * 1000;
    const distancia = round(r.distancia * TARIFAS.porKm);
    const volumen = TARIFAS.volumen[r.volumen] || 0;
    const vehiculo = TARIFAS.vehiculo[r.vehiculo] || 0;
    const personal = (r.ayudantes || 0) * TARIFAS.ayudante;
    const subtotal = distancia + volumen + vehiculo + personal;
    const tarifa = Math.round(subtotal * TARIFAS.comision);
    return { distancia, volumen, vehiculo, personal, subtotal, tarifa, total: subtotal + tarifa };
  }

  function demoRequest() { return null; }

  const request = {
    get() { return store.get('solicitud', null); },
    current() { return request.get(); },
    save(r) { r.actualizada = Date.now(); return store.set('solicitud', r); },
    update(patch) {
      const current = request.get();
      if (!current) throw new Error('No hay una solicitud local seleccionada.');
      return request.save(Object.assign(current, patch));
    },
    clear() { store.remove('solicitud'); },
    shortRoute(r) { return shortAddr(r.origen) + ' → ' + shortAddr(r.destino); },
    serviceNumber(r) {
      const d = (r.fecha || '').replace(/-/g, '');
      return 'MG-' + (d || 'SIN-FECHA') + '-' + String(r.id || '').replace(/\D/g, '').padStart(4, '0');
    }
  };
  function shortAddr(a) {
    return String(a || '').split(',')[0].replace(/^Calle /i, 'Cll ').replace(/^Avenida /i, 'Av. ').replace(/^Carrera /i, 'Cra ');
  }

  /* Estados de la solicitud y a qué pantalla corresponden */
  const FLOW_PAGE = {
    borrador: 'cotizacion.html',
    esperando: 'estado-solicitud.html',
    rechazada: 'estado-solicitud.html',
    buscando: 'estado-solicitud.html',
    sin_proveedor: 'estado-solicitud.html',
    aceptada: 'estado-solicitud.html',
    pago_fallido: 'pago.html',
    pagada: 'servicio-confirmado.html',
    en_curso: 'seguimiento.html',
    finalizada: 'servicio-finalizado.html'
  };

  /* ------------------------------------------------------------------ */
  /* Barra de flujo (Solicitud → Proveedor → Pago → Servicio → Listo)     */
  /* ------------------------------------------------------------------ */
  const FLOW_STEPS = ['Solicitud', 'Proveedor', 'Pago', 'Servicio', 'Listo'];
  /**
   * @param {object} o { label, id, current (1-5), error (1-5), msg, tone: 'blue'|'red'|'green', spin }
   */
  function flowBar(o) {
    let html = '';
    FLOW_STEPS.forEach((name, i) => {
      const n = i + 1;
      let cls = '';
      let inner = String(n);
      if (o.error === n) { cls = 'is-error'; inner = '!'; }
      else if (n < o.current) { cls = 'is-done'; inner = icon('check'); }
      else if (n === o.current) { cls = 'is-current'; }
      if (i > 0) html += '<div class="step-line ' + (n <= o.current && o.error !== n ? 'is-done' : '') + '"></div>';
      html += '<div class="step ' + cls + '"><div class="step__dot">' + inner + '</div><span class="step__label">' + name + '</span></div>';
    });
    const tone = o.tone && o.tone !== 'blue' ? ' flow--' + o.tone : '';
    const stateIcon = o.tone === 'red' ? icon('x') : (o.tone === 'green' || o.spin === false) ? icon('check') : icon('loader', 'spin');
    return '<section class="flow' + tone + '" aria-label="Estado de la solicitud">' +
      '<div class="flow__head"><span class="flow__state">' + stateIcon.replace('<svg', '<svg width="12" height="12"') + esc(o.label) + '</span><span class="flow__id">#' + esc(o.id) + '</span></div>' +
      '<div class="steps">' + html + '</div>' +
      (o.msg ? '<p class="flow__msg">' + esc(o.msg) + '</p>' : '') +
      '</section>';
  }

  /* ------------------------------------------------------------------ */
  /* Toasts y modales                                                     */
  /* ------------------------------------------------------------------ */
  function toast(msg, type) {
    let host = $('.toast-host');
    if (!host) { host = document.createElement('div'); host.className = 'toast-host'; host.setAttribute('aria-live', 'polite'); document.body.appendChild(host); }
    const el = document.createElement('div');
    el.className = 'toast toast--' + (type || 'success');
    const ic = type === 'error' ? 'xCircle' : type === 'warning' ? 'alert' : type === 'info' ? 'info' : 'checkCircle';
    el.innerHTML = icon(ic) + '<span>' + esc(msg) + '</span>';
    host.appendChild(el);
    setTimeout(() => { el.classList.add('is-leaving'); setTimeout(() => el.remove(), 220); }, 3200);
  }

  let lastFocus = null;
  function openModal(id) {
    const m = document.getElementById(id);
    if (!m) return;
    lastFocus = document.activeElement;
    m.classList.add('is-open');
    m.setAttribute('aria-hidden', 'false');
    const f = m.querySelector('input, select, textarea, button:not(.modal__close)');
    setTimeout(() => f && f.focus(), 60);
  }
  function closeModal(id) {
    const m = typeof id === 'string' ? document.getElementById(id) : id;
    if (!m) return;
    m.classList.remove('is-open');
    m.setAttribute('aria-hidden', 'true');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  document.addEventListener('click', e => {
    const opener = e.target.closest('[data-open]');
    if (opener) { e.preventDefault(); openModal(opener.getAttribute('data-open')); return; }
    const closer = e.target.closest('[data-close]');
    if (closer) { closeModal(closer.closest('.modal')); return; }
    if (e.target.classList && e.target.classList.contains('modal')) closeModal(e.target);
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') $$('.modal.is-open').forEach(m => closeModal(m));
  });

  function setLoading(btn, on, text) {
    if (!btn) return;
    if (on) { btn.dataset.label = btn.innerHTML; btn.classList.add('is-loading'); if (text) btn.textContent = text; }
    else { btn.classList.remove('is-loading'); if (btn.dataset.label) btn.innerHTML = btn.dataset.label; }
  }

  /* Pestañas genéricas: <div class="tabs" data-tabs="nombre"> + [data-filter] */
  function initTabs(root, onChange) {
    $$('.tab', root).forEach(t => t.addEventListener('click', () => {
      $$('.tab', root).forEach(x => { x.classList.remove('is-active'); x.setAttribute('aria-selected', 'false'); });
      t.classList.add('is-active');
      t.setAttribute('aria-selected', 'true');
      onChange(t.dataset.filter);
    }));
  }

  /* ------------------------------------------------------------------ */
  /* Layout: sidebar, barra superior y navegación inferior (móvil)       */
  /* ------------------------------------------------------------------ */
  const NAV = {
    cliente: {
      user: { name: 'Cliente', role: 'Cliente' },
      items: [
        { key: 'inicio', label: 'Inicio', href: 'dashboard-cliente.html', icon: 'home' },
        { key: 'solicitar', label: 'Solicitar', href: 'solicitar-mudanza.html', icon: 'plusCircle' },
        { key: 'seguimiento', label: 'Seguimiento', href: 'seguimiento.html', icon: 'locate' },
        { key: 'historial', label: 'Historial', href: 'historial-cliente.html', icon: 'clock' },
        { key: 'perfil', label: 'Perfil', href: 'perfil-cliente.html', icon: 'user' }
      ]
    },
    proveedor: {
      user: { name: 'Proveedor', role: 'Proveedor' },
      items: [
        { key: 'inicio', label: 'Inicio', href: 'dashboard-proveedor.html', icon: 'home' },
        { key: 'solicitudes', label: 'Solicitudes', href: 'solicitudes-proveedor.html', icon: 'list', badge: () => pendingForProvider() },
        { key: 'vehiculos', label: 'Vehículos', href: 'vehiculos-proveedor.html', icon: 'truck' },
        { key: 'historial', label: 'Historial', href: 'historial-proveedor.html', icon: 'clock' },
        { key: 'perfil', label: 'Perfil', href: 'perfil-proveedor.html', icon: 'user' }
      ]
    },
    admin: {
      user: { name: 'Admin MudGo', role: 'Administrador' },
      items: [
        { key: 'dashboard', label: 'Dashboard', href: 'admin-dashboard.html', icon: 'grid' },
        { key: 'usuarios', label: 'Usuarios', href: 'admin-usuarios.html', icon: 'users' },
        { key: 'proveedores', label: 'Proveedores', href: 'admin-proveedores.html', icon: 'truck' },
        { key: 'servicios', label: 'Servicios', href: 'admin-servicios.html', icon: 'list' }
      ]
    }
  };

  /** La lista del proveedor se obtiene exclusivamente desde la API. */
  function providerRequests() { return []; }
  function pendingForProvider() { return providerRequests().filter(s => s.estado === 'Pendiente').length; }

  function renderLayout() {
    const body = document.body;
    const role = body.dataset.role;
    const cfg = NAV[role];
    const app = $('.app');
    if (!cfg || !app) return;
    const active = body.dataset.nav;
    const currentUser = window.MG_USER;
    if (currentUser) { cfg.user.name = currentUser.nombre; cfg.user.role = currentUser.rol === 'admin' ? 'Administrador' : currentUser.rol === 'proveedor' ? 'Proveedor' : 'Cliente'; }
    const main = $('.main', app);

    const navLinks = cfg.items.map(it => {
      const b = it.badge ? it.badge() : 0;
      return '<a class="nav-link' + (it.key === active ? ' is-active' : '') + '" href="' + it.href + '"' + (it.key === active ? ' aria-current="page"' : '') + '>' +
        icon(it.icon) + '<span>' + it.label + '</span>' + (b ? '<span class="nav-badge">' + b + '</span>' : '') + '</a>';
    }).join('');

    const aside = document.createElement('aside');
    aside.className = 'sidebar';
    aside.setAttribute('aria-label', 'Navegación principal');
    aside.innerHTML =
      '<div class="sidebar__brand"><a href="index.html" class="logo" aria-label="MudGo, ir al inicio">MudGo</a></div>' +
      '<nav class="sidebar__nav">' + navLinks + '</nav>' +
      '<div class="sidebar__user"><div class="user-chip"><span class="avatar">' + initials(cfg.user.name) + '</span>' +
      '<div><div class="user-chip__name">' + esc(cfg.user.name) + '</div><div class="user-chip__role">' + esc(cfg.user.role) + '</div></div></div>' +
      '<a class="logout" href="login.html" data-logout>' + icon('logout') + 'Cerrar sesión</a></div>';
    app.insertBefore(aside, app.firstChild);

    // Barra superior móvil
    if (main) {
      const back = main.dataset.back;
      const title = main.dataset.title;
      const top = document.createElement('header');
      top.className = 'topbar';
      top.innerHTML = back
        ? '<a class="topbar__back" href="' + back + '">' + icon('chevronLeft') + '<span>' + esc(title || '') + '</span></a>'
        : '<a href="index.html" class="logo">MudGo</a>' +
          (role === 'admin' ? '<a class="btn btn--ghost btn--sm" href="login.html">' + icon('logout') + '</a>' :
            '<a class="icon-btn" href="' + (role === 'cliente' ? 'estado-solicitud.html' : 'solicitudes-proveedor.html') + '" aria-label="Notificaciones">' + icon('bell') + '<span class="icon-btn__dot"></span></a>');
      main.insertBefore(top, main.firstChild);
    }

    // Navegación inferior móvil
    const bottom = document.createElement('nav');
    bottom.className = 'bottom-nav';
    bottom.setAttribute('aria-label', 'Navegación móvil');
    bottom.innerHTML = cfg.items.map(it =>
      '<a href="' + it.href + '" class="' + (it.key === active ? 'is-active' : '') + '">' + icon(it.icon) + '<span>' + it.label + '</span></a>'
    ).join('');
    body.appendChild(bottom);

    $$('[data-logout]').forEach(a => a.addEventListener('click', async e => { e.preventDefault(); try { await window.MudGoAPI.logout(); } finally { store.remove('sesion'); location.href = 'login.html'; } }));
  }

  /* Fecha de hoy en elementos [data-today] */
  function fillToday() {
    $$('[data-today]').forEach(el => { el.textContent = dateLong(new Date()); });
  }

  /* ------------------------------------------------------------------ */
  /* PWA: registro del service worker                                    */
  /* ------------------------------------------------------------------ */
  function registerSW() {
    if ('serviceWorker' in navigator && /^https?:/.test(location.protocol)) {
      navigator.serviceWorker.register('sw.js').catch(() => { /* sin SW */ });
    }
  }

  /* ------------------------------------------------------------------ */
  /* Arranque                                                             */
  /* ------------------------------------------------------------------ */
  const pages = {};
  function page(name, fn) { pages[name] = fn; }

  document.addEventListener('DOMContentLoaded', async () => {
    fillToday();
    registerSW();
    const expectedRole = document.body.dataset.role;
    const pageName = document.body.dataset.page;
    try {
      if (!window.MudGoAPI) throw new Error('No se pudo cargar el cliente de la API.');
      const user = await window.MudGoAPI.me();
      if (expectedRole && user.rol !== expectedRole) {
        const destinations = { cliente: 'dashboard-cliente.html', proveedor: 'dashboard-proveedor.html', admin: 'admin-dashboard.html' };
        if (destinations[user.rol]) { location.replace(destinations[user.rol]); return; }
        throw new Error('El rol de la cuenta no tiene acceso a esta sección.');
      }
      window.MG_USER = user;
      renderLayout();
      if (pageName && pages[pageName]) {
        try { pages[pageName](); } catch (err) { console.error('[MudGo] Error en la página', pageName, err); }
      }
    } catch (err) {
      console.warn('[MudGo] No fue posible validar la sesión:', err.message);
      if (err.status === 401 || err.status === 403) { location.replace('login.html'); return; }
      document.body.innerHTML = '<main style="max-width:620px;margin:12vh auto;padding:24px;font-family:system-ui;text-align:center"><h1>MudGo no está disponible</h1><p>No fue posible conectar con el servidor. Verifica que PHP y MySQL estén activos e inténtalo de nuevo.</p><p style="color:#777;font-size:14px">' + esc(err.message) + '</p><button onclick="location.reload()" style="padding:12px 20px;border:0;border-radius:8px;background:#0601cb;color:white;cursor:pointer">Reintentar</button></main>';
    }
  });

  window.MG = {
    icon, $, $$, esc, money, moneyShort, dateLong, dateShort, dateMed, time12, todayISO, parseDate, initials, stars, params, go,
    store, DATA, LABELS, TARIFAS, badge, request, demoRequest, calcQuote, estimateDistance, shortAddr, FLOW_PAGE, flowBar,
    toast, openModal, closeModal, setLoading, initTabs, page, providerRequests, pendingForProvider
  };
})();
