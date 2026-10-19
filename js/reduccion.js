/* ============================================
 * REDUCCIÓN SECUNDARIA · Lógica de la página
 * Archivo de lógica: js/reduccion.js
 * Secciones de la lógica conservan el flujo de la página.
 * ============================================ */

  cargarBarMenu(true);
  document.body.classList.add('reduccion-step1-mode');
  document.body.classList.add('anfo-step1-mode');
  document.body.classList.remove('rs-flow-mode');
  const menuReduccion=document.querySelector('#dropdownMenu ul');
  if(menuReduccion&&!document.getElementById('menuIngresoDatosReduccion')){
    const item=document.createElement('li');
    const enlace=document.createElement('a');
    enlace.id='menuIngresoDatosReduccion';enlace.href='#';enlace.textContent='⚙️ Ingreso / Editar Datos';
    enlace.addEventListener('click',evento=>{evento.preventDefault();document.getElementById('dropdownMenu').classList.remove('show');abrirDatosModal()});
    item.appendChild(enlace);menuReduccion.insertBefore(item,menuReduccion.children[1]||null);
  }
  if(menuReduccion&&!document.getElementById('menuExportarExcelReduccion')){
    const item=document.createElement('li'),enlace=document.createElement('a');
    enlace.id='menuExportarExcelReduccion';enlace.href='#';enlace.textContent='⬇ Descargar Excel';
    enlace.addEventListener('click',evento=>{evento.preventDefault();document.getElementById('dropdownMenu').classList.remove('show');descargarExcel()});
    item.appendChild(enlace);menuReduccion.appendChild(item);
  }
  if(menuReduccion&&!document.getElementById('menuDatosPlanillaReduccion')){
    const item=document.createElement('li'),enlace=document.createElement('a');
    enlace.id='menuDatosPlanillaReduccion';enlace.href='#';enlace.textContent='📋 Datos faltantes de planilla';
    enlace.addEventListener('click',evento=>{evento.preventDefault();document.getElementById('dropdownMenu').classList.remove('show');abrirAsistentePlanilla('planilla')});
    item.appendChild(enlace);menuReduccion.appendChild(item);
  }
  if(menuReduccion&&!document.getElementById('menuInformeReduccion')){
    const item=document.createElement('li'),enlace=document.createElement('a');
    enlace.id='menuInformeReduccion';enlace.href='#';enlace.textContent='📄 Ver informe técnico';
    enlace.addEventListener('click',evento=>{evento.preventDefault();document.getElementById('dropdownMenu').classList.remove('show');informe()});
    item.appendChild(enlace);menuReduccion.appendChild(item);
  }
  document.querySelectorAll('[data-turno-reduccion]').forEach(boton=>boton.addEventListener('click',()=>{
    $('fTurno').value=boton.dataset.turnoReduccion;
    $('fTurno').dispatchEvent(new Event('change',{bubbles:true}));
  }));
  document.getElementById('fTurno').addEventListener('change',()=>{P().turno=$('fTurno').value;actualizarPersonalPorTurno(P());save();sincronizarTurnoRS();render()});
  function sincronizarTurnoRS(){
    document.querySelectorAll('[data-turno-reduccion]').forEach(boton=>{
      const activo=boton.dataset.turnoReduccion===$('fTurno').value;
      boton.classList.toggle('activo',activo);boton.setAttribute('aria-pressed',activo?'true':'false');
    });
  }

  /* ============ Datos / listas (de tu Excel) ============ */
  // KEY identifica el borrador guardado; LISTAS y F contienen las opciones y campos de cada colpa.
  const KEY='rs_planillas_v1';
  const LISTAS={
    ini:['Colpa en Visera','Colpa en Piso','Colgada'],
    fin:['Colpa en Visera','Colpa en Piso','Colgada','Reducida','Sin Información','Avocada'],
    expl:['APD 100','APD 225','APD 450','APD 900','APD 1500','APD 2250','Senatel Powerex 1x6','Fameplast','Riodin 7/8x8'],
    tag:['OK','F/S','Sin Información'],
    efic:['0%','25%','50%','75%','100%'],
    cumple:['SI','NO'],
    ids:[].concat(...'ABCDEFGHIJ'.split('').map(l=>Array.from({length:10},(_,i)=>l+'.'+(i+1))))
  };
  const F=[
    {k:'id',l:'ID',t:'select',o:LISTAS.ids},
    {k:'punto',l:'PUNTO',t:'text',ph:'Ej. Z50 fw'},
    {k:'ini',l:'SITUACIÓN INICIAL',t:'chips',o:LISTAS.ini},
    {k:'fin',l:'SITUACIÓN FINAL',t:'chips',o:LISTAS.fin},
    {k:'ancho',l:'ANCHO [M]',t:'num'},
    {k:'alto',l:'ALTO [M]',t:'num'},
    {k:'largo',l:'LARGO [M]',t:'num'},
    {k:'cperf',l:'CANT. PERF.',t:'num',step:1},
    {k:'lperf',l:'LONG. PERF. [M]',t:'num'},
    {k:'cart',l:'CANT. CARTUCHOS o APD',t:'num',step:1},
    {k:'expl',l:'EXPLOSIVO (TIPO)',t:'select',o:LISTAS.expl},
    {k:'tpre',l:'TAG PRE',t:'chips',o:LISTAS.tag},
    {k:'tpost',l:'TAG POST',t:'chips',o:LISTAS.tag},
    {k:'dist',l:'DIST. PROYEC. FRAGM. [M]',t:'num'},
    {k:'efic',l:'EFICIENCIA [%]',t:'chips',o:LISTAS.efic},
    {k:'cumple',l:'¿CUMPLE LA RECOMENDACIÓN?',t:'chips',o:LISTAS.cumple}
  ];

  /* ============ Estado ============ */
  // S es el estado completo; P() y C() obtienen la planilla y calle activas; V indica la vista visible.
  const uid=()=>Math.random().toString(36).slice(2,9);
  const hoy=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
  const nuevaPl=()=>({id:uid(),fecha:hoy(),turno:'A',sector:'Esmeralda',grupo:'1',mina:'Esmeralda',nivel:'NP',bloque:'Ext Fw',idTronadura:'',fase:'',numZanja:'',calleZanja:'',calleUcl:'',paradas:'',detallePanel2:'',encJEJ:'',supervisorJeJ:'',supervisorDet:[''],encDET:[''],encDETActivo:'',calles:[],calleAct:null});
  let S; try{S=JSON.parse(localStorage.getItem(KEY)||'null')}catch(e){S=null}
  if(!S||!S.pl||!S.pl.length){S={pl:[nuevaPl()],act:null};S.act=S.pl[0].id}
  const P=()=>S.pl.find(p=>p.id===S.act)||S.pl[0];
  const C=()=>P().calles.find(c=>c.id===P().calleAct);
  const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};
  const esc=s=>String(s??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
  const $=id=>document.getElementById(id);
  const num=v=>parseFloat(String(v).replace(',','.'))||0;
  const fm=n=>(Math.round(n*100)/100).toString().replace('.',',');
  const vol=c=>num(c.ancho)*num(c.alto)*num(c.largo);
  const dmy=f=>f?f.split('-').reverse().join('-'):'';
  const toast=m=>{const t=$('toast');t.textContent=m;t.style.display='block';setTimeout(()=>t.style.display='none',2200)};
  const cerrar=id=>$(id).style.display='none';
  const totQ=c=>{const t=c.colpas.length;return Math.max(0,t-(num(c.i2)+num(c.i3)+num(c.i4)))};

  let V=1;
  function ir(n){
    if((n===4||n===5||n===6||n===7||n===8)&&!C()){toast('Seleccione o cree una calle');return}
    V=n;render();window.scrollTo(0,0);
  }

  /* ============ Render general ============ */
  function render(){
    document.body.classList.toggle('reduccion-step1-mode',V<=2);
    document.body.classList.toggle('anfo-step1-mode',V===1);
    document.body.classList.toggle('rs-flow-mode',V===3||V===4||V===6);
    document.body.classList.toggle('rs-capture-mode',V===5);
    document.body.classList.toggle('rs-planilla-mode',V===7&&G?.tipo==='planilla');
    document.body.classList.toggle('rs-resumen-final-mode',V===8);
    ['v1','v2','v3','v4','v5','v6','v7','v8'].forEach((id,i)=>$(id).hidden=V!==i+1);
    if(V===1){
      const p=P();$('fFecha').value=p.fecha;$('fTurno').value=p.turno;
      if(completarPersonalPlanilla(p)||actualizarPersonalPorTurno(p))save();
      sincronizarTurnoRS();
      const personal=[
        ['Encargado Seguimiento JeJ',localStorage.getItem('jej_usuario_activo')||p.encJEJ||'',false],
        ['Supervisor JeJ',p.supervisorJeJ||'',false],
        ...(p.supervisorDet||[]).filter(Boolean).map(nombre=>['Supervisor(es) DET',nombre,true]),
        ...((p.encDETActivo||((p.encDET||[]).filter(Boolean)[0]))?[['Responsable(s) Carguío DET',p.encDETActivo||p.encDET.filter(Boolean)[0],true]]:[])
      ].filter(([,nombre])=>nombre);
      const completos=personal.length>=4&&Boolean(p.sector)&&Boolean(p.grupo);
      $('estadoPersonalRS').textContent=completos?'✓ Completo':'Datos pendientes';
      $('estadoPersonalRS').classList.toggle('incompleto',!completos);
      $('infoDatos').innerHTML=personal.length?personal.map(([rol,nombre,det])=>{
        const iniciales=String(nombre).trim().split(/\s+/).slice(0,2).map(parte=>parte[0]||'').join('').toUpperCase();
        return '<div class="anfo-persona"><span class="anfo-avatar'+(det?' det':'')+'">'+esc(iniciales||'—')+'</span><div><small>'+esc(rol)+'</small><strong>'+esc(nombre)+'</strong></div></div>';
      }).join(''):'<p>Complete los datos de planilla y personal desde el menú ☰.</p>';
    }
    if(V===2)renderizarConfiguracionPostura();
    if(V===3){
      const p=P();
      $('rsTurnoZanja').textContent=(p.turno||'A')+' · '+dmy(p.fecha);
      $('rsIdTronaduraZanja').textContent=p.idTronadura||'Sin asignar';
      RSZanjaSeleccionada=p.calles.some(c=>c.id===p.calleAct)?p.calleAct:(p.calles[0]?.id||null);
      renderListaZanjasRS();
    }
    if(V===4)renderizarListaColpasRegistradas();
    if(V===5)renderizarAsistenteColpa();
    if(V===6){$('t3').textContent='Zanja '+C().id;$('rsPasoZanja').textContent=C().id;$('rsConteoColpas').textContent=C().colpas.length;renderLista();}
    if(V===7)renderizarAsistentePlanilla();
    if(V===8)renderizarResumenFinalRS();
  }

  let RSConfig=null;
  let RSZanjaSeleccionada=null;
  const minasRS=['andesita','Diablo Regimiento','Diamante','Esmeralda','NNM','Pacífico Superior','Pilar Norte','Reservas Norte','TT8'];
  const nivelesRS=['NP','UCL','Panel2'];
  const configurarPosturaAlCambiar=()=>{if(!RSConfig)RSConfig={...P()};actualizarVistaNivelRS();actualizarIdPosturaRS()};
  document.querySelectorAll('[data-rs-mina]').forEach(boton=>boton.addEventListener('click',()=>{configurarPosturaAlCambiar();RSConfig.mina=boton.dataset.rsMina;sincronizarSeleccionPosturaRS();actualizarIdPosturaRS()}));
  document.querySelectorAll('[data-rs-nivel]').forEach(boton=>boton.addEventListener('click',()=>{configurarPosturaAlCambiar();RSConfig.nivel=boton.dataset.rsNivel;sincronizarSeleccionPosturaRS();actualizarVistaNivelRS();actualizarIdPosturaRS()}));
  document.querySelectorAll('[data-rs-bloque]').forEach(boton=>boton.addEventListener('click',()=>{configurarPosturaAlCambiar();RSConfig.bloque=boton.dataset.rsBloque;sincronizarSeleccionPosturaRS()}));
  [['rsNumZanja','numZanja'],['rsCalleZanja','calleZanja'],['rsCalleUcl','calleUcl'],['rsParadas','paradas'],['rsDetallePanel2','detallePanel2'],['rsFase','fase']].forEach(([id,key])=>$(id).addEventListener('input',()=>{configurarPosturaAlCambiar();RSConfig[key]=$(id).value;actualizarIdPosturaRS()}));
  function sincronizarSeleccionPosturaRS(){
    document.querySelectorAll('[data-rs-mina]').forEach(b=>{const a=b.dataset.rsMina===RSConfig.mina;b.classList.toggle('sel',a);b.setAttribute('aria-pressed',a?'true':'false')});
    document.querySelectorAll('[data-rs-nivel]').forEach(b=>{const a=b.dataset.rsNivel===RSConfig.nivel;b.classList.toggle('sel',a);b.setAttribute('aria-pressed',a?'true':'false')});
    document.querySelectorAll('[data-rs-bloque]').forEach(b=>{const a=b.dataset.rsBloque===RSConfig.bloque;b.classList.toggle('sel',a);b.setAttribute('aria-pressed',a?'true':'false')});
  }
  function actualizarVistaNivelRS(){document.querySelectorAll('[data-rs-fields]').forEach(el=>{el.hidden=el.dataset.rsFields!==RSConfig.nivel})}
  function idPosturaRS(d){
    const fase=d.fase?(String(d.fase).toLowerCase().startsWith('fase')?d.fase:'Fase '+d.fase):'';
    const z=d.numZanja?(String(d.numZanja).toUpperCase().startsWith('Z')?d.numZanja:'Z'+d.numZanja):'';
    return d.nivel==='NP'?[z,d.calleZanja,fase].filter(Boolean).join(' '):d.nivel==='UCL'?[d.calleUcl,'UCL',fase].filter(Boolean).join(' '):[d.detallePanel2,fase].filter(Boolean).join(' ');
  }
  function actualizarIdPosturaRS(){if(RSConfig)$('rsIdTronadura').value=idPosturaRS(RSConfig)}
  function renderizarConfiguracionPostura(){
    const p=P(),c=C();RSConfig={...p,...(c?Object.fromEntries(['mina','nivel','bloque','fase','numZanja','calleZanja','calleUcl','paradas','detallePanel2','idTronadura'].filter(k=>c[k]!==undefined).map(k=>[k,c[k]])): {})};
    [['rsNumZanja','numZanja'],['rsCalleZanja','calleZanja'],['rsCalleUcl','calleUcl'],['rsParadas','paradas'],['rsDetallePanel2','detallePanel2'],['rsFase','fase']].forEach(([id,key])=>{$(id).value=RSConfig[key]||''});
    sincronizarSeleccionPosturaRS();actualizarVistaNivelRS();actualizarIdPosturaRS();
  }
  function guardarConfiguracionPostura(){
    const p=P();if(!RSConfig)renderizarConfiguracionPostura();
    Object.assign(p,{mina:RSConfig.mina,nivel:RSConfig.nivel,bloque:RSConfig.bloque,fase:RSConfig.fase,numZanja:RSConfig.numZanja,calleZanja:RSConfig.calleZanja,calleUcl:RSConfig.calleUcl,paradas:RSConfig.paradas,detallePanel2:RSConfig.detallePanel2,idTronadura:idPosturaRS(RSConfig)});
    const c=C();if(c)Object.assign(c,{mina:p.mina,nivel:p.nivel,bloque:p.bloque,fase:p.fase,numZanja:p.numZanja,calleZanja:p.calleZanja,calleUcl:p.calleUcl,paradas:p.paradas,detallePanel2:p.detallePanel2,idTronadura:p.idTronadura});
    save();ir(3);toast('Configuración guardada');
  }

  function sugerenciaZanjaRS(){
    const numeros=P().calles.map(c=>Number(String(c.id).match(/\d+/)?.[0])).filter(Number.isFinite);
    return 'ZANJA '+((numeros.length?Math.max(...numeros):0)+1);
  }
  function renderListaZanjasRS(){
    const p=P(),lista=$('listaZanjasRS');
    $('sugerenciaZanjaRS').textContent=sugerenciaZanjaRS();
    $('conteoZanjasRS').textContent=p.calles.length;
    lista.innerHTML=p.calles.length?p.calles.map(c=>{
      const elegida=c.id===RSZanjaSeleccionada;
      return '<div class="anfo-trabajo-fila"><button type="button" class="anfo-trabajo-seleccion" data-rs-seleccionar-zanja="'+esc(c.id)+'" aria-pressed="'+(elegida?'true':'false')+'"><span class="anfo-trabajo-radio"></span><span class="anfo-trabajo-detalle"><strong>Zanja '+esc(c.id)+'</strong><small>'+c.colpas.length+' colpa(s) registradas</small></span><span class="anfo-trabajo-estado'+(c.colpas.length?'':' sin-tiros')+'">'+(c.colpas.length?'En curso':'Nueva')+'</span></button><button type="button" class="anfo-btn-eliminar-trabajo" data-rs-eliminar-zanja="'+esc(c.id)+'" aria-label="Eliminar zanja '+esc(c.id)+'" title="Eliminar">🗑</button></div>';
    }).join(''):'<p class="anfo-sin-trabajos">Aún no hay zanjas creadas.</p>';
    lista.querySelectorAll('[data-rs-seleccionar-zanja]').forEach(b=>b.addEventListener('click',()=>{RSZanjaSeleccionada=b.dataset.rsSeleccionarZanja;renderListaZanjasRS()}));
    lista.querySelectorAll('[data-rs-eliminar-zanja]').forEach(b=>b.addEventListener('click',()=>eliminarZanjaRS(b.dataset.rsEliminarZanja)));
  }
  function renderizarListaColpasRegistradas(filtro=''){
    const c=C(),query=String(filtro).trim().toLocaleLowerCase();
    $('rsPasoZanjaLista').textContent=c.id;
    $('rsConteoColpasLista').textContent=c.colpas.length;
    $('rsSugerenciaNuevaZanja').textContent=sugerenciaZanjaRS();
    const filas=c.colpas.map((colpa,i)=>({colpa,i})).filter(({colpa})=>!query||[colpa.id,colpa.punto].some(valor=>String(valor||'').toLocaleLowerCase().includes(query)));
    const lista=$('rsListaRegistrada');
    lista.innerHTML=(filas.map(({colpa,i})=>`<article class="rs-colpa-fila"><button type="button" data-rs-editar-colpa="${i}" aria-label="Editar colpa ${esc(colpa.id||i+1)}"><span class="rs-colpa-radio"></span><span><strong>Colpa ${esc(colpa.id||i+1)}</strong><small>${esc(colpa.punto||'Sin punto')} · ${esc(colpa.fin||'Pendiente')} · ${num(colpa.cart)} cart.</small></span><b>${colpa.fin==='Reducida'?'Reducida':'En curso'}</b></button><button type="button" class="rs-colpa-eliminar" data-rs-eliminar-colpa="${i}" aria-label="Eliminar colpa ${esc(colpa.id||i+1)}">▤</button></article>`).join('')||(!c.colpas.length?'<p class="rs-lista-vacia">Aún no hay colpas registradas.</p>':''))+(!query?`<button type="button" class="rs-colpa-pendiente" data-rs-nueva-colpa><strong>${c.colpas.length+1}</strong><span>Pendiente · tocar para capturar</span></button>`:'');
    lista.querySelectorAll('[data-rs-editar-colpa]').forEach(b=>b.addEventListener('click',()=>editarColpa(Number(b.dataset.rsEditarColpa))));
    lista.querySelectorAll('[data-rs-eliminar-colpa]').forEach(b=>b.addEventListener('click',()=>elimColpa(Number(b.dataset.rsEliminarColpa))));
    lista.querySelector('[data-rs-nueva-colpa]')?.addEventListener('click',nuevaColpa);
    $('rsBuscarColpa').oninput=evento=>renderizarListaColpasRegistradas(evento.target.value);
  }
  function eliminarZanjaRS(id){
    if(!confirm('¿Eliminar la zanja '+id+' y sus colpas?'))return;
    const p=P();p.calles=p.calles.filter(c=>c.id!==id);
    if(p.calleAct===id)p.calleAct=null;
    RSZanjaSeleccionada=p.calles[0]?.id||null;save();renderListaZanjasRS();
  }

  /* ============ Asistente dato por dato (datos y planilla) ============ */
  // G conserva los datos temporales del asistente de planilla hasta Guardar; la captura de colpas usa W.
  const horaAhora=()=>{const n=new Date();return String(n.getHours()).padStart(2,'0')+':'+String(n.getMinutes()).padStart(2,'0')};
  let G=null;
  const UB='🏔️ Ubicación y Postura', HO='⏱️ Horarios de la Calle', IN='📊 Indicadores por Calle';
  const infoInd=d=>{const t=C().colpas.length;return `1. Puntos total que necesitan RS: <b>${t}</b><br>5. Puntos quemados total en calle: <b>${Math.max(0,t-(num(d.i2)+num(d.i3)+num(d.i4)))}</b>`};
  const crearPerdidasRS=perdidas=>({
    carguio:{activo:Boolean(perdidas?.carguio?.activo),motivo:perdidas?.carguio?.motivo||'',otro:perdidas?.carguio?.otro||'',minutos:num(perdidas?.carguio?.minutos)},
    quemada:{activo:Boolean(perdidas?.quemada?.activo),motivo:perdidas?.quemada?.motivo||'',otro:perdidas?.quemada?.otro||'',minutos:num(perdidas?.quemada?.minutos)}
  });
  function crearDefinicionAsistentePlanilla(){
    const c=C();
    const minas=['andesita','Diablo Regimiento','Diamante','Esmeralda','NNM','Pacífico Superior','Pilar Norte','Reservas Norte','TT8'];
    const niveles=[{v:'NP',t:'NP (Nivel de Producción)'},{v:'UCL',t:'UCL (Nivel UCL)'},{v:'Panel2',t:'Panel 2'}];
    const bloques=['B-2','B-6','Ext Fw','DhZ'];
    return {tit:'Completar Datos de Planilla (Ubicación, Horarios e Indicadores)',
      pasos:[
        {k:'mina',l:'Mina',t:'select',options:minas,g:UB,c:'#00b0f0'},
        {k:'nivel',l:'Nivel',t:'select',options:niveles,g:UB,c:'#00b0f0'},
        {k:'bloque',l:'Bloque',t:'select',options:bloques,g:UB,c:'#00b0f0'},
        {k:'fase',l:'Fase (Transversal)',t:'text',ph:'Ej. Fase 1',g:UB,c:'#00b0f0'},
        {k:'numZanja',l:'Núm. Zanja (Producción)',t:'text',ph:'Ej. 47',g:UB,c:'#00b0f0'},
        {k:'calleZanja',l:'Calle(s) Zanja',t:'text',ph:'Ej. C41-43',g:UB,c:'#00b0f0'},
        {k:'calleUcl',l:'Calle UCL',t:'text',ph:'Ej. C41',g:UB,c:'#00b0f0'},
        {k:'paradas',l:'Paradas Inicio / Fin',t:'text',ph:'Ej. P1 a P5',g:UB,c:'#00b0f0'},
        {k:'detallePanel2',l:'Detalle Panel 2',t:'text',ph:'Ingrese detalles de Panel 2',g:UB,c:'#00b0f0'},
        {k:'hCarguio',l:'HORA INICIO CARGUÍO',t:'time',g:HO,c:'#93c5fd'},
        {k:'hSolicitud',l:'HORA SOLICITUD',t:'time',g:HO,c:'#93c5fd'},
        {k:'hAislacion',l:'HORA INICIO AISLACIÓN',t:'time',g:HO,c:'#93c5fd'},
        {k:'hQuemada',l:'HORA QUEMADA',t:'time',g:HO,c:'#93c5fd'},
        {k:'i2',l:'PUNTOS NO QUEMADOS POR PRETIL DEFICIENTE',t:'num',step:1,g:IN,c:'#fbbf24',info:infoInd},
        {k:'i3',l:'PUNTOS NO QUEMADOS POR CONDICIÓN DE GOTEO',t:'num',step:1,g:IN,c:'#fbbf24',info:infoInd},
        {k:'i4',l:'COLPA SOBREDIMENSIONADA SIN BARRENADURA',t:'num',step:1,g:IN,c:'#fbbf24',info:infoInd}
      ],
      d:{mina:c.mina||'Esmeralda',nivel:c.nivel||'NP',bloque:c.bloque||'Ext Fw',fase:c.fase||'',numZanja:c.numZanja||'',calleZanja:c.calleZanja||'',calleUcl:c.calleUcl||'',paradas:c.paradas||'',detallePanel2:c.detallePanel2||'',hLlegada:c.h?.llegada||'',hCarguio:c.h?.carguio||'',hFinCarguio:c.h?.finCarguio||'',hQuemada:c.h?.quemada||'',hSalida:c.h?.salida||'',hSolicitud:c.h?.solicitud||'',hAislacion:c.h?.aislacion||'',colihue:c.colihue||'No',perdidas:crearPerdidasRS(c.perdidas),obs:c.obs||'',i2:c.i2||0,i3:c.i3||0,i4:c.i4||0},
      aplicar(d){Object.assign(c,{mina:d.mina,nivel:d.nivel,bloque:d.bloque,fase:d.fase,numZanja:d.numZanja,calleZanja:d.calleZanja,calleUcl:d.calleUcl,paradas:d.paradas,detallePanel2:d.detallePanel2});
        const fase=d.fase?(String(d.fase).toLowerCase().startsWith('fase')?d.fase:'Fase '+d.fase):'';
        const z=d.numZanja?(String(d.numZanja).toUpperCase().startsWith('Z')?d.numZanja:'Z'+d.numZanja):'';
        c.idTronadura=d.nivel==='NP'?[z,d.calleZanja,fase].filter(Boolean).join(' '):d.nivel==='UCL'?[d.calleUcl,'UCL',fase].filter(Boolean).join(' '):[d.detallePanel2,fase].filter(Boolean).join(' ');
        c.h={...(c.h||{}),llegada:d.hLlegada,carguio:d.hCarguio,finCarguio:d.hFinCarguio,quemada:d.hQuemada,salida:d.hSalida,solicitud:d.hSolicitud,aislacion:d.hAislacion};c.perdidas=crearPerdidasRS(d.perdidas);c.colihue=d.colihue;c.obs=d.obs;c.i2=num(d.i2);c.i3=num(d.i3);c.i4=num(d.i4)}};
  }
  function abrirAsistentePlanilla(tipo){
    if(tipo==='datos'){
      abrirDatosModal();
      return;
    }
    if(!C()){toast('Seleccione o cree una zanja antes de completar la planilla');return}
    G={...crearDefinicionAsistentePlanilla(),s:0,tab:0,volver:V,tipo};
    V=7;render();
    window.scrollTo(0,0);
  }
  function abrirDatosModal(){
    const p=P();
    $('mdSector').value=p.sector||'';
    $('mdGrupo').value=p.grupo??'';
    cargarDatalistPersonalRS('listaSupJeJ','supervisorJeJ',p.turno);
    cargarDatalistPersonalRS('listaSupDET','supervisorDet',p.turno);
    cargarDatalistPersonalRS('listaEncDET','responsableDet',p.turno);
    completarPersonalPlanilla(p);
    $('mdEncJEJ').value=localStorage.getItem('jej_usuario_activo')||p.encJEJ||'';
    $('mdSupervisorJeJ').value=p.supervisorJeJ||'';
    pintarPersonalModal('mdSupervisoresDET','supervisorDet',p.supervisorDet&&p.supervisorDet.length?p.supervisorDet:['']);
    const responsablesTurno=nombresPersonalRS('responsableDet',p.turno);
    const responsableElegido=p.encDETActivo||responsablesTurno.find(nombre=>(p.encDET||[]).some(actual=>String(actual).trim().toLocaleLowerCase()===nombre.toLocaleLowerCase()))||responsablesTurno[0]||(p.encDET||[]).find(Boolean)||'';
    pintarEncargadosModal([responsableElegido]);
    $('mDatos').style.display='flex';
  }
  function cargarDatalistPersonalRS(idLista,rol,turno){
    const nombres=nombresPersonalRS(rol,turno);
    const lista=$(idLista);lista.replaceChildren();
    [...new Set(nombres)].forEach(nombre=>{const opcion=document.createElement('option');opcion.value=nombre;lista.appendChild(opcion)});
  }
  function nombresPersonalRS(rol,turno){
    if(window.JEJUsuarios&&typeof window.JEJUsuarios.nombres==='function')return window.JEJUsuarios.nombres(rol,turno);
    let personalMap={};
    try{personalMap=JSON.parse(localStorage.getItem('jej_personal_map')||'{}')}catch(error){console.error('No se pudo leer el personal guardado',error)}
    const registros=Array.isArray(personalMap[rol])?personalMap[rol]:[];
    return [...new Set(registros.map(item=>typeof item==='string'?{nombre:item,turno:'Ambos'}:item)
      .filter(item=>item&&item.nombre&&(!turno||turno==='Especial'||!item.turno||item.turno==='Ambos'||item.turno===turno))
      .map(item=>String(item.nombre).trim()).filter(Boolean))];
  }
  function actualizarPersonalPorTurno(p){
    let cambio=false;
    const ajustar=(valor,rol,multiple)=>{
      const actual=(multiple?(valor||[]):[valor]).map(x=>String(x||'').trim()).filter(Boolean);
      const todos=nombresPersonalRS(rol,'');
      const disponibles=nombresPersonalRS(rol,p.turno);
      const validos=actual.filter(nombre=>!todos.some(x=>x.toLocaleLowerCase()===nombre.toLocaleLowerCase())||disponibles.some(x=>x.toLocaleLowerCase()===nombre.toLocaleLowerCase()));
      const resultado=validos.length?validos:(actual.length?disponibles:disponibles.slice(0,1));
      const final=multiple?(resultado.length?resultado:['']):(resultado[0]||'');
      if(JSON.stringify(valor)!==JSON.stringify(final)){cambio=true;return final}
      return valor;
    };
    p.supervisorJeJ=ajustar(p.supervisorJeJ,'supervisorJeJ',false);
    p.supervisorDet=ajustar(p.supervisorDet,'supervisorDet',true);
    const disponiblesResponsable=nombresPersonalRS('responsableDet',p.turno);
    const responsablesRegistrados=nombresPersonalRS('responsableDet','');
    let responsableActivo=String(p.encDETActivo||'').trim();
    if(!responsableActivo){
      responsableActivo=(p.encDET||[]).map(nombre=>String(nombre||'').trim()).find(nombre=>disponiblesResponsable.some(opcion=>opcion.toLocaleLowerCase()===nombre.toLocaleLowerCase()))||disponiblesResponsable[0]||(p.encDET||[]).map(nombre=>String(nombre||'').trim()).find(Boolean)||'';
    }else if(responsablesRegistrados.some(nombre=>nombre.toLocaleLowerCase()===responsableActivo.toLocaleLowerCase())&&!disponiblesResponsable.some(nombre=>nombre.toLocaleLowerCase()===responsableActivo.toLocaleLowerCase())){
      responsableActivo=disponiblesResponsable[0]||'';
    }
    if(p.encDETActivo!==responsableActivo){p.encDETActivo=responsableActivo;cambio=true;}
    return cambio;
  }

  function completarPersonalPlanilla(p){
    let cambio=false;
    const usuarioActivo=localStorage.getItem('jej_usuario_activo');
    if(usuarioActivo&&p.encJEJ!==usuarioActivo){p.encJEJ=usuarioActivo;cambio=true;}
    const supervisorJeJ=nombresPersonalRS('supervisorJeJ',p.turno);
    const supervisoresDET=nombresPersonalRS('supervisorDet',p.turno);
    const responsablesDET=nombresPersonalRS('responsableDet',p.turno);
    if(!p.supervisorJeJ&&supervisorJeJ.length){p.supervisorJeJ=supervisorJeJ[0];cambio=true;}
    if((!Array.isArray(p.supervisorDet)||!p.supervisorDet.some(Boolean))&&supervisoresDET.length){p.supervisorDet=supervisoresDET;cambio=true;}
    if((!Array.isArray(p.encDET)||!p.encDET.some(Boolean))&&responsablesDET.length){p.encDET=responsablesDET;cambio=true;}
    if(!p.encDETActivo){p.encDETActivo=(p.encDET||[]).map(nombre=>String(nombre||'').trim()).find(nombre=>responsablesDET.some(opcion=>opcion.toLocaleLowerCase()===nombre.toLocaleLowerCase()))||responsablesDET[0]||'';if(p.encDETActivo)cambio=true;}
    return cambio;
  }
  function pintarEncargadosModal(valores){
    const valor=Array.isArray(valores)?valores.find(Boolean)||'':'';
    $('mdEncDET').innerHTML=`<div style="display:flex;gap:8px;align-items:center">
      <input class="md-enc-det" type="text" list="listaEncDET" value="${esc(valor)}" placeholder="Seleccione o escriba un responsable" style="flex:1;min-width:0">
    </div>`;
  }
  function pintarPersonalModal(contenedor,clase,valores){
    const lista=clase==='supervisorDet'?'listaSupDET':'listaEncDET';
    $(contenedor).innerHTML=valores.map((valor,i)=>`<div style="display:flex;gap:8px;align-items:center">
      <input class="${clase==='supervisorDet'?'md-supervisor-det':'md-enc-det'}" type="text" list="${lista}" value="${esc(valor)}" placeholder="${clase==='supervisorDet'?'Nombre del Supervisor DET':'Nombre del responsable DET'}" style="flex:1;min-width:0">
      ${valores.length>1?`<button type="button" class="btn-delete" title="Quitar" aria-label="Quitar" onclick="quitarPersonalModal('${contenedor}','${clase}',${i})">×</button>`:''}
    </div>`).join('');
  }
  function valoresPersonalModal(contenedor,clase){return [...document.querySelectorAll(`#${contenedor} .${clase==='supervisorDet'?'md-supervisor-det':'md-enc-det'}`)].map(input=>input.value)}
  function agregarCampoPersonalModal(clase){
    const id=clase==='supervisorDet'?'mdSupervisoresDET':'mdEncDET';
    const valores=valoresPersonalModal(id,clase);valores.push('');pintarPersonalModal(id,clase,valores);
    const inputs=document.querySelectorAll(`#${id} input`);inputs[inputs.length-1].focus();
  }
  function quitarPersonalModal(id,clase,indice){const valores=valoresPersonalModal(id,clase);valores.splice(indice,1);pintarPersonalModal(id,clase,valores.length?valores:[''])}
  function valoresEncargadosModal(){return [...document.querySelectorAll('#mdEncDET .md-enc-det')].map(input=>input.value)}
  function agregarEncargadoModal(){
    const valores=valoresEncargadosModal();valores.push('');pintarEncargadosModal(valores);
    const inputs=document.querySelectorAll('#mdEncDET .md-enc-det');inputs[inputs.length-1].focus();
  }
  function quitarEncargadoModal(indice){
    const valores=valoresEncargadosModal();valores.splice(indice,1);
    pintarEncargadosModal(valores.length?valores:['']);
  }
  function cerrarDatosModal(){$('mDatos').style.display='none'}
  function guardarDatosModal(){
    const p=P();
    p.sector=$('mdSector').value.trim();
    p.grupo=$('mdGrupo').value;
    p.encJEJ=$('mdEncJEJ').value.trim();
    p.supervisorJeJ=$('mdSupervisorJeJ').value.trim();
    p.supervisorDet=valoresPersonalModal('mdSupervisoresDET','supervisorDet').map(nombre=>nombre.trim()).filter(Boolean);
    p.encDETActivo=valoresEncargadosModal().map(nombre=>nombre.trim()).find(Boolean)||'';
    save();cerrarDatosModal();render();toast('Datos guardados');
  }
  function capturarDatosAsistentePlanilla(){
    const s=G.pasos[G.s];
    if(s.t==='multi')G.d[s.k]=[...document.querySelectorAll('.gm')].map(i=>i.value);
    else{const el=$('wi');if(el)G.d[s.k]=el.value}
  }
  function renderizarAsistentePlanilla(){
    if(G.tipo==='planilla'){renderizarPestanasDatosPlanilla();return}
    const ps=G.pasos,n=ps.length,s=ps[G.s],d=G.d,ult=G.s===n-1,v=d[s.k]??'';
    let inp='';
    if(s.t==='multi'){
      inp=`<div class="mlt">${d[s.k].map((x,i)=>`<div class="mrow"><input class="big gm" value="${esc(x)}" placeholder="Nombre" onkeydown="if(event.key==='Enter')avanzarAsistentePlanilla()">${d[s.k].length>1?`<button class="x" title="Quitar" onclick="quitarElementoAsistentePlanilla(${i})">×</button>`:''}</div>`).join('')}
        <div style="text-align:center"><button class="dash" onclick="agregarElementoAsistentePlanilla()">+ ${esc(s.add)}</button></div></div>`;
    }else if(s.t==='select'){
      const opts=s.options.map(x=>typeof x==='string'?{v:x,t:x}:x);
      inp=`<div class="jp-opts rs-opciones">${opts.map(x=>`<button type="button" class="jp-opt rs-opcion${String(v)===String(x.v)?' sel':''}" data-valor="${esc(x.v)}" aria-pressed="${String(v)===String(x.v)?'true':'false'}">${esc(x.t)}</button>`).join('')}</div>`;
    }else if(s.t==='time'){
      inp=`<input id="wi" class="big" type="time" value="${esc(v)}" onkeydown="if(event.key==='Enter')avanzarAsistentePlanilla()">
        <div style="text-align:center"><button class="dash" style="margin-top:10px" onclick="establecerHoraActualAsistente()">Ahora</button></div>`;
    }else if(s.t==='num'){
      inp=`<input id="wi" class="big" type="number" inputmode="decimal" step="${s.step||0.1}" min="0" value="${esc(v)}" placeholder="0" oninput="actualizarInformacionAsistentePlanilla()" onkeydown="if(event.key==='Enter')avanzarAsistentePlanilla()">`;
    }else{
      inp=`<input id="wi" class="big" value="${esc(v)}" placeholder="${esc(s.ph||'')}" onkeydown="if(event.key==='Enter')avanzarAsistentePlanilla()">`;
    }
    const llenos=ps.filter(x=>x!==s&&(Array.isArray(d[x.k])?d[x.k].some(Boolean):String(d[x.k]??'')!==''&&!(x.t==='num'&&num(d[x.k])===0&&!d[x.k])));
    const host=$('v7');
    host.style.borderLeftColor=s.c;
    host.innerHTML=`
      <div class="wz-top"><b>${esc(s.g)}</b><span>Dato <b style="color:#2563eb">${G.s+1}</b> de ${n}</span></div>
      <div class="bar"><i style="width:${((G.s+1)/n)*100}%"></i></div>
      <h2>${esc(s.l)}</h2>${inp}
      ${s.info?`<div class="gi" id="gInfo">${s.info(d)}</div>`:''}
      <div class="nav">
        <button class="btn-primary" ${G.s===0?'disabled':''} onclick="irAlPasoAnteriorPlanilla()">← Anterior</button>
        <button class="btn-primary" onclick="omitirPasoAsistentePlanilla()">Omitir</button>
        <button class="btn-primary" onclick="avanzarAsistentePlanilla()">${ult?'Guardar datos ✓':'Siguiente →'}</button>
        ${ult?'':'<button class="btn-primary" onclick="guardarAsistentePlanilla()">Guardar y salir</button>'}
        <span class="sp"></span>
        <button class="btn-primary" style="color:#dc2626;border-color:#fca5a5" onclick="cancelarAsistentePlanilla()">Cancelar</button>
      </div>
      ${llenos.length?`<div style="display:flex;flex-wrap:wrap;justify-content:center;gap:4px 6px;margin-top:14px;padding-top:10px;border-top:1px solid #e2e8f0">${llenos.map(x=>`<span style="font-size:.72rem;background:#f1f5f9;border-radius:4px;padding:2px 6px;color:#334155">${esc(x.l.toLowerCase())}: ${esc(Array.isArray(d[x.k])?d[x.k].filter(Boolean).join(', '):d[x.k])}</span>`).join('')}</div>`:''}`;
    host.querySelectorAll('.rs-opcion').forEach(boton=>boton.addEventListener('click',()=>{
      const paso=G.pasos[G.s];
      G.d[paso.k]=boton.dataset.valor;
      renderizarAsistentePlanilla();
    }));
    const el=host.querySelector('input');if(el){el.focus();el.select&&el.select()}
  }
  function capturarPestanaDatosPlanilla(){
    $('v7').querySelectorAll('[data-rs-planilla-campo]').forEach(el=>G.d[el.dataset.rsPlanillaCampo]=el.value);
    $('v7').querySelectorAll('[data-rs-perdida-otro]').forEach(el=>G.d.perdidas[el.dataset.rsPerdidaOtro].otro=el.value);
    const observacion=$('v7').querySelector('[data-rs-observacion]');if(observacion)G.d.obs=observacion.value;
  }
  function horaMinutos(hora){if(!hora)return null;const [h,m]=hora.split(':').map(Number);return h*60+m}
  function diferenciaHorasRS(inicio,fin){const a=horaMinutos(inicio),b=horaMinutos(fin);if(a===null||b===null)return null;return (b-a+1440)%1440}
  function formatoTiempoRS(minutos){if(minutos===null||!Number.isFinite(minutos))return '—';return Math.floor(minutos/60)+' h '+String(minutos%60).padStart(2,'0')+' min'}
  const TIEMPOS_RS=[
    {k:'hLlegada',label:'Llegada a la zanja'},
    {k:'hCarguio',label:'Inicio de carguío'},
    {k:'hFinCarguio',label:'Fin de carguío'},
    {k:'hQuemada',label:'Quemada'},
    {k:'hSalida',label:'Salida de la zanja'}
  ];
  function renderizarPestanasDatosPlanilla(){
    const pestañas=['Horarios','Indicadores','Pérdidas'];
    G.d.perdidas=crearPerdidasRS(G.d.perdidas);
    const c=C(),reducidas=c.colpas.filter(x=>x.fin==='Reducida').length;
    const eficiencias=c.colpas.map(x=>num(x.efic)).filter(n=>Number.isFinite(n)&&n>0);
    const eficiencia=eficiencias.length?Math.round(eficiencias.reduce((a,b)=>a+b,0)/eficiencias.length):0;
    const cumplen=c.colpas.filter(x=>String(x.cumple||'').toUpperCase()==='SI').length;
    const cartuchos=c.colpas.reduce((total,x)=>total+num(x.cart),0);
    const totalPerdidas=Object.values(G.d.perdidas).reduce((sum,p)=>sum+(p.activo?num(p.minutos):0),0);
    const tiempos=TIEMPOS_RS.map((t,i)=>{const delta=i?diferenciaHorasRS(G.d[TIEMPOS_RS[i-1].k],G.d[t.k]):null;return `<label class="rs-tiempo-fila"><span class="rs-tiempo-punto"></span><span class="rs-tiempo-info"><strong>${t.label}</strong>${i?`<small data-rs-duracion="${i}">${delta===null?'—':delta+' min'}</small>`:''}</span><input type="time" data-rs-planilla-campo="${t.k}" value="${esc(G.d[t.k]||'')}"></label>`}).join('');
    const perdidasConfig={
      carguio:{titulo:'Durante el carguío',motivos:['Falta de pegamento','Falla de equipo','Sin acceso','Otro'],presets:[10,15,30]},
      quemada:{titulo:'Durante la quemada',motivos:['Bloqueo de vía','Ventilación','Espera de equipo','Otro'],presets:[10,20,30]}
    };
    const tarjetaPerdida=(tipo,config)=>{const perdida=G.d.perdidas[tipo];return `<article class="rs-perdida-card ${perdida.activo?'registrando':''}" data-rs-perdida-card="${tipo}"><header><strong>■ ${config.titulo}</strong><div><button type="button" class="rs-perdida-toggle ${!perdida.activo?'active':''}" data-rs-perdida-clear="${tipo}" aria-pressed="${!perdida.activo}">Sin pérd.</button><button type="button" class="rs-perdida-toggle registrar ${perdida.activo?'active':''}" data-rs-perdida-register="${tipo}" aria-pressed="${perdida.activo}">Registrar</button></div></header><div class="rs-perdida-detalle" ${perdida.activo?'':'hidden'}><div class="rs-perdida-motivos" role="group" aria-label="Motivo de ${config.titulo.toLowerCase()}">${config.motivos.map(m=>`<button type="button" class="${perdida.motivo===m?'selected':''}" data-rs-perdida-motivo="${tipo}" data-motivo="${esc(m)}" aria-pressed="${perdida.motivo===m}">${m}</button>`).join('')}</div>${perdida.motivo==='Otro'?`<input class="rs-perdida-otro" type="text" placeholder="Especifique el motivo" data-rs-perdida-otro="${tipo}" value="${esc(perdida.otro)}">`:''}<div class="rs-perdida-controles"><button type="button" data-rs-perdida-step="${tipo}" data-delta="-5" aria-label="Restar 5 minutos">−</button><strong><input type="number" min="0" step="5" data-rs-perdida-minutos="${tipo}" value="${num(perdida.minutos)}"><small>min</small></strong><button type="button" data-rs-perdida-step="${tipo}" data-delta="5" aria-label="Sumar 5 minutos">+</button><div class="rs-perdida-presets">${config.presets.map(m=>`<button type="button" data-rs-perdida-preset="${tipo}" data-minutos="${m}" class="${num(perdida.minutos)===m?'selected':''}">${m}</button>`).join('')}</div></div></div></article>`};
    const campos=G.tab===0?`<div class="rs-tiempo-lista">${tiempos}</div><details class="rs-horarios-anteriores"><summary>Otros horarios guardados</summary><label>Hora solicitud<input type="time" data-rs-planilla-campo="hSolicitud" value="${esc(G.d.hSolicitud||'')}"></label><label>Inicio de aislación<input type="time" data-rs-planilla-campo="hAislacion" value="${esc(G.d.hAislacion||'')}"></label></details><p class="rs-datos-nota" data-rs-tiempo-total>ⓘ Total en zanja ${formatoTiempoRS(diferenciaHorasRS(G.d.hLlegada,G.d.hSalida))}. Los tiempos entre eventos se calculan solos.</p>`:
      G.tab===1?`<section class="rs-indicadores-bloque"><h3>■ Calculados de las colpas · Automático</h3><div class="rs-indicador-filas"><div>🔒 Colpas registradas · ${c.colpas.length}</div><div>🔒 Reducidas · ${reducidas} (${c.colpas.length?Math.round(reducidas/c.colpas.length*100):0} %)</div><div>🔒 Eficiencia promedio · ${eficiencia} %</div><div>🔒 Cumplen la recomendación · ${cumplen} de ${c.colpas.length}</div><div>🔒 Cartuchos usados · ${cartuchos}</div></div></section><section class="rs-indicadores-bloque"><h3>■ Datos de planilla</h3><div class="rs-colihue"><span>Colihue usado</span><div role="group" aria-label="Colihue usado"><button type="button" data-rs-colihue="Sí" class="${G.d.colihue==='Sí'?'selected':''}" aria-pressed="${G.d.colihue==='Sí'}">Sí</button><button type="button" data-rs-colihue="No" class="${G.d.colihue!=='Sí'?'selected':''}" aria-pressed="${G.d.colihue!=='Sí'}">No</button></div></div></section><p class="rs-datos-nota">ⓘ Los campos vacíos se omiten del informe técnico.</p>`:
      `${tarjetaPerdida('carguio',perdidasConfig.carguio)}${tarjetaPerdida('quemada',perdidasConfig.quemada)}<label class="rs-observacion-general">■ Observaciones generales<textarea rows="2" data-rs-observacion placeholder="Ej: Personal RS DET realiza carguío con colihue ya que no tienen pegamento">${esc(G.d.obs||'')}</textarea></label><p class="rs-perdida-total" data-rs-perdida-total>⚠ Pérdida total ${totalPerdidas} min. Se descuenta del tiempo efectivo en el informe.</p>`;
    const host=$('v7');
    host.innerHTML=`<header class="rs-planilla-head"><div class="rs-capture-kicker">PASO 6 DE 7 · DATOS DE PLANILLA · ZANJA ${esc(c.id)}</div><span class="rs-capture-count">${G.tab===0?'5/12':G.tab===1?'9/12':'12/12'}</span><h2>${G.tab===0?'Horarios de la zanja':G.tab===1?'Indicadores de la zanja':'Pérdidas y observaciones'}</h2></header><div class="rs-capture-progress" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i class="active"></i><i></i></div><div class="rs-planilla-tabs" role="tablist" aria-label="Datos de planilla">${pestañas.map((t,i)=>`<button type="button" role="tab" class="${i===G.tab?'active':''}" aria-selected="${i===G.tab?'true':'false'}" data-rs-planilla-tab="${i}">${i===0?'◷':i===1?'▣':'▴'} ${t}</button>`).join('')}</div><section class="rs-planilla-panel ${G.tab===2?'perdidas':''}" role="tabpanel">${campos}</section><nav class="rs-capture-nav"><button type="button" class="anfo-btn-volver" data-rs-planilla-back>‹ ${G.tab===0?'Colpas':pestañas[G.tab-1]}</button><button type="button" class="${G.tab===pestañas.length-1?'rs-capture-save':'anfo-btn-usar'}" data-rs-planilla-next>${G.tab===pestañas.length-1?'Ir al resumen ✓':pestañas[G.tab+1]+' ›'}</button></nav>`;
    host.querySelectorAll('[data-rs-planilla-tab]').forEach(b=>b.addEventListener('click',()=>{capturarPestanaDatosPlanilla();G.tab=Number(b.dataset.rsPlanillaTab);renderizarAsistentePlanilla()}));
    host.querySelectorAll('[data-rs-planilla-campo]').forEach(input=>input.addEventListener('input',()=>{G.d[input.dataset.rsPlanillaCampo]=input.value;if(G.tab===0){host.querySelectorAll('[data-rs-duracion]').forEach(el=>{const i=Number(el.dataset.rsDuracion),delta=diferenciaHorasRS(G.d[TIEMPOS_RS[i-1].k],G.d[TIEMPOS_RS[i].k]);el.textContent=delta===null?'—':delta+' min'});const total=host.querySelector('[data-rs-tiempo-total]');if(total)total.textContent=`ⓘ Total en zanja ${formatoTiempoRS(diferenciaHorasRS(G.d.hLlegada,G.d.hSalida))}. Los tiempos entre eventos se calculan solos.`}}));
    host.querySelectorAll('[data-rs-colihue]').forEach(b=>b.addEventListener('click',()=>{capturarPestanaDatosPlanilla();G.d.colihue=b.dataset.rsColihue;renderizarAsistentePlanilla()}));
    host.querySelectorAll('[data-rs-perdida-clear]').forEach(b=>b.addEventListener('click',()=>{capturarPestanaDatosPlanilla();const t=b.dataset.rsPerdidaClear;G.d.perdidas[t]={activo:false,motivo:'',otro:'',minutos:0};renderizarAsistentePlanilla()}));
    host.querySelectorAll('[data-rs-perdida-register]').forEach(b=>b.addEventListener('click',()=>{capturarPestanaDatosPlanilla();G.d.perdidas[b.dataset.rsPerdidaRegister].activo=true;renderizarAsistentePlanilla()}));
    host.querySelectorAll('[data-rs-perdida-motivo]').forEach(b=>b.addEventListener('click',()=>{capturarPestanaDatosPlanilla();G.d.perdidas[b.dataset.rsPerdidaMotivo].motivo=b.dataset.motivo;renderizarAsistentePlanilla()}));
    host.querySelectorAll('[data-rs-perdida-minutos]').forEach(input=>input.addEventListener('input',()=>{const t=input.dataset.rsPerdidaMinutos;G.d.perdidas[t].minutos=Math.max(0,num(input.value));const total=Object.values(G.d.perdidas).reduce((s,p)=>s+(p.activo?num(p.minutos):0),0);host.querySelector('[data-rs-perdida-total]').textContent=`⚠ Pérdida total ${total} min. Se descuenta del tiempo efectivo en el informe.`}));
    host.querySelectorAll('[data-rs-perdida-otro]').forEach(input=>input.addEventListener('input',()=>{G.d.perdidas[input.dataset.rsPerdidaOtro].otro=input.value}));
    host.querySelectorAll('[data-rs-perdida-step]').forEach(b=>b.addEventListener('click',()=>{capturarPestanaDatosPlanilla();const t=b.dataset.rsPerdidaStep;G.d.perdidas[t].minutos=Math.max(0,num(G.d.perdidas[t].minutos)+Number(b.dataset.delta));renderizarAsistentePlanilla()}));
    host.querySelectorAll('[data-rs-perdida-preset]').forEach(b=>b.addEventListener('click',()=>{capturarPestanaDatosPlanilla();G.d.perdidas[b.dataset.rsPerdidaPreset].minutos=Number(b.dataset.minutos);renderizarAsistentePlanilla()}));
    host.querySelector('[data-rs-planilla-back]').addEventListener('click',()=>{capturarPestanaDatosPlanilla();if(G.tab){G.tab--;renderizarAsistentePlanilla()}else{const destino=G.volver;G.aplicar(G.d);save();V=destino;G=null;render();toast('Datos guardados')}});
    host.querySelector('[data-rs-planilla-next]').addEventListener('click',()=>{capturarPestanaDatosPlanilla();if(G.tab<pestañas.length-1){G.tab++;renderizarAsistentePlanilla()}else guardarAsistentePlanilla(true)});
  }
  function actualizarInformacionAsistentePlanilla(){capturarDatosAsistentePlanilla();const s=G.pasos[G.s],t=$('gInfo');if(t&&s.info)t.innerHTML=s.info(G.d)}
  function establecerHoraActualAsistente(){const el=$('wi');el.value=horaAhora();G.d[G.pasos[G.s].k]=el.value}
  function agregarElementoAsistentePlanilla(){capturarDatosAsistentePlanilla();G.d[G.pasos[G.s].k].push('');renderizarAsistentePlanilla();const l=document.querySelectorAll('.gm');l[l.length-1].focus()}
  function quitarElementoAsistentePlanilla(i){capturarDatosAsistentePlanilla();G.d[G.pasos[G.s].k].splice(i,1);renderizarAsistentePlanilla()}
  function cambiarPasoAsistentePlanilla(i){capturarDatosAsistentePlanilla();G.s=+i;renderizarAsistentePlanilla()}
  function irAlPasoAnteriorPlanilla(){capturarDatosAsistentePlanilla();if(G.s>0){G.s--;renderizarAsistentePlanilla()}}
  function omitirPasoAsistentePlanilla(){if(G.s<G.pasos.length-1){G.s++;renderizarAsistentePlanilla()}else guardarAsistentePlanilla(true)}
  function avanzarAsistentePlanilla(){capturarDatosAsistentePlanilla();if(G.s<G.pasos.length-1){G.s++;renderizarAsistentePlanilla()}else guardarAsistentePlanilla(true)}
  function guardarAsistentePlanilla(yaCapt){
    if(!yaCapt)capturarDatosAsistentePlanilla();
    const destino=G.tipo==='planilla'?8:G.volver;
    G.aplicar(G.d);save();V=destino;G=null;render();window.scrollTo(0,0);toast('Datos guardados');
  }
  function cancelarAsistentePlanilla(){if(confirm('¿Cancelar? Se descartan los cambios hechos en este asistente.')){V=G.volver;G=null;render()}}

  function renderizarResumenFinalRS(){
    const planilla=P(),zanjas=planilla.calles||[],colpas=zanjas.flatMap(z=>z.colpas||[]);
    const reducidas=colpas.filter(x=>x.fin==='Reducida').length;
    const noCumplen=colpas.filter(x=>String(x.cumple||'').toUpperCase()==='NO').length;
    const eficiencia=colpas.map(x=>num(x.efic)).filter(n=>n>0);
    const eficienciaMedia=eficiencia.length?Math.round(eficiencia.reduce((a,b)=>a+b,0)/eficiencia.length):0;
    const cartuchos=colpas.reduce((s,x)=>s+num(x.cart),0);
    const tiempoTotal=zanjas.reduce((s,z)=>s+(diferenciaHorasRS(z.h?.llegada,z.h?.salida)||0),0);
    const tiempoCarguio=zanjas.reduce((s,z)=>s+(diferenciaHorasRS(z.h?.carguio,z.h?.finCarguio)||0),0);
    const perdidas=zanjas.reduce((s,z)=>s+Object.values(crearPerdidasRS(z.perdidas)).reduce((a,p)=>a+(p.activo?num(p.minutos):0),0),0);
    const maximo=Math.max(1,...zanjas.map(z=>(z.colpas||[]).length));
    const filaGrafico=z=>{const items=z.colpas||[],red=items.filter(x=>x.fin==='Reducida').length,no=items.filter(x=>String(x.cumple||'').toUpperCase()==='NO').length;return `<article class="rs-chart-row"><strong>Zanja ${esc(z.id)}</strong><div class="rs-chart-series"><label>Total <progress class="total" max="${maximo}" value="${items.length}"></progress><b>${items.length}</b></label><label>Reducidas <progress class="reducidas" max="${maximo}" value="${red}"></progress><b>${red}</b></label><label>No cumplen <progress class="no-cumplen" max="${maximo}" value="${no}"></progress><b>${no}</b></label></div></article>`};
    const root=$('v8');
    root.innerHTML=`<div class="rs-final-progress" aria-label="Paso 7 de 7">${Array.from({length:7},()=>'<i></i>').join('')}</div><header class="rs-final-head"><div><p>PASO 7 DE 7</p><h2>Resumen General</h2></div><span>✓ Guardado</span></header><div class="rs-final-stats"><article><strong>${zanjas.length}</strong><small>Zanjas</small></article><article><strong>${colpas.length}</strong><small>Colpas</small></article><article><strong>${reducidas}</strong><small>Reducidas</small></article><article class="danger"><strong>${noCumplen}</strong><small>No cumplen</small></article></div><section class="rs-final-chart"><header><strong>■ COLPAS POR ZANJA</strong><span>${colpas.length?Math.round(reducidas/colpas.length*100):0} % reducidas</span></header><div class="rs-chart-rows">${zanjas.length?zanjas.map(filaGrafico).join(''):'<p>Aún no hay zanjas registradas.</p>'}</div><footer><span>■ Total</span><span>■ Reducidas</span><span>■ No cumplen</span></footer></section><div class="rs-final-tiempos"><span>Cartuchos <b>${cartuchos}</b></span><span>Carguío <b>${formatoTiempoRS(tiempoCarguio)}</b></span><span>Total en zanja <b>${formatoTiempoRS(tiempoTotal)}</b></span><span>Pérdidas <b>${formatoTiempoRS(perdidas)}</b></span><span>Tiempo efectivo <b>${formatoTiempoRS(Math.max(0,tiempoTotal-perdidas))}</b></span></div><section class="rs-final-acciones"><button type="button" class="guardar" data-rs-final-guardar>▣<b>Guardar y salir</b><small>Auto-guardado en el equipo</small></button><button type="button" class="nube" data-rs-final-nube>☁<b>OneDrive</b><small>Subir a la nube</small></button><button type="button" class="excel" data-rs-final-excel>▦<b>Descargar Excel</b><small>Planilla de terreno</small></button><button type="button" class="informe" data-rs-final-informe>▤<b>Descargar Informe Técnico</b><small>Informe de reducción</small></button></section><nav class="rs-final-footer"><button type="button" data-rs-final-volver>‹ Volver a la zanja</button><button type="button" data-rs-final-otra>+ Registrar otra zanja</button></nav>`;
    root.querySelector('[data-rs-final-guardar]').addEventListener('click',()=>{save();window.location.href='../index.html'});
    root.querySelector('[data-rs-final-nube]').addEventListener('click',()=>{const boton=document.getElementById('btn-subir-onedrive');if(boton)boton.click();else toast('La sincronización con OneDrive no está disponible en esta vista')});
    root.querySelector('[data-rs-final-excel]').addEventListener('click',descargarExcel);
    root.querySelector('[data-rs-final-informe]').addEventListener('click',informe);
    root.querySelector('[data-rs-final-volver]').addEventListener('click',()=>{V=6;render()});
    root.querySelector('[data-rs-final-otra]').addEventListener('click',()=>{V=3;render()});
  }

  /* ============ Paso 2: calles ============ */
  function crearCalleDesde(inputId){
    const entrada=$(inputId),id=entrada.value.trim();if(!id){toast('Ingrese el número de zanja');entrada.focus();return}
    const p=P();
    if(p.calles.some(c=>c.id.toLocaleLowerCase()===id.toLocaleLowerCase())){toast('Esa zanja ya existe en esta planilla');return}
    p.calles.push({id,colpas:[],mina:p.mina,nivel:p.nivel,bloque:p.bloque,fase:p.fase,numZanja:p.numZanja,calleZanja:p.calleZanja,calleUcl:p.calleUcl,paradas:p.paradas,detallePanel2:p.detallePanel2,idTronadura:p.idTronadura,h:{llegada:'',carguio:'',finCarguio:'',quemada:'',salida:'',solicitud:'',aislacion:''},perdidas:crearPerdidasRS(),colihue:'No',i2:0,i3:0,i4:0,obs:''});
    p.calleAct=id;RSZanjaSeleccionada=id;entrada.value='';save();ir(4);
  }
  function crearCalle(){crearCalleDesde('nCalle')}
  function crearCalleDesdePanel(){crearCalleDesde('rsNuevaZanjaDesdeColpas')}
  function usarCalle(){const v=RSZanjaSeleccionada;if(!v){toast('Seleccione una zanja existente');return}P().calleAct=v;save();ir(4)}
  function elimCalle(){if(RSZanjaSeleccionada)eliminarZanjaRS(RSZanjaSeleccionada);}

  /* ============ Paso 3: resumen ============ */
  function renderLista(){
    const c=C(),items=c.colpas.map((x,i)=>({x,i}));
    $('rsConteoColpas').textContent=c.colpas.length;
    $('rsConteoReducidas').textContent=c.colpas.filter(x=>x.fin==='Reducida').length;
    $('rsConteoNoCumplen').textContent=c.colpas.filter(x=>String(x.cumple||'').toUpperCase()==='NO').length;
    $('lista').innerHTML=items.length?items.map(({x,i})=>{
      const id=esc(x.id||i+1);
      const medidas=[x.ancho,x.alto,x.largo].filter(v=>v!==undefined&&v!=='').map(esc).join('×');
      const eficiencia=String(x.efic||'').trim();
      const estado=String(x.fin||'Pendiente'),noCumple=String(x.cumple||'').toUpperCase()==='NO';
      const estadoClass=noCumple?'no-cumple':estado==='Reducida'?'reducida':estado==='Pendiente'?'pendiente':'otro';
      return '<button type="button" class="rs-resumen-colpa '+(noCumple?'no-cumple':'')+'" onclick="editarColpa('+i+')" aria-label="Editar colpa '+id+'"><span class="rs-resumen-piedra" aria-hidden="true"></span><strong>'+id+'</strong><small>'+medidas+' m</small><small>'+esc(x.expl||'—')+' · '+esc(x.cart||0)+'</small><span class="rs-resumen-estado '+estadoClass+'">'+esc(estado)+'</span><small>Efic. '+esc(eficiencia||'—')+'</small></button>';
    }).join('')+'<button type="button" class="rs-resumen-pendiente" onclick="nuevaColpa()"><strong>'+(c.colpas.length+1)+'</strong><span>Pendiente</span></button>'
      :' <button type="button" class="rs-resumen-pendiente" onclick="nuevaColpa()"><strong>1</strong><span>Pendiente</span></button>';
  }
  function elimColpa(i){if(confirm('¿Eliminar esta colpa?')){C().colpas.splice(i,1);save();if(V===4)renderizarListaColpasRegistradas($('rsBuscarColpa').value);else renderLista()}}
  function guardarCompleto(){save();toast('Registro guardado');V=3;render()}

  /* Observaciones */
  function abrirObs(){$('oTxt').value=C().obs||'';$('mObs').style.display='flex'}
  function guardarObs(){C().obs=$('oTxt').value;save();cerrar('mObs');toast('Observación guardada')}

  /* ============ Paso 4: asistente por dato ============ */
  const PESTANAS_COLPA=[
    {id:'medidas',label:'Medidas',campos:['id','punto','ini','ancho','alto','largo']},
    {id:'perforacion',label:'Perfor.',campos:['cperf','lperf','cart','expl']},
    {id:'tags',label:'Tags',campos:['tpre','tpost','dist']},
    {id:'resultado',label:'Result.',campos:['fin','efic','cumple']}
  ];
  let W={ci:-1,d:{},tab:0,s:0,borradores:{}};
  function nuevaColpa(){
    const c=C();
    const usados=new Set(c.colpas.map(colpa=>colpa.id).filter(Boolean));
    const id=LISTAS.ids.find(opcion=>!usados.has(opcion))||'';
    W={ci:-1,d:{id},tab:0,s:0,borradores:{},volver:V};V=5;render();
  }
  function editarColpa(i){W={ci:i,d:{...C().colpas[i]},tab:0,s:0,borradores:{},volver:V};V=5;render()}
  function capturarDatosAsistenteColpa(){document.querySelectorAll('#v5 [data-campo]:not([data-rs-choice]):not([data-rs-step])').forEach(el=>W.d[el.dataset.campo]=el.value)}
  function seleccionarColpaCaptura(i){
    capturarDatosAsistenteColpa();
    W.borradores[W.ci<0?'nueva':String(W.ci)]={...W.d};
    const esNueva=i===C().colpas.length;
    W.ci=esNueva?-1:i;
    W.d={...(W.borradores[esNueva?'nueva':String(i)]||C().colpas[i]||{})};
    W.tab=0;renderizarAsistenteColpa();
  }
  function campoCapturaColpa(f){
    const v=W.d[f.k]??'';
    if(f.t==='select')return `<label class="rs-select-field">${esc(f.l)}<select id="wi-${f.k}" data-campo="${f.k}" class="rs-capture-select"><option value=""></option>${f.o.map(o=>`<option value="${esc(o)}" ${o===v?'selected':''}>${esc(o)}</option>`).join('')}</select></label>`;
    if(f.t==='chips')return `<div class="rs-choice-group" role="group" aria-label="${esc(f.l)}">${f.o.map(o=>`<button type="button" class="rs-choice ${o===v?'is-selected':''}" data-rs-choice="${esc(o)}" data-campo="${f.k}" aria-pressed="${o===v?'true':'false'}">${esc(o)}</button>`).join('')}</div>`;
    if(f.t==='num')return `<div class="rs-stepper"><button type="button" data-rs-step="-1" data-campo="${f.k}" aria-label="Disminuir ${esc(f.l)}">−</button><label class="rs-stepper-value"><span>${esc(f.l)}</span><input id="wi-${f.k}" data-campo="${f.k}" type="number" inputmode="decimal" min="0" step="${f.step||0.1}" value="${esc(v)}" placeholder="0"><small>${f.k==='ancho'||f.k==='alto'||f.k==='largo'||f.k==='lperf'||f.k==='dist'?'m':f.k==='cperf'||f.k==='cart'?'u':''}</small></label><button type="button" data-rs-step="1" data-campo="${f.k}" aria-label="Aumentar ${esc(f.l)}">+</button></div>`;
    return `<label class="rs-text-field">${esc(f.l)}<input id="wi-${f.k}" data-campo="${f.k}" type="text" value="${esc(v)}" placeholder="${esc(f.ph||'')}"></label>`;
  }
  function renderVistaPreviaColpa(){
    const d=W.d,ancho=esc(d.ancho||'—'),alto=esc(d.alto||'—'),largo=esc(d.largo||'—');
    const perforaciones=Math.min(7,Math.max(1,Math.round(num(d.cperf)||2)));
    const tiros=Array.from({length:perforaciones},(_,i)=>{const x=49+i*(58/Math.max(1,perforaciones-1));return `<line x1="${x}" y1="65" x2="${x-4}" y2="111" stroke="#f59e0b" stroke-width="2.5"/>`}).join('');
    const preview=$('rsVistaColpa');if(!preview)return;
    preview.innerHTML=`<div class="rs-vista-titulo">COLPA ${esc(d.id||'—')} · VISTA</div><svg viewBox="0 0 160 190" role="img" aria-label="Vista esquemática de la colpa"><polygon points="35,70 72,43 126,55 140,110 112,151 55,157 28,121" fill="#c8c1a2" stroke="#655f4d" stroke-width="2"/>${tiros}<text x="80" y="112" text-anchor="middle" class="rs-svg-label">Ancho ${ancho} m</text><text x="18" y="100" transform="rotate(-90 18 100)" text-anchor="middle" class="rs-svg-label">Alto ${alto} m</text><path d="M28 171H140 M28 166V176 M140 166V176" stroke="#20b9e9" stroke-width="1.5"/><text x="84" y="185" text-anchor="middle" class="rs-svg-dim">Largo ${largo} m</text></svg><div class="rs-vista-datos"><b>${esc(d.cperf||0)} perf. × ${esc(d.lperf||0)} m</b><span>${esc(d.cart||0)} cart. ${esc(d.expl||'')}</span><span>Vol. ≈ ${fm(vol(d))} m³</span><span>ID ${esc(d.id||'—')}</span></div>`;
  }
  function renderizarAsistenteColpa(){
    const seccion=PESTANAS_COLPA[W.tab],campos=F.filter(f=>seccion.campos.includes(f.k));
    const num_=W.ci<0?C().colpas.length+1:W.ci+1;
    const seleccion=Array.from({length:Math.max(1,Math.min(6,Math.max(C().colpas.length,num_)))},(_,i)=>{
      const activa=i===W.ci||W.ci<0&&i===C().colpas.length;
      const existe=Boolean(C().colpas[i]);
      const etiqueta=existe?(C().colpas[i].id||i+1):i+1;
      return `<button type="button" class="rs-colpa-paso ${activa?'is-active':''} ${existe?'is-saved':''}" data-rs-colpa-index="${i}" aria-pressed="${activa?'true':'false'}">${existe&&Object.keys(C().colpas[i]).length>3?'✓':esc(etiqueta)}</button>`;
    }).join('');
    $('v5').innerHTML=`<header class="rs-capture-head"><div class="rs-capture-kicker">PASO 5 DE 7 · ZANJA ${esc(C().id)}</div><span class="rs-capture-count">Colpa ${num_} de ${Math.max(C().colpas.length,num_)}</span><h2>Captura de Colpa</h2></header><div class="rs-capture-progress" aria-hidden="true"><i></i><i></i><i></i><i></i><i class="active"></i><i></i><i></i></div><div class="rs-colpa-selector" aria-label="Colpas de esta zanja">${seleccion}</div><div class="rs-capture-tabs" role="tablist" aria-label="Pestañas de captura">${PESTANAS_COLPA.map((p,i)=>`<button type="button" role="tab" class="rs-capture-tab ${i===W.tab?'is-active':''}" data-rs-tab="${i}" aria-selected="${i===W.tab?'true':'false'}">${p.label}</button>`).join('')}</div><div class="rs-capture-layout"><aside class="rs-vista-card" id="rsVistaColpa"></aside><section class="rs-capture-fields" role="tabpanel">${campos.map(campoCapturaColpa).join('')}</section></div><nav class="rs-capture-nav"><button type="button" class="anfo-btn-volver" onclick="irAlPasoAnteriorColpa()">‹ ${W.tab===0?'Colpas':PESTANAS_COLPA[W.tab-1].label}</button><button type="button" class="${W.tab===3?'rs-capture-save':'anfo-btn-usar'}" onclick="avanzarPasoColpa()">${W.tab===3?'Guardar colpa ✓':PESTANAS_COLPA[W.tab+1].label+' ›'}</button></nav>`;
    $('v5').querySelectorAll('[data-rs-tab]').forEach(b=>b.addEventListener('click',()=>{capturarDatosAsistenteColpa();W.tab=Number(b.dataset.rsTab);renderizarAsistenteColpa()}));
    $('v5').querySelectorAll('[data-rs-colpa-index]').forEach(b=>b.addEventListener('click',()=>seleccionarColpaCaptura(Number(b.dataset.rsColpaIndex))));
    $('v5').querySelectorAll('[data-rs-choice]').forEach(b=>b.addEventListener('click',()=>{W.d[b.dataset.campo]=b.dataset.rsChoice;renderizarAsistenteColpa()}));
    $('v5').querySelectorAll('[data-rs-step]').forEach(b=>b.addEventListener('click',()=>{capturarDatosAsistenteColpa();const k=b.dataset.campo;W.d[k]=Math.max(0,num(W.d[k])+Number(b.dataset.rsStep)*(k==='ancho'||k==='alto'||k==='largo'||k==='lperf'||k==='dist'?0.1:1));renderizarAsistenteColpa()}));
    $('v5').querySelectorAll('#wi-medidas,#wi-perforacion,#wi-tags,#wi-resultado,[id^="wi-"]').forEach(input=>{input.addEventListener('input',()=>{W.d[input.dataset.campo]=input.value;renderVistaPreviaColpa()});input.addEventListener('change',()=>{W.d[input.dataset.campo]=input.value;renderVistaPreviaColpa()})});
    renderVistaPreviaColpa();
  }
  function cambiarPasoColpa(i){capturarDatosAsistenteColpa();W.tab=Math.max(0,Math.min(PESTANAS_COLPA.length-1,Number(i)));renderizarAsistenteColpa()}
  function irAlPasoAnteriorColpa(){capturarDatosAsistenteColpa();if(W.tab>0){W.tab--;renderizarAsistenteColpa()}else{V=W.volver||6;render()}}
  function omitirPasoColpa(){avanzarPasoColpa()}
  function avanzarPasoColpa(){capturarDatosAsistenteColpa();if(W.tab<PESTANAS_COLPA.length-1){W.tab++;renderizarAsistenteColpa()}else finalizarCapturaColpa()}
  function finalizarCapturaColpa(){
    const c=C();
    if(W.ci<0)c.colpas.push(W.d);else c.colpas[W.ci]=W.d;
    Object.entries(W.borradores||{}).forEach(([indice,borrador])=>{
      if(indice==='nueva'){
        if(W.ci>=0)c.colpas.push(borrador);
      }else if(Number.isInteger(Number(indice))&&Number(indice)>=0)c.colpas[Number(indice)]=borrador;
    });
    save();V=6;render();toast('Colpa guardada');
  }
  function cancelarColpa(){if(confirm('¿Descartar esta colpa?')){V=W.volver||6;render()}}

  /* ============ Exportar ============ */
  function hojaHTML(p,c){
    const th='style="background:#9dc3e6;border:1px solid #000;padding:4px;font-weight:bold"',td='style="border:1px solid #000;padding:4px;text-align:center"';
    const h=c.h||{};
    const rows=c.colpas.map(x=>`<tr>${[x.id,x.punto,x.ini,x.fin,x.ancho,x.alto,x.largo,fm(vol(x)),x.cperf,x.lperf,x.cart,x.expl,x.tpre,x.tpost,x.dist,x.efic,x.cumple].map(v=>`<td ${td}>${esc(v??'')}</td>`).join('')}</tr>`).join('');
    return `<table border="1" style="border-collapse:collapse;font-family:Arial;font-size:11px">
      <tr><td colspan="17" ${th} align="center">HOJA DE TERRENO REDUCCIÓN SECUNDARIA</td></tr>
      <tr><td colspan="17" ${td}><b>J. E. J. INGENIERÍA S. A. CONTRATO N° 4600026097</b></td></tr>
      <tr><td colspan="17" ${td}><b>SERVICIO QA/QC OPERACIONES DE PERFORACIÓN Y TRONADURA</b></td></tr>
      <tr><td ${td}><b>SECTOR</b></td><td ${td}>${esc(p.sector)}</td><td ${td}><b>TURNO</b></td><td ${td}>${esc(p.turno)}</td><td ${td}><b>GRUPO</b></td><td ${td}>${esc(p.grupo)}</td><td ${td}><b>FECHA</b></td><td colspan="2" ${td}>${dmy(p.fecha)}</td></tr>
      <tr><td ${td}><b>HORA INICIO CARGUÍO</b></td><td ${td}>${esc(h.carguio)}</td><td ${td}><b>HORA SOLICITUD</b></td><td ${td}>${esc(h.solicitud)}</td><td ${td}><b>HORA INICIO AISLACIÓN</b></td><td ${td}>${esc(h.aislacion)}</td><td ${td}><b>HORA QUEMADA</b></td><td colspan="2" ${td}>${esc(h.quemada)}</td></tr>
      <tr><td ${td}><b>LLEGADA A LA ZANJA</b></td><td ${td}>${esc(h.llegada)}</td><td ${td}><b>FIN DE CARGUÍO</b></td><td ${td}>${esc(h.finCarguio)}</td><td ${td}><b>SALIDA DE LA ZANJA</b></td><td ${td}>${esc(h.salida)}</td><td ${td}><b>COLIHUE USADO</b></td><td colspan="2" ${td}>${esc(c.colihue||'No')}</td></tr>
      <tr><td ${td}><b>CALLE</b></td><td ${td}>${esc(c.id)}</td></tr>
      <tr><td colspan="3" ${td}><b>ENCARGADO OPERACIÓN RS DET</b></td><td colspan="6" ${td}>${esc(p.encDETActivo||p.encDET.join(', '))}</td></tr>
      <tr><td colspan="3" ${td}><b>ENCARGADO SEGUIMIENTO JEJ</b></td><td colspan="6" ${td}>${esc(p.encJEJ)}</td></tr>
      <tr>${['ID','PUNTO','SITUACIÓN INICIAL','SITUACIÓN FINAL','ANCHO [M]','ALTO [M]','LARGO [M]','VOLUMEN [M3]','CANT. PERF.','LONG. PERF. [M]','CANT. CARTUCHOS o APD','EXPLOSIVO (TIPO)','TAG PRE','TAG POST','DIST. PROYEC. FRAGM.','EFICIENCIA [%]','¿Cumple la recomendación?'].map(t=>`<td ${th}>${t}</td>`).join('')}</tr>
      ${rows}
      <tr><td colspan="8" ${th}>INDICADOR POR CALLE</td><td colspan="2" ${th}>CANTIDAD</td></tr>
      <tr><td colspan="8">1. Puntos total en la calle que necesitan RS</td><td colspan="2" ${td}>${c.colpas.length}</td></tr>
      <tr><td colspan="8">2. Puntos no quemados por pretil deficiente</td><td colspan="2" ${td}>${num(c.i2)}</td></tr>
      <tr><td colspan="8">3. Puntos no quemados por condición de goteo</td><td colspan="2" ${td}>${num(c.i3)}</td></tr>
      <tr><td colspan="8">4. Colpa sobredimensionada sin barrenadura</td><td colspan="2" ${td}>${num(c.i4)}</td></tr>
      <tr><td colspan="8">5. Puntos quemados total en calle</td><td colspan="2" ${td}>${totQ(c)}</td></tr>
      <tr><td colspan="17" ${th}>PÉRDIDAS DE TIEMPO</td></tr>
      <tr><td colspan="3" ${td}><b>Durante el carguío</b></td><td colspan="4" ${td}>${c.perdidas?.carguio?.activo?'Registrada':'Sin pérdida'}</td><td colspan="4" ${td}>${esc(c.perdidas?.carguio?.motivo==='Otro'?c.perdidas?.carguio?.otro:c.perdidas?.carguio?.motivo||'')}</td><td colspan="2" ${td}>${num(c.perdidas?.carguio?.minutos)} min</td><td colspan="4" ${td}></td></tr>
      <tr><td colspan="3" ${td}><b>Durante la quemada</b></td><td colspan="4" ${td}>${c.perdidas?.quemada?.activo?'Registrada':'Sin pérdida'}</td><td colspan="4" ${td}>${esc(c.perdidas?.quemada?.motivo==='Otro'?c.perdidas?.quemada?.otro:c.perdidas?.quemada?.motivo||'')}</td><td colspan="2" ${td}>${num(c.perdidas?.quemada?.minutos)} min</td><td colspan="4" ${td}></td></tr>
      <tr><td colspan="17" ${th} align="center">OBSERVACIONES</td></tr>
      <tr><td colspan="17" ${td}>${esc(c.obs)}</td></tr>
      <tr><td colspan="17" ${td}><b>EXPLOSIVOS:</b> SEMEXA 1-1/4X16 / RIODIN 7/8X8 / POWEREX 1X6 / APD450-900-1500 / TRONEX / FAMEPLAST</td></tr>
      <tr><td colspan="17" ${td}><b>SITUACIÓN INICIAL / FINAL:</b> COLGADA / COLPA EN PISO / COLPA EN VISERA</td></tr>
    </table><br>`;
  }
  function todoHTML(){const p=P();return p.calles.map(c=>hojaHTML(p,c)).join('')}
  const LT=String.fromCharCode(60);           // "<" armado por código para no romper el script de la página
  const tag=(n,attr)=>LT+n+(attr?' '+attr:'')+'>';
  const ctag=n=>LT+'/'+n+'>';
  function descargarExcel(){
    const p=P();if(!p.calles.length){toast('No hay calles para exportar');return}
    const html=tag('html','xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"')
      +tag('head')+tag('meta','charset="UTF-8"')+ctag('head')+tag('body')+todoHTML()+ctag('body')+ctag('html');
    const a=document.createElement('a');
    a.href=URL.createObjectURL(new Blob(['\ufeff'+html],{type:'application/vnd.ms-excel'}));
    a.download='RS_'+p.sector+'_'+p.fecha+'_Turno'+p.turno+'.xls';a.click();
  }
  function informe(){
    const p=P();if(!p.calles.length){toast('No hay calles para el informe');return}
    window.JEJInformeReduccion.abrir(p);
  }

  render();
