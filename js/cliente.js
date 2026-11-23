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
  page('c-dashboard', async () => {
    const greeting = $('#client-greeting');
    const currentUser = window.MG_USER || {};
    if (greeting) greeting.textContent = 'Hola, ' + (currentUser.nombre || DATA.cliente.nombre || 'cliente') + ' 👋';

    const pending = $('#pending'), active = $('#active'), recent = $('#recent');
    const statusLabels = {
      cotizada: ['Cotización pendiente', 'orange', 'Tu cotización está lista para enviar.'],
      esperando_proveedor: ['Esperando proveedor', 'orange', 'Los proveedores están revisando tu solicitud.'],
      buscando_proveedor: ['Buscando proveedor', 'orange', 'Buscando un proveedor disponible.'],
      sin_proveedor: ['Sin proveedor disponible', 'red', 'Intenta cambiar la fecha u hora.'],
      aceptada: ['Proveedor aceptado', 'green', 'Completa el pago para confirmar el servicio.'],
      pagada: ['Pago confirmado', 'blue', 'Tu servicio está listo para iniciar.']
    };
    const statusText = s => ({cotizada:'Cotizada',esperando_proveedor:'Esperando proveedor',buscando_proveedor:'Buscando proveedor',sin_proveedor:'Sin proveedor',aceptada:'Aceptada',pagada:'Pagada',en_camino:'En camino',en_curso:'En curso',finalizada:'Finalizada',cancelada:'Cancelada'}[s] || s);
    try {
      const rows = await MudGoAPI.requests();
      const newest = [...rows].sort((a,b) => (b.id||0)-(a.id||0));
      // El resumen representa la solicitud más reciente. No rescata solicitudes
      // antiguas abiertas si el último flujo ya terminó o fue cancelado.
      const latest = newest[0] || null;
      const current = latest && ['pagada','en_camino','en_curso'].includes(latest.estado) ? latest : null;
      const pend = latest && ['cotizada','esperando_proveedor','buscando_proveedor','sin_proveedor','aceptada'].includes(latest.estado) ? latest : null;
      if (pend) {
        const label = statusLabels[pend.estado] || ['Solicitud pendiente','orange','Consulta el estado de tu solicitud.'];
        pending.innerHTML = '<div class="card__head"><h3>Solicitud pendiente</h3>' + badge(label[0],label[1],true) + '</div>' +
          '<p class="small muted">' + esc(pend.origen) + ' → ' + esc(pend.destino) + ' · ' + dateShort(pend.fecha_servicio) + ' · ' + esc(pend.hora_servicio) + '</p>' +
          '<div class="row row--between mt-12"><span class="small subtle">' + esc(label[2]) + '</span><a class="btn btn--link" href="estado-solicitud.html?id=' + encodeURIComponent(pend.id) + '">Ver estado →</a></div>';
        pending.classList.remove('hidden');
      } else { pending.classList.add('hidden'); pending.innerHTML=''; }
      if (current) {
        const provider = current.proveedor_nombre || 'Proveedor asignado';
        const vehicle = current.vehiculo_modelo || current.tipo_vehiculo || 'Vehículo por confirmar';
        active.innerHTML = '<div class="card__head"><h3>Servicio activo</h3>' + badge(statusText(current.estado),'blue',true) + '</div>' +
          routeHTML({origen:current.origen,destino:current.destino}) + '<hr class="card__divider">' +
          '<div class="row row--between"><div class="row"><span class="avatar avatar--sm">' + initials(provider) + '</span><div><div class="small">' + esc(provider) + '</div><div class="xs subtle">' + esc(vehicle) + '</div></div></div>' +
          '<a class="btn btn--primary btn--sm" href="seguimiento.html?id=' + encodeURIComponent(current.id) + '">Ver seguimiento</a></div>';
        active.classList.remove('hidden');
      } else { active.classList.add('hidden'); active.innerHTML=''; }
      recent.innerHTML = newest.length ? newest.slice(0,3).map(h => '<a class="list-row" href="historial-cliente.html?id=' + encodeURIComponent(h.id) + '">' +
        '<div class="list-row__main"><div class="row" style="gap:8px"><span class="xs subtle">' + dateMed(h.fecha_servicio) + '</span>' + badge(statusText(h.estado)) + '</div>' +
        '<div class="list-row__title mt-8">' + esc(h.origen) + '</div><div class="list-row__sub">→ ' + esc(h.destino) + '</div></div>' +
        '<div class="list-row__end"><div class="strong">' + money(h.total || 0) + '</div></div></a>').join('') : '<div class="empty-state">Aún no tienes solicitudes registradas.</div>';
    } catch (e) {
      toast('No se pudo cargar el resumen: ' + e.message, 'error');
      pending.classList.add('hidden'); active.classList.add('hidden');
      recent.innerHTML = '<div class="empty-state">No fue posible cargar tu historial reciente.</div>';
    }
  });


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
        id: editing ? prev.id : null,
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
      const apiVehicle = String(r.vehiculo).replaceAll('-', '_');
      const payload = { origen:r.origen, destino:r.destino, fecha_servicio:r.fecha, hora_servicio:r.hora, tipo_carga:r.volumen, tipo_vehiculo:apiVehicle, ayudantes:r.ayudantes, distancia_km:r.distancia, observaciones:r.descripcion };
      if (window.MudGoAPI) {
        window.MudGoAPI.createRequest(payload).then(created => {
          r.id = created.id; r.apiId = created.id; r.estado = 'borrador'; r.precio = Object.assign({}, r.precio, { subtotal:Number(created.subtotal), total:Number(created.total), tarifa:Number(created.total)-Number(created.subtotal) });
          request.save(r); go('cotizacion.html', 300);
        }).catch(err => { toast(err.message || 'No se pudo guardar la solicitud.', 'error'); setLoading(btn, false); });
      } else { request.save(r); go('cotizacion.html', 700); }
    });

    show(1);
  });

  /* ================================================================== */
  /* C03 · Cotización estimada                                           */
  /* ================================================================== */
  page('c-cotizacion', () => {
    const r = request.current();
    if (!r || !r.precio) { toast('No hay una cotización para mostrar. Crea una solicitud primero.', 'warning'); go('solicitar-mudanza.html'); return; }
    const p = r.precio;
    $('#q-route').innerHTML = routeHTML(r, { hollow: true });
    $('#q-mini').innerHTML =
      '<div class="mini-stat"><strong>Base 1 km</strong><span>Distancia demostrativa</span></div>' +
      '<div class="mini-stat"><strong>' + LABELS.volumen[r.volumen] + '</strong><span>Volumen</span></div>' +
      '<div class="mini-stat"><strong>' + dateShort(r.fecha) + '</strong><span>Fecha</span></div>';
    $('#q-breakdown').innerHTML = kv([
      ['Distancia base demostrativa (1 km, no cartográfica)', money(p.distancia)],
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
    if (!r || !r.apiId || !r.precio) { toast('No hay una cotización local válida. Crea una nueva solicitud.', 'error'); go('solicitar-mudanza.html'); return; }
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
      const send = r.apiId ? window.MudGoAPI.confirmRequest(r.apiId) : Promise.reject(new Error('No existe una cotización guardada en el servidor. Vuelve a crear la solicitud.'));
      send.then(() => {
        request.save(Object.assign(r, { estado: 'esperando', enviada: Date.now(), intentos: 0 }));
        setLoading(btn, false); openModal('sent-modal');
        const bar = $('#sent-progress'); requestAnimationFrame(() => { bar.style.width = '100%'; });
        go('estado-solicitud.html?id=' + encodeURIComponent(r.apiId), 2600);
      }).catch(err => { setLoading(btn, false); toast(err.message || 'No se pudo enviar la solicitud.', 'error'); });
    });
  });

  /* ================================================================== */
  /* C06–C10 · Estado de la solicitud                                    */
  /* ================================================================== */
  page('c-estado', async () => {
    const root = $('#estado-root');
    const clearTimers = () => {};

    async function render() {
      clearTimers();
      let r = null;
      const requestedId = params().get('id');
      if (requestedId && window.MudGoAPI) {
        try {
          const apiRow = await window.MudGoAPI.getRequest(requestedId);
          const stateMap = { cotizada: 'borrador', esperando_proveedor: 'esperando', buscando_proveedor: 'buscando', aceptada: 'aceptada', pagada: 'pagada', en_camino: 'pagada', en_curso: 'pagada', finalizada: 'pagada', cancelada: 'sin_proveedor' };
          r = {
            id: String(apiRow.id), apiId: apiRow.id, apiBacked: true, estado: stateMap[apiRow.estado] || 'borrador',
            origen: apiRow.origen, destino: apiRow.destino, fecha: apiRow.fecha_servicio, hora: apiRow.hora_servicio,
            volumen: apiRow.tipo_carga, vehiculo: apiRow.tipo_vehiculo, ayudantes: Number(apiRow.ayudantes || 0),
            distancia: Number(apiRow.distancia_km || 0),
            precio: { subtotal: Number(apiRow.subtotal || 0), tarifa: Math.max(0, Number(apiRow.total || 0) - Number(apiRow.subtotal || 0)), total: Number(apiRow.total || 0) },
            proveedor: apiRow.proveedor_id || null, proveedor_nombre: apiRow.proveedor_nombre || null,
            proveedor_calificacion: apiRow.proveedor_calificacion || null, proveedor_total_calificaciones: apiRow.proveedor_total_calificaciones || 0,
            vehiculo_modelo: apiRow.vehiculo_modelo || null, vehiculo_capacidad: apiRow.vehiculo_capacidad || null
          };
        } catch (error) {
          root.innerHTML = emptyState('No se pudo cargar la solicitud', error.message || 'Comprueba tu conexión e inténtalo de nuevo.', 'dashboard-cliente.html', 'Volver al inicio');
          return;
        }
      } else {
        r = null;
      }
      if (!r) {
        root.innerHTML = emptyState('No tienes solicitudes activas', 'Cuando envíes una solicitud podrás ver aquí si un proveedor la aceptó.', 'solicitar-mudanza.html', 'Solicitar mudanza');
        return;
      }
      if (r.apiBacked && ['pagada'].includes(r.estado)) {
        root.innerHTML = emptyState('Pago confirmado', 'Tu servicio está confirmado. Consulta su seguimiento.', 'seguimiento.html?id=' + encodeURIComponent(r.apiId), 'Ver seguimiento');
        return;
      }
      if (r.apiBacked && r.estado === 'borrador') {
        root.innerHTML = emptyState('Cotización pendiente', 'La solicitud aún no ha sido enviada a los proveedores.', 'dashboard-cliente.html', 'Volver al inicio');
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
      if (!r.apiBacked) bind(r);
      if (r.estado === 'aceptada' && r.apiId && window.MudGoAPI) {
        window.MudGoAPI.getRequest(r.apiId).then(data => {
          if (!data.proveedor_nombre) return;
          const card = root.querySelector('.info-grid');
          const providerCard = card && card.closest('.card');
          if (!providerCard) return;
          const name = data.proveedor_nombre;
          const rating = Number(data.proveedor_calificacion || 0).toFixed(1);
          const count = Number(data.proveedor_total_calificaciones || 0);
          const vehicle = data.vehiculo_modelo || ({van:'Van',camion_pequeno:'Camión pequeño',camion_mediano:'Camión mediano',camion_grande:'Camión grande'}[data.tipo_vehiculo] || data.tipo_vehiculo || 'Por asignar');
          providerCard.querySelector('.avatar').textContent = initials(name);
          providerCard.querySelector('.strong').textContent = name;
          const ratingRow = providerCard.querySelector('.strong').parentElement.querySelector('.row');
          if (ratingRow) ratingRow.innerHTML = stars(5) + '<span>' + rating + '</span><span class="subtle">(' + count + ' reseñas)</span>';
          const tiles = providerCard.querySelectorAll('.info-tile strong');
          if (tiles[0]) tiles[0].textContent = '🚛 ' + vehicle;
          if (tiles[1]) tiles[1].textContent = '⚖️ ' + (data.vehiculo_capacidad || 'Por confirmar');
          if (tiles[3]) tiles[3].textContent = '⏱ Por confirmar';
        }).catch(err => console.warn('[MudGo] No se pudo cargar el proveedor asignado:', err));
      }
    }

    function requestSummary(r) {
      return '<section class="card"><p class="label-caps mb-16">Tu solicitud</p>' + routeHTML(r, { hollow: true }) +
        '<div class="mini-stats"><div class="mini-stat"><strong>' + dateShort(r.fecha) + '</strong><span>Fecha</span></div>' +
        '<div class="mini-stat"><strong>' + time12(r.hora) + '</strong><span>Hora</span></div>' +
        '<div class="mini-stat"><strong>' + money(r.precio.total) + '</strong><span>Estimado</span></div></div></section>';
    }


    /* C06 */
    function viewWaiting(r) {
      return '<div>' + flowBar({ label: 'Esperando aceptación', id: r.id, current: 1, msg: 'Los proveedores disponibles están revisando tu solicitud.' }) +
        '<section class="card status-hero"><div class="status-icon status-icon--lg status-icon--pulse">' + icon('loader', 'spin') + '<span class="status-icon__badge">!</span></div>' +
        '<div class="mt-16">' + badge('Esperando aceptación', 'orange', true) + '</div>' +
        '<h2>Buscando proveedor</h2><p>Tu solicitud está activa. Los proveedores disponibles la están revisando.</p>' +
        '<div class="row mt-16" style="justify-content:center"><span class="small subtle">La solicitud está disponible para proveedores registrados.</span></div></section>' +
        requestSummary(r) +
        '<div class="notice notice--gray mt-16">' + icon('lock') + '<div><strong>Pago bloqueado</strong>El pago estará disponible una vez que un proveedor acepte tu solicitud.</div></div>' +
        '<div class="text-center mt-24"><button class="btn btn--ghost" data-open="cancel-modal">Cancelar solicitud</button></div>' +
        '</div>';
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
        '<div class="btn-stack"><a class="btn btn--primary btn--lg" href="pago.html?id=' + encodeURIComponent(r.apiId || r.id) + '">Continuar al pago ' + icon('arrowRight') + '</a>' +
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
        '<div class="row mt-16" style="justify-content:center"><span class="small subtle">Esperando respuestas de proveedores.</span></div></section>' +
        requestSummary(r) +
        '<div class="text-center mt-24"><button class="btn btn--ghost" data-open="cancel-modal">Cancelar solicitud</button></div>' +
        '</div>';
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

    function bind() { /* Los estados se actualizan exclusivamente desde el backend. */ }

    // Cancelar solicitud
    $('#cancel-confirm').addEventListener('click', () => { toast('La cancelación desde el cliente aún no está habilitada en el servidor.', 'warning'); closeModal('cancel-modal'); });

    window.addEventListener('beforeunload', clearTimers);
    render();
  });

  /* ================================================================== */
  /* C11 · Pago  +  C12 · Pago exitoso  +  C13 · Pago fallido            */
  /* ================================================================== */
  page('c-pago', async () => {
    const id = params().get('id') || (request.get() && (request.get().apiId || request.get().id));
    const flow = $('#pay-flow'), formView = $('#pay-form-view'), failView = $('#pay-fail-view'), blocked = $('#pay-blocked');
    if (!id) {
      formView.classList.add('hidden'); blocked.classList.remove('hidden');
      blocked.innerHTML = emptyState('Solicitud no encontrada', 'Abre el pago desde el estado de una solicitud aceptada.', 'dashboard-cliente.html', 'Volver al inicio'); return;
    }
    let r;
    try { r = await MudGoAPI.getRequest(id); }
    catch (e) {
      formView.classList.add('hidden'); blocked.classList.remove('hidden');
      blocked.innerHTML = emptyState('No se pudo cargar el pago', e.message, 'dashboard-cliente.html', 'Volver al inicio'); return;
    }
    if (r.estado !== 'aceptada') {
      formView.classList.add('hidden'); blocked.classList.remove('hidden');
      const paid = ['pagada','en_camino','en_curso','finalizada'].includes(r.estado);
      blocked.innerHTML = paid
        ? emptyState('Este servicio ya fue pagado', 'El pago está registrado. Consulta la confirmación y el seguimiento.', 'servicio-confirmado.html?id=' + encodeURIComponent(r.id), 'Ver servicio')
        : emptyState('Pago no disponible', 'El pago solo se habilita después de que un proveedor acepte la solicitud.', 'estado-solicitud.html?id=' + encodeURIComponent(r.id), 'Ver estado');
      return;
    }
    const subtotal=Number(r.subtotal||0), total=Number(r.total||0), fee=Math.max(0,total-subtotal);
    const viewData={id:r.id,apiId:r.id,origen:r.origen,destino:r.destino,fecha:r.fecha_servicio,hora:String(r.hora_servicio||'').slice(0,5),ayudantes:Number(r.ayudantes||0),precio:{subtotal,tarifa:fee,total}};
    $('#pay-summary').innerHTML=kv([
      ['Mudanza '+esc(MG.request.shortRoute(viewData)),money(subtotal)],
      ['Tarifa de servicio',money(fee)],
      ['Total',money(total),'kv__row--total']
    ]);
    const payBtn=$('#pay-btn'); payBtn.innerHTML='Pagar '+money(total)+' '+icon('arrowRight');
    const me=await MudGoAPI.me().catch(()=>null); $('#pay-name').value=String(me&&me.nombre||'').toUpperCase();
    flow.innerHTML=flowBar({label:'Esperando pago',id:r.id,current:3,msg:'El proveedor está reservado. Confirma el pago para asegurar la fecha.'});
    formView.classList.remove('hidden'); failView.classList.add('hidden');
    const methods=$$('[name="metodo"]');
    function syncMethod(){const m=$('[name="metodo"]:checked').value;$('#card-fields').classList.toggle('hidden',m!=='tarjeta');$('#wallet-fields').classList.toggle('hidden',m==='tarjeta');$('#wallet-label').textContent='Número de celular '+(m==='nequi'?'Nequi':'Daviplata');}
    methods.forEach(m=>m.addEventListener('change',syncMethod)); syncMethod();
    const num=$('#card-number'),exp=$('#card-exp'),cvv=$('#card-cvv'),phone=$('#wallet-phone');
    num.addEventListener('input',()=>{num.value=num.value.replace(/\D/g,'').slice(0,16).replace(/(\d{4})(?=\d)/g,'$1 ');});
    exp.addEventListener('input',()=>{let v=exp.value.replace(/\D/g,'').slice(0,4);if(v.length>2)v=v.slice(0,2)+'/'+v.slice(2);exp.value=v;});
    cvv.addEventListener('input',()=>{cvv.value=cvv.value.replace(/\D/g,'').slice(0,4);});
    phone.addEventListener('input',()=>{phone.value=phone.value.replace(/\D/g,'').slice(0,10);});
    function fieldErr(input,bad){input.closest('.field').classList.toggle('has-error',bad);return !bad;}
    function validate(){const m=$('[name="metodo"]:checked').value;if(m!=='tarjeta')return fieldErr(phone,!/^3\d{9}$/.test(phone.value));let ok=true;ok=fieldErr(num,num.value.replace(/\s/g,'').length!==16)&&ok;const [mm,yy]=exp.value.split('/').map(Number),now=new Date();const expired=!mm||mm>12||!yy||(2000+yy<now.getFullYear())||(2000+yy===now.getFullYear()&&mm<now.getMonth()+1);ok=fieldErr(exp,expired)&&ok;ok=fieldErr(cvv,cvv.value.length<3)&&ok;ok=fieldErr($('#pay-name'),$('#pay-name').value.trim().length<3)&&ok;return ok;}
    $('#pay-form').addEventListener('submit',async e=>{
      e.preventDefault(); if(!validate()){toast('Revisa los datos de pago','error');return;}
      setLoading(payBtn,true,'Procesando pago…'); const selected=$('[name="metodo"]:checked').value;
      const fail=$('#sim-fail').checked||(selected==='tarjeta'&&num.value.replace(/\s/g,'').endsWith('0002'));
      try{
        const result=await MudGoAPI.createPayment({solicitud_id:Number(r.id),metodo:selected==='tarjeta'?'tarjeta':'transferencia',resultado_demo:fail?'fallido':'exitoso'});
        setLoading(payBtn,false);
        if(result.estado==='fallido'){
          formView.classList.add('hidden');failView.classList.remove('hidden');
          flow.innerHTML=flowBar({label:'Pago fallido',id:r.id,current:3,error:3,tone:'red',msg:'No pudimos procesar el pago. El proveedor sigue reservado por ahora.'});return;
        }
        $('#success-amount').textContent=money(result.monto||total);openModal('success-modal');
        request.save({...viewData,estado:'pagada'});requestAnimationFrame(()=>{$('#success-progress').style.width='100%';});
        go('servicio-confirmado.html?id='+encodeURIComponent(r.id),1800);
      }catch(error){setLoading(payBtn,false);toast(error.message||'No fue posible registrar el pago.','error');}
    });
    $('#retry-btn').addEventListener('click',()=>{failView.classList.add('hidden');formView.classList.remove('hidden');});
    $('#change-method-btn').addEventListener('click',()=>{failView.classList.add('hidden');formView.classList.remove('hidden');const nequi=$('[name="metodo"][value="nequi"]');nequi.checked=true;syncMethod();$('#methods').scrollIntoView({behavior:'smooth',block:'center'});});
  });

  /* ================================================================== */
  /* C14 · Servicio confirmado                                           */
  /* ================================================================== */
  page('c-confirmado', async () => {
    const id=params().get('id')||(request.get()&&(request.get().apiId||request.get().id));
    if(!id){$('#confirm-root').innerHTML=emptyState('Servicio no encontrado','No se recibió el identificador de la solicitud.','dashboard-cliente.html','Volver al inicio');return;}
    let r;try{r=await MudGoAPI.getRequest(id);}catch(e){$('#confirm-root').innerHTML=emptyState('No se pudo cargar la confirmación',e.message,'dashboard-cliente.html','Volver al inicio');return;}
    if(!['pagada','en_camino','en_curso','finalizada'].includes(r.estado)){$('#confirm-root').innerHTML=emptyState('Aún no hay un servicio confirmado','El servicio se confirma cuando el pago se registra correctamente.','estado-solicitud.html?id='+encodeURIComponent(r.id),'Ver mi solicitud');return;}
    const provider=r.proveedor_nombre||'Proveedor asignado';
    const vehicle=[r.vehiculo_modelo,r.vehiculo_capacidad].filter(Boolean).join(' · ')||r.tipo_vehiculo||'Vehículo por confirmar';
    const serviceCode=r.codigo||('MG-'+String(r.id).padStart(6,'0'));
    $('#cs-flow').innerHTML=flowBar({label:'Servicio confirmado',id:serviceCode,current:r.estado==='finalizada'?5:4,spin:false,msg:'El proveedor fue notificado y se preparará para la fecha acordada.'});
    $('#cs-number').textContent='#'+serviceCode;
    $('#cs-details').innerHTML=kv([
      ['Fecha',dateLong(r.fecha_servicio)],['Hora',time12(r.hora_servicio)],['Proveedor',esc(provider)],['Vehículo',esc(vehicle)],
      ['Personal',ayudantesTxt(Number(r.ayudantes||0))],['Total pagado','<span class="blue">'+money(r.total||0)+'</span>']
    ]);
    const timeline=[['Pago confirmado','Registrado','is-done'],['Proveedor notificado','Registrado','is-done'],['Servicio en camino','Pendiente',''],['Mudanza finalizada','Pendiente','']];
    if(['en_camino','en_curso','finalizada'].includes(r.estado))timeline[2]=['Servicio en camino','Actualizado','is-done'];
    if(['en_curso','finalizada'].includes(r.estado))timeline[3]=['Mudanza finalizada','Actualizado','is-done'];
    $('#cs-timeline').innerHTML=timeline.map(([t,w,c],i)=>'<div class="timeline__item '+c+'"><span class="timeline__dot">'+(c?icon('check'):i+1)+'</span>'+t+'<span class="timeline__time">'+w+'</span></div>').join('');
    const track=document.querySelector('#confirm-root a[href="seguimiento.html"]');if(track)track.href='seguimiento.html?id='+encodeURIComponent(r.id);
  });

  /* ================================================================== */
  /* C15 · Seguimiento en vivo                                           */
  /* ================================================================== */
  page('c-seguimiento', async () => {
    const local=request.get(); const id=params().get('id')||(local&&local.id); if(!id){$('#track-root').innerHTML=emptyState('No hay una solicitud seleccionada','Abre el seguimiento desde tu solicitud.','historial-cliente.html','Ver historial');return;}
    let r;try{r=await MudGoAPI.getRequest(id);}catch(e){$('#track-root').innerHTML=emptyState('No se pudo cargar el seguimiento',e.message,'dashboard-cliente.html','Volver al inicio');return;}
    if(!['pagada','en_camino','en_curso'].includes(r.estado)){ $('#track-root').innerHTML=emptyState('El servicio no está en curso','El seguimiento estará disponible cuando el proveedor inicie el servicio.','estado-solicitud.html','Ver solicitud');return; }
    const provider=r.proveedor_nombre||'Proveedor asignado';const pn=$('#tr-provider-name');if(pn)pn.textContent=provider;const pa=$('#tr-provider-avatar');if(pa)pa.textContent=initials(provider);const pv=$('#tr-provider-vehicle');if(pv)pv.textContent=r.vehiculo_modelo||r.tipo_vehiculo||'Vehículo por asignar';const pr=$('#tr-provider-rating');if(pr)pr.textContent=r.proveedor_calificacion?'★ '+Number(r.proveedor_calificacion).toFixed(1)+' · '+Number(r.proveedor_total_calificaciones||0)+' reseñas':'';$('#tr-id').textContent='#MG-'+String(r.id).padStart(6,'0');$('#tr-from').textContent=shortAddr(r.origen);$('#tr-to').textContent=shortAddr(r.destino);
    const call=$('#tr-call');if(call){call.href=r.proveedor_telefono?'tel:'+r.proveedor_telefono:'#';call.hidden=!r.proveedor_telefono;}
    const card=document.querySelector('#track-root .provider-name');if(card)card.textContent=provider;
    $('#tr-flow').innerHTML=flowBar({label:r.estado==='pagada'?'Servicio confirmado':'Servicio en proceso',id:r.id,current:r.estado==='pagada'?3:4,msg:r.estado==='pagada'?'El proveedor está preparando el servicio.':'El proveedor inició el servicio.'});
    $('#tr-from').textContent=shortAddr(r.origen);$('#tr-to').textContent=shortAddr(r.destino);
    // El mapa es ilustrativo: no se simula movimiento GPS ni se cambia el estado desde el navegador del cliente.
    const map=$('#map');map.setAttribute('aria-label','Representación ilustrativa de la ruta desde '+r.origen+' hasta '+r.destino);
    const eta=$('#truck-eta');if(eta)eta.textContent='Ubicación no disponible';const progress=$('#tr-progress');if(progress)progress.style.width=r.estado==='en_curso'?'55%':'25%';
    const refresh=async()=>{try{const fresh=await MudGoAPI.getRequest(id);if(fresh.estado==='finalizada'){clearInterval(timer);go('servicio-finalizado.html?id='+id);}}catch(e){console.warn(e);}};
    const timer=setInterval(refresh,5000);
    const confirm=$('#deliver-confirm');if(confirm){confirm.disabled=true;confirm.textContent='La finalización la registra el proveedor';}
  });

  /* ================================================================== */
  /* C16 · Servicio finalizado                                           */
  /* ================================================================== */
  page('c-finalizado', async () => {
    const id=params().get('id')||(request.get()&&request.get().id);if(!id){$('#done-root').innerHTML=emptyState('Servicio no encontrado','No hay un servicio seleccionado.','historial-cliente.html','Ver historial');return;}
    try{const r=await MudGoAPI.getRequest(id);if(r.estado!=='finalizada'){$('#done-root').innerHTML=emptyState('El servicio aún no ha finalizado','El proveedor debe registrar la finalización.','seguimiento.html','Ver seguimiento');return;}
      $('#done-flow').innerHTML=flowBar({label:'Servicio finalizado',id:r.id,current:5,tone:'green',msg:'Tu mudanza fue completada exitosamente.'});
      $('#done-summary').innerHTML=kv([['Proveedor',esc(r.proveedor_nombre||'Proveedor')],['Vehículo',esc(r.vehiculo_modelo||r.tipo_vehiculo||'—')],['Origen',esc(r.origen)],['Destino',esc(r.destino)],['Fecha',esc(r.fecha_servicio)],['Total', '<span class="blue strong">'+money(r.total)+'</span>']]);const ratingLink=$('#rate-service-link');if(ratingLink)ratingLink.href='calificar.html?id='+encodeURIComponent(r.id);
    }catch(e){$('#done-root').innerHTML=emptyState('No se pudo cargar el servicio',e.message,'historial-cliente.html','Ver historial');}
  });

  /* ================================================================== */
  /* C17 · Calificación                                                  */
  /* ================================================================== */
  page('c-calificar', async () => {
    const id = params().get('id');
    if (!id) { toast('Falta el identificador del servicio.', 'error'); return; }
    let service;
    try {
      service = await MudGoAPI.getRequest(id);
      if (service.estado !== 'finalizada') throw new Error('Solo puedes calificar un servicio finalizado.');
      if (!service.proveedor_id) throw new Error('El servicio no tiene un proveedor asignado.');
      const title = document.querySelector('.page-head__sub');
      if (title) title.textContent = 'Con ' + (service.proveedor_nombre || 'tu proveedor');
    } catch (e) { toast(e.message, 'error'); return; }
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
        $('#rating-label').textContent = labels[value]; send.disabled = false;
      });
    });
    $('#rating').addEventListener('mouseleave', () => paint(value));
    $$('.chip input').forEach(c => c.addEventListener('change', () => c.closest('.chip').classList.toggle('is-selected', c.checked)));
    $('#rate-form').addEventListener('submit', async e => {
      e.preventDefault(); if (!value) return;
      setLoading(send, true, 'Enviando…');
      try {
        const chips = $$('.chip input:checked').map(c => c.value || c.closest('.chip').textContent.trim());
        const comment = [chips.join(', '), $('#comentario')?.value?.trim()].filter(Boolean).join('. ');
        await MudGoAPI.createRating({ solicitud_id: Number(id), puntuacion: value, comentario: comment });
        toast('Calificación registrada.', 'success'); go('historial-cliente.html', 700);
      } catch (err) { toast(err.message || 'No se pudo registrar la calificación.', 'error'); }
      finally { setLoading(send, false); }
    });
    $('#rate-skip').addEventListener('click', () => go('historial-cliente.html'));
  });

  /* ================================================================== */
  /* C18 · Historial de servicios                                        */
  /* ================================================================== */
  page('c-historial', async () => {
    let all=[];try{const rows=await MudGoAPI.requests();all=rows.map(r=>({id:String(r.id),origen:r.origen,destino:r.destino,fecha:r.fecha_servicio,proveedor:r.proveedor_nombre||null,estado:r.estado==='finalizada'?'Finalizado':r.estado==='cancelada'?'Cancelado':r.estado==='en_curso'?'En curso':r.estado==='en_camino'?'En camino':r.estado==='pagada'?'Pagado':r.estado==='aceptada'?'Aceptado':'En proceso',costo:Number(r.total||0),rating:null,vehiculo:r.vehiculo_modelo||r.tipo_vehiculo}));}catch(e){toast(e.message,'error');}
    const done=all.filter(h=>h.estado==='Finalizado');$('#hist-count').textContent=done.length+' servicios realizados';const body=$('#hist-body');let filter='todos';
    function render(){const rows=all.filter(h=>filter==='todos'||(filter==='finalizado'&&h.estado==='Finalizado')||(filter==='cancelado'&&h.estado==='Cancelado'));body.innerHTML=rows.length?rows.map(h=>'<tr><td><span class="id">#'+esc(h.id)+'</span></td><td>'+esc(h.origen)+'<span class="sub">→ '+esc(h.destino)+'</span></td><td>'+dateMed(h.fecha)+'</td><td>'+esc(h.proveedor||'—')+'</td><td>'+badge(h.estado)+'</td><td>'+money(h.costo)+'</td><td>—</td></tr>').join(''):'<tr><td colspan="7">No hay servicios registrados.</td></tr>';}
    initTabs($('#hist-tabs'),f=>{filter=f;render();});render();
  });

  /* ================================================================== */
  /* C19 · Perfil                                                        */
  /* ================================================================== */
  page('c-perfil', async () => {
    const form = $('#form-datos');
    const paintProfile = p => {
      const name = p.nombre || 'Cliente';
      $('#pf-name').textContent = name; $('#pf-mail').textContent = p.correo || '';
      $('#pf-phone').textContent = p.telefono || ''; $('#pf-avatar').textContent = initials(name);
      form.elements.nombre.value = p.nombre || ''; form.elements.correo.value = p.correo || '';
      form.elements.telefono.value = p.telefono || '';
      if (p.ciudad) form.elements.ciudad.value = p.ciudad;
    };
    try {
      const [profile, rows] = await Promise.all([MudGoAPI.profile(), MudGoAPI.requests()]);
      paintProfile(profile);
      $('#pf-moves').textContent = String(rows.filter(r => r.estado === 'finalizada').length);
      $('#pf-rating').textContent = '—';
      $('#pf-tenure').textContent = profile.created_at ? new Date(profile.created_at).toLocaleDateString('es-CO',{month:'short',year:'numeric'}) : '—';
    } catch (err) { toast('No se pudo cargar el perfil: ' + err.message, 'error'); }

    $$('.menu-item').forEach(item => {
      const btn = $('.list-row', item);
      btn.addEventListener('click', () => { const open=item.classList.toggle('is-open');btn.setAttribute('aria-expanded',open);$('.menu-panel',item).classList.toggle('hidden',!open); });
    });

    form.addEventListener('submit', async e => {
      e.preventDefault();
      const data={nombre:form.elements.nombre.value.trim(),correo:form.elements.correo.value.trim(),telefono:form.elements.telefono.value.trim()};if(form.elements.ciudad.value)data.ciudad=form.elements.ciudad.value;
      if(data.nombre.length<3||!/^\S+@\S+\.\S+$/.test(data.correo))return toast('Revisa el nombre y el correo electrónico.','error');
      const button=form.querySelector('button[type="submit"]');button.disabled=true;
      try { const updated=await MudGoAPI.updateProfile(data); const fresh=await MudGoAPI.profile();paintProfile(fresh);if(window.MG_USER){window.MG_USER.nombre=fresh.nombre;window.MG_USER.correo=fresh.correo;window.MG_USER.telefono=fresh.telefono;}toast('Datos personales guardados en tu cuenta.','success'); }
      catch(err){toast(err.message,'error');} finally{button.disabled=false;}
    });

    const addressList=$('#addr-list');
    async function loadAddresses(){
      const rows=await MudGoAPI.addresses();$('#addr-count').textContent=rows.length+(rows.length===1?' dirección guardada':' direcciones guardadas');
      addressList.innerHTML=rows.map(a=>`<div class="reason"><span class="reason__icon">📍</span><div style="flex:1"><strong>${esc(a.alias)}</strong><span>${esc(a.direccion)}</span></div><button class="btn btn--ghost btn--sm" data-del="${Number(a.id)}" aria-label="Eliminar dirección">${icon('trash')}</button></div>`).join('')||'<p class="small muted">Aún no tienes direcciones guardadas.</p>';
    }
    try{await loadAddresses();}catch(err){toast('No se pudieron cargar las direcciones: '+err.message,'error');}
    addressList.addEventListener('click',async e=>{const b=e.target.closest('[data-del]');if(!b)return;b.disabled=true;try{await MudGoAPI.deleteAddress(b.dataset.del);await loadAddresses();toast('Dirección eliminada.','success');}catch(err){b.disabled=false;toast(err.message,'error');}});
    $('#form-addr').addEventListener('submit',async e=>{e.preventDefault();const f=e.currentTarget;const alias=f.elements.alias.value.trim()||'Otra';const direccion=f.elements.dir.value.trim();if(direccion.length<6)return toast('Escribe una dirección válida.','error');const b=f.querySelector('button[type="submit"]');b.disabled=true;try{await MudGoAPI.addAddress({alias,direccion});f.reset();await loadAddresses();toast('Dirección guardada en tu cuenta.','success');}catch(err){toast(err.message,'error');}finally{b.disabled=false;}});

    const passForm=$('#form-pass');
    passForm.addEventListener('submit',async e=>{e.preventDefault();const f=e.currentTarget;const actual=f.elements.actual.value,nueva=f.elements.nueva.value,confirmar=f.elements.confirmar.value;if(!actual)return toast('Escribe tu contraseña actual.','error');if(nueva.length<8||!/[A-Za-z]/.test(nueva)||!/[0-9]/.test(nueva))return toast('La nueva contraseña debe tener al menos 8 caracteres e incluir letras y números.','error');if(nueva!==confirmar)return toast('Las contraseñas no coinciden.','error');const b=f.querySelector('button[type="submit"]');b.disabled=true;try{await MudGoAPI.changePassword({actual,nueva,confirmar});f.reset();toast('Contraseña actualizada correctamente.','success');}catch(err){toast(err.message,'error');}finally{b.disabled=false;}});

    const prefInputs=$$('[data-pref]');
    try{const prefs=await MudGoAPI.preferences();const map={estado:'estado_solicitudes',correo:'resumen_correo',promos:'promociones'};prefInputs.forEach(input=>input.checked=!!Number(prefs[map[input.dataset.pref]]));}catch(err){toast('No se pudieron cargar las preferencias. '+err.message,'error');}
    function paintNotif(){ $('#notif-state').textContent=prefInputs.some(x=>x.checked)?'Preferencias activas':'Desactivadas'; }
    paintNotif();
    prefInputs.forEach(input=>input.addEventListener('change',async()=>{const data={};prefInputs.forEach(x=>data[x.dataset.pref]=x.checked);prefInputs.forEach(x=>x.disabled=true);try{await MudGoAPI.updatePreferences(data);paintNotif();toast('Preferencias guardadas.','success');}catch(err){input.checked=!input.checked;toast(err.message,'error');}finally{prefInputs.forEach(x=>x.disabled=false);}}));
    $('#add-card').addEventListener('click',()=>toast('Los métodos de pago se simulan durante el proceso de pago. MudGo no almacena tarjetas.','info'));
  });
})();
