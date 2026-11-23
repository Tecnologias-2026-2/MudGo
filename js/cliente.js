/* ==========================================================================
   MudGo · Pantallas del cliente (C01–C19 del prototipo)
   Flujo: Solicitud → Cotización → Confirmación → Espera de aceptación
          → (Aceptada | Rechazada → Buscando → Sin proveedor)
          → Pago (exitoso | fallido) → Confirmado → Seguimiento → Finalizado → Calificación
   ========================================================================== */
(function () {
  'use strict';
  const { $, $$, esc, icon, money, dateLong, dateShort, dateMed, time12, todayISO, stars, initials,
    store, DATA, LABELS, request, calcQuote, estimateDistance, shortAddr, flowBar, toast, openModal, closeModal,
    setLoading, initTabs, page, params, go, badge } = window.MG;

  const P = DATA.proveedor;

  /* Reglas compartidas ------------------------------------------------ */
  function routeHTML(r, opts) {
    opts = opts || {};
    return '<div class="route' + (opts.box ? ' route--box' : '') + (opts.hollow ? ' route--hollow' : '') + '">' +
      '<div class="route__stop"><div class="route__label">Origen</div><div class="route__value">' + esc(r.origen) + '</div></div>' +
      '<div class="route__stop route__stop--end"><div class="route__label">Destino</div><div class="route__value">' + esc(r.destino) + '</div></div></div>';
  }
  function kv(rows) {
    return '<dl class="kv">' + rows.map(([k, v, cls]) =>
      '<div class="kv__row ' + (cls || '') + '"><dt class="kv__key">' + k + '</dt><dd class="kv__val">' + v + '</dd></div>').join('') + '</dl>';
  }
  function ayudantesTxt(n) { return n === 0 ? 'Sin ayudantes' : n === 1 ? '1 ayudante' : n + ' ayudantes'; }
  function emptyState(title, text, href, cta) {
    return '<div class="card status-hero fade-in"><div class="status-icon">' + icon('info') + '</div>' +
      '<h2>' + esc(title) + '</h2><p>' + esc(text) + '</p>' +
      (href ? '<a class="btn btn--primary mt-24" href="' + href + '">' + esc(cta) + ' ' + icon('arrowRight') + '</a>' : '') + '</div>';
  }
  /** Si el usuario abre una pantalla con ?estado=..., se fuerza ese estado (útil para revisar cada pantalla del prototipo). */
  function applyStateParam() {
    const e = params().get('estado');
    if (e) request.update({ estado: e });
  }

  /* ================================================================== */
  /* C01 · Dashboard del cliente                                         */
  /* ================================================================== */
  page('c-dashboard', () => {
    const r = request.get();
    const hasReq = !!r;

    // Solicitud pendiente
    const pendingStates = {
      esperando: ['Esperando proveedor', 'orange', 'Notificando a 12+ proveedores...'],
      buscando: ['Buscando proveedor', 'orange', 'Buscando otro proveedor disponible...'],
      rechazada: ['Rechazada por proveedor', 'red', 'Buscaremos otro proveedor automáticamente.'],
      sin_proveedor: ['Sin proveedor disponible', 'red', 'Modifica la fecha u hora para aumentar la disponibilidad.'],
      aceptada: ['Proveedor aceptado', 'green', 'Completa el pago para confirmar el servicio.'],
      pago_fallido: ['Pago fallido', 'red', 'Tu proveedor sigue reservado. Intenta pagar de nuevo.']
    };
    const pend = $('#pending');
    const pr = hasReq ? r : Object.assign(MG.demoRequest(), { estado: 'esperando' });
    const pst = hasReq ? pendingStates[r.estado] : pendingStates.esperando;
    if (pst) {
      const link = ['aceptada', 'esperando', 'buscando', 'rechazada', 'sin_proveedor'].includes(pr.estado) || !hasReq ? 'estado-solicitud.html' : 'pago.html';
      pend.innerHTML =
        '<div class="card__head"><h3>Solicitud pendiente</h3>' + badge(pst[0], pst[1], true) + '</div>' +
        '<p class="small muted">' + esc(MG.request.shortRoute(pr)) + ' · ' + dateShort(pr.fecha) + ' · ' + esc(pr.hora) + '</p>' +
        '<div class="row row--between mt-12"><span class="small subtle">' + esc(pst[2]) + '</span>' +
        '<a class="btn btn--link" href="' + link + '">' + (pr.estado === 'aceptada' ? 'Ir al pago →' : 'Ver estado →') + '</a></div>';
      pend.classList.remove('hidden');
      if (pr.estado === 'borrador') pend.classList.add('hidden');
    } else if (hasReq && r.estado === 'borrador') {
      pend.innerHTML = '<div class="card__head"><h3>Cotización sin enviar</h3>' + badge('Borrador', 'gray') + '</div>' +
        '<p class="small muted">' + esc(MG.request.shortRoute(r)) + ' · ' + money(r.precio.total) + ' estimado</p>' +
        '<div class="row row--between mt-12"><span class="small subtle">Aún no la has enviado a los proveedores.</span><a class="btn btn--link" href="cotizacion.html">Retomar →</a></div>';
      pend.classList.remove('hidden');
    } else {
      pend.classList.add('hidden');
    }

    // Servicio activo
    const act = $('#active');
    const activeReq = !hasReq ? { origen: 'Calle 72 #10-45, Bogotá', destino: 'Av. El Dorado #68C-61, Bogotá', estado: 'en_curso', vehiculo: 'Toyota Dyna · ABC-123', prov: 'Carlos Ruiz' }
      : (['pagada', 'en_curso'].includes(r.estado) ? { origen: r.origen, destino: r.destino, estado: r.estado, vehiculo: P.vehiculo + ' · ' + P.placa, prov: P.corto } : null);
    if (activeReq) {
      act.innerHTML =
        '<div class="card__head"><h3>Servicio activo</h3>' + (activeReq.estado === 'pagada' ? badge('Confirmado', 'blue', true) : badge('En curso', 'blue', true)) + '</div>' +
        routeHTML(activeReq) +
        '<hr class="card__divider">' +
        '<div class="row row--between"><div class="row"><span class="avatar avatar--sm">' + initials(activeReq.prov) + '</span>' +
        '<div><div class="small">' + esc(activeReq.prov) + '</div><div class="xs subtle">' + esc(activeReq.vehiculo) + '</div></div></div>' +
        '<a class="btn btn--primary btn--sm" href="' + (activeReq.estado === 'pagada' ? 'servicio-confirmado.html' : 'seguimiento.html') + '">' + (activeReq.estado === 'pagada' ? 'Ver detalle' : 'Ver en vivo') + '</a></div>';
      act.classList.remove('hidden');
    } else {
      act.classList.add('hidden');
    }

    // Historial reciente
    const hist = historyList().slice(0, 3);
    $('#recent').innerHTML = hist.map(h =>
      '<a class="list-row" href="historial-cliente.html?id=' + encodeURIComponent(h.id) + '">' +
      '<div class="list-row__main"><div class="row" style="gap:8px"><span class="xs subtle">' + dateMed(h.fecha) + '</span>' + badge(h.estado) + '</div>' +
      '<div class="list-row__title mt-8">' + esc(h.origen) + '</div><div class="list-row__sub">→ ' + esc(h.destino) + '</div></div>' +
      '<div class="list-row__end"><div class="strong">' + money(h.costo) + '</div>' + (h.rating ? stars(h.rating) : '') + '</div></a>'
    ).join('');
  });

  /** Historial = servicios guardados por la demo + datos de ejemplo. */
  function historyList() {
    const extra = store.get('historialExtra', []);
    return extra.concat(DATA.historialCliente);
  }

  /* ================================================================== */
  /* C02 · Solicitar mudanza (3 pasos)                                   */
  /* ================================================================== */
  page('c-solicitar', () => {
    const form = $('#request-form');
    const panels = $$('[data-step]', form);
    let step = 1;

    // Precargar si se está modificando una solicitud
    const prev = request.get();
    const editing = params().has('editar') && prev;
    const fecha = form.elements.fecha;
    fecha.min = todayISO(0);
    if (editing) {
      form.elements.origen.value = prev.origen;
      form.elements.destino.value = prev.destino;
      fecha.value = prev.fecha >= fecha.min ? prev.fecha : '';
      form.elements.hora.value = prev.hora;
      form.querySelector('[name="volumen"][value="' + prev.volumen + '"]').checked = true;
      form.querySelector('[name="vehiculo"][value="' + prev.vehiculo + '"]').checked = true;
      form.elements.descripcion.value = prev.descripcion || '';
      setHelpers(prev.ayudantes);
    } else {
      fecha.value = todayISO(1);
    }

    function setHelpers(n) {
      n = Math.max(0, Math.min(4, n));
      form.elements.ayudantes.value = n;
      $('#helpers-out').textContent = n;
    }
    $('#helpers-minus').addEventListener('click', () => setHelpers(+form.elements.ayudantes.value - 1));
    $('#helpers-plus').addEventListener('click', () => setHelpers(+form.elements.ayudantes.value + 1));

    function show(n) {
      step = n;
      panels.forEach(p => p.classList.toggle('hidden', +p.dataset.step !== n));
      $$('.form-steps .step').forEach((s, i) => {
        s.classList.toggle('is-current', i + 1 === n);
        s.classList.toggle('is-done', i + 1 < n);
        s.querySelector('.step__dot').innerHTML = i + 1 < n ? icon('check') : String(i + 1);
      });
      $$('.form-steps .step-line').forEach((l, i) => l.classList.toggle('is-done', i + 1 < n));
      const first = panels[n - 1].querySelector('input:not([type=radio]), select');
      if (first && n > 1) first.focus();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function validate(n) {
      let ok = true;
      const check = (name, cond) => {
        const f = form.elements[name].closest('.field');
        f.classList.toggle('has-error', !cond);
        if (!cond) ok = false;
      };
      if (n === 1) {
        const o = form.elements.origen.value.trim();
        const d = form.elements.destino.value.trim();
        check('origen', o.length >= 6);
        check('destino', d.length >= 6 && d.toLowerCase() !== o.toLowerCase());
      }
      if (n === 2) {
        check('fecha', !!fecha.value && fecha.value >= fecha.min);
        check('hora', !!form.elements.hora.value);
      }
      return ok;
    }

    $$('[data-next]', form).forEach(b => b.addEventListener('click', () => { if (validate(step)) show(step + 1); }));
    $$('[data-prev]', form).forEach(b => b.addEventListener('click', () => show(step - 1)));
    $$('input', form).forEach(i => i.addEventListener('input', () => i.closest('.field') && i.closest('.field').classList.remove('has-error')));

    // Selector de dirección: intercambiar origen y destino
    $('#swap').addEventListener('click', () => {
      const o = form.elements.origen.value;
      form.elements.origen.value = form.elements.destino.value;
      form.elements.destino.value = o;
    });

    form.addEventListener('submit', e => {
      e.preventDefault();
      if (!validate(1)) return show(1);
      if (!validate(2)) return show(2);
      const btn = form.querySelector('[type=submit]');
      setLoading(btn, true, 'Calculando cotización…');
      const r = {
        id: editing ? prev.id : 'MG-' + String(43 + Math.floor(Math.random() * 50)).padStart(3, '0'),
        origen: form.elements.origen.value.trim(),
        destino: form.elements.destino.value.trim(),
        fecha: fecha.value,
        hora: form.elements.hora.value,
        volumen: form.elements.volumen.value,
        vehiculo: form.elements.vehiculo.value,
        ayudantes: +form.elements.ayudantes.value,
        descripcion: form.elements.descripcion.value.trim(),
        estado: 'borrador',
        creada: Date.now()
      };
      r.distancia = estimateDistance(r.origen, r.destino);
      r.precio = calcQuote(r);
      request.save(r);
      go('cotizacion.html', 700);
    });

    show(1);
  });

  /* ================================================================== */
  /* C03 · Cotización estimada                                           */
  /* ================================================================== */
  page('c-cotizacion', () => {
    const r = request.current();
    const p = r.precio;
    $('#q-route').innerHTML = routeHTML(r, { hollow: true });
    $('#q-mini').innerHTML =
      '<div class="mini-stat"><strong>' + String(r.distancia).replace('.', ',') + ' km</strong><span>Distancia</span></div>' +
      '<div class="mini-stat"><strong>' + LABELS.volumen[r.volumen] + '</strong><span>Volumen</span></div>' +
      '<div class="mini-stat"><strong>' + dateShort(r.fecha) + '</strong><span>Fecha</span></div>';
    $('#q-breakdown').innerHTML = kv([
      ['Distancia (' + String(r.distancia).replace('.', ',') + ' km)', money(p.distancia)],
      ['Volumen de carga (' + LABELS.volumen[r.volumen].toLowerCase() + ')', money(p.volumen)],
      ['Tipo de vehículo (' + LABELS.vehiculo[r.vehiculo].toLowerCase() + ')', money(p.vehiculo)],
      [r.ayudantes ? ayudantesTxt(r.ayudantes) + ' de carga' : 'Sin ayudantes', money(p.personal)],
      ['Tarifa de servicio MudGo (5%)', money(p.tarifa)]
    ]);
    const factors = [['Distancia', p.distancia, ''], ['Carga', p.volumen, 'orange'], ['Vehículo', p.vehiculo, 'green'], ['Personal', p.personal, 'purple']];
    $('#q-factors').innerHTML = factors.map(([n, v, c]) => {
      const pct = Math.round(v / p.subtotal * 100);
      return '<div class="factor"><span>' + n + '</span><div class="progress ' + (c ? 'progress--' + c : '') + '"><div class="progress__bar" data-w="' + pct + '"></div></div><span>' + pct + '%</span></div>';
    }).join('');
    requestAnimationFrame(() => setTimeout(() => $$('#q-factors .progress__bar').forEach(b => { b.style.width = b.dataset.w + '%'; }), 50));
    $('#q-total').textContent = money(p.total);

    if (r.estado && r.estado !== 'borrador') {
      $('#q-confirm').outerHTML = '<a class="btn btn--primary btn--lg btn--block" href="' + MG.FLOW_PAGE[r.estado] + '">Ver estado de la solicitud →</a>';
      $('#q-edit').classList.add('hidden');
    }
  });

  /* ================================================================== */
  /* C04 · Confirmar solicitud  +  C05 · Solicitud enviada               */
  /* ================================================================== */
  page('c-confirmar', () => {
    const r = request.current();
    const p = r.precio;
    $('#cf-route').innerHTML = routeHTML(r, { box: true });
    $('#cf-details').innerHTML = kv([
      ['Fecha', dateLong(r.fecha)],
      ['Hora', time12(r.hora)],
      ['Distancia estimada', String(r.distancia).replace('.', ',') + ' km'],
      ['Volumen de carga', LABELS.volumenDetalle[r.volumen]],
      ['Tipo de vehículo', LABELS.vehiculo[r.vehiculo]],
      ['Personal de carga', ayudantesTxt(r.ayudantes)]
    ].concat(r.descripcion ? [['Notas', esc(r.descripcion)]] : []));
    $('#cf-price').innerHTML = kv([
      ['Subtotal', money(p.subtotal)],
      ['Tarifa de servicio (5%)', money(p.tarifa)],
      ['Total estimado', money(p.total), 'kv__row--total']
    ]);

    $('#cf-send').addEventListener('click', e => {
      const btn = e.currentTarget;
      setLoading(btn, true, 'Enviando…');
      setTimeout(() => {
        request.save(Object.assign(r, { estado: 'esperando', enviada: Date.now(), intentos: 0 }));
        setLoading(btn, false);
        openModal('sent-modal');
        const bar = $('#sent-progress');
        requestAnimationFrame(() => { bar.style.width = '100%'; });
        go('estado-solicitud.html', 2600);
      }, 700);
    });
  });

  /* ================================================================== */
  /* C06–C10 · Estado de la solicitud                                    */
  /* ================================================================== */
  page('c-estado', () => {
    applyStateParam();
    const root = $('#estado-root');
    let timers = [];
    const clearTimers = () => { timers.forEach(t => clearTimeout(t) || clearInterval(t)); timers = []; };

    function render() {
      clearTimers();
      const r = request.get();
      if (!r) {
        root.innerHTML = emptyState('No tienes solicitudes activas', 'Cuando envíes una solicitud podrás ver aquí si un proveedor la aceptó.', 'solicitar-mudanza.html', 'Solicitar mudanza');
        return;
      }
      const views = { esperando: viewWaiting, aceptada: viewAccepted, rechazada: viewRejected, buscando: viewSearching, sin_proveedor: viewNoProvider };
      if (!views[r.estado]) {
        const target = MG.FLOW_PAGE[r.estado];
        root.innerHTML = r.estado === 'borrador'
          ? emptyState('Tu cotización aún no se ha enviado', 'Revisa la cotización y confírmala para que los proveedores la reciban.', 'cotizacion.html', 'Ver cotización')
          : emptyState('Tu solicitud ya avanzó', 'Un proveedor aceptó y el proceso continúa en otra pantalla.', target || 'dashboard-cliente.html', 'Continuar');
        return;
      }
      root.innerHTML = views[r.estado](r);
      root.firstElementChild && root.firstElementChild.classList.add('fade-in');
      bind(r);
    }

    function requestSummary(r) {
      return '<section class="card"><p class="label-caps mb-16">Tu solicitud</p>' + routeHTML(r, { hollow: true }) +
        '<div class="mini-stats"><div class="mini-stat"><strong>' + dateShort(r.fecha) + '</strong><span>Fecha</span></div>' +
        '<div class="mini-stat"><strong>' + time12(r.hora) + '</strong><span>Hora</span></div>' +
        '<div class="mini-stat"><strong>' + money(r.precio.total) + '</strong><span>Estimado</span></div></div></section>';
    }
    const notifyAvatars = '<div class="avatar-stack"><span class="avatar avatar--sm">CR</span><span class="avatar avatar--sm">JM</span><span class="avatar avatar--sm">AC</span><span class="avatar avatar--sm">RM</span></div>';
    const demoBar = '<div class="demo-bar"><div class="demo-bar__title">Simula la respuesta del proveedor</div><div class="btn-row">' +
      '<button class="btn btn--outline btn--sm" data-sim="aceptada">' + icon('check') + 'Aceptar</button>' +
      '<button class="btn btn--outline btn--sm" data-sim="rechazada">' + icon('x') + 'Rechazar</button>' +
      '<button class="btn btn--outline btn--sm" data-sim="sin_proveedor">' + icon('ban') + 'Sin proveedores</button></div>' +
      '<p class="mt-8">También puedes aceptarla desde el panel del proveedor (<a class="blue" href="solicitudes-proveedor.html" target="_blank" rel="noopener">abrir en otra pestaña</a>).</p></div>';

    /* C06 */
    function viewWaiting(r) {
      return '<div>' + flowBar({ label: 'Esperando aceptación', id: r.id, current: 1, msg: 'Los proveedores disponibles están revisando tu solicitud.' }) +
        '<section class="card status-hero"><div class="status-icon status-icon--lg status-icon--pulse">' + icon('loader', 'spin') + '<span class="status-icon__badge">!</span></div>' +
        '<div class="mt-16">' + badge('Esperando aceptación', 'orange', true) + '</div>' +
        '<h2>Buscando proveedor</h2><p>Tu solicitud está activa. Los proveedores disponibles la están revisando.</p>' +
        '<div class="row mt-16" style="justify-content:center"><span class="small subtle">Notificando a</span>' + notifyAvatars + '<span class="small subtle">+12 proveedores</span></div></section>' +
        requestSummary(r) +
        '<div class="notice notice--gray mt-16">' + icon('lock') + '<div><strong>Pago bloqueado</strong>El pago estará disponible una vez que un proveedor acepte tu solicitud.</div></div>' +
        '<div class="text-center mt-24"><button class="btn btn--ghost" data-open="cancel-modal">Cancelar solicitud</button></div>' +
        demoBar + '</div>';
    }

    /* C07 */
    function viewAccepted(r) {
      return '<div>' + flowBar({ label: 'Proveedor aceptado', id: r.id, current: 2, spin: false, msg: 'Un proveedor aceptó tu solicitud. Completa el pago para confirmar.' }) +
        '<div class="notice notice--green">' + icon('checkCircle') + '<div><strong>¡Un proveedor aceptó tu solicitud!</strong>Puedes continuar al pago para confirmar el servicio.</div></div>' +
        '<section class="card mt-16"><p class="label-caps mb-16">Proveedor asignado</p>' +
        '<div class="row row--between"><div class="row"><span class="avatar avatar--lg avatar--online">CR</span><div><div class="strong" style="font-size:16px">' + esc(P.nombre) + '</div>' +
        '<div class="row small" style="gap:6px">' + stars(5) + '<span>' + P.rating + '</span><span class="subtle">(' + P.resenas + ' reseñas)</span></div></div></div>' +
        badge('Verificado', 'green', true) + '</div>' +
        '<div class="info-grid"><div class="info-tile"><strong>🚛 ' + esc(P.vehiculo) + '</strong><span>Vehículo</span></div>' +
        '<div class="info-tile"><strong>⚖️ ' + esc(P.capacidad) + '</strong><span>Capacidad</span></div>' +
        '<div class="info-tile"><strong>👷 ' + ayudantesTxt(r.ayudantes) + '</strong><span>Personal</span></div>' +
        '<div class="info-tile"><strong>⏱ ' + esc(P.llegada) + '</strong><span>Tiempo llegada</span></div></div></section>' +
        '<section class="card"><p class="label-caps mb-16">Resumen del servicio</p>' + kv([
          ['Origen', esc(r.origen)], ['Destino', esc(r.destino)], ['Fecha', dateLong(r.fecha)], ['Hora', time12(r.hora)],
          ['Distancia', String(r.distancia).replace('.', ',') + ' km']]) + '</section>' +
        '<section class="card card--blue row row--between"><div><div class="small blue">Total a pagar</div><div style="font-size:24px" class="blue">' + money(r.precio.total) + '</div></div>' +
        '<div class="small subtle text-right">Pago protegido<br>hasta la entrega</div></section>' +
        '<div class="btn-stack"><a class="btn btn--primary btn--lg" href="pago.html">Continuar al pago ' + icon('arrowRight') + '</a>' +
        '<a class="btn btn--ghost" href="dashboard-cliente.html">Decidir después</a></div></div>';
    }

    /* C08 */
    function viewRejected(r) {
      return '<div>' + flowBar({ label: 'Rechazada por proveedor', id: r.id, current: 2, error: 2, tone: 'red', msg: 'El proveedor no pudo aceptar tu solicitud. Buscaremos otro.' }) +
        '<section class="card status-hero"><div class="status-icon status-icon--red status-icon--lg">' + icon('xCircle') + '</div>' +
        '<h2>Proveedor no disponible</h2><p>El proveedor no pudo aceptar tu solicitud en este momento. No te preocupes, buscaremos otro.</p></section>' +
        '<section class="card"><h3 class="mb-16">¿Qué pasó?</h3><div class="reason-list">' +
        '<div class="reason"><span class="reason__icon">📅</span><span>El proveedor no tiene disponibilidad para esa fecha y hora.</span></div>' +
        '<div class="reason"><span class="reason__icon">🚛</span><span>Su vehículo está actualmente en otro servicio.</span></div>' +
        '<div class="reason"><span class="reason__icon">🔄</span><span>MudGo buscará automáticamente otro proveedor disponible.</span></div></div></section>' +
        '<section class="card card--orange row row--between"><div class="row"><span class="spin orange">' + icon('loader') + '</span><span>Buscando alternativa...</span></div>' +
        '<span class="small muted">Redirigiendo en <b id="countdown">4</b>s</span></section>' +
        '<div class="btn-stack"><button class="btn btn--primary btn--lg" data-go="buscando">Buscar ahora ' + icon('arrowRight') + '</button>' +
        '<a class="btn btn--outline" href="solicitar-mudanza.html?editar=1">Modificar solicitud</a></div></div>';
    }

    /* C09 */
    function viewSearching(r) {
      return '<div>' + flowBar({ label: 'Buscando otro proveedor', id: r.id, current: 2, msg: 'Estamos contactando a otros proveedores cercanos.' }) +
        '<section class="card status-hero"><div class="status-icon status-icon--lg status-icon--pulse">' + icon('refresh', 'spin') + '</div>' +
        '<div class="mt-16">' + badge('Buscando proveedor', 'blue', true) + '</div>' +
        '<h2>Buscando proveedores cercanos...</h2><p>Notificamos a más proveedores en tu zona para encontrar uno disponible.</p>' +
        '<div class="mt-24" style="max-width:360px;margin-inline:auto"><div class="progress"><div class="progress__bar" id="search-bar"></div></div>' +
        '<p class="small mt-8"><b id="search-pct">0</b>% completado</p></div>' +
        '<div class="row mt-16" style="justify-content:center">' + notifyAvatars.replace('</div>', '<span class="avatar avatar--sm">LG</span></div>') + '</div></section>' +
        requestSummary(r) +
        '<div class="text-center mt-24"><button class="btn btn--ghost" data-open="cancel-modal">Cancelar solicitud</button></div>' +
        '<div class="demo-bar"><div class="demo-bar__title">Resultado de la búsqueda</div><div class="btn-row">' +
        '<button class="btn btn--outline btn--sm" data-outcome="aceptada">Encontrar proveedor</button>' +
        '<button class="btn btn--outline btn--sm" data-outcome="sin_proveedor">Ninguno disponible</button></div></div></div>';
    }

    /* C10 */
    function viewNoProvider(r) {
      return '<div>' + flowBar({ label: 'Sin proveedor disponible', id: r.id, current: 2, error: 2, tone: 'red', msg: 'No hay proveedores disponibles en este momento para tu solicitud.' }) +
        '<section class="card status-hero"><div class="status-icon status-icon--red status-icon--lg">' + icon('xCircle') + '</div>' +
        '<h2>Sin proveedores disponibles</h2><p>En este momento no hay proveedores disponibles para tu solicitud. Prueba alguna de estas opciones.</p></section>' +
        '<section class="card"><h3 class="mb-16">¿Qué puedes hacer?</h3><div class="reason-list">' +
        '<div class="reason"><span class="reason__icon">📅</span><div><strong>Cambia la fecha u hora</strong><span>Intenta con otra franja horaria o un día diferente para aumentar la disponibilidad.</span></div></div>' +
        '<div class="reason"><span class="reason__icon">📍</span><div><strong>Amplía el área de búsqueda</strong><span>Modifica el radio de búsqueda para incluir más proveedores.</span></div></div>' +
        '<div class="reason"><span class="reason__icon">🔔</span><div><strong>Activa notificación</strong><span>Te avisaremos cuando un proveedor esté disponible para tu solicitud.</span></div></div></div></section>' +
        '<section class="card card--muted small row row--wrap"><span>' + esc(MG.request.shortRoute(r)) + '</span><span class="subtle">·</span><span>' + dateShort(r.fecha) + ' · ' + esc(r.hora) + '</span><span class="subtle">·</span><span>' + money(r.precio.total) + ' est.</span></section>' +
        '<div class="btn-stack"><a class="btn btn--primary btn--lg" href="solicitar-mudanza.html?editar=1">Modificar solicitud</a>' +
        '<button class="btn btn--outline" id="notify-btn">🔔 Notificarme cuando haya proveedor</button>' +
        '<button class="btn btn--ghost" data-open="cancel-modal">Cancelar y volver al inicio</button></div></div>';
    }

    function setState(estado) {
      const r = request.get();
      if (!r) return;
      if (estado === 'rechazada') r.intentos = (r.intentos || 0) + 1;
      r.estado = estado;
      if (estado === 'aceptada') r.proveedor = P.id;
      request.save(r);
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function bind(r) {
      $$('[data-sim]', root).forEach(b => b.addEventListener('click', () => {
        if (b.dataset.sim === 'sin_proveedor') { store.set('simOutcome', 'sin_proveedor'); setState('rechazada'); }
        else setState(b.dataset.sim);
      }));
      $$('[data-go]', root).forEach(b => b.addEventListener('click', () => setState(b.dataset.go)));

      if (r.estado === 'esperando') {
        // En la demo, un proveedor acepta solo después de un rato
        timers.push(setTimeout(() => { toast('Un proveedor aceptó tu solicitud', 'success'); setState('aceptada'); }, 20000));
      }
      if (r.estado === 'rechazada') {
        let n = 4;
        timers.push(setInterval(() => {
          n -= 1;
          const c = $('#countdown');
          if (c) c.textContent = Math.max(n, 0);
          if (n <= 0) setState('buscando');
        }, 1000));
      }
      if (r.estado === 'buscando') {
        let pct = 0;
        const outcome = () => store.get('simOutcome', 'aceptada');
        $$('[data-outcome]', root).forEach(b => b.addEventListener('click', () => { store.set('simOutcome', b.dataset.outcome); }));
        timers.push(setInterval(() => {
          pct = Math.min(100, pct + 4 + Math.random() * 8);
          const bar = $('#search-bar'); const t = $('#search-pct');
          if (bar) bar.style.width = pct + '%';
          if (t) t.textContent = Math.round(pct);
          if (pct >= 100) {
            const o = outcome();
            store.remove('simOutcome');
            if (o === 'aceptada') toast('Encontramos un proveedor para ti', 'success');
            setState(o);
          }
        }, 450));
      }
      const nb = $('#notify-btn');
      if (nb) nb.addEventListener('click', () => {
        nb.disabled = true;
        nb.innerHTML = icon('check') + ' Te avisaremos cuando haya un proveedor';
        toast('Notificación activada', 'success');
      });
    }

    // Cancelar solicitud
    $('#cancel-confirm').addEventListener('click', () => {
      const r = request.get();
      if (r) {
        const extra = store.get('historialExtra', []);
        extra.unshift({ id: r.id, origen: r.origen, destino: r.destino.split(',')[0], fecha: r.fecha, proveedor: null, estado: 'Cancelado', costo: 0, rating: null, motivo: 'Cancelado por el cliente' });
        store.set('historialExtra', extra);
      }
      request.clear();
      closeModal('cancel-modal');
      toast('Solicitud cancelada. No se realizó ningún cobro.', 'warning');
      go('dashboard-cliente.html', 900);
    });

    // Si el proveedor acepta/rechaza desde otra pestaña
    window.addEventListener('storage', e => { if (e.key === 'mudgo.solicitud') render(); });
    window.addEventListener('beforeunload', clearTimers);
    render();
  });

  /* ================================================================== */
  /* C11 · Pago  +  C12 · Pago exitoso  +  C13 · Pago fallido            */
  /* ================================================================== */
  page('c-pago', () => {
    applyStateParam();
    let r = request.get();
    if (!r) { r = MG.demoRequest(); r.estado = 'aceptada'; request.save(r); }
    const flow = $('#pay-flow');
    const formView = $('#pay-form-view');
    const failView = $('#pay-fail-view');
    const blocked = $('#pay-blocked');

    if (!['aceptada', 'pago_fallido'].includes(r.estado)) {
      formView.classList.add('hidden');
      blocked.classList.remove('hidden');
      const early = ['borrador', 'esperando', 'buscando', 'rechazada', 'sin_proveedor'].includes(r.estado);
      blocked.innerHTML = early
        ? emptyState('Pago bloqueado', 'El pago estará disponible una vez que un proveedor acepte tu solicitud.', 'estado-solicitud.html', 'Ver estado de la solicitud')
        : emptyState('Este servicio ya fue pagado', 'Puedes ver los detalles y el seguimiento de tu mudanza.', MG.FLOW_PAGE[r.estado] || 'dashboard-cliente.html', 'Continuar');
      return;
    }

    const p = r.precio;
    $('#pay-summary').innerHTML = kv([
      ['Mudanza ' + esc(MG.request.shortRoute(r)), money(p.subtotal)],
      ['Tarifa de servicio', money(p.tarifa)],
      ['Total', money(p.total), 'kv__row--total']
    ]);
    const payBtn = $('#pay-btn');
    payBtn.innerHTML = 'Pagar ' + money(p.total) + ' ' + icon('arrowRight');
    $('#pay-name').value = DATA.cliente.nombre.toUpperCase();

    function showForm() {
      flow.innerHTML = flowBar({ label: 'Esperando pago', id: r.id, current: 3, msg: 'El proveedor está reservado. Confirma el pago para asegurar la fecha.' });
      formView.classList.remove('hidden');
      failView.classList.add('hidden');
    }
    function showFail() {
      flow.innerHTML = flowBar({ label: 'Pago fallido', id: r.id, current: 3, error: 3, tone: 'red', msg: 'No pudimos procesar tu pago. El proveedor sigue reservado por ahora.' });
      formView.classList.add('hidden');
      failView.classList.remove('hidden');
      failView.classList.add('fade-in');
    }
    r.estado === 'pago_fallido' ? showFail() : showForm();

    // Método de pago
    const methods = $$('[name="metodo"]');
    function syncMethod() {
      const m = $('[name="metodo"]:checked').value;
      $('#card-fields').classList.toggle('hidden', m !== 'tarjeta');
      $('#wallet-fields').classList.toggle('hidden', m === 'tarjeta');
      $('#wallet-label').textContent = 'Número de celular ' + (m === 'nequi' ? 'Nequi' : 'Daviplata');
    }
    methods.forEach(m => m.addEventListener('change', syncMethod));
    syncMethod();

    // Formateo de campos de tarjeta
    const num = $('#card-number'), exp = $('#card-exp'), cvv = $('#card-cvv'), phone = $('#wallet-phone');
    num.addEventListener('input', () => { num.value = num.value.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 '); });
    exp.addEventListener('input', () => { let v = exp.value.replace(/\D/g, '').slice(0, 4); if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2); exp.value = v; });
    cvv.addEventListener('input', () => { cvv.value = cvv.value.replace(/\D/g, '').slice(0, 4); });
    phone.addEventListener('input', () => { phone.value = phone.value.replace(/\D/g, '').slice(0, 10); });

    function fieldErr(input, bad) { input.closest('.field').classList.toggle('has-error', bad); return !bad; }
    function validate() {
      const m = $('[name="metodo"]:checked').value;
      if (m !== 'tarjeta') return fieldErr(phone, !/^3\d{9}$/.test(phone.value));
      let ok = true;
      ok = fieldErr(num, num.value.replace(/\s/g, '').length !== 16) && ok;
      const [mm, yy] = exp.value.split('/').map(Number);
      const now = new Date();
      const expired = !mm || mm > 12 || !yy || (2000 + yy < now.getFullYear()) || (2000 + yy === now.getFullYear() && mm < now.getMonth() + 1);
      ok = fieldErr(exp, expired) && ok;
      ok = fieldErr(cvv, cvv.value.length < 3) && ok;
      ok = fieldErr($('#pay-name'), $('#pay-name').value.trim().length < 3) && ok;
      return ok;
    }

    $('#pay-form').addEventListener('submit', e => {
      e.preventDefault();
      if (!validate()) { toast('Revisa los datos de pago', 'error'); return; }
      setLoading(payBtn, true, 'Procesando pago…');
      const m = $('[name="metodo"]:checked').value;
      const willFail = $('#sim-fail').checked || (m === 'tarjeta' && num.value.replace(/\s/g, '').endsWith('0002'));
      setTimeout(() => {
        setLoading(payBtn, false);
        if (willFail) {
          r.estado = 'pago_fallido';
          r.pagosFallidos = (r.pagosFallidos || 0) + 1;
          request.save(r);
          showFail();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          r.estado = 'pagada';
          r.pago = { metodo: m, fecha: Date.now(), ultimos: m === 'tarjeta' ? num.value.slice(-4) : phone.value.slice(-4) };
          r.servicio = request.serviceNumber(r);
          request.save(r);
          $('#success-amount').textContent = money(p.total);
          openModal('success-modal');
          requestAnimationFrame(() => { $('#success-progress').style.width = '100%'; });
          go('servicio-confirmado.html', 2600);
        }
      }, 1600);
    });

    $('#retry-btn').addEventListener('click', () => { r.estado = 'aceptada'; request.save(r); showForm(); });
    $('#change-method-btn').addEventListener('click', () => {
      r.estado = 'aceptada'; request.save(r); showForm();
      const nequi = $('[name="metodo"][value="nequi"]'); nequi.checked = true; syncMethod();
      $('#methods').scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  });

  /* ================================================================== */
  /* C14 · Servicio confirmado                                           */
  /* ================================================================== */
  page('c-confirmado', () => {
    applyStateParam();
    let r = request.get();
    if (!r) { r = MG.demoRequest(); r.estado = 'pagada'; r.servicio = 'MG-20260810-0042'; }
    if (!['pagada', 'en_curso'].includes(r.estado)) {
      $('#confirm-root').innerHTML = emptyState('Aún no hay un servicio confirmado', 'El servicio se confirma cuando el pago se procesa correctamente.', MG.FLOW_PAGE[r.estado] || 'dashboard-cliente.html', 'Ver mi solicitud');
      return;
    }
    const num = r.servicio || request.serviceNumber(r);
    $('#cs-flow').innerHTML = flowBar({ label: 'Servicio confirmado', id: num, current: 4, spin: false, msg: 'El proveedor fue notificado y se preparará para la fecha acordada.' });
    $('#cs-number').textContent = '#' + num;
    $('#cs-details').innerHTML = kv([
      ['Fecha', dateLong(r.fecha)],
      ['Hora', time12(r.hora)],
      ['Proveedor', esc(P.nombre)],
      ['Vehículo', esc(P.vehiculo + ' · ' + P.placa)],
      ['Personal', ayudantesTxt(r.ayudantes)],
      ['Total pagado', '<span class="blue">' + money(r.precio.total) + '</span>']
    ]);
    const [h, m] = r.hora.split(':').map(Number);
    const fin = String(h + 3).padStart(2, '0') + ':' + String(m).padStart(2, '0');
    const day = dateShort(r.fecha).split(' ')[0];
    $('#cs-timeline').innerHTML = [
      ['Pago confirmado', 'Ahora', 'is-done'], ['Proveedor notificado', 'Ahora', 'is-done'],
      ['Servicio en camino', day + ' ' + r.hora, ''], ['Mudanza finalizada', day + ' ~' + fin, '']
    ].map(([t, w, c], i) => '<div class="timeline__item ' + c + '"><span class="timeline__dot">' + (c ? icon('check') : i + 1) + '</span>' + t + '<span class="timeline__time">' + w + '</span></div>').join('');
  });

  /* ================================================================== */
  /* C15 · Seguimiento en vivo                                           */
  /* ================================================================== */
  page('c-seguimiento', () => {
    applyStateParam();
    let r = request.get();
    const demo = !r;
    if (demo) { r = MG.demoRequest(); r.estado = 'en_curso'; r.servicio = 'MG-20260810-0042'; }
    if (!['pagada', 'en_curso'].includes(r.estado)) {
      $('#track-root').innerHTML = emptyState('No tienes un servicio en curso', 'El seguimiento en vivo se activa cuando tu mudanza está confirmada y pagada.', MG.FLOW_PAGE[r.estado] || 'solicitar-mudanza.html', MG.FLOW_PAGE[r.estado] ? 'Ver mi solicitud' : 'Solicitar mudanza');
      return;
    }
    if (!demo && r.estado === 'pagada') { r.estado = 'en_curso'; request.save(r); }
    const num = r.servicio || request.serviceNumber(r);
    $('#tr-id').textContent = '#' + num;
    $('#tr-flow').innerHTML = flowBar({ label: 'Servicio en proceso', id: num, current: 4, msg: 'Tu mudanza está en curso. Haz seguimiento en tiempo real.' });
    $('#tr-from').textContent = shortAddr(r.origen);
    $('#tr-to').textContent = shortAddr(r.destino);
    $('#tr-call').href = 'tel:' + P.telefono.replace(/\s/g, '');

    // Movimiento del camión sobre una curva Bézier (mapa simulado)
    const map = $('#map');
    const truck = $('#truck');
    const eta = $('#truck-eta');
    const path = $('#route-path');
    const total = path.getTotalLength();
    const DURATION = 90; // segundos de demo para recorrer la ruta
    let t = Math.min(store.get('trackProgress', 0.18), 0.98);
    function place() {
      const pt = path.getPointAtLength(total * t);
      const vb = path.ownerSVGElement.viewBox.baseVal;
      truck.style.left = (pt.x / vb.width * 100) + '%';
      truck.style.top = (pt.y / vb.height * 100) + '%';
      const mins = Math.max(1, Math.round(15 * (1 - t) / 0.82));
      eta.textContent = t >= 0.99 ? 'Llegó' : '~' + mins + ' min';
      $('#tr-progress').style.width = Math.round(t * 100) + '%';
    }
    place();
    const timer = setInterval(() => {
      t = Math.min(1, t + 1 / DURATION);
      store.set('trackProgress', t);
      place();
      if (t >= 1) { clearInterval(timer); toast('Tu mudanza llegó al destino. Confirma la entrega.', 'info'); $('#deliver-btn').classList.add('is-pulse'); }
    }, 1000);
    map.setAttribute('aria-label', 'Mapa simulado de la ruta desde ' + r.origen + ' hasta ' + r.destino);

    $('#deliver-confirm').addEventListener('click', () => {
      clearInterval(timer);
      store.remove('trackProgress');
      if (!demo) { r.estado = 'finalizada'; r.finalizada = Date.now(); request.save(r); }
      closeModal('deliver-modal');
      go('servicio-finalizado.html' + (demo ? '?estado=finalizada' : ''));
    });
  });

  /* ================================================================== */
  /* C16 · Servicio finalizado                                           */
  /* ================================================================== */
  page('c-finalizado', () => {
    applyStateParam();
    let r = request.get() || Object.assign(MG.demoRequest(), { estado: 'finalizada', servicio: 'MG-20260810-0042' });
    if (r.estado !== 'finalizada') {
      $('#done-root').innerHTML = emptyState('El servicio aún no ha finalizado', 'Cuando confirmes la entrega en el seguimiento, verás aquí el resumen.', MG.FLOW_PAGE[r.estado] || 'dashboard-cliente.html', 'Ver mi servicio');
      return;
    }
    const num = r.servicio || request.serviceNumber(r);
    $('#done-flow').innerHTML = flowBar({ label: 'Servicio finalizado', id: num, current: 5, tone: 'green', msg: 'Tu mudanza fue completada exitosamente. ¡Bienvenido a tu nuevo hogar!' });
    $('#done-summary').innerHTML = kv([
      ['Proveedor', esc(P.nombre)], ['Vehículo', esc(P.vehiculo)], ['Origen', esc(r.origen)], ['Destino', esc(r.destino)],
      ['Duración', '2h 45min'], ['Total cobrado', '<span class="blue strong">' + money(r.precio.total) + '</span>']
    ]);
  });

  /* ================================================================== */
  /* C17 · Calificación                                                  */
  /* ================================================================== */
  page('c-calificar', () => {
    const r = request.get();
    let value = 0;
    const btns = $$('#rating button');
    const labels = ['', 'Muy malo', 'Malo', 'Regular', 'Bueno', '¡Excelente!'];
    const send = $('#rate-send');
    function paint(n) { btns.forEach((b, i) => b.classList.toggle('is-on', i < n)); }
    btns.forEach((b, i) => {
      b.addEventListener('mouseenter', () => paint(i + 1));
      b.addEventListener('focus', () => paint(i + 1));
      b.addEventListener('click', () => {
        value = i + 1;
        btns.forEach((x, j) => x.setAttribute('aria-pressed', j < value ? 'true' : 'false'));
        $('#rating-label').textContent = labels[value];
        send.disabled = false;
      });
    });
    $('#rating').addEventListener('mouseleave', () => paint(value));

    $$('.chip input').forEach(c => c.addEventListener('change', () => c.closest('.chip').classList.toggle('is-selected', c.checked)));

    function finish(rated) {
      if (r) {
        const extra = store.get('historialExtra', []);
        extra.unshift({
          id: r.id, origen: r.origen, destino: r.destino.split(',')[0], fecha: r.fecha, proveedor: P.corto, estado: 'Finalizado',
          costo: r.precio.total, rating: rated ? value : null, vehiculo: P.vehiculo + ' · ' + P.placa, inicio: time12(r.hora), fin: '—'
        });
        store.set('historialExtra', extra);
        request.clear();
      }
    }
    $('#rate-form').addEventListener('submit', e => {
      e.preventDefault();
      if (!value) return;
      setLoading(send, true, 'Enviando…');
      setTimeout(() => {
        finish(true);
        toast('¡Gracias por calificar a ' + P.corto + '!', 'success');
        go('historial-cliente.html', 900);
      }, 700);
    });
    $('#rate-skip').addEventListener('click', () => { finish(false); go('dashboard-cliente.html'); });
  });

  /* ================================================================== */
  /* C18 · Historial de servicios                                        */
  /* ================================================================== */
  page('c-historial', () => {
    const all = historyList();
    const done = all.filter(h => h.estado === 'Finalizado');
    $('#hist-count').textContent = done.length + ' servicios realizados';
    const body = $('#hist-body');
    let filter = 'todos';
    function render() {
      const rows = all.filter(h => filter === 'todos' || h.estado.toLowerCase() === filter);
      body.innerHTML = rows.length ? rows.map(h =>
        '<tr tabindex="0" data-id="' + esc(h.id) + '" style="cursor:pointer">' +
        '<td data-label="ID"><span class="id">#' + esc(h.id) + '</span></td>' +
        '<td data-label="Ruta">' + esc(h.origen) + '<span class="sub">→ ' + esc(h.destino) + '</span></td>' +
        '<td data-label="Fecha">' + dateMed(h.fecha) + '</td>' +
        '<td data-label="Proveedor">' + (h.proveedor ? esc(h.proveedor) : '<span class="muted">N/A</span>') + '</td>' +
        '<td data-label="Estado">' + badge(h.estado) + '</td>' +
        '<td data-label="Costo" class="strong">' + money(h.costo) + '</td>' +
        '<td data-label="Calificación">' + (h.rating ? stars(h.rating) : '<span class="muted">—</span>') + '</td></tr>'
      ).join('') : '<tr><td colspan="7"><div class="empty"><div class="empty__icon">📋</div>No hay servicios en esta categoría.</div></td></tr>';
    }
    initTabs($('#hist-tabs'), f => { filter = f; render(); });
    render();

    function detail(id) {
      const h = all.find(x => x.id === id);
      if (!h) return;
      $('#detail-title').textContent = 'Servicio #' + h.id;
      $('#detail-body').innerHTML =
        '<div class="row row--between mb-16">' + badge(h.estado) + '<span class="small muted">' + dateLong(h.fecha) + '</span></div>' +
        routeHTML({ origen: h.origen, destino: h.destino }, { box: true }) +
        (h.estado === 'Cancelado'
          ? '<div class="notice notice--red mt-16">' + icon('info') + '<div><strong>Este servicio fue cancelado</strong>' + esc(h.motivo || 'Cancelado') + '. No se realizó ningún cobro.</div></div>'
          : '<div class="mt-16">' + kv([['Proveedor', esc(h.proveedor)], ['Vehículo', esc(h.vehiculo || '—')], ['Hora inicio', esc(h.inicio || '—')], ['Hora fin', esc(h.fin || '—')],
            ['Tu calificación', h.rating ? stars(h.rating) + ' ' + h.rating.toFixed(1) : '<span class="muted">Sin calificar</span>'], ['Costo total', '<span class="blue strong">' + money(h.costo) + '</span>']]) + '</div>');
      $('#detail-repeat').href = 'solicitar-mudanza.html';
      $('#detail-repeat').textContent = h.estado === 'Cancelado' ? 'Agendar nuevo servicio' : 'Repetir servicio';
      openModal('detail-modal');
    }
    body.addEventListener('click', e => { const tr = e.target.closest('tr[data-id]'); if (tr) detail(tr.dataset.id); });
    body.addEventListener('keydown', e => { const tr = e.target.closest('tr[data-id]'); if (tr && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); detail(tr.dataset.id); } });
    const qid = params().get('id');
    if (qid) detail(qid);
  });

  /* ================================================================== */
  /* C19 · Perfil                                                        */
  /* ================================================================== */
  page('c-perfil', () => {
    const user = Object.assign({}, DATA.cliente, store.get('perfilCliente', {}));
    const paint = () => {
      $('#pf-name').textContent = user.nombre;
      $('#pf-mail').textContent = user.correo;
      $('#pf-phone').textContent = user.telefono;
      $('#pf-avatar').textContent = initials(user.nombre);
    };
    paint();
    const f = $('#form-datos');
    f.elements.nombre.value = user.nombre;
    f.elements.correo.value = user.correo;
    f.elements.telefono.value = user.telefono;
    f.elements.ciudad.value = user.ciudad;

    // Menú tipo acordeón
    $$('.menu-item').forEach(item => {
      const btn = $('.list-row', item);
      btn.addEventListener('click', () => {
        const open = item.classList.toggle('is-open');
        btn.setAttribute('aria-expanded', open);
        $('.menu-panel', item).classList.toggle('hidden', !open);
      });
    });

    f.addEventListener('submit', e => {
      e.preventDefault();
      const ok = f.elements.nombre.value.trim().length > 2 && /\S+@\S+\.\S+/.test(f.elements.correo.value);
      if (!ok) { toast('Revisa el nombre y el correo', 'error'); return; }
      Object.assign(user, { nombre: f.elements.nombre.value.trim(), correo: f.elements.correo.value.trim(), telefono: f.elements.telefono.value.trim(), ciudad: f.elements.ciudad.value });
      store.set('perfilCliente', { nombre: user.nombre, correo: user.correo, telefono: user.telefono, ciudad: user.ciudad });
      paint();
      toast('Datos personales actualizados', 'success');
    });

    // Direcciones
    const addrs = store.get('direcciones', [{ alias: 'Casa', dir: 'Calle 72 #10-45, Bogotá' }, { alias: 'Oficina', dir: 'Av. El Dorado #68C-61, Bogotá' }]);
    function paintAddrs() {
      $('#addr-count').textContent = addrs.length + (addrs.length === 1 ? ' dirección guardada' : ' direcciones guardadas');
      $('#addr-list').innerHTML = addrs.map((a, i) => '<div class="reason"><span class="reason__icon">📍</span><div style="flex:1"><strong>' + esc(a.alias) + '</strong><span>' + esc(a.dir) + '</span></div>' +
        '<button class="btn btn--ghost btn--sm" data-del="' + i + '" aria-label="Eliminar ' + esc(a.alias) + '">' + icon('trash') + '</button></div>').join('');
    }
    paintAddrs();
    $('#addr-list').addEventListener('click', e => {
      const b = e.target.closest('[data-del]'); if (!b) return;
      addrs.splice(+b.dataset.del, 1); store.set('direcciones', addrs); paintAddrs(); toast('Dirección eliminada', 'warning');
    });
    $('#form-addr').addEventListener('submit', e => {
      e.preventDefault();
      const fa = e.currentTarget;
      if (fa.elements.dir.value.trim().length < 6) { toast('Escribe una dirección válida', 'error'); return; }
      addrs.push({ alias: fa.elements.alias.value.trim() || 'Otra', dir: fa.elements.dir.value.trim() });
      store.set('direcciones', addrs); paintAddrs(); fa.reset(); toast('Dirección guardada', 'success');
    });

    // Seguridad
    $('#form-pass').addEventListener('submit', e => {
      e.preventDefault();
      const fp = e.currentTarget;
      const nw = fp.elements.nueva.value, cf = fp.elements.confirmar.value;
      if (!fp.elements.actual.value) return toast('Escribe tu contraseña actual', 'error');
      if (nw.length < 8) return toast('La nueva contraseña debe tener al menos 8 caracteres', 'error');
      if (nw !== cf) return toast('Las contraseñas no coinciden', 'error');
      fp.reset(); toast('Contraseña actualizada', 'success');
    });

    // Notificaciones
    const prefs = store.get('notifCliente', { estado: true, promos: false, correo: true });
    $$('[data-pref]').forEach(s => {
      s.checked = !!prefs[s.dataset.pref];
      s.addEventListener('change', () => {
        prefs[s.dataset.pref] = s.checked; store.set('notifCliente', prefs);
        $('#notif-state').textContent = Object.values(prefs).some(Boolean) ? 'Activas' : 'Desactivadas';
      });
    });
    $('#notif-state').textContent = Object.values(prefs).some(Boolean) ? 'Activas' : 'Desactivadas';

    $('#add-card').addEventListener('click', () => toast('En esta versión los métodos de pago se agregan al momento de pagar.', 'info'));
  });
})();
