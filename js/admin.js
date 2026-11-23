/* ==========================================================================
   MudGo · Panel de administración (AD01–AD04 del prototipo)
   Los cambios (suspender, activar, cancelar) se guardan solo en este navegador.
   ========================================================================== */
(function () {
  'use strict';
  const { $, $$, esc, icon, money, dateMed, initials, stars, store, DATA, toast, openModal, closeModal,
    initTabs, page, badge } = window.MG;

  function load(key, fallback) { return store.get(key, fallback.map(x => Object.assign({}, x))); }
  function since(d) { return 'Desde ' + dateMed(d).replace(/^0/, ''); }
  function searchable(input, onChange) {
    let t;
    input.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => onChange(input.value.trim().toLowerCase()), 120); });
  }
  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }

  function serviceRow(s, full) {
    return '<tr tabindex="0" data-id="' + esc(s.id) + '" style="cursor:pointer">' +
      '<td data-label="ID"><span class="id">#' + esc(s.id) + '</span></td>' +
      '<td data-label="Cliente">' + esc(s.cliente) + '</td>' +
      '<td data-label="Proveedor">' + (s.proveedor ? esc(s.proveedor) : '<span class="muted">N/A</span>') + '</td>' +
      (full ? '<td data-label="Ruta">' + esc(s.origen) + '<span class="sub">→ ' + esc(s.destino) + '</span></td>' : '') +
      '<td data-label="Fecha" class="muted">' + (full ? dateMed(s.fecha) : dateMed(s.fecha).slice(0, 6)) + '</td>' +
      '<td data-label="Estado">' + badge(s.estado) + '</td>' +
      '<td data-label="Costo" class="strong">' + money(s.costo) + '</td></tr>';
  }

  function serviceDetail(s, onCancel) {
    $('#svc-title').textContent = 'Servicio #' + s.id;
    $('#svc-body').innerHTML =
      '<div class="row row--between mb-16">' + badge(s.estado, null, true) + '<span class="small muted">' + dateMed(s.fecha) + '</span></div>' +
      '<div class="route route--box"><div class="route__stop"><div class="route__label">Origen</div><div class="route__value">' + esc(s.origen) + '</div></div>' +
      '<div class="route__stop route__stop--end"><div class="route__label">Destino</div><div class="route__value">' + esc(s.destino) + '</div></div></div>' +
      '<dl class="kv mt-16"><div class="kv__row"><dt class="kv__key">Cliente</dt><dd class="kv__val">' + esc(s.cliente) + '</dd></div>' +
      '<div class="kv__row"><dt class="kv__key">Proveedor</dt><dd class="kv__val">' + (s.proveedor ? esc(s.proveedor) : 'Sin asignar') + '</dd></div>' +
      '<div class="kv__row"><dt class="kv__key">Costo</dt><dd class="kv__val strong">' + money(s.costo) + '</dd></div>' +
      '<div class="kv__row"><dt class="kv__key">Comisión MudGo (5%)</dt><dd class="kv__val">' + money(Math.round(s.costo * 0.05)) + '</dd></div></dl>';
    const cancel = $('#svc-cancel');
    if (cancel) {
      const can = ['Pendiente', 'En curso'].includes(s.estado);
      cancel.classList.toggle('hidden', !can || !onCancel);
      cancel.onclick = () => { onCancel(s); closeModal('svc-modal'); };
    }
    openModal('svc-modal');
  }
  function bindRowOpen(tbody, find, onOpen) {
    const open = tr => { const s = find(tr.dataset.id); if (s) onOpen(s); };
    tbody.addEventListener('click', e => { const tr = e.target.closest('tr[data-id]'); if (tr && !e.target.closest('button')) open(tr); });
    tbody.addEventListener('keydown', e => { const tr = e.target.closest('tr[data-id]'); if (tr && e.key === 'Enter') open(tr); });
  }

  /* ================================================================== */
  /* AD01 · Dashboard                                                    */
  /* ================================================================== */
  page('a-dashboard', () => {
    const week = [62, 71, 58, 80, 94, 120, 102];
    const max = Math.max(...week);
    $('#bars').innerHTML = ['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d, i) =>
      '<div class="bars__col"><div class="bars__bar' + (week[i] === max ? ' is-max' : '') + '" style="height:0" data-h="' + Math.round(week[i] / max * 100) + '"><span>' + week[i] + '</span></div><span class="bars__label">' + d + '</span></div>'
    ).join('');
    setTimeout(() => $$('#bars .bars__bar').forEach(b => { b.style.height = b.dataset.h + '%'; }), 80);
    setTimeout(() => $$('.dist-row .progress__bar').forEach(b => { b.style.width = b.dataset.w + '%'; }), 80);

    const svcs = load('adminServicios', DATA.serviciosAdmin);
    const body = $('#recent-body');
    body.innerHTML = svcs.slice(0, 4).map(s => serviceRow(s, false)).join('');
    bindRowOpen(body, id => svcs.find(s => s.id === id), s => serviceDetail(s, null));
  });

  /* ================================================================== */
  /* AD02 · Gestión de usuarios                                          */
  /* ================================================================== */
  page('a-usuarios', () => {
    const users = load('adminUsuarios', DATA.usuarios);
    let q = '', filter = 'todos';
    const body = $('#users-body');
    function render() {
      $('#users-count').textContent = users.length + ' usuarios registrados';
      const rows = users.map((u, i) => Object.assign({ i }, u)).filter(u =>
        (filter === 'todos' || norm(u.estado) === filter) && (!q || norm(u.nombre + ' ' + u.correo + ' ' + u.telefono).includes(norm(q))));
      body.innerHTML = rows.length ? rows.map(u =>
        '<tr><td data-label="Usuario"><div class="cell-user"><span class="avatar">' + initials(u.nombre) + '</span><div>' + esc(u.nombre) + '<span class="sub">' + since(u.desde) + '</span></div></div></td>' +
        '<td data-label="Correo" class="muted">' + esc(u.correo) + '</td>' +
        '<td data-label="Teléfono" class="muted">' + esc(u.telefono) + '</td>' +
        '<td data-label="Tipo">' + badge('Cliente', 'blue') + '</td>' +
        '<td data-label="Servicios" class="text-center">' + u.servicios + '</td>' +
        '<td data-label="Estado">' + badge(u.estado, null, true) + '</td>' +
        '<td data-label="Acciones"><div class="row" style="gap:6px"><button class="btn btn--soft btn--sm" data-view="' + u.i + '">' + icon('eye') + 'Ver</button>' +
        (u.estado === 'Suspendido'
          ? '<button class="btn btn--outline btn--sm" data-act="' + u.i + '">Reactivar</button>'
          : '<button class="btn btn--danger-soft btn--sm" data-act="' + u.i + '">Suspender</button>') + '</div></td></tr>'
      ).join('') : '<tr><td colspan="7"><div class="empty"><div class="empty__icon">🔍</div>No se encontraron usuarios.</div></td></tr>';
    }
    searchable($('#users-search'), v => { q = v; render(); });
    $('#users-filter').addEventListener('change', e => { filter = e.target.value; render(); });
    body.addEventListener('click', e => {
      const v = e.target.closest('[data-view]');
      const a = e.target.closest('[data-act]');
      if (v) {
        const u = users[+v.dataset.view];
        $('#user-body').innerHTML = '<div class="row mb-16"><span class="avatar avatar--lg">' + initials(u.nombre) + '</span><div><div class="strong" style="font-size:16px">' + esc(u.nombre) + '</div><div class="small muted">' + since(u.desde) + '</div></div></div>' +
          '<dl class="kv"><div class="kv__row"><dt class="kv__key">Correo</dt><dd class="kv__val">' + esc(u.correo) + '</dd></div>' +
          '<div class="kv__row"><dt class="kv__key">Teléfono</dt><dd class="kv__val">' + esc(u.telefono) + '</dd></div>' +
          '<div class="kv__row"><dt class="kv__key">Servicios solicitados</dt><dd class="kv__val">' + u.servicios + '</dd></div>' +
          '<div class="kv__row"><dt class="kv__key">Estado</dt><dd class="kv__val">' + badge(u.estado, null, true) + '</dd></div></dl>';
        openModal('user-modal');
      }
      if (a) {
        const u = users[+a.dataset.act];
        u.estado = u.estado === 'Suspendido' ? 'Activo' : 'Suspendido';
        store.set('adminUsuarios', users);
        toast(u.nombre + (u.estado === 'Suspendido' ? ' fue suspendido' : ' fue reactivado'), u.estado === 'Suspendido' ? 'warning' : 'success');
        render();
      }
    });
    render();
  });

  /* ================================================================== */
  /* AD03 · Gestión de proveedores                                       */
  /* ================================================================== */
  page('a-proveedores', () => {
    const provs = load('adminProveedores', DATA.proveedores);
    let q = '', filter = 'todos';
    const body = $('#prov-body');
    function render() {
      $('#prov-count').textContent = provs.length + ' proveedores registrados';
      const rows = provs.map((p, i) => Object.assign({ i }, p)).filter(p =>
        (filter === 'todos' || (filter === 'disponible' ? p.disponible : filter === 'suspendido' ? p.estado === 'Suspendido' : !p.disponible)) &&
        (!q || norm(p.nombre + ' ' + p.correo).includes(norm(q))));
      body.innerHTML = rows.length ? rows.map(p =>
        '<tr><td data-label="Proveedor"><div class="cell-user"><span class="avatar">' + initials(p.nombre) + '</span><div>' + esc(p.nombre) + '<span class="sub">' + since(p.desde) + '</span></div></div></td>' +
        '<td data-label="Contacto">' + esc(p.correo) + '<span class="sub">' + esc(p.telefono) + '</span></td>' +
        '<td data-label="Calificación"><span class="orange">★</span> ' + p.rating + ' <span class="muted">(' + p.resenas + ')</span></td>' +
        '<td data-label="Vehículos" class="text-center">' + p.vehiculos + '</td>' +
        '<td data-label="Disponibilidad">' + badge(p.disponible ? 'Disponible' : 'No disponible', null, true) + '</td>' +
        '<td data-label="Estado">' + badge(p.estado) + '</td>' +
        '<td data-label="Acciones"><div class="row" style="gap:6px"><button class="btn btn--soft btn--sm" data-view="' + p.i + '">' + icon('eye') + 'Ver</button>' +
        (p.estado === 'Suspendido'
          ? '<button class="btn btn--outline btn--sm" data-act="' + p.i + '">Reactivar</button>'
          : '<button class="btn btn--danger-soft btn--sm" data-act="' + p.i + '">Suspender</button>') + '</div></td></tr>'
      ).join('') : '<tr><td colspan="7"><div class="empty"><div class="empty__icon">🔍</div>No se encontraron proveedores.</div></td></tr>';
    }
    searchable($('#prov-search'), v => { q = v; render(); });
    $('#prov-filter').addEventListener('change', e => { filter = e.target.value; render(); });
    body.addEventListener('click', e => {
      const v = e.target.closest('[data-view]');
      const a = e.target.closest('[data-act]');
      if (v) {
        const p = provs[+v.dataset.view];
        $('#prov-modal-body').innerHTML = '<div class="row mb-16"><span class="avatar avatar--lg">' + initials(p.nombre) + '</span><div><div class="strong" style="font-size:16px">' + esc(p.nombre) + '</div><div class="small">' + stars(p.rating) + ' ' + p.rating + ' <span class="muted">(' + p.resenas + ' reseñas)</span></div></div></div>' +
          '<dl class="kv"><div class="kv__row"><dt class="kv__key">Correo</dt><dd class="kv__val">' + esc(p.correo) + '</dd></div>' +
          '<div class="kv__row"><dt class="kv__key">Teléfono</dt><dd class="kv__val">' + esc(p.telefono) + '</dd></div>' +
          '<div class="kv__row"><dt class="kv__key">Vehículos</dt><dd class="kv__val">' + p.vehiculos + '</dd></div>' +
          '<div class="kv__row"><dt class="kv__key">Documentos</dt><dd class="kv__val">' + badge(p.estado === 'Suspendido' ? 'SOAT vencido' : 'Verificados', p.estado === 'Suspendido' ? 'red' : 'green') + '</dd></div>' +
          '<div class="kv__row"><dt class="kv__key">Estado</dt><dd class="kv__val">' + badge(p.estado) + '</dd></div></dl>';
        openModal('prov-modal');
      }
      if (a) {
        const p = provs[+a.dataset.act];
        p.estado = p.estado === 'Suspendido' ? 'Activo' : 'Suspendido';
        if (p.estado === 'Suspendido') p.disponible = false;
        store.set('adminProveedores', provs);
        toast(p.nombre + (p.estado === 'Suspendido' ? ' fue suspendido y no recibirá solicitudes' : ' fue reactivado'), p.estado === 'Suspendido' ? 'warning' : 'success');
        render();
      }
    });
    render();
  });

  /* ================================================================== */
  /* AD04 · Gestión de servicios                                         */
  /* ================================================================== */
  page('a-servicios', () => {
    const svcs = load('adminServicios', DATA.serviciosAdmin);
    let q = '', filter = 'todos';
    const body = $('#svc-body-table');
    function render() {
      $('#svc-count').textContent = svcs.length + ' servicios en total';
      const rows = svcs.filter(s => (filter === 'todos' || norm(s.estado) === filter) && (!q || norm(s.id + ' ' + s.cliente + ' ' + (s.proveedor || '')).includes(norm(q))));
      body.innerHTML = rows.length ? rows.map(s => serviceRow(s, true)).join('') :
        '<tr><td colspan="7"><div class="empty"><div class="empty__icon">🔍</div>No hay servicios con ese filtro.</div></td></tr>';
    }
    initTabs($('#svc-tabs'), f => { filter = f; render(); });
    searchable($('#svc-search'), v => { q = v; render(); });
    bindRowOpen(body, id => svcs.find(s => s.id === id), s => serviceDetail(s, sv => {
      sv.estado = 'Cancelado';
      store.set('adminServicios', svcs);
      toast('Servicio #' + sv.id + ' cancelado. Se notificó al cliente y al proveedor.', 'warning');
      render();
    }));
    render();
  });
})();
