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

  function mapRemoteRequest(row) {
    const states = { esperando_proveedor: 'Pendiente', buscando_proveedor: 'Pendiente', aceptada: 'Aceptada', pagada: 'Aceptada', en_camino: 'Aceptada', en_curso: 'Aceptada', finalizada: 'Aceptada', cancelada: 'Rechazada' };
    const volume = { pequeno: 'Pequeña', mediano: 'Mediana', grande: 'Grande' };
    const vehicle = { van: 'Van', camion_pequeno: 'Camión pequeño', camion_mediano: 'Camión mediano', camion_grande: 'Camión grande' };
    return {
      id: String(row.id), cliente: row.cliente_nombre || 'Cliente', telefono: row.cliente_telefono || '',
      valor: Number(row.total || row.subtotal || 0), fecha: row.fecha_servicio, hora: String(row.hora_servicio || '').slice(0,5),
      origen: row.origen, destino: row.destino, carga: volume[row.tipo_carga] || row.tipo_carga,
      vehiculo: vehicle[row.tipo_vehiculo] || row.tipo_vehiculo, ayudantes: Number(row.ayudantes || 0),
      estado: states[row.estado] || 'Pendiente', estadoApi: row.estado, nueva: row.estado === 'esperando_proveedor'
    };
  }
  async function remoteProviderRequests() {
    if (!window.MudGoAPI) return providerRequests();
    const rows = await MudGoAPI.requests();
    return (Array.isArray(rows) ? rows : []).map(mapRemoteRequest);
  }

  /** Aceptar una solicitud: si es la del cliente real, actualiza su estado. */
  async function accept(id) {
    try {
      if (window.MudGoAPI) await MudGoAPI.decideRequest(id, 'aceptar');
      else {
        const r = request.get();
        if (r && r.id === id && ['esperando', 'buscando'].includes(r.estado)) { r.estado = 'aceptada'; r.proveedor = DATA.proveedor.id; request.save(r); }
        else setProvState(id, 'Aceptada');
      }
      toast('¡Solicitud aceptada! El cliente será notificado.', 'success');
      go('solicitud-aceptada.html?id=' + encodeURIComponent(id), 900);
    } catch (error) { toast(error.message || 'No se pudo aceptar la solicitud.', 'error'); }
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
      const finish = () => { closeModal('reject-modal'); toast('Solicitud rechazada. MudGo la asignará a otro proveedor.', 'warning'); after && after(); };
      if (window.MudGoAPI) {
        MudGoAPI.decideRequest(rejectId, 'rechazar').then(finish).catch(e => toast(e.message || 'No se pudo rechazar la solicitud.', 'error'));
      } else {
        const r = request.get();
        if (r && r.id === rejectId && ['esperando', 'buscando'].includes(r.estado)) { r.estado = 'rechazada'; r.intentos = (r.intentos || 0) + 1; request.save(r); }
        else setProvState(rejectId, 'Rechazada');
        finish();
      }
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
  page('p-dashboard', async () => {
    // Disponibilidad
    const sw = $('#avail');
    sw.disabled = true;
    const paintAvail = () => { $('#avail-label').textContent = sw.checked ? 'Disponible' : 'No disponible'; };
    sw.addEventListener('change', async () => { const desired=sw.checked; sw.disabled=true; try { await MudGoAPI.setProviderAvailability(desired); paintAvail(); toast(desired?'Ahora recibirás nuevas solicitudes':'No recibirás solicitudes nuevas',desired?'success':'warning'); } catch(e) { sw.checked=!desired; paintAvail(); toast(e.message,'error'); } finally { sw.disabled=false; } });

    let remote = [];
    try {
      const [user, rows, profile] = await Promise.all([MudGoAPI.me(), remoteProviderRequests(), MudGoAPI.providerProfile()]);
      remote = rows; sw.checked=!!Number(profile.disponible); sw.disabled=false; paintAvail();
      const name = user && user.nombre ? user.nombre : 'Proveedor';
      $('#provider-name').textContent = name.split(' ')[0];
      const statCards=$$('.stat'); if(statCards[2]){const v=statCards[2].querySelector('.stat__value');if(v)v.textContent=Number(profile.calificacion_promedio||0)>0?Number(profile.calificacion_promedio).toFixed(1):'—';const sub=statCards[2].querySelector('.stat__sub');if(sub)sub.textContent=Number(profile.total_calificaciones||0)+' reseñas';} if(statCards[3]){const v=statCards[3].querySelector('.stat__value');if(v)v.textContent=money(Number(profile.ingresos||0)*.9);}
    } catch (e) { toast(e.message || 'No se pudieron cargar los datos del proveedor.', 'error'); }
    const pend = remote.filter(s => s.estado === 'Pendiente');
    const today = new Date().toISOString().slice(0, 10);
    const thisMonth = today.slice(0, 7);
    $('#stat-today').textContent = remote.filter(s => String(s.fecha || '').slice(0, 10) === today).length;
    $('#stat-month').textContent = remote.filter(s => ['Aceptada'].includes(s.estado) && String(s.fecha || '').slice(0, 7) === thisMonth).length;
    $('#pend-count').textContent = pend.length + (pend.length === 1 ? ' nueva' : ' nuevas');
    $('#pend-list').innerHTML = pend.length
      ? pend.slice(0, 3).map(s => requestCard(s, true)).join('')
      : '<div class="card empty"><div class="empty__icon">📭</div>No tienes solicitudes pendientes.</div>';
    $$('[data-accept]').forEach(b => b.addEventListener('click', () => { setLoading(b, true); accept(b.dataset.accept); }));

    // No mostrar servicios de demostración: solo servicios asignados realmente a este proveedor.
    const active = remote.find(s => ['aceptada','pagada','en_camino','en_curso'].includes(s.estadoApi));
    const activeCard = $('#active-service');
    if (active) {
      activeCard.hidden = false;
      $('#active-client').textContent = active.cliente;
      $('#active-state').textContent = active.estadoApi==='aceptada'?'Esperando pago':active.estadoApi==='pagada'?'Pago recibido':active.estadoApi==='en_camino'?'En camino':'En curso';
      $('#active-bar').style.width = active.estadoApi==='aceptada'?'15%':active.estadoApi==='pagada'?'30%':active.estadoApi==='en_camino'?'50%':'70%';
      $('#active-link').href = 'servicio-proveedor.html?id=' + encodeURIComponent(active.id);
      $('#active-badge').outerHTML = badge(active.estadoApi==='aceptada'?'Esperando pago':active.estadoApi==='finalizada'?'Finalizado':'Servicio activo', active.estadoApi==='aceptada'?'orange':'blue', true);
    } else {
      activeCard.hidden = true;
    }
  });

  /* ================================================================== */
  /* P02 · Solicitudes                                                   */
  /* ================================================================== */
  page('p-solicitudes', async () => {
    let filter = params().get('filtro') || 'todas';
    const list = $('#req-list');
    function render() {
      const all = remote;
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
    let remote = [];
    try { remote = await remoteProviderRequests(); } catch (e) { toast(e.message || 'No se pudieron cargar las solicitudes.', 'error'); }
    render();
  });

  /* ================================================================== */
  /* P03 · Solicitud aceptada                                            */
  /* ================================================================== */
  page('p-aceptada', async () => {
    const id = params().get('id');
    if (!id || !window.MudGoAPI) { toast('No se pudo cargar la solicitud real.', 'error'); return; }
    try {
      const s = await MudGoAPI.getRequest(id);
      if (s.estado === 'aceptada' && Number(s.proveedor_id) !== Number(window.MG_USER && window.MG_USER.id)) {
        toast('Esta solicitud fue asignada a otro proveedor.', 'error'); return;
      }
      const volume = { pequeno: 'Pequeña', mediano: 'Mediana', grande: 'Grande' };
      const vehicle = { van: 'Van', camion_pequeno: 'Camión pequeño', camion_mediano: 'Camión mediano', camion_grande: 'Camión grande' };
      const date = s.fecha_servicio ? new Date(s.fecha_servicio + 'T12:00:00').toLocaleDateString('es-CO',{day:'2-digit',month:'short',year:'numeric'}) : '';
      const when = date + ' · ' + String(s.hora_servicio || '').slice(0,5);
      const client = s.cliente_nombre || 'Cliente';
      $('#pa-client').innerHTML = '<div class="row row--between"><div class="row"><span class="avatar avatar--lg">' + initials(client) + '</span><div><div class="strong">' + esc(client) + '</div><div class="small muted">' + esc(s.cliente_telefono || '') + '</div></div></div>' + badge('Cliente', 'green', true) + '</div>';
      $('#pa-route').innerHTML = '<div class="route route--box"><div class="route__stop"><div class="route__label">Origen</div><div class="route__value">' + esc(s.origen) + '</div></div><div class="route__stop route__stop--end"><div class="route__label">Destino</div><div class="route__value">' + esc(s.destino) + '</div></div></div>';
      $('#pa-details').innerHTML = '<dl class="kv">' + [['Fecha y hora',when],['Tipo de carga',volume[s.tipo_carga]||s.tipo_carga],['Vehículo',vehicle[s.tipo_vehiculo]||s.tipo_vehiculo],['Personal',Number(s.ayudantes||0)+' ayudantes']].map(([k,v])=>'<div class="kv__row"><dt class="kv__key">'+k+'</dt><dd class="kv__val">'+esc(String(v))+'</dd></div>').join('') + '</dl>';
      $('#pa-value').textContent = money(s.total || s.subtotal || 0);
      $('#pa-detail').href = 'servicio-proveedor.html?id=' + encodeURIComponent(s.id);
      const paid = ['pagada','en_camino','en_curso','finalizada'].includes(s.estado);
      const steps = $('#pa-steps');
      steps.innerHTML = '<div class="step is-done"><div class="step__dot">'+icon('check')+'</div><span class="step__label">Aceptada</span></div><div class="step-line is-done"></div><div class="step '+(paid?'is-done':'is-current')+'"><div class="step__dot">'+(paid?icon('check'):'2')+'</div><span class="step__label">Pago cliente</span></div><div class="step-line '+(paid?'is-done':'')+'"></div><div class="step '+(paid?'is-current':'')+'"><div class="step__dot">3</div><span class="step__label">Confirmado</span></div>';
      $('#pa-msg').innerHTML = paid ? icon('checkCircle')+'<span>El cliente completó el pago.</span>' : icon('clock')+'<span>En espera de que el cliente complete el pago para confirmar el servicio.</span>';
      $('#pa-msg').className = 'notice mt-16 ' + (paid?'notice--green':'notice--blue');
    } catch (e) { toast(e.message || 'No se pudo cargar la solicitud.', 'error'); }
  });

  /* ================================================================== */
  /* P04 · Servicio (confirmado → activo → finalizado)                   */
  /* ================================================================== */
  page('p-servicio', async () => {
    const id=params().get('id'); if(!id){toast('Falta el identificador del servicio.','error');return;}
    let s; try{s=await MudGoAPI.getRequest(id);}catch(e){toast(e.message,'error');return;}
    if(Number(s.proveedor_id)!==Number(window.MG_USER&&window.MG_USER.id)){toast('Este servicio no está asignado a tu cuenta.','error');return;}
    const status=s.estado; const map={aceptada:'confirmado',pagada:'confirmado',en_camino:'activo',en_curso:'activo',finalizada:'finalizado'};
    let estado=map[status]||'confirmado'; let notPaid=status==='aceptada';
    const date=s.fecha_servicio?new Date(s.fecha_servicio+'T12:00:00'):new Date();
    const dateTxt=date.toLocaleDateString('es-CO',{day:'2-digit',month:'short',year:'numeric'});
    const vehicle=s.vehiculo_modelo||s.tipo_vehiculo||'Por asignar';
    const value=Number(s.total||s.subtotal||0);
    $('#sv-title').textContent='Servicio #'+s.id; $('#sv-when').textContent=dateTxt+' · '+String(s.hora_servicio||'').slice(0,5);
    $('#sv-client').innerHTML='<div class="row"><span class="avatar avatar--lg">'+initials(s.cliente_nombre||'Cliente')+'</span><div><div class="strong">'+esc(s.cliente_nombre||'Cliente')+'</div><div class="small muted">'+esc(s.cliente_telefono||'')+'</div></div></div>'+(s.cliente_telefono?'<a class="icon-btn" href="tel:'+esc(s.cliente_telefono)+'">'+icon('phone')+'</a>':'');
    $('#sv-route').innerHTML='<div class="route route--box route--hollow"><div class="route__stop"><div class="route__label">Origen</div><div class="route__value">'+esc(s.origen)+'</div></div><div class="route__stop route__stop--end"><div class="route__label">Destino</div><div class="route__value">'+esc(s.destino)+'</div></div></div>';
    $('#sv-details').innerHTML='<dl class="kv">'+[['Fecha y hora',dateTxt+' · '+String(s.hora_servicio||'').slice(0,5)],['Vehículo',vehicle],['Personal',Number(s.ayudantes||0)+' ayudantes']].map(([k,v])=>'<div class="kv__row"><dt class="kv__key">'+k+'</dt><dd class="kv__val">'+esc(String(v))+'</dd></div>').join('')+'</dl>';
    $('#sv-value').textContent=money(value); $('#sv-fee').textContent=money(-Math.round(value*.1)); $('#sv-earn').textContent=money(value-Math.round(value*.1));
    const btn=$('#sv-action');
    function paint(){const idx=estado==='confirmado'?1:estado==='activo'?2:3;$$('[data-sv-badge]').forEach(b=>b.outerHTML='<span data-sv-badge>'+badge(notPaid?'Esperando pago':estado==='confirmado'?'Confirmado':estado==='activo'?'En curso':'Finalizado',notPaid?'orange':estado==='finalizado'?'green':'blue',true)+'</span>');$$('#sv-steps .step').forEach((st,i)=>{st.classList.toggle('is-done',i+1<idx||estado==='finalizado');st.classList.toggle('is-current',i+1===idx&&estado!=='finalizado');st.querySelector('.step__dot').innerHTML=(i+1<idx||estado==='finalizado')?icon('check'):String(i+1);});$('#sv-msg').textContent=notPaid?'El cliente aún no ha pagado.':estado==='confirmado'?'El pago fue recibido. El servicio está listo para iniciar.':estado==='activo'?'Servicio en curso.':'Servicio finalizado.';btn.disabled=notPaid;btn.innerHTML=notPaid?'Esperando pago del cliente':estado==='confirmado'?'Iniciar servicio '+icon('arrowRight'):estado==='activo'?'Marcar llegada al destino '+icon('flag'):'Volver al inicio';$('#sv-flow').innerHTML=MG.flowBar({label:notPaid?'Esperando pago':estado==='finalizado'?'Servicio finalizado':estado==='activo'?'Servicio en proceso':'Servicio confirmado',id:s.id,current:notPaid?3:estado==='finalizado'?5:4,tone:estado==='finalizado'?'green':'blue'});}
    paint(); btn.addEventListener('click',async()=>{if(estado==='finalizado'){go('dashboard-proveedor.html');return;}const next=estado==='confirmado'?'en_curso':'finalizada';setLoading(btn,true);try{await MudGoAPI.updateRequestStatus(id,next);s=await MudGoAPI.getRequest(id);estado=next==='en_curso'?'activo':'finalizado';notPaid=false;toast(next==='en_curso'?'Servicio iniciado.':'Servicio finalizado.','success');paint();}catch(e){toast(e.message||'No se pudo actualizar el servicio.','error');}finally{setLoading(btn,false);}});
  });

  /* ================================================================== */
  /* P05 · Vehículos                                                     */
  /* ================================================================== */
  page('p-vehiculos', async () => {
    let list=[]; const root=$('#veh-list');
    async function load(){list=await MudGoAPI.vehicles();render();}
    function render(){ $('#veh-count').textContent=list.length+(list.length===1?' vehículo registrado':' vehículos registrados');root.innerHTML=list.map((v,i)=>'<article class="card"><div class="row row--between"><div><div class="strong">'+esc(v.modelo)+'</div><div class="small muted">'+esc(v.placa)+' · '+esc(v.tipo)+' · '+esc(v.capacidad)+'</div></div><label class="switch"><span class="small muted">Disponible</span><input type="checkbox" data-toggle="'+i+'"'+(Number(v.disponible)?' checked':'')+'><span class="switch__track"></span></label><button class="btn btn--ghost btn--sm" data-remove="'+i+'">'+icon('trash')+'</button></div></article>').join('')||'<div class="card empty">Aún no tienes vehículos registrados.</div>';}
    try{await load();}catch(e){toast(e.message,'error');}
    root.addEventListener('change',async e=>{
      const t=e.target.closest('[data-toggle]');
      if(!t)return;
      const v=list[+t.dataset.toggle];
      if(!v)return;
      const previous=!!Number(v.disponible);
      const desired=t.checked;
      const label=t.closest('.switch')?.querySelector('.small');
      // Actualización optimista: no reconstruir la tarjeta mientras el servidor responde.
      // Así el thumb conserva su transición CSS y no se corta la animación.
      v.disponible=desired?1:0;
      if(label)label.textContent=desired?'Disponible':'No disponible';
      t.disabled=true;
      t.closest('.switch')?.classList.add('is-saving');
      try{
        await MudGoAPI.updateVehicle(v.id,{disponible:desired});
        toast(desired?'Vehículo disponible.':'Vehículo no disponible.','success');
      }catch(err){
        v.disponible=previous?1:0;
        t.checked=previous;
        if(label)label.textContent=previous?'Disponible':'No disponible';
        toast(err.message||'No se pudo actualizar el vehículo.','error');
      }finally{
        t.disabled=false;
        t.closest('.switch')?.classList.remove('is-saving');
      }
    });
    root.addEventListener('click',async e=>{const b=e.target.closest('[data-remove]');if(!b)return;const v=list[+b.dataset.remove];if(!confirm('¿Eliminar '+v.modelo+' ('+v.placa+')?'))return;try{await MudGoAPI.deleteVehicle(v.id);await load();toast('Vehículo eliminado.','success');}catch(err){toast(err.message,'error');}});
    const form=$('#veh-form'),plate=form.elements.placa;plate.addEventListener('input',()=>{plate.value=plate.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6).replace(/^([A-Z]{3})(\d)/,'$1-$2');});
    form.addEventListener('submit',async e=>{e.preventDefault();const data={modelo:form.elements.modelo.value.trim(),placa:plate.value,tipo:form.elements.tipo.value,capacidad:String(form.elements.capacidad.value)+' toneladas',disponible:true};try{await MudGoAPI.createVehicle(data);await load();form.reset();closeModal('veh-modal');toast('Vehículo registrado en la base de datos.','success');}catch(err){toast(err.message,'error');}});
  });

  /* ================================================================== */
  /* P06 · Historial                                                     */
  /* ================================================================== */
  page('p-historial', async () => {
    try{const rows=await MudGoAPI.requests();const done=rows.filter(r=>r.estado==='finalizada');const total=done.reduce((a,r)=>a+Number(r.total||0)*.9,0);$('#ph-earn').textContent=money(total);$('#ph-count').textContent=done.length;$('#ph-body').innerHTML=done.map(r=>'<tr><td>#'+r.id+'</td><td>'+esc(r.cliente_nombre||'Cliente')+'</td><td>'+esc(r.origen)+' → '+esc(r.destino)+'</td><td>'+dateMed(r.fecha_servicio)+'</td><td>'+badge('Finalizado','green')+'</td><td>'+money(Number(r.total||0)*.9)+'</td></tr>').join('')||'<tr><td colspan="6">Aún no tienes servicios finalizados.</td></tr>';}catch(e){toast(e.message,'error');}
  });

  /* ================================================================== */
  /* P07 · Perfil                                                        */
  /* ================================================================== */
  page('p-perfil', async () => {
    $$('.menu-item').forEach(item=>{const btn=$('.list-row',item);btn.addEventListener('click',()=>{const open=item.classList.toggle('is-open');btn.setAttribute('aria-expanded',open);$('.menu-panel',item).classList.toggle('hidden',!open);});});
    try {
      const [p,v,rows,docs]=await Promise.all([MudGoAPI.profile(),MudGoAPI.vehicles(),MudGoAPI.requests(),MudGoAPI.providerDocuments()]);
      $('#pp-veh').textContent=v.length+(v.length===1?' vehículo registrado':' vehículos registrados');
      const name=p.nombre||'Proveedor';$('#pp-name').textContent=name;$('#pp-email').textContent=p.correo||'';$('#pp-avatar').textContent=initials(name);
      $('#pp-rating').textContent='—';$('#pp-rating-count').textContent='0';
      const completed=rows.filter(x=>x.estado==='finalizada');$('#pp-month-count').textContent=completed.filter(x=>String(x.updated_at||'').slice(0,7)===new Date().toISOString().slice(0,7)).length;
      $('#pp-income').textContent=money(completed.reduce((sum,x)=>sum+Number(x.total||0)*.9,0));
      $('#pp-since').textContent=p.created_at?new Date(p.created_at).toLocaleDateString('es-CO',{year:'numeric',month:'short'}):'—';
      $('#pp-nombre').value=p.nombre||'';$('#pp-correo').value=p.correo||'';$('#pp-tel').value=p.telefono||'';
      const f=document.querySelector('form[data-save="Datos personales actualizados"]');
      f.addEventListener('submit',async e=>{e.preventDefault();const data={nombre:$('#pp-nombre').value.trim(),correo:$('#pp-correo').value.trim(),telefono:$('#pp-tel').value.trim()};if(data.nombre.length<3||!/^\S+@\S+\.\S+$/.test(data.correo))return toast('Revisa el nombre y el correo.','error');const b=f.querySelector('button[type="submit"]');b.disabled=true;try{await MudGoAPI.updateProfile(data);const fresh=await MudGoAPI.profile();$('#pp-name').textContent=fresh.nombre;$('#pp-email').textContent=fresh.correo;$('#pp-avatar').textContent=initials(fresh.nombre);toast('Datos personales guardados.','success');}catch(err){toast(err.message,'error');}finally{b.disabled=false;}});
      const passForm=document.querySelector('form[data-save="Contraseña actualizada"]');
      passForm.addEventListener('submit',async e=>{e.preventDefault();const actual=$('#pp-actual').value,nueva=$('#pp-nueva').value,confirmar=$('#pp-conf').value;if(!actual)return toast('Escribe tu contraseña actual.','error');if(nueva.length<8||!/[A-Za-z]/.test(nueva)||!/[0-9]/.test(nueva))return toast('La contraseña debe tener al menos 8 caracteres e incluir letras y números.','error');if(nueva!==confirmar)return toast('Las contraseñas no coinciden.','error');const b=passForm.querySelector('button[type="submit"]');b.disabled=true;try{await MudGoAPI.changePassword({actual,nueva,confirmar});passForm.reset();toast('Contraseña actualizada correctamente.','success');}catch(err){toast(err.message,'error');}finally{b.disabled=false;}});
      const docLabels={cedula:'Cédula de ciudadanía',licencia:'Licencia de conducción',soat:'SOAT'};
      const paintDocs=()=>{$$('[data-upload]').forEach(input=>{const type=input.dataset.upload;const doc=docs.find(x=>x.tipo===type);const badge=input.closest('.reason').querySelector('.badge');if(badge){badge.textContent=doc?(doc.estado==='pendiente'?'En revisión':doc.estado==='aprobado'?'Aprobado':'Requiere corrección'):'Sin registrar';badge.className='badge '+(doc?.estado==='aprobado'?'badge--green':doc?'badge--blue':'badge--gray');}});};
      paintDocs();
      $$('[data-upload]').forEach(input=>input.addEventListener('change',async()=>{const file=input.files?.[0];if(!file)return;if(file.size>5*1024*1024){toast('El archivo supera 5 MB.','error');input.value='';return;}const type=input.dataset.upload;input.disabled=true;try{await MudGoAPI.uploadProviderDocument(type,file);const refreshed=await MudGoAPI.providerDocuments();docs.splice(0,docs.length,...refreshed);paintDocs();toast(docLabels[type]+' recibido para revisión.','success');}catch(err){toast(err.message,'error');}finally{input.disabled=false;input.value='';}}));
    } catch(e){toast(e.message||'No se pudo cargar el perfil.','error');}
  });
})();
