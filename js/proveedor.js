/* ==========================================================================
   MudGo · Pantallas del proveedor (P01–P07 del prototipo)
   El proveedor recibe solicitudes asignadas por MudGo y las acepta o rechaza.
   Si el cliente tiene una solicitud "esperando" en este navegador, aparece aquí.
   ========================================================================== */
(function () {
  'use strict';
  const { $, $$, esc, icon, money, moneyShort, dateShort, dateMed, initials, stars, store, DATA, request,
    toast, openModal, closeModal, setLoading, initTabs, page, params, go, badge, providerRequests } = window.MG;

  /* Helpers ------------------------------------------------------------ */
  function whenTxt(s) { return dateShort(s.fecha) + ' · ' + s.hora; }
  function tagsHTML(s) {
    return '<div class="tags"><span class="tag tag--blue">📦 ' + esc(s.carga) + '</span><span class="tag">🚛 ' + esc(s.vehiculo) + '</span>' +
      '<span class="tag">👷 ' + s.ayudantes + (s.ayudantes === 1 ? ' ayudante' : ' ayudantes') + '</span></div>';
  }
  function routeMini(s) {
    return '<div class="route route--hollow" style="gap:8px"><div class="route__stop"><div class="small">' + esc(s.origen) + '</div></div>' +
      '<div class="route__stop route__stop--end"><div class="small">' + esc(s.destino) + '</div></div></div>';
  }
  function setProvState(id, estado) {
    const st = store.get('provEstados', {});
    st[id] = estado;
    store.set('provEstados', st);
  }

  /** Aceptar una solicitud: si es la del cliente real, actualiza su estado. */
  function accept(id) {
    const r = request.get();
    if (r && r.id === id && ['esperando', 'buscando'].includes(r.estado)) {
      r.estado = 'aceptada';
      r.proveedor = DATA.proveedor.id;
      request.save(r);
    } else {
      setProvState(id, 'Aceptada');
    }
    toast('¡Solicitud aceptada! El cliente será notificado.', 'success');
    go('solicitud-aceptada.html?id=' + encodeURIComponent(id), 900);
  }

  /** Rechazar (abre modal con motivo). */
  let rejectId = null;
  function askReject(id) {
    rejectId = id;
    $('#reject-id').textContent = '#' + id;
    $$('#reject-modal input[name=motivo]').forEach((i, n) => { i.checked = n === 0; });
    openModal('reject-modal');
  }
  function bindRejectModal(after) {
    const btn = $('#reject-confirm');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const r = request.get();
      if (r && r.id === rejectId && ['esperando', 'buscando'].includes(r.estado)) {
        r.estado = 'rechazada';
        r.intentos = (r.intentos || 0) + 1;
        request.save(r);
      } else {
        setProvState(rejectId, 'Rechazada');
      }
      closeModal('reject-modal');
      toast('Solicitud rechazada. MudGo la asignará a otro proveedor.', 'warning');
      after && after();
    });
  }

  function requestCard(s, compact) {
    const actions = s.estado === 'Pendiente'
      ? '<div class="btn-row mt-16">' +
        (compact ? '<a class="btn btn--outline" href="solicitudes-proveedor.html">Ver en solicitudes</a>' : '<button class="btn btn--outline" data-reject="' + esc(s.id) + '">Rechazar</button>') +
        '<button class="btn btn--primary" data-accept="' + esc(s.id) + '">' + (compact ? 'Aceptar ' + icon('arrowRight') : 'Aceptar solicitud') + '</button></div>'
      : s.estado === 'Aceptada'
        ? '<a class="btn btn--soft btn--block mt-16" href="servicio-proveedor.html?id=' + encodeURIComponent(s.id) + '">Ver detalle del servicio →</a>'
        : '<p class="small subtle mt-16">' + icon('ban').replace('<svg', '<svg width="14" height="14" style="vertical-align:-2px"') + ' Solicitud rechazada — no aparece como disponible para ti</p>';
    return '<article class="card fade-in' + (s.estado === 'Rechazada' ? ' card--muted' : '') + '">' +
      '<div class="row row--between" style="align-items:flex-start">' +
      '<div><div class="row" style="gap:8px"><span class="small blue">#' + esc(s.id) + '</span>' + (compact ? '' : badge(s.estado)) + (s.nueva ? badge('Nueva', 'purple') : '') + '</div>' +
      '<div class="strong mt-8">' + esc(s.cliente) + '</div>' + (compact ? '' : '<div class="xs subtle">' + esc(s.telefono) + '</div>') + '</div>' +
      '<div class="text-right"><div class="price">' + money(s.valor) + '</div><div class="xs subtle">' + whenTxt(s) + '</div></div></div>' +
      '<div class="mt-16">' + routeMini(s) + '</div><div class="mt-12">' + tagsHTML(s) + '</div>' + actions + '</article>';
  }

  /* ================================================================== */
  /* P01 · Dashboard del proveedor                                       */
  /* ================================================================== */
  page('p-dashboard', () => {
    // Disponibilidad
    const sw = $('#avail');
    sw.checked = store.get('provDisponible', true);
    const paintAvail = () => { $('#avail-label').textContent = sw.checked ? 'Disponible' : 'No disponible'; };
    paintAvail();
    sw.addEventListener('change', () => {
      store.set('provDisponible', sw.checked); paintAvail();
      toast(sw.checked ? 'Ahora recibirás nuevas solicitudes' : 'No recibirás solicitudes nuevas', sw.checked ? 'success' : 'warning');
    });

    const pend = providerRequests().filter(s => s.estado === 'Pendiente');
    $('#stat-today').textContent = pend.length + 1;
    $('#pend-count').textContent = pend.length + (pend.length === 1 ? ' nueva' : ' nuevas');
    $('#pend-list').innerHTML = pend.length
      ? pend.slice(0, 3).map(s => requestCard(s, true)).join('')
      : '<div class="card empty"><div class="empty__icon">📭</div>No tienes solicitudes pendientes.</div>';
    $$('[data-accept]').forEach(b => b.addEventListener('click', () => { setLoading(b, true); accept(b.dataset.accept); }));

    // Servicio activo (si el cliente ya pagó, se muestra ese servicio)
    const r = request.get();
    const live = r && ['pagada', 'en_curso'].includes(r.estado);
    const svc = store.get('provServicio', {});
    const id = live ? r.id : 'MG-040';
    const est = svc[id] || (live && r.estado === 'en_curso' ? 'activo' : 'confirmado');
    $('#active-client').textContent = live ? DATA.cliente.nombre : 'Marcos Díaz';
    $('#active-state').textContent = est === 'activo' ? 'En camino' : est === 'finalizado' ? 'Finalizado' : 'Por iniciar';
    $('#active-bar').style.width = est === 'activo' ? '65%' : est === 'finalizado' ? '100%' : '15%';
    $('#active-link').href = 'servicio-proveedor.html?id=' + id;
    $('#active-badge').outerHTML = est === 'activo' ? badge('En curso', 'blue', true) : est === 'finalizado' ? badge('Finalizado', 'green', true) : badge('Confirmado', 'blue', true);
  });

  /* ================================================================== */
  /* P02 · Solicitudes                                                   */
  /* ================================================================== */
  page('p-solicitudes', () => {
    let filter = params().get('filtro') || 'todas';
    const list = $('#req-list');
    function render() {
      const all = providerRequests();
      const pending = all.filter(s => s.estado === 'Pendiente').length;
      $('#req-sub').textContent = pending + (pending === 1 ? ' pendiente de respuesta' : ' pendientes de respuesta');
      $('#tab-pend-count').textContent = pending;
      $('#tab-pend-count').classList.toggle('hidden', !pending);
      const map = { pendientes: 'Pendiente', aceptadas: 'Aceptada', rechazadas: 'Rechazada' };
      const rows = all.filter(s => filter === 'todas' || s.estado === map[filter]);
      list.innerHTML = rows.length ? rows.map(s => requestCard(s)).join('') :
        '<div class="card empty"><div class="empty__icon">📭</div>No hay solicitudes en esta categoría.</div>';
      $$('[data-accept]', list).forEach(b => b.addEventListener('click', () => { setLoading(b, true); accept(b.dataset.accept); }));
      $$('[data-reject]', list).forEach(b => b.addEventListener('click', () => askReject(b.dataset.reject)));
    }
    $$('#req-tabs .tab').forEach(t => t.classList.toggle('is-active', t.dataset.filter === filter));
    initTabs($('#req-tabs'), f => { filter = f; render(); });
    bindRejectModal(render);
    window.addEventListener('storage', e => { if (e.key === 'mudgo.solicitud') render(); });
    render();
  });

  /* ================================================================== */
  /* P03 · Solicitud aceptada                                            */
  /* ================================================================== */
  page('p-aceptada', () => {
    const id = params().get('id') || 'MG-043';
    const r = request.get();
    const live = r && r.id === id;
    const base = providerRequests().find(s => s.id === id) || DATA.solicitudesProveedor[0];
    const s = live ? {
      id: r.id, cliente: DATA.cliente.nombre, telefono: DATA.cliente.telefono, valor: r.precio.subtotal, fecha: r.fecha, hora: r.hora,
      origen: r.origen, destino: r.destino, carga: MG.LABELS.volumen[r.volumen], vehiculo: MG.LABELS.vehiculo[r.vehiculo], ayudantes: r.ayudantes,
      clienteRating: 4.8, clienteMudanzas: 4
    } : base;
    const paid = live ? ['pagada', 'en_curso', 'finalizada'].includes(r.estado) : false;

    $('#pa-client').innerHTML =
      '<div class="row row--between"><div class="row"><span class="avatar avatar--lg">' + initials(s.cliente) + '</span><div>' +
      '<div class="strong">' + esc(s.cliente) + '</div><div class="small muted">' + esc(s.telefono) + '</div>' +
      '<div class="xs subtle"><span class="orange">★</span> ' + s.clienteRating + ' · ' + s.clienteMudanzas + ' mudanzas</div></div></div>' +
      badge('Verificado', 'green', true) + '</div>';
    $('#pa-route').innerHTML = '<div class="route route--box"><div class="route__stop"><div class="route__label">Origen</div><div class="route__value">' + esc(s.origen) + '</div></div>' +
      '<div class="route__stop route__stop--end"><div class="route__label">Destino</div><div class="route__value">' + esc(s.destino) + '</div></div></div>';
    $('#pa-details').innerHTML = '<dl class="kv">' + [
      ['Fecha y hora', whenTxt(s)], ['Tipo de carga', esc(s.carga)], ['Vehículo', esc(s.vehiculo)],
      ['Personal', s.ayudantes + (s.ayudantes === 1 ? ' ayudante' : ' ayudantes')]
    ].map(([k, v]) => '<div class="kv__row"><dt class="kv__key">' + k + '</dt><dd class="kv__val">' + v + '</dd></div>').join('') + '</dl>';
    $('#pa-value').textContent = money(s.valor);
    $('#pa-detail').href = 'servicio-proveedor.html?id=' + encodeURIComponent(s.id);

    const steps = $('#pa-steps');
    function paintSteps(isPaid) {
      steps.innerHTML =
        '<div class="step is-done"><div class="step__dot">' + icon('check') + '</div><span class="step__label">Aceptada</span></div>' +
        '<div class="step-line is-done"></div>' +
        '<div class="step ' + (isPaid ? 'is-done' : 'is-current') + '"><div class="step__dot">' + (isPaid ? icon('check') : '2') + '</div><span class="step__label">Pago cliente</span></div>' +
        '<div class="step-line ' + (isPaid ? 'is-done' : '') + '"></div>' +
        '<div class="step ' + (isPaid ? 'is-current' : '') + '"><div class="step__dot">3</div><span class="step__label">Confirmado</span></div>';
      $('#pa-msg').innerHTML = isPaid
        ? icon('checkCircle') + '<span>El cliente completó el pago. El servicio quedó confirmado.</span>'
        : icon('clock') + '<span>En espera de que el cliente complete el pago para confirmar el servicio.</span>';
      $('#pa-msg').className = 'notice mt-16 ' + (isPaid ? 'notice--green' : 'notice--blue');
    }
    paintSteps(paid);
    window.addEventListener('storage', e => {
      if (e.key !== 'mudgo.solicitud') return;
      const nr = request.get();
      if (nr && nr.id === id) { paintSteps(['pagada', 'en_curso', 'finalizada'].includes(nr.estado)); if (nr.estado === 'pagada') toast('El cliente pagó el servicio', 'success'); }
    });
  });

  /* ================================================================== */
  /* P04 · Servicio (confirmado → activo → finalizado)                   */
  /* ================================================================== */
  page('p-servicio', () => {
    const id = params().get('id') || 'MG-040';
    const r = request.get();
    const live = r && r.id === id;
    const base = DATA.solicitudesProveedor.find(s => s.id === id) || DATA.solicitudesProveedor[2];
    const s = live ? {
      id: r.id, cliente: DATA.cliente.nombre, telefono: DATA.cliente.telefono, valor: r.precio.subtotal, fecha: r.fecha, hora: r.hora,
      origen: r.origen, destino: r.destino, vehiculo: MG.LABELS.vehiculo[r.vehiculo], ayudantes: r.ayudantes
    } : base;
    const svc = store.get('provServicio', {});
    let estado = svc[id] || (live && r.estado === 'en_curso' ? 'activo' : live && r.estado === 'finalizada' ? 'finalizado' : 'confirmado');
    const notPaid = live && ['aceptada', 'pago_fallido'].includes(r.estado);

    $('#sv-title').textContent = 'Servicio #' + s.id;
    $('#sv-when').textContent = dateShort(s.fecha) + ' · ' + MG.time12(s.hora);
    $('#sv-client').innerHTML = '<div class="row"><span class="avatar avatar--lg">' + initials(s.cliente) + '</span><div><div class="strong">' + esc(s.cliente) + '</div><div class="small muted">' + esc(s.telefono) + '</div></div></div>' +
      '<a class="icon-btn" href="tel:' + s.telefono.replace(/\s/g, '') + '" aria-label="Llamar al cliente" style="color:var(--blue);background:var(--blue-50);border-color:var(--blue-50)">' + icon('phone') + '</a>';
    $('#sv-route').innerHTML = '<div class="route route--box route--hollow"><div class="route__stop"><div class="route__label">Origen</div><div class="route__value">' + esc(s.origen) + '</div></div>' +
      '<div class="route__stop route__stop--end"><div class="route__label">Destino</div><div class="route__value">' + esc(s.destino) + '</div></div></div>';
    $('#sv-details').innerHTML = '<dl class="kv">' + [['Fecha y hora', dateShort(s.fecha) + ' · ' + MG.time12(s.hora)], ['Vehículo', esc(s.vehiculo)], ['Personal', s.ayudantes + ' ayudantes']]
      .map(([k, v]) => '<div class="kv__row"><dt class="kv__key">' + k + '</dt><dd class="kv__val">' + v + '</dd></div>').join('') + '</dl>';
    const fee = Math.round(s.valor * 0.10);
    $('#sv-value').textContent = money(s.valor);
    $('#sv-fee').textContent = money(-fee);
    $('#sv-earn').textContent = money(s.valor - fee);

    const btn = $('#sv-action');
    function paint() {
      const labels = { confirmado: 'Confirmado', activo: 'En curso', finalizado: 'Finalizado' };
      const tones = { confirmado: 'blue', activo: 'blue', finalizado: 'green' };
      $$('[data-sv-badge]').forEach(b => { b.outerHTML = '<span data-sv-badge>' + badge(notPaid ? 'Esperando pago' : labels[estado], notPaid ? 'orange' : tones[estado], true) + '</span>'; });
      const idx = { confirmado: 1, activo: 2, finalizado: 3 }[estado];
      $$('#sv-steps .step').forEach((st, i) => {
        st.classList.toggle('is-done', i + 1 < idx || estado === 'finalizado');
        st.classList.toggle('is-current', i + 1 === idx && estado !== 'finalizado');
        st.querySelector('.step__dot').innerHTML = (i + 1 < idx || estado === 'finalizado') ? icon('check') : String(i + 1);
      });
      $$('#sv-steps .step-line').forEach((l, i) => l.classList.toggle('is-done', i + 1 < idx || estado === 'finalizado'));
      const msg = $('#sv-msg');
      if (notPaid) {
        msg.textContent = 'El cliente aún no ha pagado. Podrás iniciar el servicio cuando el pago se confirme.';
        btn.disabled = true; btn.innerHTML = 'Esperando pago del cliente';
      } else if (estado === 'confirmado') {
        msg.textContent = 'El pago fue recibido. El servicio está listo para iniciar.';
        btn.disabled = false; btn.className = 'btn btn--primary btn--lg btn--block'; btn.innerHTML = 'Iniciar servicio ' + icon('arrowRight');
      } else if (estado === 'activo') {
        msg.textContent = 'Servicio en curso. El cliente ve tu ubicación en tiempo real.';
        btn.disabled = false; btn.className = 'btn btn--orange btn--lg btn--block'; btn.innerHTML = 'Marcar llegada al destino ' + icon('flag');
      } else {
        msg.textContent = 'Servicio finalizado. El pago se depositará automáticamente en tu cuenta.';
        btn.disabled = false; btn.className = 'btn btn--outline btn--lg btn--block'; btn.innerHTML = 'Volver al inicio';
      }
      $('#sv-flow').innerHTML = MG.flowBar({
        label: notPaid ? 'Esperando pago' : estado === 'finalizado' ? 'Servicio finalizado' : estado === 'activo' ? 'Servicio en proceso' : 'Servicio confirmado',
        id: s.id, current: notPaid ? 3 : estado === 'finalizado' ? 5 : 4, tone: estado === 'finalizado' ? 'green' : 'blue', spin: estado === 'activo'
      });
    }
    paint();

    btn.addEventListener('click', () => {
      if (estado === 'finalizado') { go('dashboard-proveedor.html'); return; }
      setLoading(btn, true);
      setTimeout(() => {
        setLoading(btn, false);
        estado = estado === 'confirmado' ? 'activo' : 'finalizado';
        svc[id] = estado;
        store.set('provServicio', svc);
        if (live) {
          if (estado === 'activo' && r.estado === 'pagada') { r.estado = 'en_curso'; request.save(r); }
          if (estado === 'finalizado') store.set('trackProgress', 1);
        }
        toast(estado === 'activo' ? 'Servicio iniciado. El cliente fue notificado.' : 'Llegada registrada. El cliente debe confirmar la entrega.', 'success');
        paint();
      }, 600);
    });
  });

  /* ================================================================== */
  /* P05 · Vehículos                                                     */
  /* ================================================================== */
  page('p-vehiculos', () => {
    const list = store.get('vehiculos', DATA.vehiculos);
    function render() {
      $('#veh-count').textContent = list.length + (list.length === 1 ? ' vehículo registrado' : ' vehículos registrados');
      $('#veh-list').innerHTML = list.map((v, i) =>
        '<article class="card fade-in"><div class="row row--between" style="align-items:flex-start;flex-wrap:wrap;gap:16px">' +
        '<div class="row" style="align-items:flex-start"><span class="menu-item__icon" style="font-size:22px;width:52px;height:52px;background:var(--blue-50)">🚛</span><div>' +
        '<div class="row" style="gap:8px"><span class="strong" style="font-size:16px">' + esc(v.modelo) + '</span>' + badge(v.disponible ? 'Disponible' : 'No disponible', null, true) + '</div>' +
        '<div class="small muted mt-8">🔖 ' + esc(v.placa) + ' · ' + esc(v.tipo) + '</div><div class="small muted">⚖️ ' + esc(v.capacidad) + '</div></div></div>' +
        '<div class="row"><label class="switch"><span class="small muted">Disponibilidad</span><input type="checkbox" data-toggle="' + i + '"' + (v.disponible ? ' checked' : '') + '><span class="switch__track"></span></label>' +
        '<button class="btn btn--ghost btn--sm" data-remove="' + i + '" aria-label="Eliminar ' + esc(v.modelo) + '">' + icon('trash') + '</button></div></div></article>'
      ).join('') || '<div class="card empty"><div class="empty__icon">🚚</div>Aún no tienes vehículos registrados.</div>';
    }
    render();
    $('#veh-list').addEventListener('change', e => {
      const t = e.target.closest('[data-toggle]'); if (!t) return;
      list[+t.dataset.toggle].disponible = t.checked;
      store.set('vehiculos', list); render();
      toast(t.checked ? 'Vehículo disponible para servicios' : 'Vehículo marcado como no disponible', t.checked ? 'success' : 'warning');
    });
    $('#veh-list').addEventListener('click', e => {
      const b = e.target.closest('[data-remove]'); if (!b) return;
      const v = list[+b.dataset.remove];
      if (!confirmRemoval(v)) return;
      list.splice(+b.dataset.remove, 1); store.set('vehiculos', list); render(); toast('Vehículo eliminado', 'warning');
    });
    function confirmRemoval(v) { return window.confirm('¿Eliminar ' + v.modelo + ' (' + v.placa + ')?'); }

    const form = $('#veh-form');
    const plate = form.elements.placa;
    plate.addEventListener('input', () => { plate.value = plate.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6).replace(/^([A-Z]{3})(\d)/, '$1-$2'); });
    form.addEventListener('submit', e => {
      e.preventDefault();
      let ok = true;
      const err = (el, bad) => { el.closest('.field').classList.toggle('has-error', bad); if (bad) ok = false; };
      err(form.elements.modelo, form.elements.modelo.value.trim().length < 3);
      err(plate, !/^[A-Z]{3}-\d{3}$/.test(plate.value));
      err(form.elements.capacidad, !(+form.elements.capacidad.value > 0));
      if (!ok) return;
      list.push({ id: 'V-' + Date.now(), modelo: form.elements.modelo.value.trim(), placa: plate.value, tipo: form.elements.tipo.value, capacidad: String(form.elements.capacidad.value).replace('.', ',') + ' toneladas', disponible: true });
      store.set('vehiculos', list); render(); form.reset(); closeModal('veh-modal'); toast('Vehículo agregado', 'success');
    });
  });

  /* ================================================================== */
  /* P06 · Historial                                                     */
  /* ================================================================== */
  page('p-historial', () => {
    const rows = DATA.historialProveedor;
    const total = rows.reduce((a, b) => a + b.ganancia, 0);
    $('#ph-earn').textContent = money(total);
    $('#ph-count').textContent = rows.filter(r => r.estado === 'Finalizado').length;
    $('#ph-body').innerHTML = rows.map(h =>
      '<tr><td data-label="ID"><span class="id">#' + esc(h.id) + '</span></td>' +
      '<td data-label="Cliente"><div class="cell-user"><span class="avatar avatar--sm">' + initials(h.cliente) + '</span>' + esc(h.cliente) + '</div></td>' +
      '<td data-label="Ruta">' + esc(h.origen) + '<span class="sub">→ ' + esc(h.destino) + '</span></td>' +
      '<td data-label="Fecha">' + dateMed(h.fecha) + '</td>' +
      '<td data-label="Estado">' + badge(h.estado) + '</td>' +
      '<td data-label="Ganancias" class="strong">' + (h.ganancia ? money(h.ganancia) : '<span class="muted">—</span>') + '</td></tr>'
    ).join('');
  });

  /* ================================================================== */
  /* P07 · Perfil                                                        */
  /* ================================================================== */
  page('p-perfil', () => {
    $$('.menu-item').forEach(item => {
      const btn = $('.list-row', item);
      btn.addEventListener('click', () => {
        const open = item.classList.toggle('is-open');
        btn.setAttribute('aria-expanded', open);
        $('.menu-panel', item).classList.toggle('hidden', !open);
      });
    });
    const veh = store.get('vehiculos', DATA.vehiculos);
    $('#pp-veh').textContent = veh.length + (veh.length === 1 ? ' vehículo registrado' : ' vehículos registrados');
    $$('form[data-save]').forEach(f => f.addEventListener('submit', e => {
      e.preventDefault();
      toast(f.dataset.save, 'success');
    }));
    $$('[data-upload]').forEach(inp => inp.addEventListener('change', () => {
      if (!inp.files.length) return;
      const row = inp.closest('.reason');
      row.querySelector('.badge').outerHTML = badge('En revisión', 'orange');
      toast('Documento cargado: ' + inp.files[0].name, 'success');
    }));
  });
})();
