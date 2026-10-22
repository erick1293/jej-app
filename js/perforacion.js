/* ============================================
 * PERFORACIÓN · Lógica de la página
 * Archivo de lógica: js/perforacion.js
 * Secciones de la lógica conservan el flujo de la página.
 * ============================================ */

/* ===================== NÚCLEO DE DATOS (listas, columnas, cálculos, almacenamiento) ===================== */
/* =========================================================
   JEJ · Núcleo de datos (listas, columnas, cálculos, almacenamiento)
   Si necesitas cambiar una lista desplegable, edítala en LISTAS.
   ========================================================= */
(function (root) {
  'use strict';

  var KEY = 'jej_app_v1';

  /* ---------- Listas desplegables ---------- */
  var LISTAS = {
    turno:      ['A', 'B'],
    siNo:       ['Si', 'No'],
    nivel:      ['NP', 'UCL', 'Panel 2'],
    bloque:     ['B-2', 'B-6', 'Ext Fw', 'DHz'],
    fase:       ['1', '1 2/3', '2', '3', '4'],
    problemas:  ['Barra Pegada', 'Repasos', 'Cambio Bit', 'Cambio Barras', 'Equipo fuera servicio'],
    estadoTiro: ['Bueno', 'Tapado', 'Colapsado', 'Desviado', 'Obstruido'],
    signo:      ['Negativo', 'Positivo'],
    desvio:     ['Dentro', 'Fuera'],
    aguaEstado: ['Seco', 'Agua']
  };

  /* ---------- Definición de columnas del registro por tiro ---------- */
  // type: text | num | select | time | calc ; unit = unidad que se muestra al preguntar el dato
  var COLS = {
    perf: [
      { k: 'parada',     label: 'PARADA',                       type: 'text',   w: 6,  bg: '00B0F0' },
      { k: 'tiro',       label: 'TIRO',                         type: 'num',   w: 6,  bg: '00B0F0' },
      { k: 'mDiseno',    label: 'Mts Diseño',                   type: 'num',    w: 9,  bg: 'DCE6F1', unit: 'm' },
      { k: 'taco',       label: 'Taco teórico',                 type: 'num',    w: 8,  bg: 'DCE6F1', unit: 'm' },
      { k: 'mPerf',      label: 'Mts Perforados',               type: 'num',    w: 10, bg: 'DCE6F1', unit: 'm' },
      { k: 'cumpl',      label: 'Cumplimiento para carga de diseño', type: 'calc', calc: 'cumpl', fmt: 'pct', w: 11, bg: 'FDE9D9' },
      { k: 'problema',   label: 'Problemas durante la perforación', type: 'select', list: 'problemas', w: 14, bg: 'F8CBAD' },
      { k: 'alturaBarra',label: 'Altura barra pegada',          type: 'num',    w: 9,  bg: 'F8CBAD', unit: 'm' },
      { k: 'estado',     label: 'ESTADO TIRO',                  type: 'select', list: 'estadoTiro', w: 10, bg: 'FFF2CC' },
      { k: 'conAgua',    label: 'TIRO CON AGUA',                type: 'select', list: 'siNo', w: 8, bg: 'FFF2CC' },
      { k: 'signo',      label: 'TIRO NEGATIVO / POSITIVO',     type: 'select', list: 'signo', w: 10, bg: 'FFF2CC' },
      { k: 'desvio',     label: 'Desvío',                       type: 'select', list: 'desvio', w: 9, bg: 'FFF2CC' },
      { k: 'intentosDestape', label: 'Intentos de destape',     type: 'num', w: 9, bg: 'FFF2CC' },
      { k: 'numBarras',  label: 'Número de barras',              type: 'num', w: 9, bg: 'FFF2CC' },
      { k: 'brocas',     label: 'Brocas',                       type: 'text', w: 12, bg: 'DCE6F1' },
      { k: 'barras',     label: 'Barras',                       type: 'text', w: 12, bg: 'DCE6F1' },
      { k: 'abat',       label: 'ÁNGULO ABATIMIENTO',           type: 'num',    w: 10, bg: '7030A0', fg: 'FFFFFF', unit: '°' },
      { k: 'rot',        label: 'ÁNGULO ROTACIÓN',              type: 'num',    w: 10, bg: '7030A0', fg: 'FFFFFF', unit: '°' },
      { k: 'entubados',  label: 'MTS ENTUBADOS',                type: 'num',    w: 9,  bg: 'FF99FF', unit: 'm' },
      { k: 'pPerc',      label: 'Presión de Percusión [bar]',   type: 'num',    w: 10, bg: '1F4E78', fg: 'FFFFFF', unit: 'bar' },
      { k: 'pRot',       label: 'Presión de Rotación [bar]',    type: 'num',    w: 10, bg: '1F4E78', fg: 'FFFFFF', unit: 'bar' },
      { k: 'pAv',        label: 'Presión de Avance [bar]',      type: 'num',    w: 10, bg: '1F4E78', fg: 'FFFFFF', unit: 'bar' },
      { k: 'pAgua',      label: 'Presión de Agua [bar]',        type: 'num',    w: 10, bg: '1F4E78', fg: 'FFFFFF', unit: 'bar' },
      { k: 'pComp',      label: 'Presión de Compresor de Aceite [bar]', type: 'num', w: 11, bg: '1F4E78', fg: 'FFFFFF', unit: 'bar' },
      { k: 'golpes',     label: 'Percusión martillo (golpes/min)', type: 'num', w: 11, bg: 'A9E4B8', unit: 'golpes/min', sinCaptura: true },
      { k: 'rpm',        label: 'Rotación (RPM)',               type: 'num',    w: 9,  bg: 'A9E4B8', unit: 'RPM', sinCaptura: true },
      { k: 'vAv',        label: 'Velocidad de Avance [m/tiempo]', type: 'num',  w: 11, bg: 'A9E4B8', unit: 'm/tiempo', sinCaptura: true },
      { k: 'caudal',     label: 'Caudal agua barrido (m3/min)', type: 'num',    w: 11, bg: 'A9E4B8', unit: 'm³/min', sinCaptura: true },
      { k: 'hIni',       label: 'Hora Inicio',                  type: 'time',   w: 8,  bg: 'D9D9D9' },
      { k: 'hFin',       label: 'Hora Término',                 type: 'time',   w: 8,  bg: 'D9D9D9' },
      { k: 'tTiro',       label: 'Tiempo Perforación del Tiro [min]', type: 'calc', calc: 'tTiro', fmt: 'num1', w: 11, bg: 'D9D9D9' },
      { k: 'trabajo',    label: 'ID TRABAJO',                   type: 'text',   w: 12, bg: 'D9D9D9', sinCaptura: true }
    ]
  };

  /* ---------- Utilidades numéricas / horarias ---------- */
  function num(v) {
    if (v === null || v === undefined || v === '') return NaN;
    var n = parseFloat(String(v).replace(',', '.'));
    return isFinite(n) ? n : NaN;
  }
  function fmt(n, d) {
    if (!isFinite(n)) return '';
    return n.toFixed(d === undefined ? 1 : d).replace('.', ',');
  }
  function toMin(hhmm) {
    if (!hhmm || !/^\d{1,2}:\d{2}/.test(hhmm)) return NaN;
    var p = hhmm.split(':'); return (+p[0]) * 60 + (+p[1]);
  }
  function diffMin(a, b) { // de a hasta b, admite cruce de medianoche
    var x = toMin(a), y = toMin(b);
    if (isNaN(x) || isNaN(y)) return NaN;
    return ((y - x) % 1440 + 1440) % 1440;
  }
  function fmtHM(min) {
    if (!isFinite(min)) return '00:00';
    var h = Math.floor(min / 60), m = Math.round(min % 60);
    if (m === 60) { h++; m = 0; }
    return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
  }

  /* ---------- Cálculos de la planilla ---------- */
  var calc = {
    // (Perforado − taco) / (Diseño − taco): cuánto del largo de carga de diseño se alcanzó
    cumpl: function (r) {
      var d = num(r.mDiseno), p = num(r.mPerf), t = num(r.taco);
      if (isNaN(t)) t = 0;
      if (isNaN(d) || isNaN(p) || d - t <= 0) return 0;
      return Math.max(0, (p - t) / (d - t));
    },
    tTiro: function (r) { return diffMin(r.hIni, r.hFin); }
  };
  function tPostura(h) { return diffMin(h.hLlegPyt, h.hSalPyt); }
  function tPerforacion(h) { return diffMin(h.hIniPerf, h.hFinPerf); }
  function totalPerdidas(p) {
    var s = 0; p.perdidas.forEach(function (x) { var m = toMin(x.tiempo); if (!isNaN(m)) s += m; });
    return s;
  }
  function filaUsada(r) {
    return !!(r.capturado || r.mDiseno || r.mPerf || r.estado || r.problema || r.pPerc || r.pAv);
  }
  function filaTieneDatos(r) {
    return Object.keys(r).some(function (k) { return r[k] !== '' && r[k] !== null && r[k] !== undefined; });
  }

  function resumen(p) {
    var usadas = p.filas.filter(filaUsada);
    var mDis = 0, mPerf = 0, mDisPar = 0, sumCumpl = 0, nCumpl = 0, minTiros = 0, prob = {}, paradas = {};
    usadas.forEach(function (r) {
      var d = num(r.mDiseno), m = num(r.mPerf);
      if (!isNaN(d)) mDis += d;
      if (!isNaN(m)) mPerf += m;
      if (!isNaN(d) && !isNaN(m)) { sumCumpl += calc.cumpl(r); nCumpl++; mDisPar += d; }
      var t = calc.tTiro(r); if (!isNaN(t)) minTiros += t;
      if (r.problema) prob[r.problema] = (prob[r.problema] || 0) + 1;
      var key = (r.trabajo || '') + '||' + (r.parada === '' ? '—' : r.parada);
      var g = paradas[key] || (paradas[key] = { trabajo: r.trabajo || '', parada: r.parada === '' ? '—' : r.parada, tiros: 0, mDis: 0, mDisPar: 0, mPerf: 0, minutos: 0 });
      g.tiros++; if (!isNaN(d)) g.mDis += d; if (!isNaN(m)) g.mPerf += m; if (!isNaN(d) && !isNaN(m)) g.mDisPar += d;
      if (!isNaN(t)) g.minutos += t;
    });
    var tPerf = tPerforacion(p.header);
    var horasRef = !isNaN(tPerf) && tPerf > 0 ? tPerf / 60 : (minTiros > 0 ? minTiros / 60 : NaN);
    return {
      nTiros: usadas.length, mDis: mDis, mPerf: mPerf,
      desvio: mDisPar > 0 ? (mPerf - mDisPar) / mDisPar : NaN,
      cumplProm: nCumpl ? sumCumpl / nCumpl : NaN,
      minTiros: minTiros, tPostura: tPostura(p.header), tPerf: tPerf,
      tPerdidas: totalPerdidas(p),
      rendimiento: isNaN(horasRef) ? NaN : mPerf / horasRef,
      problemas: prob,
      paradas: Object.keys(paradas).map(function (k) { return paradas[k]; })
    };
  }

  /* ---------- Almacenamiento (localStorage con respaldo en memoria) ---------- */
  var mem = null;
  function uid() { return 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  function filaVaciaPerf() { var o = {}; COLS.perf.forEach(function (c) { if (c.type !== 'calc') o[c.k] = ''; }); return o; }

  var HEADER_KEYS = ['fecha', 'turno', 'mina', 'nivel', 'bloque', 'idTronadura', 'supJej', 'encSeg', 'supDet', 'perforistaDet',
    'hLlegJej', 'hSalJej', 'hLlegPyt', 'hIniPerf', 'hFinPerf', 'hSalPyt', 'diametro', 'idEquipo',
    'numZanja', 'calleZanja1', 'calleZanja2', 'fase', 'calleUcl', 'paradaIni', 'paradaFin'];

  function nuevaPlanilla() {
    var p = { id: uid(), header: {}, perdidas: [], filas: [], obs: [], refAbat: 'horizontal', trabajos: [], trabajoActual: '' };
    HEADER_KEYS.forEach(function (k) { p.header[k] = ''; });
    var hoy = new Date();
    p.header.fecha = hoy.getFullYear() + '-' + ('0' + (hoy.getMonth() + 1)).slice(-2) + '-' + ('0' + hoy.getDate()).slice(-2);
    p.header.mina = 'Esmeralda'; p.header.nivel = 'NP'; p.header.bloque = 'Ext Fw';
    for (var k = 0; k < 10; k++) p.obs.push('');
    return p;
  }
  function normalizar(p) {
    var base = nuevaPlanilla();
    p.header = Object.assign(base.header, p.header || {});
    p.perdidas = (p.perdidas || []).filter(function (x) { return x && (x.desc || x.tiempo); });
    p.filas = (p.filas || []).map(function (f) { var o = Object.assign(filaVaciaPerf(), f); delete o.obs; return o; }).filter(filaTieneDatos);
    p.obs = p.obs && p.obs.length ? p.obs : base.obs;
    p.refAbat = p.refAbat === 'vertical' ? 'vertical' : 'horizontal';
    delete p.carguio; 
    p.trabajos = Array.isArray(p.trabajos) ? p.trabajos.filter(Boolean) : [];
    p.filas.forEach(function (f) {
      if (!f.trabajo) f.trabajo = 'Trabajo 01';
      if (p.trabajos.indexOf(f.trabajo) < 0) p.trabajos.push(f.trabajo);
    });
    if (!p.trabajoActual || p.trabajos.indexOf(p.trabajoActual) < 0) p.trabajoActual = p.trabajos[0] || '';
    return p;
  }

  var state = { planillas: {}, actual: null };
  function load() {
    var raw = null;
    try { raw = root.localStorage.getItem(KEY); } catch (e) { raw = mem; }
    if (raw) {
      try {
        var s = JSON.parse(raw);
        Object.keys(s.planillas || {}).forEach(function (id) { s.planillas[id] = normalizar(s.planillas[id]); });
        state = s;
      } catch (e) { /* datos corruptos: se parte vacío */ }
    }
    if (!state.actual || !state.planillas[state.actual]) {
      var ids = Object.keys(state.planillas);
      if (ids.length) state.actual = ids[0];
      else { var p = nuevaPlanilla(); state.planillas[p.id] = p; state.actual = p.id; }
    }
  }
  var timer = null;
  function save() {
    var s = JSON.stringify(state);
    try { root.localStorage.setItem(KEY, s); } catch (e) { mem = s; }
  }
  function touch() { clearTimeout(timer); timer = setTimeout(save, 250); }

  var store = {
    current: function () { return state.planillas[state.actual]; },
    list: function () { return Object.keys(state.planillas).map(function (id) { return state.planillas[id]; }); },
    setCurrent: function (id) { if (state.planillas[id]) { state.actual = id; save(); } },
    create: function () {
      var p = nuevaPlanilla(), c = state.planillas[state.actual];
      if (c) ['mina', 'nivel', 'bloque', 'encSeg', 'supJej', 'diametro', 'idEquipo'].forEach(function (k) { if (c.header[k]) p.header[k] = c.header[k]; });
      state.planillas[p.id] = p; state.actual = p.id; save(); return p; },
    remove: function (id) {
      delete state.planillas[id];
      if (!Object.keys(state.planillas).length) { var p = nuevaPlanilla(); state.planillas[p.id] = p; }
      if (!state.planillas[state.actual]) state.actual = Object.keys(state.planillas)[0];
      save();
    },
    touch: touch, saveNow: save,
    exportJSON: function () { return JSON.stringify(state, null, 1); },
    importJSON: function (text) {
      var s = JSON.parse(text);
      if (!s || !s.planillas) throw new Error('Archivo de respaldo no válido');
      Object.keys(s.planillas).forEach(function (id) { state.planillas[id] = normalizar(s.planillas[id]); });
      state.actual = s.actual && state.planillas[s.actual] ? s.actual : Object.keys(state.planillas)[0];
      save();
    },
    etiqueta: function (p) {
      var h = p.header;
      return (h.idTronadura || 'Sin ID') + ' · ' + (h.fecha || 'sin fecha') + ' · Turno ' + (h.turno || '–');
    },
    filaVaciaPerf: filaVaciaPerf
  };
  load();
  var planillaActiva = store.current();
  var fechaActual = new Date();
  var fechaUso = fechaActual.getFullYear() + '-' + ('0' + (fechaActual.getMonth() + 1)).slice(-2) + '-' + ('0' + fechaActual.getDate()).slice(-2);
  if (planillaActiva && planillaActiva.header.fecha !== fechaUso) {
    planillaActiva.header.fecha = fechaUso;
    save();
  }

  root.JEJ = {
    LISTAS: LISTAS, COLS: COLS, store: store, calc: calc,
    num: num, fmt: fmt, toMin: toMin, fmtHM: fmtHM, diffMin: diffMin,
    tPostura: tPostura, tPerforacion: tPerforacion, totalPerdidas: totalPerdidas,
    resumen: resumen, filaUsada: filaUsada
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.JEJ;
})(typeof window !== 'undefined' ? window : globalThis);

/* ===================== EXPORTACIÓN A EXCEL ===================== */
/* =========================================================
   JEJ · Exportación a Excel (.xlsx) con ExcelJS
   Replica la "Hoja de terreno control de perforación":
   colores de encabezado, listas desplegables y fórmulas vivas.
   ========================================================= */
(function (root) {
  'use strict';
  var J = root.JEJ;

  function colLetter(n) { var s = ''; while (n > 0) { var m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; }
  function colNum(s) { var n = 0; for (var i = 0; i < s.length; i++) n = n * 26 + s.charCodeAt(i) - 64; return n; }
  function argb(hex) { return 'FF' + hex; }
  var THIN = { style: 'thin', color: { argb: 'FF000000' } };
  var BORDER = { top: THIN, left: THIN, bottom: THIN, right: THIN };
  function fill(hex) { return { type: 'pattern', pattern: 'solid', fgColor: { argb: argb(hex) } }; }

  function timeVal(s) { var m = J.toMin(s); return isNaN(m) ? null : m / 1440; }
  function autoNum(v) { return /^\d+([.,]\d+)?$/.test(String(v)) ? J.num(v) : v; }
  function cellVal(col, v) {
    if (v === '' || v === undefined || v === null) return null;
    if (col.type === 'select') return autoNum(v);
    if (col.type === 'num') { var n = J.num(v); return isNaN(n) ? String(v) : n; }
    if (col.type === 'time') return timeVal(v);
    return String(v);
  }

  function build(ExcelJS, p) {
    var wb = new ExcelJS.Workbook();
    wb.creator = 'App JEJ'; wb.created = new Date();
    var ws = wb.addWorksheet('Perforación', { views: [{ showGridLines: false }] });
    var wl = wb.addWorksheet('Listas');

    /* ---------- Hoja Listas ---------- */
    var listaRef = {}; var ci = 1;
    var NOMBRES = { turno: 'TURNO', siNo: 'Si / No', nivel: 'Nivel', bloque: 'Bloque', fase: 'Fase',
      problemas: 'Problemas durante la perforación', estadoTiro: 'Estado Tiro', signo: 'Tiro Negativo / Positivo' };
    Object.keys(J.LISTAS).forEach(function (k) {
      var L = colLetter(ci), arr = J.LISTAS[k];
      var h = wl.getCell(L + '1'); h.value = NOMBRES[k] || k; h.font = { bold: true }; h.alignment = { wrapText: true, horizontal: 'center' };
      arr.forEach(function (v, i) { wl.getCell(L + (i + 2)).value = autoNum(v); wl.getCell(L + (i + 2)).alignment = { horizontal: 'center' }; });
      wl.getColumn(ci).width = 16;
      listaRef[k] = 'Listas!$' + L + '$2:$' + L + '$' + (arr.length + 1);
      ci++;
    });
    function validar(cell, key) {
      cell.dataValidation = { type: 'list', allowBlank: true, formulae: [listaRef[key]] };
    }

    /* ---------- Hoja Perforación ---------- */
    var C = J.COLS.perf;
    C.forEach(function (c, i) { ws.getColumn(i + 1).width = c.w; });
    function merge(rng, value, st) {
      ws.mergeCells(rng);
      var cell = ws.getCell(rng.split(':')[0]);
      if (value !== undefined) cell.value = value;
      if (st) Object.keys(st).forEach(function (k) { cell[k] = st[k]; });
      var m = rng.match(/([A-Z]+)(\d+):([A-Z]+)(\d+)/);
      if (m && st && st.border) {
        var c1 = colNum(m[1]), c2 = colNum(m[3]);
        for (var r = +m[2]; r <= +m[4]; r++) for (var c = c1; c <= c2; c++) ws.getCell(r, c).border = st.border;
      }
      return cell;
    }

    var titulo = { font: { bold: true, size: 11 }, alignment: { horizontal: 'center', vertical: 'middle' } };
    merge('A1:AA1', 'HOJA DE TERRENO CONTROL DE PERFORACIÓN', titulo);
    merge('A2:AA2', 'J. E. J. INGENIERÍA S. A. CONTRATO N° 4600026097', titulo);
    merge('A3:AA3', 'SERVICIO QA/QC OPERACIONES DE PERFORACIÓN Y TRONADURA', titulo);
    ws.getRow(1).height = 20; ws.getRow(2).height = 20; ws.getRow(3).height = 20;

    var H = p.header;
    var lbl = function (hex) { return { font: { bold: true, size: 9 }, fill: fill(hex), border: BORDER, alignment: { vertical: 'middle', wrapText: true } }; };
    var val = function (hex) { return { font: { size: 9 }, fill: hex ? fill(hex) : undefined, border: BORDER, alignment: { vertical: 'middle', horizontal: 'center' } }; };
    var AZUL = 'DDEBF7', VERDE = '00FF00', AMAR = 'FFE699';

    // Grupo 1: A:C etiqueta, D:E valor
    var g1 = [
      ['Fecha', H.fecha, AZUL, 'date'], ['Turno', H.turno, AZUL, 'turno'], ['Mina', H.mina, AZUL], ['Nivel', H.nivel, AZUL, 'nivel'],
      ['Bloque', H.bloque, AZUL, 'bloque'], ['ID Tronadura', H.idTronadura, AMAR], ['Supervisor JeJ', H.supJej, AZUL],
      ['Encargado Seguimiento JeJ', H.encSeg, AZUL], ['Supervisor DET', H.supDet, VERDE], ['Perforista DET', H.perforistaDet, VERDE]
    ];
    g1.forEach(function (f, i) {
      var r = 5 + i;
      merge('A' + r + ':C' + r, f[0], lbl(f[2]));
      var v = f[1];
      if (f[3] === 'date' && v) { var dm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v); v = dm ? new Date(Date.UTC(+dm[1], +dm[2] - 1, +dm[3])) : v; }
      var cell = merge('D' + r + ':E' + r, v === '' ? null : v, val(f[2]));
      if (f[3] === 'date') cell.numFmt = 'dd-mm-yyyy';
      if (f[3] === 'turno' || f[3] === 'nivel' || f[3] === 'bloque') validar(cell, f[3]);
    });
    ws.getRow(12).height = 24;

    // Grupo 2: G:I etiqueta, J:K valor
    var T = function (k) { return timeVal(H[k]); };
    var g2 = [
      ['H Llegada JeJ a Postura', T('hLlegJej'), VERDE, 'time'], ['H Salida JeJ de Postura', T('hSalJej'), VERDE, 'time'],
      ['H Llegada PyT a Postura', T('hLlegPyt'), VERDE, 'time'], ['H Inicio Perforación', T('hIniPerf'), VERDE, 'time'],
      ['H Fin Perforación', T('hFinPerf'), VERDE, 'time'], ['H Salida PyT de Postura', T('hSalPyt'), VERDE, 'time'],
      ['Tiempo en Postura', { formula: 'IF(AND(J10<>"",J7<>""),MOD(J10-J7,1),0)', result: (J.tPostura(H) || 0) / 1440 }, AMAR, 'time'],
      ['Tiempo en Perforación', { formula: 'IF(AND(J9<>"",J8<>""),MOD(J9-J8,1),0)', result: (J.tPerforacion(H) || 0) / 1440 }, AMAR, 'time'],
      ['Diámetro Perforación [pulg]', H.diametro === '' ? null : (isNaN(J.num(H.diametro)) ? H.diametro : J.num(H.diametro)), AZUL],
      ['ID Del Equipo de Perforación', H.idEquipo === '' ? null : H.idEquipo, VERDE]
    ];
    g2.forEach(function (f, i) {
      var r = 5 + i;
      merge('G' + r + ':I' + r, f[0], lbl(f[2]));
      var cell = merge('J' + r + ':K' + r, f[1], val(f[2]));
      if (f[3] === 'time') cell.numFmt = 'hh:mm';
    });

    // Grupo 3: M:O etiqueta, P:Q valor
    merge('M5:O5', 'Núm. Zanja', lbl(VERDE)); merge('P5:Q5', H.numZanja || null, val(VERDE));
    merge('M6:O7', 'Calles Zanja', lbl(VERDE));
    merge('P6:P7', H.calleZanja1 || null, val(VERDE)); merge('Q6:Q7', H.calleZanja2 || null, val(VERDE));
    merge('M8:O8', 'Fase', lbl(AZUL)); var cf = merge('P8:Q8', H.fase || null, val(AZUL)); validar(cf, 'fase');
    merge('M9:O9', 'Calle UCL', lbl(VERDE)); merge('P9:Q9', H.calleUcl || null, val(VERDE));
    merge('M10:O10', 'Parada Inicial', lbl(VERDE)); merge('P10:Q10', H.paradaIni || null, val(VERDE));
    merge('M11:O11', 'Parada Final (neg)', lbl(VERDE)); merge('P11:Q11', H.paradaFin || null, val(VERDE));

    // Pérdida operacional: S:Z observación, AA tiempo (crece si hay más de 9 pérdidas)
    var perd = p.perdidas.filter(function (x) { return x.desc || x.tiempo; });
    var nP = Math.max(9, perd.length);
    merge('S5:Z5', 'Pérdida Operacional Durante la Perforación · Observación', { font: { bold: true, size: 9 }, fill: fill('FCE4D6'), border: BORDER, alignment: { horizontal: 'center', vertical: 'middle' } });
    ws.getCell('AA5').value = 'TIEMPO'; ws.getCell('AA5').font = { bold: true, size: 8 }; ws.getCell('AA5').border = BORDER;
    ws.getCell('AA5').alignment = { horizontal: 'center' }; ws.getCell('AA5').fill = fill('FCE4D6');
    for (var pi = 0; pi < nP; pi++) {
      var x = perd[pi] || { desc: '', tiempo: '' }, rp = 6 + pi;
      merge('S' + rp + ':Z' + rp, x.desc || null, { font: { size: 9 }, border: BORDER });
      var cp = ws.getCell('AA' + rp); cp.value = timeVal(x.tiempo); cp.numFmt = 'hh:mm'; cp.border = BORDER; cp.alignment = { horizontal: 'center' };
    }
    var rTot = 6 + nP;
    var tot = ws.getCell('AA' + rTot);
    tot.value = { formula: 'SUM(AA6:AA' + (5 + nP) + ')', result: J.totalPerdidas(p) / 1440 }; tot.numFmt = '[h]:mm'; tot.font = { bold: true, size: 9 };
    tot.border = BORDER; tot.alignment = { horizontal: 'center' };
    merge('S' + rTot + ':Z' + rTot, 'Total pérdida operacional', { font: { bold: true, size: 9 }, alignment: { horizontal: 'right' } });

    /* tabla de tiros */
    var HR = 7 + nP; // fila de encabezado (16 cuando hay 9 pérdidas)
    C.forEach(function (c, i) {
      var cell = ws.getCell(HR, i + 1);
      cell.value = c.label;
      cell.font = { bold: true, size: 8, color: { argb: argb(c.fg || '000000') } };
      cell.fill = fill(c.bg); cell.border = BORDER;
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    });
    ws.getRow(HR).height = 48;
    var filas = p.filas.filter(J.filaUsada);
    var n = Math.max(20, filas.length);
    var idx = {}; C.forEach(function (c, i) { idx[c.k] = i + 1; });
    for (var i = 0; i < n; i++) {
      var r = HR + 1 + i, row = filas[i] || {};
      C.forEach(function (c, j) {
        var cell = ws.getCell(r, j + 1);
        cell.border = BORDER; cell.font = { size: 9 };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        if (c.type === 'calc') return;
        cell.value = cellVal(c, row[c.k]);
        if (c.type === 'time') cell.numFmt = 'hh:mm';
        if (c.type === 'select') validar(cell, c.list);
      });
      var D = colLetter(idx.taco) + r, E = colLetter(idx.mPerf) + r, Cc = colLetter(idx.mDiseno) + r;
      var cu = ws.getCell(r, idx.cumpl);
      cu.value = { formula: 'IFERROR(MAX(0,(' + E + '-' + D + ')/(' + Cc + '-' + D + ')),0)', result: J.calc.cumpl(row) };
      cu.numFmt = '0%';
      var hi = colLetter(idx.hIni) + r, hf = colLetter(idx.hFin) + r;
      var tt = ws.getCell(r, idx.tTiro), tm = J.calc.tTiro(row);
      tt.value = { formula: 'IF(AND(' + hi + '<>"",' + hf + '<>""),MOD(' + hf + '-' + hi + ',1)*1440,0)', result: isNaN(tm) ? 0 : tm };
      tt.numFmt = '0.0';
    }
    var last = HR + n;
    // Totales de metros
    var rt = last + 1;
    ws.getCell(rt, 1).value = 'TOTAL'; ws.getCell(rt, 1).font = { bold: true, size: 9 };
    ['mDiseno', 'mPerf', 'tTiro'].forEach(function (k) {
      var L = colLetter(idx[k]);
      var cell = ws.getCell(rt, idx[k]);
      var res = 0; filas.forEach(function (f) { var v = k === 'tTiro' ? J.calc.tTiro(f) : J.num(f[k]); if (!isNaN(v)) res += v; });
      cell.value = { formula: 'SUM(' + L + (HR + 1) + ':' + L + last + ')', result: res };
      cell.font = { bold: true, size: 9 }; cell.alignment = { horizontal: 'center' }; cell.border = BORDER;
      if (k === 'tTiro') cell.numFmt = '0.0';
    });

    // Otras observaciones
    var ob = rt + 2;
    merge('A' + ob + ':' + colLetter(C.length) + ob, 'OTRAS OBSERVACIONES EN TERRENO', { font: { bold: true, size: 9 }, fill: fill('FFF2CC'), border: BORDER, alignment: { horizontal: 'center' } });
    for (var o = 0; o < Math.max(10, p.obs.length); o++) {
      merge('A' + (ob + 1 + o) + ':' + colLetter(C.length) + (ob + 1 + o), p.obs[o] || null, { font: { size: 9 }, border: BORDER });
    }
    ws.views = [{ showGridLines: false, state: 'frozen', xSplit: 2, ySplit: HR }];
    ws.pageSetup = { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 };

    return wb;
  }

  function nombreArchivo(p) {
    var h = p.header;
    return ('Perforacion_' + (h.idTronadura || 'sin-ID') + '_' + (h.fecha || 'sin-fecha')).replace(/[^\w\-]+/g, '_') + '.xlsx';
  }

  function download(p) {
    var EJS = root.ExcelJS;
    if (!EJS) { alert('No se cargó ExcelJS. Compruebe que js/vendor/exceljs.min.js esté disponible.'); return Promise.resolve(); }
    var wb = build(EJS, p);
    return wb.xlsx.writeBuffer().then(function (buf) {
      var blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      if (root.JEJArchivo && typeof root.JEJArchivo.guardar === 'function') {
        return root.JEJArchivo.guardar(nombreArchivo(p), blob, blob.type);
      }
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = nombreArchivo(p);
      document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 2500);
    });
  }

  root.JEJ.excel = { build: build, download: download, nombreArchivo: nombreArchivo };
})(typeof window !== 'undefined' ? window : globalThis);

/* ===================== COMPONENTES DE INTERFAZ ===================== */
/* =========================================================
   JEJ · Componentes de interfaz: barra superior y campos de formulario.
   ========================================================= */
(function (root) {
  'use strict';
  var J = root.JEJ;

  function el(tag, attrs, kids) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'class') e.className = attrs[k];
      else if (k === 'text') e.textContent = attrs[k];
      else if (k === 'style') e.style.cssText = attrs[k];
      else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] !== undefined && attrs[k] !== null) e.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return e;
  }
  function $(sel) { return typeof sel === 'string' ? document.querySelector(sel) : sel; }

  function opciones(sel, lista, actual) {
    sel.innerHTML = '';
    sel.appendChild(el('option', { value: '', text: '' }));
    var found = false;
    lista.forEach(function (v) {
      var o = el('option', { value: v, text: v }); if (v === actual) { o.selected = true; found = true; }
      sel.appendChild(o);
    });
    if (actual && !found) { var o2 = el('option', { value: actual, text: actual }); o2.selected = true; sel.appendChild(o2); }
  }

  /* ---------- Barra superior: planilla activa, nueva, eliminar, descargas ---------- */
  function toolbar(host, opt) {
    // Barra superior eliminada: la selección de planilla y las descargas ya no se muestran aquí.
    host = $(host);
    host.innerHTML = '';
    host.classList.remove('anfo-perforacion-toolbar');
    host.hidden = true;
  }

  /* ---------- Campo de formulario ---------- */
  // def: {k,label,type:text|date|time|select|calc, list, cls}
  function campo(def, obj, onInput, calcFn) {
    var wrap = el('div', { class: 'anfo-perforacion-campo form-group-field' + (def.cls || '') });
    wrap.appendChild(el('label', { text: def.label }));
    var inp;
    if (def.type === 'calc') {
      inp = el('output', { class: 'anfo-perforacion-calc', 'data-calc': def.k, text: calcFn ? calcFn() : '' });
    } else if (def.type === 'select') {
      inp = el('select'); opciones(inp, J.LISTAS[def.list], obj[def.k]);
      inp.addEventListener('change', function () { obj[def.k] = inp.value; onInput && onInput(def.k); });
    } else {
      inp = el('input', { type: def.type || 'text', value: obj[def.k] || '' });
      inp.addEventListener('input', function () { obj[def.k] = inp.value; onInput && onInput(def.k); });
    }
    wrap.appendChild(inp);
    return wrap;
  }

  J.ui = { el: el, $: $, toolbar: toolbar, campo: campo, opciones: opciones };
})(typeof window !== 'undefined' ? window : globalThis);

/* ===================== DIAGRAMAS DE DISPARO ===================== */
/* =========================================================
   JEJ · Diagramas de disparo (SVG) a partir de la planilla
   Convención (editable en el paso "Finalizar"):
   - Abatimiento: ángulo del tiro respecto de la horizontal (o de la vertical,
     según la opción elegida). Signo: columna "Tiro negativo / positivo".
   - Rotación: ángulo en planta medido desde el eje de la labor
     (0° = a lo largo de la labor, 90° = hacia la derecha, 270° = hacia la izquierda).
   ========================================================= */
(function (root) {
  'use strict';
  var J = root.JEJ;
  var RAD = Math.PI / 180;
  var COL = { fondo: '#f8fafc', piso: '#eef2f7', borde: '#dbe3ec', anillo: '#c3cfdc', eje: '#475569', taco: '#64748b',
              carga: '#ea580c', dis: '#94a3b8', alerta: '#dc2626', texto: '#0f172a', collar: '#12263f' };
  var FONT = 'Segoe UI,system-ui,Arial,sans-serif';

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function f1(n) { return (Math.round(n * 10) / 10).toString(); }

  // Devuelve null si el tiro no tiene ángulo de abatimiento
  function geometria(row, ref) {
    var a = J.num(row.abat); if (isNaN(a)) return null;
    var r = J.num(row.rot), supuesto = false;
    if (isNaN(r)) { r = 90; supuesto = true; }
    var mag = Math.abs(a);
    if (ref === 'vertical') mag = 90 - mag;
    var sg = row.signo === 'Negativo' ? -1 : (row.signo === 'Positivo' ? 1 : (a < 0 ? -1 : 1));
    var elev = sg * mag * RAD, az = r * RAD;
    var L = J.num(row.mPerf); if (isNaN(L)) L = J.num(row.mDiseno);
    var Ld = J.num(row.mDiseno);
    if (isNaN(L)) return null;
    var u = { across: Math.cos(elev) * Math.sin(az), along: Math.cos(elev) * Math.cos(az), up: Math.sin(elev) };
    return { u: u, L: L, Ld: isNaN(Ld) ? null : Ld, taco: Math.max(0, J.num(row.taco) || 0), supuesto: supuesto, row: row,
             mag: mag, sg: sg, rot: r, conProblema: !!(row.estado && row.estado !== 'Bueno') };
  }

  function flecha(x, y, dir) { // punta de flecha pequeña en (x,y) apuntando según dir
    var d = 5, w = 3.2;
    var p = { u: [x, y - d, x - w, y, x + w, y], d: [x, y + d, x - w, y, x + w, y], l: [x - d, y, x, y - w, x, y + w], r: [x + d, y, x, y - w, x, y + w] }[dir];
    return '<polygon points="' + p.join(',') + '" fill="' + COL.eje + '"/>';
  }
  function etiquetaEje(x, y, txt, anchor) {
    return '<text x="' + x + '" y="' + y + '" text-anchor="' + anchor + '" fill="' + COL.eje + '" font-weight="600" font-size="11" paint-order="stroke" stroke="' + COL.fondo + '" stroke-width="3">' + txt + '</text>';
  }

  function vista(rows, modo, ref) {
    var W = 520, H = 520, cx = W / 2, cy = H / 2, m = 54;
    var geos = rows.map(function (r) { return geometria(r, ref); }).filter(Boolean);
    var omitidos = rows.length - geos.length;
    var maxL = 5; geos.forEach(function (g) { maxL = Math.max(maxL, g.L, g.Ld || 0); });
    var paso = maxL > 40 ? 10 : (maxL > 15 ? 5 : 2);
    var tope = Math.ceil(maxL / paso) * paso;
    var s = (W / 2 - m) / tope;
    var o = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" font-family="' + FONT + '" font-size="11">'];

    // fondo: tarjeta con mitad inferior sombreada (piso) en la sección transversal
    o.push('<rect x="1" y="1" width="' + (W - 2) + '" height="' + (H - 2) + '" rx="14" fill="' + COL.fondo + '"/>');
    if (modo === 'seccion') {
      o.push('<path d="M1 ' + cy + ' H' + (W - 1) + ' V' + (H - 15) + ' Q' + (W - 1) + ' ' + (H - 1) + ' ' + (W - 15) + ' ' + (H - 1) + ' H15 Q1 ' + (H - 1) + ' 1 ' + (H - 15) + ' Z" fill="' + COL.piso + '"/>');
    }
    o.push('<rect x="1" y="1" width="' + (W - 2) + '" height="' + (H - 2) + '" rx="14" fill="none" stroke="' + COL.borde + '"/>');

    // anillos de distancia
    for (var d = paso; d <= tope; d += paso) {
      var rr = d * s;
      o.push('<circle cx="' + cx + '" cy="' + cy + '" r="' + rr.toFixed(1) + '" fill="none" stroke="' + COL.anillo + '" stroke-dasharray="2 5" stroke-linecap="round"/>');
      o.push('<text x="' + (cx + rr * 0.7071 + 3).toFixed(1) + '" y="' + (cy - rr * 0.7071 - 3).toFixed(1) + '" fill="#64748b" font-size="10" paint-order="stroke" stroke="' + COL.fondo + '" stroke-width="3">' + d + ' m</text>');
    }
    // ejes
    o.push('<line x1="' + m / 2 + '" y1="' + cy + '" x2="' + (W - m / 2) + '" y2="' + cy + '" stroke="' + COL.eje + '" stroke-width="1"/>');
    o.push('<line x1="' + cx + '" y1="' + m / 2 + '" x2="' + cx + '" y2="' + (H - m / 2) + '" stroke="' + COL.eje + '" stroke-width="1"/>');
    o.push(flecha(m / 2, cy, 'l'), flecha(W - m / 2, cy, 'r'), flecha(cx, m / 2, 'u'), flecha(cx, H - m / 2, 'd'));
    var lb = modo === 'seccion' ? ['Izquierda', 'Derecha', 'Techo (+)', 'Piso (−)'] : ['Izquierda', 'Derecha', 'Avance de la labor', 'Retroceso'];
    o.push(etiquetaEje(m / 2 - 8, cy - 9, lb[0], 'start'));
    o.push(etiquetaEje(W - m / 2 + 8, cy - 9, lb[1], 'end'));
    o.push(etiquetaEje(cx + 10, 22, lb[2], 'start'));
    o.push(etiquetaEje(cx + 10, H - 12, lb[3], 'start'));

    function pt(g, L) {
      var x = g.u.across * L, y = modo === 'seccion' ? g.u.up * L : g.u.along * L;
      return [cx + x * s, cy - y * s];
    }
    var chips = [];
    // 1) largo de diseño (debajo de todo)
    geos.forEach(function (g) {
      if (g.Ld !== null && Math.abs(g.Ld - g.L) > 0.05) {
        var o0 = pt(g, 0), td = pt(g, g.Ld);
        o.push('<line x1="' + o0[0].toFixed(1) + '" y1="' + o0[1].toFixed(1) + '" x2="' + td[0].toFixed(1) + '" y2="' + td[1].toFixed(1) + '" stroke="' + COL.dis + '" stroke-width="1.4" stroke-dasharray="5 4"/>');
      }
    });
    // 2) tiros: taco + largo de carga
    geos.forEach(function (g) {
      var o0 = pt(g, 0), toe = pt(g, g.L), pc = pt(g, Math.min(g.taco, g.L));
      o.push('<line x1="' + o0[0].toFixed(1) + '" y1="' + o0[1].toFixed(1) + '" x2="' + pc[0].toFixed(1) + '" y2="' + pc[1].toFixed(1) + '" stroke="' + COL.taco + '" stroke-width="4" stroke-linecap="round"/>');
      o.push('<line x1="' + pc[0].toFixed(1) + '" y1="' + pc[1].toFixed(1) + '" x2="' + toe[0].toFixed(1) + '" y2="' + toe[1].toFixed(1) + '" stroke="' + COL.carga + '" stroke-width="4" stroke-linecap="round"/>');
      if (g.conProblema) o.push('<circle cx="' + toe[0].toFixed(1) + '" cy="' + toe[1].toFixed(1) + '" r="8" fill="none" stroke="' + COL.alerta + '" stroke-width="1.8"/>');
      o.push('<circle cx="' + toe[0].toFixed(1) + '" cy="' + toe[1].toFixed(1) + '" r="3.4" fill="#fff" stroke="' + COL.carga + '" stroke-width="2"/>');
      chips.push({ g: g, toe: toe });
    });
    // 3) etiquetas del número de tiro (encima de todo)
    chips.forEach(function (c) {
      var txt = String(c.g.row.tiro || ''); if (!txt) return;
      var dx = c.toe[0] - cx, dy = c.toe[1] - cy, n = Math.hypot(dx, dy) || 1;
      var wch = 7.4 * txt.length + 12, hch = 17;
      var lx = c.toe[0] + dx / n * (13 + wch / 4), ly = c.toe[1] + dy / n * 15;
      lx = Math.max(wch / 2 + 4, Math.min(W - wch / 2 - 4, lx)); ly = Math.max(hch / 2 + 4, Math.min(H - hch / 2 - 4, ly));
      o.push('<rect x="' + (lx - wch / 2).toFixed(1) + '" y="' + (ly - hch / 2).toFixed(1) + '" width="' + wch.toFixed(1) + '" height="' + hch + '" rx="8.5" fill="#fff" stroke="' + (c.g.conProblema ? COL.alerta : COL.collar) + '" stroke-width="1.2"/>');
      o.push('<text x="' + lx.toFixed(1) + '" y="' + (ly + 4).toFixed(1) + '" text-anchor="middle" fill="' + COL.texto + '" font-weight="700" font-size="11">' + esc(txt) + '</text>');
    });
    // collar
    o.push('<circle cx="' + cx + '" cy="' + cy + '" r="6" fill="#fff" stroke="' + COL.collar + '" stroke-width="2"/><circle cx="' + cx + '" cy="' + cy + '" r="2" fill="' + COL.collar + '"/>');
    o.push('</svg>');
    var fuera = geos.some(function (g) { return Math.abs(g.u.along) * g.L > 0.5; });
    return { svg: o.join(''), fueraDePlano: fuera, n: geos.length, omitidos: omitidos, supuestos: geos.filter(function (g) { return g.supuesto; }).length };
  }

  function leyenda() {
    return '<div class="jej-acciones-cabecera">' +
      '<span><i style="background:' + COL.taco + '"></i>Taco teórico</span>' +
      '<span><i style="background:' + COL.carga + '"></i>Largo de carga (perforado − taco)</span>' +
      '<span><i class="dash"></i>Largo de diseño (si difiere)</span>' +
      '<span><i class="ring"></i>Tiro con estado distinto de "Bueno"</span></div>';
  }

  /* Barras: metros de diseño vs perforados por tiro */
  function barras(rows) {
    var d = rows.filter(function (r) { return r.tiro || r.mPerf || r.mDiseno; });
    if (!d.length) return '';
    var W = Math.max(520, 40 * d.length + 80), H = 250, mL = 40, mB = 40, mT = 26;
    var max = 1; d.forEach(function (r) { max = Math.max(max, J.num(r.mDiseno) || 0, J.num(r.mPerf) || 0); });
    max = Math.ceil(max / 5) * 5;
    var ph = H - mB - mT, bw = (W - mL - 12) / d.length;
    var o = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;height:auto" font-family="' + FONT + '" font-size="10.5"><rect width="' + W + '" height="' + H + '" rx="12" fill="' + COL.fondo + '"/>'];
    for (var t = 0; t <= 4; t++) {
      var v = max * t / 4, y = mT + ph - ph * t / 4;
      o.push('<line x1="' + mL + '" x2="' + (W - 8) + '" y1="' + y + '" y2="' + y + '" stroke="#e2e8f0"/><text x="' + (mL - 6) + '" y="' + (y + 3.5) + '" text-anchor="end" fill="#64748b">' + J.fmt(v, 0) + '</text>');
    }
    var etiquetas = d.length <= 18;
    d.forEach(function (r, i) {
      var x = mL + i * bw + bw * 0.14, w = bw * 0.36;
      var a = J.num(r.mDiseno) || 0, b = J.num(r.mPerf) || 0;
      o.push('<rect x="' + x.toFixed(1) + '" y="' + (mT + ph - ph * a / max).toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + (ph * a / max).toFixed(1) + '" rx="2" fill="#b6c2d1"/>');
      o.push('<rect x="' + (x + w + 2).toFixed(1) + '" y="' + (mT + ph - ph * b / max).toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + (ph * b / max).toFixed(1) + '" rx="2" fill="#2563eb"/>');
      if (etiquetas && b) o.push('<text x="' + (x + w * 1.5 + 2).toFixed(1) + '" y="' + (mT + ph - ph * b / max - 4).toFixed(1) + '" text-anchor="middle" fill="#1e3a8a" font-size="9.5" font-weight="600">' + J.fmt(b, 1) + '</text>');
      o.push('<text x="' + (x + w + 1).toFixed(1) + '" y="' + (H - mB + 15) + '" text-anchor="middle" fill="#0f172a" font-weight="600">' + esc(r.tiro || '') + '</text>');
      if (r.parada) o.push('<text x="' + (x + w + 1).toFixed(1) + '" y="' + (H - mB + 27) + '" text-anchor="middle" fill="#64748b" font-size="9">P' + esc(r.parada) + '</text>');
    });
    o.push('<rect x="' + mL + '" y="6" width="10" height="10" rx="2" fill="#b6c2d1"/><text x="' + (mL + 15) + '" y="15" fill="#334155">Diseño [m]</text>');
    o.push('<rect x="' + (mL + 90) + '" y="6" width="10" height="10" rx="2" fill="#2563eb"/><text x="' + (mL + 105) + '" y="15" fill="#334155">Perforado [m]</text>');
    o.push('</svg>');
    return o.join('');
  }

  J.diagram = { vista: vista, leyenda: leyenda, barras: barras, geometria: geometria };
})(typeof window !== 'undefined' ? window : globalThis);

/* ===================== INFORME TÉCNICO ===================== */
/* =========================================================
   JEJ · Informe técnico (documento HTML autónomo, listo para
   imprimir o guardar como PDF) con resumen, tablas y diagramas.
   ========================================================= */
(function (root) {
  'use strict';
  var J = root.JEJ;

  function esc(s) { return String(s === undefined || s === null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function pct(v) { return isFinite(v) ? J.fmt(v * 100, 1) + '%' : '—'; }
  function tm(min) { return isFinite(min) ? J.fmtHM(min) : '—'; }
  function dash(v) { var t = esc(v); return t === '' ? '—' : t; }
  function fechaLarga(f) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(f || ''); return m ? m[3] + '-' + m[2] + '-' + m[1] : (f || '—');
  }

  var estilosInforme = [
    ':root{--ink:#142b54;--muted:#627697;--line:#d9e1ed;--navy:#10265b;--blue:#315ba8;--cyan:#22b8e8;--green:#159b62;--paper:#fff;--bg:#e9eef6}',
    '*{box-sizing:border-box}',
    'html{background:var(--bg)}body{margin:0;background:var(--bg);color:var(--ink);font:13px/1.45 system-ui,-apple-system,"Segoe UI",Arial,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}',
    '.jej-acciones-cabecera{position:sticky;top:0;z-index:5;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;padding:10px max(12px,env(safe-area-inset-left));background:#fff;border-bottom:1px solid var(--line);box-shadow:0 2px 8px #10265b18;color:var(--muted);font-size:12px}',
    '.jej-acciones-cabecera button{min-height:40px;padding:8px 14px;border:0;border-radius:9px;background:linear-gradient(#20c981,#0b985c);color:#fff;font:inherit;font-weight:800;cursor:pointer}',
    '.card-wide{width:min(1100px,calc(100% - 24px));max-width:1100px;margin:16px auto;background:var(--paper);border:1px solid var(--line);border-radius:14px;box-shadow:0 5px 20px #10265b18;overflow:hidden}',
    '.card-wide>.wizard-card:first-child{display:flex;justify-content:space-between;align-items:flex-end;gap:18px;margin:0;padding:22px 26px;color:#fff;background:linear-gradient(135deg,#183872,#0c1d48);border:0;border-bottom:4px solid var(--cyan);border-radius:0}',
    '.card-wide>.wizard-card:first-child .emp{margin:0 0 7px;color:#cfdef6;font-size:11px;letter-spacing:.03em}',
    '.card-wide>.wizard-card:first-child h1{margin:0;font-size:clamp(21px,4vw,30px);line-height:1.15}',
    '.card-wide>.wizard-card:first-child .id{margin-top:7px;color:#dce8fa;font-size:13px}',
    '.card-wide>.wizard-card:first-child .der{text-align:right;color:#dce8fa;font-size:12px;white-space:nowrap}',
    '.card-wide>.wizard-card:first-child .der b{display:block;color:#fff;font-size:20px}',
    '.resumen-box{margin:0;padding:18px 24px 22px;background:#fff;color:var(--ink);font-size:12px;line-height:1.5}',
    '.resumen-box h2{margin:21px 0 9px;padding:0 0 5px;border:0;border-bottom:2px solid #dce6f4;color:#193b78;font-size:15px;line-height:1.25;break-after:avoid}',
    '.resumen-box h2:first-child{margin-top:0}',
    '.grid-2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}',
    '.resumen-box>.grid-2>div:not(.item-parada-card){min-width:0;padding:8px 10px;border:1px solid var(--line);border-radius:8px;background:#f7f9fc;overflow-wrap:anywhere}',
    '.resumen-box>.grid-2>div:not(.item-parada-card)>span{display:block;margin-bottom:2px;color:var(--muted);font-size:10px}',
    '.resumen-box>.grid-2>div:not(.item-parada-card)>b{font-size:12px}',
    '.item-parada-card{display:grid;align-content:center;gap:3px;min-width:0;margin:0;padding:9px 10px;border:1px solid var(--line);border-radius:9px;background:#f7f9fc;overflow-wrap:anywhere;break-inside:avoid}',
    '.item-parada-card>b{color:#173875;font-size:17px;line-height:1.15}',
    '.item-parada-card>span{color:var(--muted);font-size:10px}',
    '.item-parada-card.ok>b{color:#078449}.item-parada-card.mal>b{color:#c33d45}',
    '.resumen-box table{display:block;width:100%;max-width:100%;margin:7px 0 14px;overflow-x:auto;border-collapse:collapse;font-size:10px;overscroll-behavior-inline:contain;-webkit-overflow-scrolling:touch}',
    '.resumen-box th,.resumen-box td{padding:6px 7px;border:1px solid var(--line);text-align:center;white-space:nowrap}',
    '.resumen-box th{background:#eaf0f8;color:#193b78;font-weight:800}',
    '.resumen-box tbody tr:nth-child(even) td{background:#f7f9fc}.resumen-box tfoot td{background:#fff4d8;font-weight:800}',
    '.resumen-box td.l,.resumen-box th.l{text-align:left;white-space:normal;min-width:130px}',
    '.resumen-box .wizard-card{margin:10px 0;padding:12px;border:1px solid var(--line);border-radius:10px;background:#f8fafd;break-inside:avoid}',
    '.resumen-box .wizard-card h3{margin:0 0 8px;color:#193b78;font-size:13px}',
    '.resumen-box figure{min-width:0;margin:0;padding:8px;border:1px solid var(--line);border-radius:8px;background:#fff}',
    '.resumen-box figure svg{display:block;width:100%;height:auto}',
    '.resumen-box figcaption{margin-top:5px;color:var(--muted);font-size:10px;text-align:center}',
    '.resumen-box .nota{margin:7px 0 0;padding:8px 10px;border:1px dashed #74bfe2;border-radius:8px;background:#edf8ff;color:#315b80;font-size:10px;overflow-wrap:anywhere}',
    '.resumen-box ul{padding-left:22px}.resumen-box li{margin:5px 0;overflow-wrap:anywhere}',
    '.section-title{display:flex;justify-content:space-between;gap:10px;padding:10px 24px;border-top:1px solid var(--line);background:#f7f9fc;color:var(--muted);font-size:10px}',
    '@media(max-width:640px){.jej-acciones-cabecera{padding:8px 10px;font-size:10px}.jej-acciones-cabecera button{min-height:38px;padding:7px 10px;font-size:11px}.card-wide{width:calc(100% - 16px);margin:8px auto;border-radius:11px}.card-wide>.wizard-card:first-child{align-items:flex-start;flex-direction:column;gap:10px;padding:16px}.card-wide>.wizard-card:first-child .der{text-align:left}.resumen-box{padding:14px 12px 18px}.resumen-box h2{margin-top:17px}.grid-2{gap:6px}.resumen-box>.grid-2>div:not(.item-parada-card){padding:7px}.item-parada-card{padding:8px}.item-parada-card>b{font-size:15px}.section-title{flex-direction:column;padding:9px 12px}}',
    '@page{size:A4 landscape;margin:10mm}',
    '@media print{html,body{background:#fff}.jej-acciones-cabecera{display:none}.card-wide{width:100%;max-width:none;margin:0;border:0;border-radius:0;box-shadow:none;overflow:visible}.card-wide>.wizard-card:first-child{print-color-adjust:exact}.resumen-box{padding:8px 4px}.resumen-box table{display:table;overflow:visible;font-size:8px}.resumen-box th,.resumen-box td{padding:3px 4px;white-space:normal;overflow-wrap:anywhere}.resumen-box>.grid-2>div,.item-parada-card,.resumen-box .wizard-card{break-inside:avoid}.section-title{padding:8px 4px}}'
  ].join('\n');

  function agrupar(p) {
    var g = {}, orden = [];
    p.filas.filter(J.filaUsada).forEach(function (r) {
      var k = (r.trabajo ? r.trabajo + ' · ' : '') + 'Parada ' + (r.parada === '' ? '—' : String(r.parada));
      if (!g[k]) { g[k] = []; orden.push(k); }
      g[k].push(r);
    });
    return { g: g, orden: orden };
  }

  function documento(p) {
    var h = p.header, R = J.resumen(p), A = agrupar(p), ref = p.refAbat === 'vertical' ? 'vertical' : 'horizontal';
    var filas = p.filas.filter(J.filaUsada);
    var trabajosUsados = []; filas.forEach(function (r) { if (r.trabajo && trabajosUsados.indexOf(r.trabajo) < 0) trabajosUsados.push(r.trabajo); });
    var multi = trabajosUsados.length > 1;
    var B = [];

    /* ---- Portada ---- */
    B.push('<div class="wizard-card"><div><p class="emp">J.E.J. Ingeniería · Servicio QA/QC Operaciones de Perforación y Tronadura · Contrato N° 4600026097</p>' +
      '<h1>Informe técnico de perforación</h1>' +
      '<div class="id">' + (h.idTronadura ? 'ID Tronadura ' + esc(h.idTronadura) : 'ID de tronadura no informado') + (h.mina ? ' · ' + esc(h.mina) : '') + '</div></div>' +
      '<div class="der"><b>' + esc(fechaLarga(h.fecha)) + '</b>Turno ' + dash(h.turno) + '</div></div>');
    B.push('<div class="resumen-box">');

    /* ---- Identificación ---- */
    B.push('<h2>Identificación y labor</h2><div class="grid-2">' + [
      ['Fecha', fechaLarga(h.fecha)], ['Turno', h.turno], ['Mina', h.mina], ['Nivel', h.nivel], ['Bloque', h.bloque], ['ID Tronadura', h.idTronadura],
      ['Supervisor JeJ', h.supJej], ['Encargado seguimiento JeJ', h.encSeg], ['Supervisor DET', h.supDet], ['Perforista DET', h.perforistaDet],
      ['Equipo de perforación', h.idEquipo], ['Diámetro de perforación [pulg]', h.diametro],
      ['Núm. zanja', h.numZanja], ['Calles zanja', [h.calleZanja1, h.calleZanja2].filter(Boolean).join(' / ')], ['Fase', h.fase],
      ['Calle UCL', h.calleUcl], ['Parada inicial', h.paradaIni], ['Parada final (neg)', h.paradaFin],
      ['ID(s) de trabajo', trabajosUsados.join(', ')]
    ].map(function (f) { return '<div><span>' + f[0] + '</span><b>' + dash(f[1]) + '</b></div>'; }).join('') + '</div>');

    /* ---- Indicadores ---- */
    var dif = isFinite(R.desvio) ? (R.desvio >= 0 ? '+' : '') + J.fmt(R.desvio * 100, 1) + '%' : '—';
    B.push('<h2>Indicadores del turno</h2><div class="grid-2">' + [
      [R.nTiros, 'tiros registrados', ''],
      [J.fmt(R.mDis, 1) + ' m', 'metros de diseño', ''],
      [J.fmt(R.mPerf, 1) + ' m', 'metros perforados', ''],
      [dif, 'diferencia vs diseño', isFinite(R.desvio) ? (R.desvio >= 0 ? 'ok' : 'mal') : ''],
      [pct(R.cumplProm), 'cumplimiento promedio de carga de diseño', ''],
      [isFinite(R.rendimiento) ? J.fmt(R.rendimiento, 1) + ' m/h' : '—', 'rendimiento de perforación', ''],
      [tm(R.tPerdidas), 'pérdida operacional total', R.tPerdidas > 0 ? 'mal' : ''],
      [tm(R.tPerf), 'tiempo en perforación', '']
    ].map(function (k) { return '<div class="item-parada-card ' + k[2] + '"><b>' + k[0] + '</b><span>' + k[1] + '</span></div>'; }).join('') + '</div>');

    /* ---- Horarios ---- */
    B.push('<h2>Horarios</h2><table><thead><tr><th>Llegada JeJ</th><th>Salida JeJ</th><th>Llegada PyT</th><th>Inicio perforación</th><th>Fin perforación</th><th>Salida PyT</th><th>Tiempo en postura</th><th>Tiempo en perforación</th></tr></thead><tbody><tr>' +
      [h.hLlegJej, h.hSalJej, h.hLlegPyt, h.hIniPerf, h.hFinPerf, h.hSalPyt].map(function (x) { return '<td>' + dash(x) + '</td>'; }).join('') +
      '<td><b>' + tm(R.tPostura) + '</b></td><td><b>' + tm(R.tPerf) + '</b></td></tr></tbody></table>');

    /* ---- Resumen por parada ---- */
    if (R.paradas.length) {
      B.push('<h2>Resumen por parada</h2><table><thead><tr>' + (multi ? '<th>Trabajo</th>' : '') + '<th>Parada</th><th>Tiros</th><th>Diseño [m]</th><th>Perforado [m]</th><th>Diferencia</th><th>Tiempo en tiros [min]</th></tr></thead><tbody>' +
        R.paradas.map(function (g) {
          var d = g.mDisPar > 0 ? (g.mPerf - g.mDisPar) / g.mDisPar : NaN;
          return '<tr>' + (multi ? '<td>' + dash(g.trabajo) + '</td>' : '') + '<td>' + esc(g.parada) + '</td><td>' + g.tiros + '</td><td>' + J.fmt(g.mDis, 1) + '</td><td>' + J.fmt(g.mPerf, 1) + '</td><td>' +
            (isFinite(d) ? (d >= 0 ? '+' : '') + J.fmt(d * 100, 1) + '%' : '—') + '</td><td>' + J.fmt(g.minutos, 1) + '</td></tr>';
        }).join('') + '</tbody></table>');
    }

    /* ---- Registro por tiro ---- */
    if (filas.length) {
      B.push('<h2>Registro por tiro</h2><div class="tabla-ancha"><table><thead><tr>' + (multi ? '<th>Trabajo</th>' : '') + '<th>Parada</th><th>Tiro</th><th>Diseño [m]</th><th>Taco [m]</th><th>Perforado [m]</th><th>Cumpl. carga</th><th>Abat. [°]</th><th>Rot. [°]</th><th>Sentido</th><th>Estado</th><th>Agua</th><th>Entub. [m]</th><th>Problema</th><th>T. perf. [min]</th></tr></thead><tbody>' +
        filas.map(function (r) {
          var t = J.calc.tTiro(r), prob = r.problema ? esc(r.problema) + (r.alturaBarra ? ' (' + esc(r.alturaBarra) + ' m)' : '') : '—';
          return '<tr>' + (multi ? '<td>' + dash(r.trabajo) + '</td>' : '') + '<td>' + dash(r.parada) + '</td><td><b>' + dash(r.tiro) + '</b></td><td>' + dash(r.mDiseno) + '</td><td>' + dash(r.taco) + '</td><td>' + dash(r.mPerf) + '</td><td>' +
            (r.mDiseno && r.mPerf ? Math.round(J.calc.cumpl(r) * 100) + '%' : '—') + '</td><td>' + dash(r.abat) + '</td><td>' + dash(r.rot) + '</td><td>' + dash(r.signo) + '</td><td>' + dash(r.estado) + '</td><td>' + dash(r.conAgua) + '</td><td>' + dash(r.entubados) +
            '</td><td class="l">' + prob + '</td><td>' + (isNaN(t) ? '—' : J.fmt(t, 1)) + '</td></tr>';
        }).join('') + '</tbody><tfoot><tr><td colspan="' + (multi ? 3 : 2) + '">Total</td><td>' + J.fmt(R.mDis, 1) + '</td><td></td><td>' + J.fmt(R.mPerf, 1) + '</td><td>' + pct(R.cumplProm) + '</td><td colspan="7"></td><td>' + J.fmt(R.minTiros, 1) + '</td></tr></tfoot></table></div>');

      /* ---- Parámetros operacionales ---- */
      var keys = ['pPerc', 'pRot', 'pAv', 'pAgua', 'pComp', 'golpes', 'rpm', 'vAv', 'caudal', 'hIni', 'hFin'];
      if (filas.some(function (r) { return keys.some(function (k) { return r[k] !== ''; }); })) {
        B.push('<h2>Parámetros de perforación</h2><div class="tabla-ancha"><table><thead><tr><th>Parada</th><th>Tiro</th><th>P. percusión [bar]</th><th>P. rotación [bar]</th><th>P. avance [bar]</th><th>P. agua [bar]</th><th>P. compresor aceite [bar]</th><th>Golpes/min</th><th>RPM</th><th>Vel. avance</th><th>Caudal agua [m³/min]</th><th>Inicio</th><th>Término</th></tr></thead><tbody>' +
          filas.map(function (r) {
            return '<tr><td>' + dash(r.parada) + '</td><td><b>' + dash(r.tiro) + '</b></td>' + ['pPerc', 'pRot', 'pAv', 'pAgua', 'pComp', 'golpes', 'rpm', 'vAv', 'caudal', 'hIni', 'hFin'].map(function (k) { return '<td>' + dash(r[k]) + '</td>'; }).join('') + '</tr>';
          }).join('') + '</tbody></table></div>');
      }

      /* ---- Gráfico de metros ---- */
      B.push('<h2>Metros por tiro: diseño vs perforado</h2>' + J.diagram.barras(filas));
    }

    /* ---- Diagramas de disparo ---- */
    B.push('<h2>Diagramas de disparo</h2>' + J.diagram.leyenda() +
      '<p class="nota">Abatimiento medido desde la ' + ref + '. Rotación: 0° = a lo largo de la labor, 90° = hacia la derecha, 270° = hacia la izquierda.</p>');
    if (!A.orden.length) B.push('<p class="nota">Aún no hay tiros registrados.</p>');
    A.orden.forEach(function (k) {
      var rows = A.g[k], s = J.diagram.vista(rows, 'seccion', ref);
      if (!s.n) { B.push('<div class="wizard-card"><h3>' + esc(k) + '</h3><p class="nota">Sin tiros con ángulo de abatimiento: no hay diagrama que dibujar.</p></div>'); return; }
      var pl = J.diagram.vista(rows, 'planta', ref), nota = '';
      if (s.omitidos) nota += s.omitidos + ' tiro(s) sin ángulo de abatimiento no se dibujan. ';
      if (s.supuestos) nota += s.supuestos + ' tiro(s) sin rotación: se asumió 90° (hacia la derecha). ';
      B.push('<div class="wizard-card"><h3>' + esc(k) + ' · ' + s.n + ' tiro(s) dibujados</h3><div class="grid-2"><figure>' + s.svg + '<figcaption>Sección transversal</figcaption></figure>' +
        (pl.fueraDePlano ? '<figure>' + pl.svg + '<figcaption>Vista en planta</figcaption></figure>' : '') + '</div>' +
        '<table><thead><tr><th>Tiro</th><th>Largo perforado [m]</th><th>Largo diseño [m]</th><th>Taco [m]</th><th>Abatimiento</th><th>Rotación</th><th>Sentido</th><th>Estado</th></tr></thead><tbody>' +
        rows.map(function (r) {
          return '<tr><td><b>' + dash(r.tiro) + '</b></td><td>' + dash(r.mPerf) + '</td><td>' + dash(r.mDiseno) + '</td><td>' + dash(r.taco) + '</td><td>' + (r.abat ? esc(r.abat) + '°' : '—') + '</td><td>' + (r.rot ? esc(r.rot) + '°' : '—') + '</td><td>' + dash(r.signo) + '</td><td>' + dash(r.estado) + '</td></tr>';
        }).join('') + '</tbody></table>' + (nota ? '<p class="nota">' + nota + '</p>' : '') + '</div>');
    });

    /* ---- Problemas y pérdidas ---- */
    var probs = Object.keys(R.problemas), perd = p.perdidas.filter(function (x) { return x.desc || x.tiempo; });
    if (probs.length || perd.length) {
      B.push('<h2>Problemas y pérdida operacional</h2>');
      if (probs.length) B.push('<table><thead><tr><th class="l">Problema durante la perforación</th><th>Tiros afectados</th></tr></thead><tbody>' +
        probs.map(function (k) { return '<tr><td class="l">' + esc(k) + '</td><td>' + R.problemas[k] + '</td></tr>'; }).join('') + '</tbody></table>');
      if (perd.length) B.push('<table><thead><tr><th class="l">Pérdida operacional durante la perforación · Observación</th><th>Tiempo</th></tr></thead><tbody>' +
        perd.map(function (x) { return '<tr><td class="l">' + dash(x.desc) + '</td><td>' + dash(x.tiempo) + '</td></tr>'; }).join('') +
        '</tbody><tfoot><tr><td class="l">Total pérdida operacional</td><td>' + tm(R.tPerdidas) + '</td></tr></tfoot></table>');
    }

    /* ---- Observaciones ---- */
    var ob = p.obs.filter(function (x) { return x; });
    if (ob.length) {
      B.push('<h2>Observaciones en terreno</h2>');
      if (ob.length) B.push('<ul>' + ob.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>');
    }

    B.push('</div><div class="section-title"><span>J.E.J. Ingeniería · Contrato N° 4600026097</span><span>Generado el ' + new Date().toLocaleString('es-CL') + '</span></div>');

    var titulo = 'Informe técnico ' + (h.idTronadura || 'perforación') + (h.fecha ? ' · ' + h.fecha : '');
    var LT = '<';
    return LT + '!DOCTYPE html>' + LT + 'html lang="es">' + LT + 'head>' + LT + 'meta charset="UTF-8">' + LT + 'meta name="viewport" content="width=device-width, initial-scale=1">' +
      LT + 'title>' + esc(titulo) + LT + '/title>' + LT + 'style>' + estilosInforme + LT + '/style>' + LT + '/head>' + LT + 'body>' +
      LT + 'div class="jej-acciones-cabecera">' + LT + 'span>Para guardar el informe: Imprimir → Destino «Guardar como PDF».' + LT + '/span>' + LT + 'button type="button" class="btn-primary" onclick="window.print()">Imprimir / Guardar PDF' + LT + '/button>' + LT + '/div>' +
      LT + 'div class="card-wide">' + B.join('') + LT + '/div>' + LT + '/body>' + LT + '/html>';
  }

  function nombreArchivo(p) {
    var h = p.header;
    return ('Informe_Tecnico_' + (h.idTronadura || 'sin-ID') + '_' + (h.fecha || 'sin-fecha')).replace(/[^\w\-]+/g, '_') + '.html';
  }

  function descargarHtml(p, html) {
    var blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = nombreArchivo(p);
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  // Abre el informe en una pestaña nueva y lanza la impresión (Guardar como PDF)
  function abrir(p) {
    var html = documento(p);
    if (root.JEJArchivo && typeof root.JEJArchivo.abrirInforme === 'function') {
      root.JEJArchivo.abrirInforme(html, nombreArchivo(p));
      return;
    }
    var w = window.open('', '_blank');
    if (!w) {
      descargarHtml(p, html);
      alert('El navegador bloqueó la ventana emergente, así que el informe se descargó como archivo .html. Ábrelo y usa Imprimir → Guardar como PDF.');
      return;
    }
    w.document.open(); w.document.write(html); w.document.close();
    w.focus();
    setTimeout(function () { try { w.print(); } catch (e) { /* el usuario puede imprimir desde el botón */ } }, 600);
  }

  J.informe = { documento: documento, abrir: abrir, descargarHtml: descargarHtml, nombreArchivo: nombreArchivo };
})(typeof window !== 'undefined' ? window : globalThis);

/* ===================== FLUJO POR PASOS ===================== */
/* Paso 1 Datos generales y turno → Paso 2 ID de trabajo → Resumen de paradas → Tiros de una parada → Finalizar */
(function () {
  'use strict';
  var J = window.JEJ, U = J.ui, el = U.el;

  var ui = { vista: 'datos', tiro: null, aviso: '', parada: '', busca: '', nuevaParada: false, asist: null, seleccionTrabajo: '', cantidadTiros: 1, pestanaTiro: 'medidas' };
  function P() { return J.store.current(); }

  /* ---------- Consultas sobre trabajos / paradas / tiros ---------- */
  function tirosDe(p, trabajo, parada) {
    return p.filas.filter(function (r) { return r.trabajo === trabajo && (parada === undefined || String(r.parada) === String(parada)); });
  }
  function paradasDe(p, trabajo) {
    var o = [];
    tirosDe(p, trabajo).forEach(function (r) { var k = String(r.parada); if (o.indexOf(k) < 0) o.push(k); });
    return o;
  }
  function metros(rows) { var s = 0; rows.forEach(function (r) { var m = J.num(r.mPerf); if (!isNaN(m)) s += m; }); return s; }
  function tiroCapturado(r) { if(!r)return false;if(Object.prototype.hasOwnProperty.call(r,'capturado'))return !!r.capturado;return !!(r.mDiseno||r.mPerf||r.estado||r.problema||r.pPerc||r.pAv); }
  function todasParadasTienenTirosCapturados(p,trabajo){var paradas=paradasDe(p,trabajo);return paradas.length>0&&paradas.every(function(par){var rows=tirosDe(p,trabajo,par);return rows.length>0&&rows.every(tiroCapturado);});}
  function configurarTirosExistentes(p,parada){var rows=tirosDe(p,p.trabajoActual,parada);ui.parada=parada;ui.cantidadTiros=rows.length||1;ui.agregarCantidad=false;ui.configurarExistentes=true;ui.vista='cantidad';render();window.scrollTo(0,0);}
  function guardarTiroCaptura(row){row.capturado=true;J.store.touch();ui.diagramUpdater=null;ui.tiro=null;ui.configurarExistentes=false;ui.agregarCantidad=false;ui.vista='parada';render();window.scrollTo(0,0);}
  function abrirPostura(p,tab){ui.tiro=null;ui.asist=null;ui.posturaTab=tab||'tiempos';ui.vista='postura';render();window.scrollTo(0,0);}
  function sinAsignar(v) { return v ? v : 'Sin asignar'; }
  function pctTxt(v) { return isFinite(v) ? Math.round(v * 100) + '%' : '—'; }
  function sugerirParada(p) {
    var ps = paradasDe(p, p.trabajoActual), last = ps[ps.length - 1];
    if (!last) return p.header.paradaIni || '';
    var m = /^(.*?)(\d+)$/.exec(last);
    return m ? m[1] + (parseInt(m[2], 10) + 1) : '';
  }
  function etiquetaPlanilla(p) {
    var o = document.querySelector('#toolbar option:checked'); if (o) o.textContent = J.store.etiqueta(p);
  }
  function refrescarToolbar() { U.toolbar('#toolbar', { onChange: alCambiarPlanilla }); }
  function alCambiarPlanilla() { ui.vista = 'datos'; ui.asist = null; ui.tiro = null; ui.aviso = ''; ui.parada = ''; ui.busca = ''; ui.nuevaParada = false; render(); }

  /* ---------- Piezas de formulario ---------- */
  function mf(label, ctrl, cls) { return el('div', { class: 'anfo-perforacion-mf form-group-field' + (cls || '') }, [el('label', { text: label }), ctrl]); }
  function txt(o, k, ph, cls, list, on) {
    var i = el('input', { type: 'text', class: 'anfo-perforacion-in' + (cls || ''), placeholder: ph || '', value: o[k] || '' });
    if (list) i.setAttribute('list', list);
    i.addEventListener('input', function () { o[k] = i.value; if (on) on(); });
    return i;
  }
  function hora(o, k, on) {
    var i = el('input', { type: 'time', class: 'anfo-perforacion-in', value: o[k] || '' });
    i.addEventListener('input', function () { o[k] = i.value; if (on) on(); });
    return i;
  }
  function sel(o, k, lista, ph, on) {
    var s = el('select', { class: 'anfo-perforacion-in' });
    U.opciones(s, J.LISTAS[lista], o[k]); s.options[0].textContent = ph || '';
    s.addEventListener('change', function () { o[k] = s.value; if (on) on(); });
    return s;
  }
  function partes(v) { return String(v || '').split(/\s*\/\s*/).filter(function (x) { return x.trim(); }); }
  function nombresUsuarios(rol, turno) {
    if (!window.JEJUsuarios || typeof window.JEJUsuarios.nombres !== 'function') return [];
    return window.JEJUsuarios.nombres(rol, turno);
  }
  function aplicarPersonalPorDefecto(h) {
    var cambio = false;
    var usuarioActivo = '';
    try { usuarioActivo = (localStorage.getItem('jej_usuario_activo') || '').trim(); } catch (e) { /* almacenamiento no disponible */ }
    // Este campo siempre identifica a la persona con sesión activa.
    if (usuarioActivo && h.encSeg !== usuarioActivo) { h.encSeg = usuarioActivo; cambio = true; }
    var supJej = nombresUsuarios('supervisorJeJ', h.turno);
    var supDet = nombresUsuarios('supervisorDet', h.turno);
    var perforistas = nombresUsuarios('responsableDet', h.turno);
    function sincronizar(valor, disponibles, multiple) {
      var actuales = (multiple ? partes(valor) : [valor]).map(function (x) { return String(x || '').trim(); }).filter(Boolean);
      var vigentes = actuales.filter(function (nombre) {
        return disponibles.some(function (opcion) { return opcion.toLocaleLowerCase() === nombre.toLocaleLowerCase(); });
      });
      if (!vigentes.length) vigentes = disponibles.slice();
      var resultado = multiple ? vigentes.join(' / ') : (vigentes[0] || '');
      if (resultado !== (valor || '')) { cambio = true; return resultado; }
      return valor || '';
    }
    h.supJej = sincronizar(h.supJej, supJej, false);
    h.supDet = sincronizar(h.supDet, supDet, true);
    h.perforistaDet = sincronizar(h.perforistaDet, perforistas, true);
    return cambio;
  }
  var dlN = 0;
  function datalist(k, multi) {
    var set = {};
    J.store.list().forEach(function (p) { (multi ? partes(p.header[k]) : [p.header[k]]).forEach(function (x) { if (x) set[x] = 1; }); });
var rolPersonal = {
  supJej: 'supervisorJeJ',
  supDet: 'supervisorDet',
  perforistaDet: 'responsableDet'
}[k];
    if (rolPersonal && window.JEJUsuarios) {
      window.JEJUsuarios.nombres(rolPersonal, J.store.current().header.turno).forEach(function (nombre) { set[nombre] = 1; });
    }
    var d = el('datalist', { id: 'dl-' + k + (++dlN) });
    Object.keys(set).forEach(function (v) { d.appendChild(el('option', { value: v })); });
    return d;
  }
  // Varios nombres en un mismo campo (se guardan separados por " / ")
  function multiInput(host, label, k, draft, textoAdd) {
    var vals = partes(draft[k]); if (!vals.length) vals = [''];
    var dl = datalist(k, true), box = el('div');
    function sync() { draft[k] = vals.map(function (x) { return x.trim(); }).filter(Boolean).join(' / '); }
    function pintar(enfocarUltimo) {
      box.innerHTML = '';
      vals.forEach(function (v, i) {
        var inp = el('input', { type: 'text', class: 'anfo-perforacion-in', placeholder: 'Seleccione o escriba...', value: v, list: dl.id });
        inp.addEventListener('input', function () { vals[i] = inp.value; sync(); });
        var fila = el('div', { class: 'anfo-perforacion-multi' }, [inp]);
        if (vals.length > 1) fila.appendChild(el('button', { type: 'button', class: 'anfo-perforacion-x', title: 'Quitar', text: '×', onclick: function () { vals.splice(i, 1); sync(); pintar(); } }));
        box.appendChild(fila);
        if (enfocarUltimo && i === vals.length - 1) setTimeout(function () { try { inp.focus(); } catch (e) { /* sin foco */ } }, 0);
      });
      box.appendChild(el('button', { type: 'button', class: 'anfo-perforacion-chip', text: '+ ' + textoAdd, onclick: function () { vals.push(''); pintar(true); } }));
    }
    pintar();
    host.appendChild(el('div', { class: 'anfo-perforacion-mf form-group-field full' }, [el('label', { text: label }), dl, box]));
  }

  /* ---------- Ventana modal ---------- */
  function abrirModal(titulo, armar, onGuardar, textoGuardar, estiloPersonal) {
    var fragmento = document.getElementById('plantillaModalJej').content.cloneNode(true);
    var ov = fragmento.querySelector('[data-modal-overlay]'), m = fragmento.querySelector('[data-modal-content]');
    function cerrar() { ov.remove(); }
    var encabezado = el('h3', { text: titulo });
    if (estiloPersonal) encabezado.setAttribute('style', 'margin-top:0;border-bottom:2px solid #e2e8f0;padding-bottom:8px');
    m.appendChild(encabezado);
    armar(m);
    var acciones = el('div', { class: 'anfo-perforacion-modal-acc' + (estiloPersonal ? ' modal-personal-acciones' : '') });
    if (estiloPersonal) acciones.setAttribute('style', 'display:flex;justify-content:flex-end;gap:10px;margin-top:20px');
    var cancelar = el('button', { type: 'button', class: 'btn-primary', text: 'Cancelar', onclick: cerrar });
    var guardar = el('button', { type: 'button', class: 'btn-primary', text: textoGuardar || 'Guardar y Aplicar', onclick: function () { if (onGuardar() !== false) cerrar(); } });
    if (estiloPersonal) {
      cancelar.setAttribute('style', 'background-color:#64748b;width:auto');
      guardar.setAttribute('style', 'background-color:#16a34a;width:auto');
    }
    acciones.appendChild(cancelar);
    acciones.appendChild(guardar);
    m.appendChild(acciones);
    ov.appendChild(m);
    ov.style.display = "flex";
    document.body.appendChild(ov);
  }

  /* ---------- Asistente dato por dato (Postura/Personal/Zanja y Plantilla) ---------- */
  function normalizarTiempo(v) {
    v = String(v).trim(); if (!v) return '';
    var mm = v.match(/^(\d{1,2}):(\d{1,2})$/);
    if (mm) return ('0' + mm[1]).slice(-2) + ':' + ('0' + mm[2]).slice(-2);
    if (/^\d+$/.test(v)) return J.fmtHM(+v);   // 90 -> 01:30 (minutos)
    return null;
  }
  function horaActual() { var n = new Date(); return ('0' + n.getHours()).slice(-2) + ':' + ('0' + n.getMinutes()).slice(-2); }

  function pasosPostura() {
    var U2 = '👷 Personal Responsable';
    return [
      { k: 'encSeg', label: 'Encargado Seguimiento JeJ (Tú)', type: 'text', grupo: U2, bg: '4ade80' },
      { k: 'supJej', label: 'Supervisor JeJ', type: 'text', ph: 'Seleccione o escriba...', dl: 'supJej', grupo: U2, bg: '4ade80' },
      { k: 'supDet', label: 'Supervisor(es) DET', type: 'multi', add: 'Agregar otro Supervisor DET', grupo: U2, bg: '4ade80' },
      { k: 'perforistaDet', label: 'Perforista(s) DET', type: 'multi', add: 'Agregar otro Perforista DET', grupo: U2, bg: '4ade80' }
    ];
  }
  function pasosPlantilla() {
    var L = '🏔️ Ubicación y Postura', H = '⏱️ Horarios · ', E = '🛠️ Equipo de Perforación', I = '🏷️ Identificación y Paradas';
    return [
      { k: 'mina', label: 'Mina', type: 'text', ph: 'Ej. Esmeralda', grupo: L, bg: '00B0F0' },
      { k: 'nivel', label: 'Nivel', type: 'select', list: 'nivel', grupo: L, bg: '00B0F0' },
      { k: 'bloque', label: 'Bloque', type: 'select', list: 'bloque', grupo: L, bg: '00B0F0' },
      { k: 'fase', label: 'Fase (Transversal)', type: 'text', ph: 'Ej. Fase 1', grupo: L, bg: '00B0F0' },
      { k: 'numZanja', label: 'Núm. Zanja (Producción)', type: 'text', ph: 'Ej. 47', grupo: L, bg: '00B0F0' },
      { k: 'calleZanja1', label: 'Entre calles · N° Calle 1', type: 'text', ph: 'Ej. 41', grupo: L, bg: '00B0F0' },
      { k: 'calleZanja2', label: 'Entre calles · N° Calle 2', type: 'text', ph: 'Ej. 43', grupo: L, bg: '00B0F0' },
      { k: 'calleUcl', label: 'Calle UCL', type: 'text', ph: 'Ej. C41', grupo: L, bg: '00B0F0' },
      { k: 'idTronadura', label: 'ID Tronadura', type: 'text', ph: 'Ej. TR-04', grupo: I, bg: '00B0F0' },
      { k: 'paradaIni', label: 'Parada Inicial', type: 'text', ph: 'Ej. P1', grupo: I, bg: '00B0F0' },
      { k: 'paradaFin', label: 'Parada Final (neg)', type: 'text', ph: 'Ej. P5', grupo: I, bg: '00B0F0' },
      { k: 'hLlegJej', label: 'Llegada · Postura JeJ', type: 'time', grupo: H + '🚜 Postura JeJ', bg: '93c5fd' },
      { k: 'hSalJej', label: 'Salida · Postura JeJ', type: 'time', grupo: H + '🚜 Postura JeJ', bg: '93c5fd' },
      { k: 'hLlegPyt', label: 'Llegada · Postura PyT', type: 'time', grupo: H + '🧨 Postura PyT', bg: '93c5fd' },
      { k: 'hSalPyt', label: 'Salida · Postura PyT', type: 'time', grupo: H + '🧨 Postura PyT', bg: '93c5fd',
        calc: function (d) { return 'Tiempo en Postura: ' + J.fmtHM(J.tPostura(d)); } },
      { k: 'hIniPerf', label: 'Inicio · Perforación', type: 'time', grupo: H + '⛏️ Perforación', bg: '93c5fd' },
      { k: 'hFinPerf', label: 'Fin · Perforación', type: 'time', grupo: H + '⛏️ Perforación', bg: '93c5fd',
        calc: function (d) { return 'Tiempo en Perforación: ' + J.fmtHM(J.tPerforacion(d)); } },
      { k: 'diametro', label: 'Diámetro', type: 'num', unit: 'pulg', ph: 'Ej. 3.5', grupo: E, bg: '4ade80' },
      { k: 'idEquipo', label: 'ID del Equipo', type: 'text', ph: 'Ej. EQ-01', grupo: E, bg: '4ade80' },
      { k: '_perdidas', label: 'Pérdida Operacional Durante la Perforación', type: 'perd', grupo: '⚠️ Pérdida Operacional', bg: 'F8CBAD' }
    ];
  }

  function abrirAsistente(tipo) {
    if (tipo === 'postura') { modalPostura(); return; }
    var p = P(), pasos = tipo === 'postura' ? pasosPostura() : pasosPlantilla(), d = {};
    pasos.forEach(function (s) {
      if (s.type === 'perd') return;
      d[s.k] = p.header[s.k] || '';
      if (s.k2) d[s.k2] = p.header[s.k2] || '';
    });
    var perd = tipo === 'plantilla' ? p.perdidas.map(function (x) { return { desc: x.desc, tiempo: x.tiempo }; }) : [];
    if (tipo === 'plantilla' && !perd.length) perd.push({ desc: '', tiempo: '' });
    ui.asist = { tipo: tipo, pasos: pasos, d: d, perd: perd, i: 0, err: '' };
    ui.aviso = '';
    render(); window.scrollTo(0, 0);
  }
  function asistenteCerrar() { ui.asist = null; render(); window.scrollTo(0, 0); }

  // Revisa los tiempos de pérdida y los normaliza (hh:mm). Devuelve false si hay un formato inválido.
  function asistenteValidarPerd(a) {
    if (!a.perd.length) return true;
    var ok = true;
    a.perd.forEach(function (x) {
      if (!x.tiempo) return;
      var v = normalizarTiempo(x.tiempo);
      if (v === null) ok = false; else x.tiempo = v;
    });
    if (!ok) a.err = 'Revisa los tiempos de pérdida: usa el formato hh:mm.';
    return ok;
  }
  function asistenteGuardar() {
    var a = ui.asist, p = P();
    if (a.tipo === 'plantilla' && !asistenteValidarPerd(a)) {
      a.i = a.pasos.length - 1; render(); return;
    }
    if (a.tipo === 'plantilla' && !a.d.idTronadura) {
      var fase = a.d.fase ? (String(a.d.fase).toLowerCase().startsWith('fase') ? a.d.fase : 'Fase ' + a.d.fase) : '';
      var zanja = a.d.numZanja ? (String(a.d.numZanja).toUpperCase().startsWith('Z') ? a.d.numZanja : 'Z' + a.d.numZanja) : '';
      a.d.idTronadura = a.d.nivel === 'NP' ? [zanja, a.d.calleZanja1 && a.d.calleZanja2 ? a.d.calleZanja1 + '-' + a.d.calleZanja2 : (a.d.calleZanja1 || a.d.calleZanja2), fase].filter(Boolean).join(' ')
        : a.d.nivel === 'UCL' ? [a.d.calleUcl, 'UCL', fase].filter(Boolean).join(' ') : [fase].filter(Boolean).join(' ');
    }
    Object.keys(a.d).forEach(function (k) { p.header[k] = a.d[k]; });
    if (a.tipo === 'plantilla') {
      p.perdidas = a.perd.filter(function (x) { return x.desc || x.tiempo; }).map(function (x) { return { desc: x.desc, tiempo: x.tiempo || '' }; });
    }
    J.store.touch(); refrescarToolbar();
    ui.asist = null; render(); window.scrollTo(0, 0);
  }
  function asistenteAvanzar() {
    var a = ui.asist, s = a.pasos[a.i];
    a.err = '';
    if (s.type === 'perd' && !asistenteValidarPerd(a)) { render(); return; }
    if (a.i >= a.pasos.length - 1) { asistenteGuardar(); return; }
    a.i++; render();
  }
  function asistenteRetroceder() { var a = ui.asist; a.err = ''; if (a.i > 0) { a.i--; render(); } }

  // Varios nombres en un mismo dato (se guardan separados por " / ")
  function multiPaso(q, s, d) {
    var vals = partes(d[s.k]); if (!vals.length) vals = [''];
    var dl = datalist(s.k, true), box = el('div', { class: 'anfo-perforacion-q-multi' });
    function sync() { d[s.k] = vals.map(function (x) { return x.trim(); }).filter(Boolean).join(' / '); }
    function pintar(enfocar) {
      box.innerHTML = '';
      vals.forEach(function (v, i) {
        var inp = el('input', { type: 'text', placeholder: 'Seleccione o escriba...', value: v, list: dl.id, 'aria-label': s.label + ' ' + (i + 1) });
        inp.addEventListener('input', function () { vals[i] = inp.value; sync(); });
        var fila = el('div', { class: 'anfo-perforacion-multi' }, [inp]);
        if (vals.length > 1) fila.appendChild(el('button', { type: 'button', class: 'anfo-perforacion-x', title: 'Quitar', text: '×', onclick: function () { vals.splice(i, 1); sync(); pintar(); } }));
        box.appendChild(fila);
        if ((enfocar && i === vals.length - 1) || (!enfocar && i === 0 && !v)) setTimeout(function () { try { inp.focus(); } catch (e) { /* sin foco */ } }, 0);
      });
      box.appendChild(el('div', { style: 'text-align:center' }, [el('button', { type: 'button', class: 'anfo-perforacion-chip', text: '+ ' + s.add, onclick: function () { vals.push(''); pintar(true); } })]));
    }
    pintar();
    q.appendChild(dl); q.appendChild(box);
  }

  // Lista de pérdidas operacionales (observación + tiempo hh:mm)
  function perdidasPaso(q, a) {
    var perd = a.perd;
    q.appendChild(el('p', { class: 'anfo-perforacion-q-ayuda', text: 'Observación y tiempo (hh:mm). Si escribes solo minutos, por ejemplo 90, se convierte a 01:30.' }));
    var dl = el('datalist', { id: 'dl-problemas' });
    J.LISTAS.problemas.forEach(function (v) { dl.appendChild(el('option', { value: v })); });
    var caja = el('div', { class: 'anfo-perforacion-perd' }), total = el('div', { class: 'anfo-perforacion-perd-total' });
    function actualizarTotal() { total.textContent = 'Total pérdida operacional: ' + J.fmtHM(J.totalPerdidas({ perdidas: perd })); }
    function pintar() {
      caja.innerHTML = '';
      caja.appendChild(el('div', { class: 'anfo-perforacion-perd-head' }, [el('span', { text: 'Observación' }), el('span', { text: 'Tiempo', style: 'text-align:center' }), el('span')]));
      perd.forEach(function (x, i) {
        var dd = el('input', { type: 'text', list: 'dl-problemas', value: x.desc || '', placeholder: 'Describe la pérdida', 'aria-label': 'Observación de la pérdida' });
        var tt = el('input', { type: 'text', class: 't', value: x.tiempo || '', placeholder: 'hh:mm', maxlength: 5, inputmode: 'numeric', 'aria-label': 'Tiempo perdido (hh:mm)' });
        dd.addEventListener('input', function () { x.desc = dd.value; });
        tt.addEventListener('input', function () { x.tiempo = tt.value; actualizarTotal(); });
        tt.addEventListener('blur', function () {
          var v = normalizarTiempo(tt.value);
          if (v === null) { tt.value = ''; x.tiempo = ''; } else { tt.value = v; x.tiempo = v; }
          actualizarTotal();
        });
        var del = el('button', { type: 'button', class: 'anfo-perforacion-x', title: 'Quitar', text: '×', onclick: function () { perd.splice(i, 1); if (!perd.length) perd.push({ desc: '', tiempo: '' }); pintar(); } });
        caja.appendChild(el('div', { class: 'anfo-perforacion-perd-fila' }, [dd, tt, del]));
      });
      caja.appendChild(el('div', { class: 'anfo-perforacion-perd-pie' }, [el('button', { type: 'button', class: 'btn-primary', text: '＋ Agregar pérdida', onclick: function () { perd.push({ desc: '', tiempo: '' }); pintar(); } })]));
      caja.appendChild(total);
      actualizarTotal();
    }
    pintar();
    q.appendChild(dl); q.appendChild(el('div', { class: 'anfo-perforacion-q-perd' }, [caja]));
  }

  function asistenteVista(host, p) {
    var a = ui.asist, ps = a.pasos, d = a.d;
    if (a.i > ps.length - 1) a.i = ps.length - 1;
    var s = ps[a.i], ultimo = a.i >= ps.length - 1;
    var q = el('div', { class: 'anfo-perforacion-q wizard-card', style: 'border-left-color:#' + s.bg });

    var salto = el('select', { 'aria-label': 'Ir a otro dato' });
    ps.forEach(function (x, i) { var o = el('option', { value: String(i), text: (i + 1) + '. ' + x.label }); if (i === a.i) o.selected = true; salto.appendChild(o); });
    salto.addEventListener('change', function () { a.i = +salto.value; a.err = ''; render(); });
    q.appendChild(el('div', { class: 'anfo-perforacion-q-top' }, [el('b', { text: s.grupo }), el('span', { text: 'Dato ' + (a.i + 1) + ' de ' + ps.length }), salto]));
    q.appendChild(el('div', { class: 'anfo-perforacion-q-barra' }, [el('i', { style: 'width:' + Math.round((a.i + 1) / ps.length * 100) + '%' })]));
    q.appendChild(el('h3', { text: s.label }));

    var calcBox = null, inp = null;
    function actualizarCalc() { if (calcBox && s.calc) calcBox.textContent = s.calc(d); }

    if (s.type === 'select') {
      var opts = el('div', { class: 'anfo-perforacion-opts' });
      J.LISTAS[s.list].forEach(function (v) {
        opts.appendChild(el('button', { type: 'button', class: 'anfo-perforacion-opt' + (d[s.k] === v ? ' sel' : ''), text: v, onclick: function () { d[s.k] = v; asistenteAvanzar(); } }));
      });
      if (d[s.k] && J.LISTAS[s.list].indexOf(d[s.k]) < 0) {
        opts.appendChild(el('button', { type: 'button', class: 'anfo-perforacion-opt sel', text: d[s.k], onclick: function () { asistenteAvanzar(); } }));
      }
      q.appendChild(opts);
    } else if (s.type === 'multi') {
      multiPaso(q, s, d);
    } else if (s.type === 'perd') {
      perdidasPaso(q, a);
    } else if (s.type === 'par') {
      var i1 = el('input', { type: 'text', value: d[s.k] || '', placeholder: s.ph || '', 'aria-label': 'Primera calle' });
      var i2 = el('input', { type: 'text', value: d[s.k2] || '', placeholder: s.ph2 || '', 'aria-label': 'Segunda calle' });
      i1.addEventListener('input', function () { d[s.k] = i1.value; });
      i2.addEventListener('input', function () { d[s.k2] = i2.value; });
      i1.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); i2.focus(); } });
      i2.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); asistenteAvanzar(); } });
      q.appendChild(el('div', { class: 'anfo-perforacion-q-input' }, [i1, el('span', { class: 'u', text: 'y' }), i2]));
      inp = i1;
    } else {
      inp = el('input', { type: s.type === 'time' ? 'time' : 'text', value: d[s.k] || '', placeholder: s.ph || '', 'aria-label': s.label });
      if (s.type === 'num') inp.setAttribute('inputmode', 'decimal');
      if (s.dl) { var dlx = datalist(s.dl, false); q.appendChild(dlx); inp.setAttribute('list', dlx.id); }
      inp.addEventListener('input', function () { d[s.k] = inp.value; a.err = ''; actualizarCalc(); });
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); asistenteAvanzar(); } });
      q.appendChild(el('div', { class: 'anfo-perforacion-q-input' }, [inp, s.unit ? el('span', { class: 'u', text: s.unit }) : null]));
      if (s.type === 'time') {
        q.appendChild(el('div', { style: 'text-align:center' }, [el('button', { type: 'button', class: 'anfo-perforacion-chip', text: 'Ahora', title: 'Poner la hora actual', onclick: function () {
          inp.value = horaActual(); d[s.k] = inp.value; actualizarCalc();
        } })]));
      }
    }
    if (s.calc) { calcBox = el('div', { class: 'anfo-perforacion-q-calc', text: s.calc(d) }); q.appendChild(calcBox); }
    if (a.err) q.appendChild(el('div', { class: 'anfo-perforacion-q-error', text: a.err }));

    var acc = el('div', { class: 'anfo-perforacion-q-acciones grid-2' }, [
      el('button', { type: 'button', class: 'btn-primary', text: '← Anterior', disabled: a.i === 0 ? 'disabled' : null, onclick: asistenteRetroceder }),
      el('button', { type: 'button', class: 'btn-primary', text: 'Omitir', onclick: function () { a.err = ''; if (ultimo) asistenteGuardar(); else { a.i++; render(); } } }),
      el('button', { type: 'button', class: 'btn-primary', text: ultimo ? '✔ Guardar datos' : 'Siguiente →', onclick: asistenteAvanzar }),
      ultimo ? null : el('button', { type: 'button', class: 'btn-primary', text: 'Guardar y salir', onclick: asistenteGuardar }),
      el('span', { class: 'anfo-perforacion-sep' }),
      el('button', { type: 'button', class: 'btn-primary', text: 'Cancelar', onclick: function () { if (confirm('¿Cancelar? Se descartan los cambios hechos en este asistente.')) asistenteCerrar(); } })
    ]);
    q.appendChild(acc);

    // Lo ya ingresado
    var llenos = ps.filter(function (x) { return x.type !== 'perd' && x !== s && (d[x.k] || (x.k2 && d[x.k2])); });
    if (llenos.length) {
      q.appendChild(el('div', { class: 'anfo-perforacion-q-resumen' }, llenos.map(function (x) {
        var v = x.k2 ? [d[x.k], d[x.k2]].filter(Boolean).join(' y ') : d[x.k];
        return el('span', { text: x.label + ': ' + v });
      })));
    }
    host.appendChild(q);
    if (inp) setTimeout(function () { try { inp.focus(); if (inp.select) inp.select(); } catch (e) { /* sin foco */ } }, 0);
  }

  /* ---------- Modal: Configuración de Postura y Personal ---------- */
  function modalPostura() {
    var p = P(), h = p.header, d = {};
    if (aplicarPersonalPorDefecto(h)) J.store.touch();
    ['encSeg', 'supJej', 'supDet', 'perforistaDet'].forEach(function (k) { d[k] = h[k] || ''; });
    abrirModal('Configuración de Postura y Personal', function (m) {
      m.appendChild(el('div', { class: 'section-title', text: '2. Personal Responsable' }));
      var enc = txt(d, 'encSeg', ''); enc.classList.add('gris');
      enc.setAttribute('readonly', 'readonly');
      enc.style.backgroundColor = '#f1f5f9';
      enc.style.fontWeight = 'bold';
      m.appendChild(mf('Encargado Seguimiento JeJ (Tú):', enc));
      var sj = txt(d, 'supJej', 'Seleccione o escriba...', '', null);
      var dlSj = datalist('supJej', false); sj.setAttribute('list', dlSj.id);
      m.appendChild(mf('Supervisor JeJ:', sj)); m.appendChild(dlSj);
      var box = el('div');
      multiInput(box, 'Supervisor(es) DET:', 'supDet', d, 'Agregar otro Supervisor DET');
      multiInput(box, 'Perforista(s) DET:', 'perforistaDet', d, 'Agregar otro Perforista DET');
      m.appendChild(box);
    }, function () {
      Object.keys(d).forEach(function (k) { h[k] = typeof d[k] === 'string' ? d[k].trim() : d[k]; });
      J.store.touch(); refrescarToolbar(); render();
    }, 'Guardar y Aplicar', true);
  }

  /* ---------- Modal: observaciones en terreno ---------- */
  function modalObs() {
    var p = P(), obs = p.obs.filter(Boolean); if (!obs.length) obs = [''];
    abrirModal('Observaciones en terreno', function (m) {
      var box = el('div');
      function pintar(enfocar) {
        box.innerHTML = '';
        obs.forEach(function (v, i) {
          var inp = el('input', { type: 'text', class: 'anfo-perforacion-in', value: v, placeholder: 'Observación ' + (i + 1) });
          inp.addEventListener('input', function () { obs[i] = inp.value; });
          var fila = el('div', { class: 'anfo-perforacion-multi' }, [inp]);
          if (obs.length > 1) fila.appendChild(el('button', { type: 'button', class: 'anfo-perforacion-x', title: 'Quitar', text: '×', onclick: function () { obs.splice(i, 1); pintar(); } }));
          box.appendChild(fila);
          if (enfocar && i === obs.length - 1) setTimeout(function () { try { inp.focus(); } catch (e) { /* sin foco */ } }, 0);
        });
        box.appendChild(el('button', { type: 'button', class: 'anfo-perforacion-chip', text: '+ Agregar otra observación', onclick: function () { obs.push(''); pintar(true); } }));
      }
      pintar();
      m.appendChild(el('div', { style: 'margin-top:14px' }, [box]));
    }, function () {
      p.obs = obs.map(function (x) { return x.trim(); }).filter(Boolean);
      while (p.obs.length < 10) p.obs.push('');
      J.store.touch(); render();
    });
  }

  /* ---------- Paso 1: Datos generales y turno ---------- */
  function vistaDatos(host, p) {
    var h = p.header, card = el('div', { class: 'anfo-paso1' });
    if (h.turno !== 'A' && h.turno !== 'B') { h.turno = 'A'; J.store.touch(); }
    if (aplicarPersonalPorDefecto(h)) J.store.touch();
    card.appendChild(el('h2', { text: 'Paso 1: Datos Generales y Turno (Perforación)' }));
    card.appendChild(el('p', { class: 'subtitle', text: 'Ingrese los datos básicos del seguimiento' }));

    var fecha = el('div', { class: 'anfo-step-card' }, [el('h3', { class: 'anfo-step-label' }, [el('i'), document.createTextNode(' Fecha y turno')])]);
    var f = el('input', { id: 'fechaPerforacion', type: 'date', value: h.fecha || '' });
    f.addEventListener('change', function () { h.fecha = f.value; etiquetaPlanilla(p); J.store.touch(); });
    fecha.appendChild(mf('Fecha:', f));
    var turnos = el('div', { class: 'form-group-field' }, [el('label', { text: 'Turno:' })]);
    var tg = el('div', { class: 'anfo-turno-botones', role: 'group', 'aria-label': 'Seleccione el turno' });
    ['A', 'B'].forEach(function (v) {
      tg.appendChild(el('button', { type: 'button', class: 'anfo-turno-boton' + (h.turno === v ? ' activo' : ''), 'aria-pressed': h.turno === v ? 'true' : 'false', text: (v === 'A' ? '☀ ' : '☾ ') + 'Turno ' + v, onclick: function () {
        h.turno = v; aplicarPersonalPorDefecto(h); etiquetaPlanilla(p); J.store.touch(); render();
      } }));
    });
    turnos.appendChild(tg); fecha.appendChild(turnos); card.appendChild(fecha);

    var personal = el('div', { class: 'anfo-step-card anfo-personal-card' });
    var personas = [
      ['Encargado JeJ', sinAsignar(h.encSeg), false], ['Supervisor JeJ', sinAsignar(h.supJej), false],
      ['Supervisor(es) DET', sinAsignar(partes(h.supDet).join(', ')), true], ['Perforista(s) DET', sinAsignar(partes(h.perforistaDet).join(', ')), true]
    ];
    var completos = personas.every(function (x) { return x[1] !== 'Sin asignar'; });
    personal.appendChild(el('div', { class: 'anfo-personal-head' }, [
      el('h3', { class: 'anfo-step-label' }, [el('i', { class: 'cyan' }), document.createTextNode(' Postura y personal')]),
      el('span', { class: 'anfo-estado-personal' + (completos ? '' : ' incompleto'), text: completos ? '✓ Completo' : 'Pendiente' })
    ]));
    personas.forEach(function (x) {
      var iniciales = x[1] === 'Sin asignar' ? '—' : x[1].split(/[ ,/]+/).slice(0, 2).map(function (n) { return n.charAt(0).toUpperCase(); }).join('');
      personal.appendChild(el('div', { class: 'anfo-persona' }, [
        el('span', { class: 'anfo-avatar' + (x[2] ? ' det' : ''), text: iniciales }),
        el('div', null, [el('small', { text: x[0] }), el('strong', { text: x[1] })])
      ]));
    });
    card.appendChild(personal);
    card.appendChild(el('div', { class: 'anfo-pie' }, [
      el('a', { href: '../index.html', class: 'btn-primary', text: '‹ Volver al Menú' }),
      el('button', { type: 'button', class: 'btn-primary', text: 'Siguiente ➜', onclick: function () { ir('config'); } })
    ]));
    host.appendChild(card);
  }

  /* ---------- Paso 2: Ubicación y postura ---------- */
  function vistaConfiguracion(host, p) {
    var h = p.header, card = el('div', { class: 'anfo-config-card', style: 'margin:0 auto' });
    card.appendChild(el('h2', { text: 'Paso 2: Configuración de Postura' }));
    function seccion(titulo, color) { return el('section', { class: 'anfo-config-section' }, [el('h3', { class: 'anfo-config-label' }, [el('i', { class: color || '' }), document.createTextNode(' ' + titulo)])]); }
    function campo(parent, label, key, ph) {
      var wrap = el('div', { class: 'form-group-field' }), input = el('input', { type: 'text', value: h[key] || '', placeholder: ph, 'aria-label': label });
      wrap.appendChild(el('label', { text: label })); wrap.appendChild(input); parent.appendChild(wrap);
      input.addEventListener('input', function () { h[key] = input.value; actualizarId(); }); return input;
    }
    var loc = seccion('1 · Ubicación y postura'), mines = ['Andesita', 'Diablo Regimiento', 'Diamante', 'Esmeralda', 'NNM', 'Pacífico Superior', 'Pilar Norte', 'Reservas Norte', 'TT8'];
    var minaSelect = el('select', { class: 'anfo-config-native', 'aria-label': 'Mina' });
    mines.forEach(function (v) { minaSelect.appendChild(el('option', { value: v, text: v })); }); minaSelect.value = h.mina || 'Esmeralda';
    loc.appendChild(el('span', { class: 'anfo-config-field-label', text: 'Mina' })); loc.appendChild(minaSelect);
    var mg = el('div', { class: 'anfo-choice-row', role: 'group', 'aria-label': 'Seleccionar mina' });
    mines.forEach(function (v) { mg.appendChild(el('button', { type: 'button', class: v === minaSelect.value ? 'selected' : '', text: ({'Diablo Regimiento':'Diablo Reg.','Pacífico Superior':'Pacífico Sup.'}[v] || v), onclick: function () { minaSelect.value = v; h.mina = v; Array.from(mg.children).forEach(function (b) { b.classList.toggle('selected', b === this); }, this); actualizarId(); } })); });
    loc.appendChild(mg);
    var niveles = [{v:'NP',t:'NP'},{v:'UCL',t:'UCL'},{v:'Panel 2',t:'Panel 2'}];
    var nivelSelect = el('select', { class: 'anfo-config-native', 'aria-label': 'Nivel' });
    niveles.forEach(function (x) { nivelSelect.appendChild(el('option', { value:x.v, text:x.t })); }); nivelSelect.value = h.nivel || 'NP';
    loc.appendChild(el('span', { class: 'anfo-config-field-label', text: 'Nivel' })); loc.appendChild(nivelSelect);
    var ng = el('div', { class: 'anfo-choice-row anfo-segmented', role: 'group', 'aria-label': 'Seleccionar nivel' });
    niveles.forEach(function (x) { ng.appendChild(el('button', { type:'button', class: x.v === nivelSelect.value ? 'selected' : '', text:x.t, onclick:function(){nivelSelect.value=x.v; h.nivel=x.v; Array.from(ng.children).forEach(function(b){b.classList.toggle('selected',b===this);},this); pintarNivel(); actualizarId();} })); });
    loc.appendChild(ng);
    var bloqueSelect = el('select', { class: 'anfo-config-native', 'aria-label': 'Bloque' });
    J.LISTAS.bloque.forEach(function(v){bloqueSelect.appendChild(el('option',{value:v,text:v}));}); bloqueSelect.value=h.bloque||'Ext Fw';
    loc.appendChild(el('span',{class:'anfo-config-field-label',text:'Bloque'})); loc.appendChild(bloqueSelect);
    var bg=el('div',{class:'anfo-choice-row anfo-bloque-choices',role:'group','aria-label':'Seleccionar bloque'});
    J.LISTAS.bloque.forEach(function(v){bg.appendChild(el('button',{type:'button',class:v===bloqueSelect.value?'selected':'',text:v,onclick:function(){bloqueSelect.value=v;h.bloque=v;Array.from(bg.children).forEach(function(b){b.classList.toggle('selected',b===this);},this);actualizarId();}}));}); loc.appendChild(bg);
    bloqueSelect.addEventListener('change',function(){h.bloque=bloqueSelect.value;actualizarId();});
    minaSelect.addEventListener('change',function(){h.mina=minaSelect.value;actualizarId();}); nivelSelect.addEventListener('change',function(){h.nivel=nivelSelect.value;pintarNivel();actualizarId();});
    card.appendChild(loc);

    var detalles=seccion('2 · Detalles del nivel','cyan'), porNivel={};
    porNivel.NP=el('div',{class:'anfo-level-fields'},[el('div',{class:'anfo-detail-grid'})]);
    campo(porNivel.NP.firstChild,'Núm. Zanja','numZanja','Ej. 49'); campo(porNivel.NP.firstChild,'Calle Zanja 1','calleZanja1','Ej. 59'); campo(porNivel.NP.firstChild,'Calle Zanja 2','calleZanja2','Ej. 61');
    porNivel.UCL=el('div',{class:'anfo-level-fields',hidden:true},[el('div',{class:'anfo-detail-grid'})]); campo(porNivel.UCL.firstChild,'Calle UCL','calleUcl','Ej. C41'); campo(porNivel.UCL.firstChild,'Parada inicial','paradaIni','Ej. P1'); campo(porNivel.UCL.firstChild,'Parada final (negativa)','paradaFin','Ej. P5');
    porNivel['Panel 2']=el('div',{class:'anfo-level-fields',hidden:true});
    campo(detalles,'Fase','fase','Ej. 2');
    Object.keys(porNivel).forEach(function(k){detalles.appendChild(porNivel[k]);});
    function pintarNivel(){Object.keys(porNivel).forEach(function(k){porNivel[k].hidden=k!==(h.nivel||'NP');});}
    pintarNivel(); card.appendChild(detalles);

    var idbox=seccion('ID de tronadura · Automático','green'), idInput=el('input',{type:'text',readonly:'readonly',disabled:'disabled',value:''});
    idbox.classList.add('anfo-id-section'); idbox.appendChild(el('label',{class:'anfo-config-field-label',text:'Se genera con los datos de ubicación'})); idbox.appendChild(idInput); card.appendChild(idbox);
    function actualizarId(){
      var fase=h.fase?(/^(fase)/i.test(h.fase)?h.fase:'Fase '+h.fase):'', z=h.numZanja?(/^z/i.test(h.numZanja)?h.numZanja:'Z'+h.numZanja):'';
      h.idTronadura=h.nivel==='NP'?[z,h.calleZanja1&&h.calleZanja2?h.calleZanja1+'-'+h.calleZanja2:(h.calleZanja1||h.calleZanja2),fase].filter(Boolean).join(' '):h.nivel==='UCL'?[h.calleUcl,'UCL',fase].filter(Boolean).join(' '):[fase].filter(Boolean).join(' ');
      idInput.value=h.idTronadura||''; J.store.touch();
    }
    actualizarId();
    card.appendChild(el('div',{class:'anfo-config-actions'},[
      el('button',{type:'button',class:'anfo-config-back',text:'‹ Volver',onclick:function(){ir('datos');}}),
      el('button',{type:'button',class:'anfo-config-apply',text:'Guardar y aplicar ✓',onclick:function(){actualizarId(); ir('id');}})
    ]));
    host.appendChild(card);
  }

  /* ---------- Paso 3: Gestión de trabajo ---------- */
  function vistaId(host, p) {
    var card = el('div', { class: 'anfo-trabajo-screen' }), selected = ui.seleccionTrabajo || p.trabajoActual || '';
    card.appendChild(el('div', { class: 'anfo-progreso', 'aria-label': 'Progreso del seguimiento' }, [
      el('span', { class: 'completado', text: '✓' }), el('span', { class: 'completado', text: '✓' }),
      el('span', { class: 'actual', text: '3', 'aria-current': 'step' }),
    ].concat(['4','5','6','7','8'].map(function (n) { return el('span', { text:n }); }))));
    card.appendChild(el('p', { class: 'anfo-paso-indicador', text: 'PASO 3 DE 8' }));
    card.appendChild(el('h2', { text: 'Gestión de Trabajo' }));
    card.appendChild(el('div', { class: 'anfo-contexto-trabajo' }, [
      el('div', null, [el('small', { text: 'Turno' }), el('strong', { text: (p.header.turno || '—') + ' · ' + (p.header.fecha || '—') })]),
      el('div', null, [el('small', { text: 'ID Tronadura' }), el('strong', { text: p.header.idTronadura || 'Sin asignar' })])
    ]));

    var inp = el('input', { type:'text', placeholder:'Ej. TRABAJO-01', 'aria-label':'Nombre o ID del trabajo', autocomplete:'off' });
    var err = el('div', { class:'anfo-perforacion-q-error' });
    function crear() {
      var n=inp.value.trim(); if(!n){err.textContent='Escribe un nombre para el trabajo.';return;}
      var ya=p.trabajos.filter(function(t){return t.toLowerCase()===n.toLowerCase();})[0];
      if(ya)n=ya;else p.trabajos.push(n);
      p.trabajoActual=n;ui.seleccionTrabajo=n;ui.nuevaParada=true;ui.busca='';J.store.touch();ir('resumen');
    }
    inp.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();crear();}});
    card.appendChild(el('section',{class:'anfo-trabajo-panel anfo-nuevo-trabajo'},[
      el('h3',null,[el('i'),document.createTextNode(' Crear nuevo trabajo')]),
      el('label',{text:'Nombre / ID del trabajo'}),inp,
      el('p',{class:'anfo-sugerencia-trabajo'},[document.createTextNode('Sugerido: '),el('strong',{text:'TRABAJO-'+String(p.trabajos.length+1).padStart(2,'0')})]),err,
      el('button',{type:'button',class:'anfo-btn-crear',text:'+ Crear e ir a paradas',onclick:crear})
    ]));
    card.appendChild(el('div',{class:'anfo-separador-trabajo'},[el('span',{text:'o continúe uno existente'})]));
    var lista=el('div',{class:'anfo-lista-trabajos','aria-label':'Trabajos guardados'});
    p.trabajos.forEach(function(t){
      var rows=tirosDe(p,t), stops=paradasDe(p,t).length, complete=rows.length>0;
      var pick=el('button',{type:'button',class:'anfo-trabajo-seleccion','aria-pressed':t===selected?'true':'false',onclick:function(){
        selected=t;ui.seleccionTrabajo=t;p.trabajoActual=t;ui.nuevaParada=paradasDe(p,t).length===0;ui.busca='';J.store.touch();ir('resumen');
      }});
      pick.appendChild(el('span',{class:'anfo-trabajo-radio'}));
      pick.appendChild(el('span',{class:'anfo-trabajo-detalle'},[el('strong',{text:t}),el('small',{text:stops+' parada(s) · '+rows.length+' tiro(s)'})]));
      pick.appendChild(el('span',{class:'anfo-trabajo-estado'+(complete?'':' sin-tiros'),text:complete?'Completo':'En curso'}));
      lista.appendChild(el('div',{class:'anfo-trabajo-fila'},[pick,el('button',{type:'button',class:'anfo-btn-eliminar-trabajo',title:'Eliminar trabajo',text:'▤',onclick:function(){
        if(!confirm('¿Eliminar el trabajo «'+t+'» y sus tiros?'))return;
        p.filas=p.filas.filter(function(r){return r.trabajo!==t;});p.trabajos=p.trabajos.filter(function(x){return x!==t;});
        if(p.trabajoActual===t)p.trabajoActual='';if(ui.seleccionTrabajo===t)ui.seleccionTrabajo='';selected=p.trabajoActual;J.store.touch();render();
      }})]));
    });
    if(!p.trabajos.length)lista.appendChild(el('p',{class:'anfo-sin-trabajos',text:'Todavía no hay trabajos guardados.'}));
    card.appendChild(el('section',{class:'anfo-trabajo-panel anfo-existentes'},[
      el('h3',null,[el('i'),document.createTextNode(' Trabajos existentes '),el('span',{class:'anfo-conteo-trabajos',text:String(p.trabajos.length)})]),lista
    ]));
    card.appendChild(el('div',{class:'anfo-acciones-trabajo'},[
      el('button',{type:'button',class:'anfo-btn-volver',text:'‹ Volver',onclick:function(){ir('config');}}),
      el('button',{type:'button',class:'anfo-btn-usar',text:'Usar seleccionado ›',disabled:selected?null:'disabled',onclick:function(){
        if(!selected)return; p.trabajoActual=selected;ui.seleccionTrabajo=selected;ui.nuevaParada=paradasDe(p,selected).length===0;ui.busca='';J.store.touch();ir('resumen');
      }})
    ]));
    host.appendChild(card);
  }

  /* ---------- Descargas (reemplaza al antiguo «Guardar Registro Completo») ---------- */
  function bloqueDescarga(p) {
    var s = el('select', { class: 'anfo-perforacion-in', 'aria-label': 'Referencia del abatimiento' }, [
      el('option', { value: 'horizontal', text: 'horizontal' }), el('option', { value: 'vertical', text: 'vertical' })]);
    s.value = p.refAbat || 'horizontal';
    s.addEventListener('change', function () { p.refAbat = s.value; J.store.touch(); });
    return el('div', { class: 'anfo-perforacion-descarga' }, [
      el('label', { class: 'anfo-perforacion-lbl', style: 'margin-top:4px', text: 'Abatimiento de los diagramas de disparo, medido desde la:' }), s,
      el('div', { class: 'anfo-perforacion-pila', style: 'margin-top:12px' }, [
        el('button', { type: 'button', class: 'btn-primary', text: '⬇ Descargar Excel', onclick: function () { J.store.saveNow(); J.excel.download(P()); } }),
        el('button', { type: 'button', class: 'btn-primary', text: '⬇ Descargar Informe Técnico', onclick: function () { J.store.saveNow(); J.informe.abrir(P()); } })
      ]),
      el('small', { text: 'Los datos se guardan automáticamente en este dispositivo.' })
    ]);
  }

  /* ---------- Resumen de paradas del trabajo ---------- */
  function vistaResumen(host, p) {
    var t=p.trabajoActual, paradas=paradasDe(p,t), seleccion=ui.parada;
    if (!seleccion || paradas.indexOf(seleccion)<0) seleccion=paradas[0]||'';
    var card=el('div',{class:'anfo-paradas-screen',style:'display:flex;min-height:calc(100dvh - 110px)'});
    card.appendChild(el('div',{class:'anfo-progreso','aria-label':'Progreso del seguimiento'},[
      el('span',{class:'completado',text:'✓'}),el('span',{class:'completado',text:'✓'}),el('span',{class:'completado',text:'✓'}),el('span',{class:'actual',text:'4','aria-current':'step'}),
      el('span',{text:'5'}),el('span',{text:'6'}),el('span',{text:'7'}),el('span',{text:'8'})
    ]));
    card.appendChild(el('p',{class:'anfo-paso-indicador',text:'PASO 4 DE 8 · '+t.toUpperCase()}));
    card.appendChild(el('h2',{text:'Gestión de Paradas'}));
    var nueva=el('section',{class:'anfo-trabajo-panel anfo-parada-nueva'},[
      el('h3',null,[el('i'),document.createTextNode(' Crear nueva parada')]),
      el('label',{text:'ID de parada'})
    ]);
    var np=el('input',{type:'text',placeholder:'Ej. P1 o PARADA 1',value:sugerirParada(p),'aria-label':'Número de parada'}), e1=el('div',{class:'anfo-perforacion-q-error'});
    function crearParada(){
      var v=np.value.trim();if(!v){e1.textContent='Escribe el número o nombre de la parada.';return;}
      ui.parada=v;ui.nuevaParada=false;
      if(tirosDe(p,t,v).length){ui.aviso='';ir('parada');return;}
      ui.cantidadTiros=1;ui.agregarCantidad=false;ui.configurarExistentes=false;ir('cantidad');
    }
    np.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();crearParada();}});
    nueva.appendChild(np);nueva.appendChild(e1);
    nueva.appendChild(el('button',{type:'button',class:'anfo-btn-crear',text:'Crear parada y configurar tiros ›',onclick:crearParada}));
    card.appendChild(nueva);

    var lista=el('div',{class:'anfo-lista-paradas','aria-label':'Paradas registradas'});
    paradas.forEach(function(par){
      var rows=tirosDe(p,t,par),m=metros(rows),nCapturados=rows.filter(tiroCapturado).length,complete=rows.length>0&&nCapturados===rows.length;
      var badge=/^p/i.test(par)?par.toUpperCase():('P'+par);
      var row=el('button',{type:'button',class:'anfo-parada-fila','aria-pressed':par===seleccion?'true':'false',onclick:function(){ui.parada=par;render();}});
      row.appendChild(el('span',{class:'anfo-parada-badge',text:badge}));
      row.appendChild(el('span',{class:'anfo-parada-detalle'},[
        el('strong',{text:'Parada '+par}),el('small',{text:rows.length+' tiros · '+(complete?'completa':nCapturados+' de '+rows.length+' capturados')+(m?' · '+J.fmt(m,1)+' m':'')})
      ]));
      row.appendChild(el('span',{class:'anfo-parada-estado'+(complete?'':' en-curso'),text:complete?'● OK':'● En curso'}));
      lista.appendChild(row);
    });
    if(!paradas.length)lista.appendChild(el('p',{class:'anfo-sin-trabajos',text:'Aún no hay paradas registradas.'}));
    var guardadas=el('section',{class:'anfo-trabajo-panel anfo-paradas-guardadas'},[
      el('h3',null,[el('i'),document.createTextNode(' Paradas registradas '),el('span',{class:'anfo-conteo-trabajos',text:String(paradas.length)})]),lista
    ]);
    var borrar=el('button',{type:'button',class:'anfo-btn-eliminar-parada',text:'▤',title:'Eliminar parada',disabled:seleccion?null:'disabled',onclick:function(){
      var rows=tirosDe(p,t,seleccion);if(!confirm('¿Eliminar la parada «'+seleccion+'» y sus '+rows.length+' tiros?'))return;
      p.filas=p.filas.filter(function(r){return !(r.trabajo===t&&String(r.parada)===seleccion);});ui.parada='';J.store.touch();render();
    }});
    guardadas.appendChild(el('div',{class:'anfo-acciones-parada'},[
      el('button',{type:'button',class:'anfo-btn-ver-tiros',text:'Editar / ver tiros ›',disabled:seleccion?null:'disabled',onclick:function(){if(!seleccion)return;ui.parada=seleccion;ui.agregarCantidad=false;ui.configurarExistentes=true;ui.cantidadTiros=tirosDe(p,t,seleccion).length||1;ui.vista='cantidad';render();window.scrollTo(0,0);}}),borrar
    ]));
    card.appendChild(guardadas);
    card.appendChild(el('div',{class:'anfo-acciones-paradas'},[
      el('button',{type:'button',class:'anfo-btn-volver',text:'‹ Volver',onclick:function(){ir('id');}}),
      el('button',{type:'button',class:'anfo-btn-resumen-paradas',text:'Ver resumen ›',onclick:function(){if(todasParadasTienenTirosCapturados(p,t)){abrirPostura(p,'tiempos');return;}var pendiente=paradasDe(p,t).filter(function(x){var r=tirosDe(p,t,x);return !r.length||!r.every(tiroCapturado);})[0];if(!pendiente){abrirPostura(p,'tiempos');return;}ui.parada=pendiente;var pendientes=tirosDe(p,t,pendiente);if(!pendientes.length){ui.cantidadTiros=1;ui.agregarCantidad=false;ui.configurarExistentes=false;ui.vista='cantidad';render();}else{ui.vista='parada';render();}}})
    ]));
    host.appendChild(card);
  }

  /* ---------- Tiros de una parada (dato por dato) ---------- */
  function camposTiro(row) {
    return J.COLS.perf.filter(function (c) {
      if (c.type === 'calc' || c.sinCaptura || c.k === 'parada') return false;
      if (c.k === 'alturaBarra' && row.problema !== 'Barra Pegada') return false; // solo si hubo barra pegada
      return true;
    });
  }
  function filaAnterior(p, row) {
    var rows = tirosDe(p, row.trabajo, row.parada), i = rows.indexOf(row);
    return i > 0 ? rows[i - 1] : null;
  }
  function calcTexto(c, row) {
    if (c.k === 'mPerf') {
      if (isNaN(J.num(row.mDiseno)) || isNaN(J.num(row.mPerf))) return 'Cumplimiento para carga de diseño: —';
      return 'Cumplimiento para carga de diseño: ' + Math.round(J.calc.cumpl(row) * 100) + '%';
    }
    if (c.k === 'hFin') {
      var t = J.calc.tTiro(row);
      return 'Tiempo de perforación del tiro: ' + (isNaN(t) ? '—' : J.fmt(t, 1) + ' min');
    }
    return null;
  }
  function nombreTiro(row) {
    return (row.parada ? 'Parada ' + row.parada : 'Parada s/n') + ' · Tiro ' + (row.tiro || 's/n');
  }

  function nuevoTiro(p) {
    ui.cantidadTiros=1; ui.agregarCantidad=true;ui.configurarExistentes=false; ui.vista='cantidad'; render(); window.scrollTo(0,0);
  }
  function editarTiro(p, row) { ui.tiro = { row: row, nuevo: false, i: 0, err: '' }; ui.pestanaTiro='medidas'; ui.aviso=''; ui.vista='captura'; render(); }
  function cancelarTiro(p) {
    var t = ui.tiro;
    if (t.nuevo) { var i = p.filas.indexOf(t.row); if (i >= 0) p.filas.splice(i, 1); }
    ui.tiro = null; ui.aviso = ''; J.store.touch();
    if (!tirosDe(p, p.trabajoActual, ui.parada).length) ui.vista = 'resumen';
    render();
  }
  function terminarTiro(p) {
    ui.aviso = nombreTiro(ui.tiro.row) + ' guardado. Puedes registrar otro tiro o volver al resumen de paradas.';
    ui.tiro = null; J.store.touch(); render();
  }
  function avanzar(p) {
    var t = ui.tiro, cs = camposTiro(t.row), c = cs[t.i];
    if (c.type === 'num') {
      var v = t.row[c.k];
      if (v !== '' && isNaN(J.num(v))) { t.err = 'Ingresa un número (puedes usar coma o punto).'; render(); return; }
    }
    t.err = '';
    if (t.i >= cs.length - 1) { terminarTiro(p); return; }
    t.i++; render();
  }
  function retroceder() {
    var t = ui.tiro; t.err = '';
    if (t.i > 0) { t.i--; render(); }
  }

  function preguntaTiro(host, p) {
    var t = ui.tiro, row = t.row, cs = camposTiro(row);
    if (t.i > cs.length - 1) t.i = cs.length - 1;
    var c = cs[t.i], prev = filaAnterior(p, row);
    var q = el('div', { class: 'anfo-perforacion-q wizard-card', style: 'border-left-color:#' + c.bg });

    var salto = el('select', { 'aria-label': 'Ir a otro dato' });
    cs.forEach(function (x, i) { var o = el('option', { value: String(i), text: (i + 1) + '. ' + x.label }); if (i === t.i) o.selected = true; salto.appendChild(o); });
    salto.addEventListener('change', function () { t.i = +salto.value; t.err = ''; render(); });
    q.appendChild(el('div', { class: 'anfo-perforacion-q-top' }, [el('b', { text: nombreTiro(row) }), el('span', { text: 'Dato ' + (t.i + 1) + ' de ' + cs.length }), salto]));
    q.appendChild(el('div', { class: 'anfo-perforacion-q-barra' }, [el('i', { style: 'width:' + Math.round((t.i + 1) / cs.length * 100) + '%' })]));
    q.appendChild(el('h3', { text: c.label }));
    if (c.k === 'problema') q.appendChild(el('p', { class: 'anfo-perforacion-q-ayuda', text: 'Si no hubo problemas, toca «Sin problemas».' }));
    if (c.k === 'alturaBarra') q.appendChild(el('p', { class: 'anfo-perforacion-q-ayuda', text: 'Se pregunta porque el problema fue barra pegada.' }));

    var calcBox = null, ct = calcTexto(c, row);
    function actualizarCalc() { if (calcBox) calcBox.textContent = calcTexto(c, row); }
    var inp = null;

    if (c.type === 'select') {
      var opts = el('div', { class: 'anfo-perforacion-opts' });
      J.LISTAS[c.list].forEach(function (v) {
        opts.appendChild(el('button', { type: 'button', class: 'anfo-perforacion-opt' + (row[c.k] === v ? ' sel' : ''), text: v, onclick: function () {
          row[c.k] = v;
          if (c.k === 'problema' && v !== 'Barra Pegada') row.alturaBarra = '';
          J.store.touch(); avanzar(p);
        } }));
      });
      q.appendChild(opts);
    } else {
      if (c.type === 'num') {
        var step = c.k === 'tiro' ? 1 : (c.unit === '°' ? 1 : 0.1), min = c.k === 'tiro' ? 1 : 0;
        inp = el('input', { type:'number', step:String(step), min:String(min), value:row[c.k] || '', 'aria-label':c.label });
        inp.addEventListener('input', function(){row[c.k]=inp.value;t.err='';J.store.touch();actualizarCalc();});
        inp.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();avanzar(p);}});
        function ajustar(delta){
          var n=J.num(inp.value); if(isNaN(n))n=0;
          n=Math.max(min,Math.round((n+delta*step)*10)/10);
          if(step===1)n=Math.round(n);
          inp.value=String(n);row[c.k]=inp.value;t.err='';J.store.touch();actualizarCalc();
        }
        var stepper=el('div',{class:'anfo-tiro-stepper'},[
          el('button',{type:'button',class:'anfo-tiro-stepper-btn',text:'−',title:'Disminuir', 'aria-label':'Disminuir '+c.label,onclick:function(){ajustar(-1);}}),
          inp,
          el('button',{type:'button',class:'anfo-tiro-stepper-btn',text:'+',title:'Aumentar', 'aria-label':'Aumentar '+c.label,onclick:function(){ajustar(1);}})
        ]);
        q.appendChild(el('div',{class:'anfo-perforacion-q-input'},[stepper,c.unit?el('span',{class:'u',text:c.unit}):null]));
      } else {
        inp = el('input', { type: c.type === 'time' ? 'time' : 'text', value: row[c.k] || '', 'aria-label': c.label });
        inp.addEventListener('input', function () { row[c.k] = inp.value; t.err = ''; J.store.touch(); actualizarCalc(); });
        inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); avanzar(p); } });
        q.appendChild(el('div', { class: 'anfo-perforacion-q-input' }, [inp, c.unit ? el('span', { class: 'u', text: c.unit }) : null]));
      }
    }
    if (ct !== null) { calcBox = el('div', { class: 'anfo-perforacion-q-calc', text: ct }); q.appendChild(calcBox); }
    if (t.err) q.appendChild(el('div', { class: 'anfo-perforacion-q-error', text: t.err }));

    // Atajo: repetir el valor del tiro anterior de la misma parada
    var pv = prev ? (c.k === 'hIni' ? prev.hFin : prev[c.k]) : '';
    if (pv && !row[c.k] && c.k !== 'tiro') {
      q.appendChild(el('div', { style: 'margin-top:6px;text-align:center' }, [el('button', { type: 'button', class: 'anfo-perforacion-chip',
        text: (c.k === 'hIni' ? 'Usar hora de término del tiro anterior: ' : 'Usar el del tiro anterior: ') + pv,
        onclick: function () { row[c.k] = pv; J.store.touch(); render(); } })]));
    }

    var acc = el('div', { class: 'anfo-perforacion-q-acciones grid-2' }, [
      el('button', { type: 'button', class: 'btn-primary', text: '← Anterior', disabled: t.i === 0 ? 'disabled' : null, onclick: retroceder }),
      el('button', { type: 'button', class: 'btn-primary', text: c.k === 'problema' ? 'Sin problemas' : 'Omitir', onclick: function () {
        row[c.k] = ''; if (c.k === 'problema') row.alturaBarra = ''; J.store.touch(); avanzar(p);
      } }),
      el('button', { type: 'button', class: 'btn-primary', text: t.i >= cs.length - 1 ? '✔ Guardar tiro' : 'Siguiente →', onclick: function () { avanzar(p); } }),
      el('span', { class: 'anfo-perforacion-sep' }),
      el('button', { type: 'button', class: 'btn-primary', text: t.nuevo ? 'Cancelar tiro' : 'Cerrar', onclick: function () { if (t.nuevo) { if (confirm('¿Cancelar este tiro? Se descartan los datos ingresados.')) cancelarTiro(p); } else { terminarTiro(p); } } })
    ]);
    q.appendChild(acc);

    // Lo ya ingresado en este tiro
    var llenos = cs.filter(function (x) { return row[x.k] !== '' && x.k !== c.k; });
    if (llenos.length) {
      q.appendChild(el('div', { class: 'anfo-perforacion-q-resumen' }, llenos.map(function (x) {
        return el('span', { text: x.label.replace(/ \[.*\]$/, '') + ': ' + row[x.k] });
      })));
    }
    host.appendChild(q);
    if (inp) setTimeout(function () { try { inp.focus(); if (inp.select) inp.select(); } catch (e) { /* sin foco */ } }, 0);
  }

  function vistaParada(host, p) {
    vistaParadaTiros(host,p); return;
    if (ui.tiro) { preguntaTiro(host, p); return; }
    var t = p.trabajoActual, par = ui.parada, filas = tirosDe(p, t, par), card = el('div', { class: 'anfo-perforacion-card card-wide' });
    card.appendChild(el('h2', { class: 'anfo-perforacion-card-t', text: '📍 Parada: ' + par }));
    card.appendChild(el('p', { class: 'anfo-perforacion-card-sub', text: 'Trabajo: ' + t + ' · Cada tiro se registra dato por dato. Enter o «Siguiente» avanza; en las listas basta con tocar la opción.' }));
    if (ui.aviso) card.appendChild(el('div', { class: 'anfo-perforacion-aviso', text: ui.aviso }));
    if (!filas.length) {
      card.appendChild(el('div', { class: 'anfo-perforacion-vacio', text: 'Aún no hay tiros en esta parada. Toca «Agregar tiro».' }));
    } else {
      var tb = el('tbody'), mDis = 0, mPerf = 0, sc = 0, nc = 0;
      filas.forEach(function (r) {
        var d = J.num(r.mDiseno), m = J.num(r.mPerf);
        if (!isNaN(d)) mDis += d; if (!isNaN(m)) mPerf += m;
        if (!isNaN(d) && !isNaN(m)) { sc += J.calc.cumpl(r); nc++; }
        tb.appendChild(el('tr', null, [
          el('td', { text: r.tiro || '—' }), el('td', { text: r.mDiseno || '—' }), el('td', { text: r.mPerf || '—' }),
          el('td', { text: r.mDiseno && r.mPerf ? Math.round(J.calc.cumpl(r) * 100) + '%' : '—' }),
          el('td', { text: r.abat ? r.abat + '°' : '—' }), el('td', { text: r.estado || '—' }), el('td', { text: r.problema || '—' }),
          el('td', null, [el('div', { class: 'acc' }, [
            el('button', { type: 'button', class: 'anfo-perforacion-link', text: 'Configurar tiro', onclick: function () { editarTiro(p, r); } }),
            el('button', { type: 'button', class: 'anfo-perforacion-x', title: 'Eliminar tiro', text: '×', onclick: function () {
              if (confirm('¿Eliminar ' + nombreTiro(r) + '?')) {
                p.filas.splice(p.filas.indexOf(r), 1); J.store.touch(); ui.aviso = '';
                if (!tirosDe(p, t, par).length) ui.vista = 'resumen';
                render();
              }
            } })
          ])])
        ]));
      });
      var tf = el('tfoot', null, [el('tr', null, [el('td', { text: 'Total' }), el('td', { text: J.fmt(mDis, 1) }), el('td', { text: J.fmt(mPerf, 1) }), el('td', { text: pctTxt(nc ? sc / nc : NaN) }), el('td', { colspan: '4' })])]);
      card.appendChild(el('div', { class: 'anfo-perforacion-scroll sin-scroll' }, [el('table', { class: 'anfo-perforacion-tabla-simple anfo-perforacion-tabla-tiros' }, [
        el('thead', null, [el('tr', null, ['Tiro', 'Diseño [m]', 'Perforado [m]', 'Cumpl.', 'Abat.', 'Estado', 'Problema', ''].map(function (x) { return el('th', { text: x }); }))]),
        tb, tf])]));
    }
    card.appendChild(el('button', { type: 'button', class: 'btn-primary', text: '＋ Agregar tiro', onclick: function () { nuevoTiro(p); } }));
    card.appendChild(el('button', { type: 'button', class: 'btn-primary', style: 'margin-top:10px', text: '← Volver al Resumen de Paradas', onclick: function () { ir('resumen'); } }));
    host.appendChild(card);
  }

  function vistaParadaTiros(host,p){
    var trabajo=String(p.trabajoActual||''),parada=String(ui.parada||''),rows=tirosDe(p,trabajo,parada),capt=rows.filter(tiroCapturado).length,sanos=rows.filter(function(r){return tiroCapturado(r)&&r.estado!=='Tapado';}).length,tapados=rows.filter(function(r){return r.estado==='Tapado';}).length;
    var page=el('div',{class:'anfo-tiros-resumen-page',style:'display:flex'});page.appendChild(el('div',{class:'anfo-resumen-progreso'},Array.from({length:8},function(_,i){return el('i',{class:i<6?'done':''});})));
    page.appendChild(el('div',{class:'anfo-resumen-head'},[el('div',null,[el('p',{text:'PARADA '+parada.toUpperCase()+' · '+trabajo.toUpperCase()}),el('h2',{text:'Tiros de la Parada'})]),el('span',{class:'anfo-resumen-guardado',text:capt===rows.length&&rows.length?'✓ Guardado':'En curso'})]));
    page.appendChild(el('div',{class:'anfo-resumen-stats'},[[capt+'/'+rows.length,'Capturados',''],[String(sanos),'Sanos','sanos'],[String(tapados),'Tapados','tapados']].map(function(x){return el('div',{class:'anfo-resumen-stat '+x[2]},[el('strong',{text:x[0]}),el('small',{text:x[1]})]);})));
    var grid=el('div',{class:'anfo-tiros-grid'});rows.forEach(function(r,i){var done=tiroCapturado(r),tile=el('button',{type:'button',class:'anfo-tiro-resumen-card'+(done?'':' pendiente')+(r.estado==='Tapado'?' tapado':''),onclick:function(){editarTiro(p,r);}});tile.appendChild(el('i',{class:'anfo-mini-diagrama'}));tile.appendChild(el('span',{class:'anfo-tiro-resumen-info'},[el('span',{class:'anfo-tiro-resumen-top'},[el('strong',{text:String(i+1)}),el('small',{text:done?(r.mPerf||'—')+' m':'Pendiente'})]),el('span',{class:'anfo-tiro-tags'},done?[el('span',{class:r.estado==='Tapado'?'tapado':'',text:r.estado==='Tapado'?'Tapado':'Sano'}),el('span',{class:'agua',text:r.conAgua==='Si'?'Agua':'Seco'})]:[])]));grid.appendChild(tile);});page.appendChild(grid);
    var siguiente=todasParadasTienenTirosCapturados(p,trabajo)?'Tiempos ›':'Paradas ›';page.appendChild(el('p',{class:'anfo-resumen-aviso',text:capt===rows.length&&rows.length?'ⓘ Tiros guardados. Continúa con los datos de postura.':'ⓘ Toque un tiro para corregirlo o complete los pendientes.'}));page.appendChild(el('div',{class:'anfo-resumen-actions'},[el('button',{class:'anfo-resumen-volver',text:'‹ Paradas',onclick:function(){ui.parada='';ir('resumen');}}),el('button',{class:'anfo-resumen-capturar',text:capt<rows.length?'Capturar tiros ›':siguiente,onclick:function(){if(capt<rows.length){configurarTirosExistentes(p,ui.parada);}else if(todasParadasTienenTirosCapturados(p,trabajo)){abrirPostura(p,'tiempos');}else{ui.parada='';ir('resumen');}}})]));host.appendChild(page);
  }
  function vistaCantidad(host,p){
    var page=el('div',{class:'anfo-tiros-resumen-page',style:'display:flex'}),out=el('output',{text:String(ui.cantidadTiros)});page.appendChild(el('div',{class:'anfo-resumen-progreso'},Array.from({length:8},function(_,i){return el('i',{class:i<5?'done':''});})));
    page.appendChild(el('div',{class:'anfo-resumen-head'},[el('div',null,[el('p',{text:'PASO 5 DE 8 · PARADA '+ui.parada.toUpperCase()}),el('h2',{text:'Configurar Tiros'})])]));
    var box=el('section',{class:'anfo-tiros-modal-body'},[el('p',{class:'anfo-tiros-eyebrow',text:'CANTIDAD DE TIROS · RANGO 1 – 50'}),el('div',{class:'anfo-tiros-stepper'},[el('button',{type:'button',text:'−',onclick:function(){var rows=tirosDe(p,p.trabajoActual,ui.parada),capt=rows.filter(tiroCapturado).reduce(function(n,r){return Math.max(n,parseInt(r.tiro,10)||0);},0),limite=ui.configurarExistentes?Math.max(1,capt):1;ui.cantidadTiros=Math.max(limite,ui.cantidadTiros-1);out.textContent=ui.cantidadTiros;}}),el('div',{class:'anfo-tiros-value-wrap'},[out,el('span',{text:'TIROS'})]),el('button',{type:'button',text:'+',onclick:function(){ui.cantidadTiros=Math.min(50,ui.cantidadTiros+1);out.textContent=ui.cantidadTiros;}})])]);var presets=el('div',{class:'anfo-tiros-presets'});[1,5,8,9,12,15,20].forEach(function(n){presets.appendChild(el('button',{type:'button',class:ui.cantidadTiros===n?'activo':'',text:String(n),onclick:function(){var rows=tirosDe(p,p.trabajoActual,ui.parada),capt=rows.filter(tiroCapturado).reduce(function(v,r){return Math.max(v,parseInt(r.tiro,10)||0);},0);ui.cantidadTiros=ui.configurarExistentes?Math.max(capt,n):n;out.textContent=ui.cantidadTiros;}}));});box.appendChild(presets);box.appendChild(el('p',{class:'anfo-tiros-hint',text:ui.configurarExistentes?'Tiros existentes cargados. «Capturar tiros» abre el primero pendiente; los capturados se conservan.':'ⓘ Se abrirá una ficha para cada tiro, una tras otra. Puedes volver al anterior en cualquier momento.'}));page.appendChild(box);
    page.appendChild(el('div',{class:'anfo-resumen-actions'},[el('button',{class:'anfo-resumen-volver',text:'‹ Volver',onclick:function(){ui.agregarCantidad=false;ui.configurarExistentes=false;ir('parada');}}),el('button',{class:'anfo-resumen-capturar',text:'Capturar tiros ›',onclick:function(){var existing=tirosDe(p,p.trabajoActual,ui.parada),target=Math.max(1,Math.min(50,parseInt(ui.cantidadTiros,10)||1));if(ui.configurarExistentes){var highestCaptured=existing.filter(tiroCapturado).reduce(function(n,r){return Math.max(n,parseInt(r.tiro,10)||0);},0);if(target<highestCaptured){alert('No se puede reducir la cantidad por debajo del último tiro capturado ('+highestCaptured+').');return;}if(target<existing.length){p.filas=p.filas.filter(function(r){return r.trabajo!==p.trabajoActual||String(r.parada)!==String(ui.parada)||Number(r.tiro)<=target;});existing=tirosDe(p,p.trabajoActual,ui.parada);}for(var add=existing.length;add<target;add++){var added=J.store.filaVaciaPerf();added.trabajo=p.trabajoActual;added.parada=ui.parada;added.tiro=String(add+1);added.capturado=false;p.filas.push(added);}existing=tirosDe(p,p.trabajoActual,ui.parada);var next=existing.filter(function(r){return !tiroCapturado(r);})[0]||existing[0];if(!next){ui.vista='parada';render();return;}ui.tiro={row:next,nuevo:!tiroCapturado(next),i:0,err:''};ui.configurarExistentes=false;ui.agregarCantidad=false;ui.pestanaTiro='medidas';ui.vista='captura';J.store.touch();render();return;}var start=ui.agregarCantidad?existing.length:0,n=Math.min(target,50-start);if(n<1){alert('Esta parada ya tiene 50 tiros.');return;}for(var i=0;i<n;i++){var r=J.store.filaVaciaPerf();r.trabajo=p.trabajoActual;r.parada=ui.parada;r.tiro=String(start+i+1);r.capturado=false;p.filas.push(r);}ui.agregarCantidad=false;ui.configurarExistentes=false;ui.tiro={row:tirosDe(p,p.trabajoActual,ui.parada)[start],nuevo:true,i:0,err:''};ui.pestanaTiro='medidas';ui.vista='captura';J.store.touch();render();}})]));host.appendChild(page);
  }
  function stepperTiro(row,key,label,unit,step,min,max,onChange){step=step||1;min=min===undefined?0:min;var input=el('input',{type:'number',step:String(step),min:String(min),value:row[key]||'', 'aria-label':label,style:'width:auto;min-width:0;flex:1;text-align:center;font-size:16px;font-weight:800;padding:0;border:0;background:transparent'});function changed(){var fn=onChange||ui.diagramUpdater;if(fn)fn();}function set(v){if(v===''){row[key]='';J.store.touch();changed();return;}var n=J.num(v);if(isNaN(n))return;if(max!==undefined)n=Math.min(max,n);if(min!==null)n=Math.max(min,n);input.value=String(n);row[key]=String(n);J.store.touch();changed();}input.addEventListener('input',function(){row[key]=input.value;J.store.touch();changed();});function bump(d){var n=J.num(input.value);if(isNaN(n))n=0;set(Math.round((n+d*step)*100)/100);}return el('div',{class:'anfo-tiro-campo'},[el('div',{class:'form-group-field'},[el('label',{text:label}),el('div',{class:'anfo-tiro-stepper'},[el('button',{type:'button',class:'anfo-tiro-stepper-btn',text:'−',onclick:function(){bump(-1);}}),input,el('button',{type:'button',class:'anfo-tiro-stepper-btn',text:'+',onclick:function(){bump(1);}})]),el('small',{text:unit||'',style:'display:block;text-align:right;color:#60759a;font-size:8px'})])]);}
  function choiceTiro(row,key,label,values,labels){var box=el('div',{class:'anfo-tiro-campo'},[el('div',{class:'form-group-field'},[el('label',{text:label})])]),choices=el('div',{class:'anfo-choice-row'});values.forEach(function(v,i){choices.appendChild(el('button',{type:'button',class:row[key]===v?'selected':'',text:labels?labels[i]:v,onclick:function(){row[key]=v;J.store.touch();Array.from(choices.children).forEach(function(b,j){b.classList.toggle('selected',j===i);});}}));});box.appendChild(choices);return box;}
  function textoTiro(row,key,label,placeholder){var input=el('input',{type:'text',value:row[key]||'',placeholder:placeholder||'', 'aria-label':label});input.addEventListener('input',function(){row[key]=input.value;J.store.touch();});return el('div',{class:'anfo-tiro-campo'},[el('div',{class:'form-group-field'},[el('label',{text:label}),input])]);}
  function svgEl(tag,attrs,kids){var node=document.createElementNS('http://www.w3.org/2000/svg',tag);Object.keys(attrs||{}).forEach(function(k){if(k==='text')node.textContent=attrs[k];else node.setAttribute(k,attrs[k]);});(kids||[]).forEach(function(k){if(k)node.appendChild(k);});return node;}
  function vistaCapturaTiro(host,p){
    var row=ui.tiro&&ui.tiro.row;if(!row){ui.vista='parada';vistaParadaTiros(host,p);return;}var rows=tirosDe(p,p.trabajoActual,ui.parada),idx=rows.indexOf(row),tabNames=['medidas','estado','equipo'],tabLabels=['Medidas','Estado','Equipo'];if(idx<0)idx=0;
    var overlay=el('div',{class:'anfo-captura-overlay visible'}),modal=el('section',{class:'anfo-captura-modal','aria-label':'Captura de tiro'});modal.appendChild(el('div',{class:'anfo-captura-progress'},Array.from({length:8},function(_,i){return el('i',{class:i<5?'done':i===5?'current':''});})));modal.appendChild(el('div',{class:'anfo-captura-head'},[el('div',null,[el('p',{text:'PASO 6 DE 8 · PARADA '+ui.parada.toUpperCase()}),el('h2',{text:'Captura de Tiro'})]),el('span',{text:'Tiro '+(idx+1)+' de '+rows.length})]));
    var nav=el('div',{class:'anfo-tiro-nav'});rows.forEach(function(r,i){nav.appendChild(el('button',{type:'button',class:(tiroCapturado(r)?'completo ':'')+(r===row?'actual':''),text:tiroCapturado(r)?'✓':String(i+1),onclick:function(){ui.tiro={row:r,nuevo:!tiroCapturado(r),i:0,err:''};ui.pestanaTiro='medidas';render();}}));});modal.appendChild(nav);
    var m=J.num(row.mPerf);if(isNaN(m)||m<1)m=13;var svg=svgEl('svg',{class:'anfo-tiro-diagrama',viewBox:'0 0 110 310'},[svgEl('rect',{x:'17',y:'16',width:'75',height:'258',fill:'#e9e3d2'}),svgEl('line',{x1:'25',y1:'25',x2:'58',y2:String(24+Math.min(250,m*15)),stroke:'#f2a20b','stroke-width':'5'}),svgEl('line',{x1:'20',y1:'24',x2:'95',y2:'24',stroke:'#8796b4','stroke-width':'5'}),svgEl('text',{x:'24',y:'291',fill:'#48638e','font-size':'8',text:'Diseño '+(row.mDiseno||'—')+' m'}),svgEl('text',{x:'24',y:'302',fill:'#48638e','font-size':'8',text:'Real '+(row.mPerf||'—')+' m'})]);var summaryDiagram=el('div',{class:'anfo-tiro-resumen',text:'Diseño '+(row.mDiseno||'—')+' m · Real '+(row.mPerf||'—')+' m'});function updateDiagram(){var md=J.num(row.mDiseno),mp=J.num(row.mPerf),ab=J.num(row.abat);if(isNaN(md))md='—';else md=J.fmt(md,1);if(isNaN(mp))mp='—';else mp=J.fmt(mp,1);if(isNaN(ab))ab=0;svg.children[1].setAttribute('x2',String(52+Math.max(-50,Math.min(50,ab))*.65));svg.children[1].setAttribute('y2',String(24+Math.min(250,(isNaN(J.num(row.mPerf))?13:J.num(row.mPerf))*15)));svg.children[3].textContent='Diseño '+md+' m';svg.children[4].textContent='Real '+mp+' m';summaryDiagram.textContent='Diseño '+md+' m · Real '+mp+' m';}ui.diagramUpdater=updateDiagram;var workspace=el('div',{class:'anfo-captura-workspace'});workspace.appendChild(el('div',{class:'anfo-tiro-diagrama-card'},[el('strong',{text:'TIRO '+(idx+1)+' · VISTA',style:'font-size:8px;color:#24498f'}),svg,summaryDiagram]));
    var panel=el('div',{class:'anfo-tiro-panel'}),tabs=el('div',{class:'anfo-tiro-tabs',style:'grid-template-columns:repeat(3,minmax(0,1fr))'}),fields=el('div',{class:'anfo-tiro-campos'});function fill(){fields.innerHTML='';if(ui.pestanaTiro==='medidas'){fields.appendChild(stepperTiro(row,'mDiseno','Long. diseño','m',.1,.1));fields.appendChild(stepperTiro(row,'abat','Ángulo','°',1,-90,90));fields.appendChild(stepperTiro(row,'mPerf','Largo real','m',.1,.1));fields.appendChild(stepperTiro(row,'rot','Azimut','°',1,0,360));}else if(ui.pestanaTiro==='estado'){fields.appendChild(choiceTiro(row,'estado','ESTADO DEL TIRO',['Bueno','Tapado'],['✓ Sano','Tapado']));if(row.estado==='Tapado')fields.appendChild(stepperTiro(row,'intentosDestape','Intentos de destape','intentos',1,0));fields.appendChild(choiceTiro(row,'conAgua','Agua',['No','Si'],['Seco','Agua']));fields.appendChild(choiceTiro(row,'desvio','Desvío',['Dentro','Fuera']));fields.appendChild(stepperTiro(row,'numBarras','Núm. barras','barras',1,0));}else{fields.appendChild(stepperTiro(row,'pPerc','Presión percusión','bar',1,0));fields.appendChild(choiceTiro(row,'conAgua','Agua barrido',['Si','No']));fields.appendChild(stepperTiro(row,'pAv','Presión avance','bar',1,0));fields.appendChild(textoTiro(row,'brocas','Brocas','Sin cambio · toque para agregar'));fields.appendChild(textoTiro(row,'barras','Barras','Ej. 11 · 1.2 m'));}}
    tabNames.forEach(function(n,i){tabs.appendChild(el('button',{type:'button',class:ui.pestanaTiro===n?'activo':'',text:tabLabels[i],onclick:function(){ui.pestanaTiro=n;render();}}));});panel.appendChild(tabs);fill();panel.appendChild(fields);workspace.appendChild(panel);modal.appendChild(workspace);var ti=tabNames.indexOf(ui.pestanaTiro);modal.appendChild(el('div',{class:'anfo-captura-actions'},[el('button',{type:'button',class:'anfo-captura-prev',text:ti===0?'‹ Tiros':'‹ '+tabLabels[ti-1],onclick:function(){if(ti===0){ui.diagramUpdater=null;ui.tiro=null;ui.vista='parada';render();}else{ui.pestanaTiro=tabNames[ti-1];render();}}}),el('button',{type:'button',class:'anfo-captura-next',style:ti===2?'background:linear-gradient(#20c981,#0b985c);border-color:#30d28d;':'',text:ti===2?'Guardar tiro ✓':tabLabels[ti+1]+' ›',onclick:function(){var activeTab=tabNames.indexOf(ui.pestanaTiro);if(activeTab<2){ui.pestanaTiro=tabNames[activeTab+1];render();}else{guardarTiroCaptura(row);}}})]));overlay.appendChild(modal);host.appendChild(overlay);
  }

  /* ---------- Paso 3 (ventana nueva): datos faltantes de plantilla + descargas ---------- */
  function plantillaCompleta(p) {
    return pasosPlantilla().every(function (x) {
      if (x.type === 'perd') return p.perdidas.length > 0;
      return !!p.header[x.k];
    });
  }
  function minutosLegibles(n){n=Math.max(0,Math.round(n||0));return n<60?n+' min':Math.floor(n/60)+' h '+(n%60)+' min';}
  function perdidaTipo(p,tipo){var x=p.perdidas.filter(function(q){return q.tipo===tipo;})[0];if(!x&&tipo==='perforacion')x=p.perdidas.filter(function(q){return !q.tipo;})[0];if(!x)x={tipo:tipo,desc:'',tiempo:'00:00',minutos:0,activo:false};x.tipo=tipo;var mins=J.toMin(x.tiempo);if(!isFinite(mins))mins=0;x.minutos=Number(x.minutos)||mins;return x;}
  function vistaPostura(host,p){
    var tabs=['tiempos','equipos','perdidas'],names=['Tiempos','Equipos','Pérdidas'],ix=Math.max(0,tabs.indexOf(ui.posturaTab||'tiempos'));ui.posturaTab=tabs[ix];
    var page=el('div',{class:'anfo-postura-page',style:'display:flex'}),progress=el('div',{class:'anfo-postura-progress','aria-label':'Paso 7 de 8'},Array.from({length:8},function(_,i){return el('i',{class:i<6?'active':''});}));page.appendChild(progress);
    page.appendChild(el('header',{class:'anfo-postura-head'},[el('div',null,[el('p',{text:'PASO 7 DE 8 · DATOS DE PLANTILLA'}),el('h2',{text:names[ix]==='Tiempos'?'Tiempos de la postura':names[ix]==='Equipos'?'Equipos y geófono':'Pérdidas y observaciones'})]),el('span',{class:'anfo-postura-count',text:(ix===0?'8':ix===1?'14':'17')+'/17'})]));
    var nav=el('nav',{class:'anfo-postura-tabs',role:'tablist','aria-label':'Datos de postura'});tabs.forEach(function(k,i){nav.appendChild(el('button',{type:'button',role:'tab',class:ix===i?'active':'','aria-selected':ix===i?'true':'false',text:(i===0?'◷ ':i===1?'⚙ ':'⚠ ')+names[i],onclick:function(){abrirPostura(p,k);}}));});page.appendChild(nav);
    var panel=el('div',{class:'anfo-postura-panel'});
    if(ix===0){
      var schedule=el('div',{class:'anfo-postura-card anfo-tiempo-lista'}),events=[['hLlegJej','Llegada JeJ a postura'],['hIniPerf','Inicio de perforación'],['hFinPerf','Fin de perforación'],['hLlegPyt','Inicio de traslado'],['hSalPyt','Fin de traslado'],['hSalJej','Salida JeJ de postura']],deltas=[];
      function updateDurations(){events.forEach(function(ev,i){if(!i)return;var mins=J.diffMin(p.header[events[i-1][0]],p.header[ev[0]]);deltas[i-1].textContent=isNaN(mins)?'':'↳ '+minutosLegibles(mins);});}
      events.forEach(function(ev,i){var input=el('input',{type:'time',value:p.header[ev[0]]||'', 'aria-label':ev[1]});input.addEventListener('input',function(){p.header[ev[0]]=input.value;J.store.touch();updateDurations();});schedule.appendChild(el('div',{class:'anfo-tiempo-evento'},[el('i',{class:i===3||i===4?'amarre':''}),el('label',{text:ev[1]}),input]));if(i<events.length-1){var delta=el('small',{style:'display:block;margin:-4px 0 2px 21px;color:#54709e;font-size:8px'});deltas.push(delta);schedule.appendChild(delta);}});updateDurations();panel.appendChild(schedule);panel.appendChild(el('p',{class:'anfo-postura-nota',text:'ⓘ Los tiempos entre eventos se calculan automáticamente.'}));
    }else if(ix===1){
      var equipo=el('div',{class:'anfo-postura-card'},[el('h3',{text:'■ PRESIÓN Y EQUIPOS'})]),grid=el('div',{class:'anfo-equipo-grid'});
      function field(label,key,unit,step,placeholder){var inp=el('input',{type:'number',step:String(step||1),min:'0',value:p.header[key]||'',placeholder:placeholder||'', 'aria-label':label});inp.addEventListener('input',function(){p.header[key]=inp.value;J.store.touch();});var stepper=el('div',{class:'anfo-equipo-stepper'},[el('button',{type:'button',text:'−',onclick:function(){var n=Number(inp.value||0);inp.value=String(Math.max(0,n-(step||1)));inp.dispatchEvent(new Event('input',{bubbles:true}));}}),inp,el('span',{text:unit}),el('button',{type:'button',text:'+',onclick:function(){var n=Number(inp.value||0);inp.value=String(n+(step||1));inp.dispatchEvent(new Event('input',{bubbles:true}));}})]);grid.appendChild(el('label',null,[document.createTextNode(label),stepper]));}
      field('Compresor','presionCompresor','bar',.1,'7.0');field('Agua','presionAgua','bar',.1,'5.0');field('Diámetro de tiros','diametro','pulg',.1,'3.5');
      var vod=el('fieldset',null,[el('legend',{text:'Tiro con VoD'})]),pill=el('div',{class:'anfo-pill-choice'});['Si','No'].forEach(function(v){pill.appendChild(el('button',{type:'button',class:p.header.tiroVod===v?'selected':'',text:v==='Si'?'Sí':'No',onclick:function(){p.header.tiroVod=v;J.store.touch();Array.from(pill.children).forEach(function(b,i){b.classList.toggle('selected',['Si','No'][i]===v);});}}));});vod.appendChild(pill);grid.appendChild(vod);equipo.appendChild(grid);panel.appendChild(equipo);
      var geo=el('div',{class:'anfo-postura-card'},[el('h3',null,[document.createTextNode('■ GEÓFONO Y COLLAR '),el('small',{text:'Opcional'})])]),geogrid=el('div',{class:'anfo-geofono-grid'});[['Ubicación','ubicacionGeofono'],['Distancia [m]','distanciaGeofono'],['Altura [m]','alturaGeofono']].forEach(function(x){var inp=el('input',{type:'text',value:p.header[x[1]]||'',placeholder:'Opcional'});inp.addEventListener('input',function(){p.header[x[1]]=inp.value;J.store.touch();});geogrid.appendChild(el('label',null,[document.createTextNode(x[0]),inp]));});geo.appendChild(geogrid);panel.appendChild(geo);
    }else{
      var lossData=[['perforacion','DURANTE LA PERFORACIÓN',['Espera de jumbo','Falla de equipo','Sin acceso','Otro']],['traslado','DURANTE EL TRASLADO',['Bloqueo de vía','Ventilación','Falla de equipo','Otro']]],total=el('p',{class:'anfo-perdida-total'});
      function updateTotal(){var sum=p.perdidas.reduce(function(s,x){var m=Number(x.minutos);if(!isFinite(m))m=J.toMin(x.tiempo);return s+(x.activo&&isFinite(m)?m:0);},0);total.textContent='⚠ Pérdida total '+minutosLegibles(sum)+'. Se descontará del tiempo efectivo.';}
      lossData.forEach(function(info){var item=perdidaTipo(p,info[0]),active=!!item.activo,card=el('div',{class:'anfo-postura-card anfo-perdida-card'+(active?' registrando':'' )}),clear=el('button',{type:'button',class:active?'':'active',text:'Sin pérd.',onclick:function(){item.activo=false;item.desc='';item.otro='';item.minutos=0;item.tiempo='00:00';var index=p.perdidas.indexOf(item);if(index>=0)p.perdidas.splice(index,1);J.store.touch();abrirPostura(p,'perdidas');}}),reg=el('button',{type:'button',class:active?'active':'',text:'Registrar',onclick:function(){item.activo=true;if(p.perdidas.indexOf(item)<0)p.perdidas.push(item);J.store.touch();abrirPostura(p,'perdidas');}});card.appendChild(el('h3',null,[el('span',{text:'■ '+info[1]}),el('div',null,[clear,reg])]));
        if(active){var details=el('div',{class:'anfo-perdida-detalle'}),chips=el('div',{class:'anfo-chip-list'}),selected=(item.desc||'').split(' · ').filter(Boolean);info[2].forEach(function(reason){var b=el('button',{type:'button',class:selected.indexOf(reason)>=0?'selected':'',text:reason});b.addEventListener('click',function(){b.classList.toggle('selected');var values=Array.from(chips.querySelectorAll('button.selected')).map(function(x){return x.textContent;});item.desc=values.join(' · ');if(values.indexOf('Otro')<0)item.otro='';J.store.touch();abrirPostura(p,'perdidas');});chips.appendChild(b);});details.appendChild(chips);if(selected.indexOf('Otro')>=0){var other=el('input',{type:'text',class:'anfo-perdida-otro',value:item.otro||'',placeholder:'Especifica la pérdida'});other.addEventListener('input',function(){item.otro=other.value;J.store.touch();});details.appendChild(other);}
          var mins=Number(item.minutos)||0,minuteInput=el('input',{type:'number',min:'0',step:'5',value:String(mins),'aria-label':'Minutos de pérdida'});function setMinutes(n){mins=Math.max(0,n);item.minutos=mins;item.tiempo=('0'+Math.floor(mins/60)).slice(-2)+':'+('0'+(mins%60)).slice(-2);minuteInput.value=String(mins);updateTotal();}minuteInput.addEventListener('input',function(){setMinutes(Number(minuteInput.value)||0);});var presets=el('div',{class:'anfo-minute-chips'});[10,15,30].forEach(function(n){presets.appendChild(el('button',{type:'button',text:String(n),onclick:function(){setMinutes(n);}}));});details.appendChild(el('div',{class:'anfo-perdida-tiempo'},[el('button',{type:'button',text:'−',onclick:function(){setMinutes(mins-5);}}),el('strong',null,[minuteInput,el('small',{text:'min'})]),el('button',{type:'button',text:'+',onclick:function(){setMinutes(mins+5);}}),presets]));card.appendChild(details);
        }panel.appendChild(card);});
      var obs=el('textarea',{rows:'2',placeholder:'Comentarios adicionales de la postura...'});obs.value=p.obs[0]||'';obs.addEventListener('input',function(){p.obs[0]=obs.value;J.store.touch();});panel.appendChild(el('div',{class:'anfo-postura-card'},[el('h3',{text:'■ OBSERVACIONES GENERALES'}),obs]));panel.appendChild(total);updateTotal();
    }
    page.appendChild(panel);page.appendChild(el('footer',{class:'anfo-postura-actions'},[el('button',{type:'button',text:ix?'‹ '+names[ix-1]:'‹ Tiros',onclick:function(){if(ix){abrirPostura(p,tabs[ix-1]);}else{ui.parada='';ir('resumen');}}}),el('button',{type:'button',style:ix===2?'background:linear-gradient(#20c981,#0b985c);border:1px solid #30d28d;':'',text:ix<2?names[ix+1]+' ›':'Ir al resumen ✓',onclick:function(){if(ix<2)abrirPostura(p,tabs[ix+1]);else{J.store.touch();ui.vista='final';render();window.scrollTo(0,0);}}})]));host.appendChild(page);
  }
  // Desde el resumen: si faltan datos abre directo el asistente; si ya están, muestra la ventana de descargas
  function irACierre(p) {
    descartarTiroVacio(p);
    ui.tiro = null; ui.aviso = ''; ui.vista = 'final';
    if (!plantillaCompleta(p)) abrirAsistente('plantilla'); else { render(); window.scrollTo(0, 0); }
  }
  function vistaFinal(host, p) {
    vistaResumenGeneralPerforacion(host,p); return;
  }
  function vistaResumenGeneralPerforacion(host,p){
    var used=p.filas.filter(J.filaUsada),groups={};used.forEach(function(r){var key=(r.trabajo||'')+'||'+String(r.parada||'—'),g=groups[key]||(groups[key]={trabajo:r.trabajo||'Trabajo',parada:r.parada||'—',total:0,sanos:0,tapados:0});g.total++;if(r.estado==='Tapado')g.tapados++;else g.sanos++;});var filas=Object.keys(groups).map(function(k){return groups[k];}),max=Math.max(1,...filas.map(function(x){return x.total;})),tapados=used.filter(function(r){return r.estado==='Tapado';}).length,perdida=J.totalPerdidas(p),detalle={};
    p.filas.filter(function(r){return r.trabajo&&r.parada!=='';}).forEach(function(r){var key=String(r.trabajo)+'||'+String(r.parada),g=detalle[key]||(detalle[key]={trabajo:r.trabajo,parada:String(r.parada),rows:[]});g.rows.push(r);});var detalleFilas=Object.keys(detalle).map(function(k){return detalle[k];});
    var page=el('div',{class:'anfo-resumen-final-mode anfo-final-page',style:'display:flex;min-height:calc(100dvh - 92px);flex-direction:column;gap:8px;color:#fff'});page.appendChild(el('div',{class:'anfo-final-progress'},Array.from({length:8},function(){return el('i');})));page.appendChild(el('header',{class:'anfo-final-head'},[el('div',null,[el('p',{text:'PERFORACIÓN · '+(p.trabajoActual||'SEGUIMIENTO')}),el('h2',{text:'Resumen General'})]),el('span',{text:'✓ Guardado'})]));
    page.appendChild(el('div',{class:'anfo-final-stats'},[[p.trabajos.length,'Trabajos',''],[filas.length,'Paradas',''],[used.length,'Tiros',''],[tapados,'Tapados','tapado']].map(function(x){return el('article',{class:x[2]},[el('strong',{text:String(x[0])}),el('small',{text:x[1]})]);})));
    var chart=el('section',{class:'anfo-final-chart'},[el('header',null,[el('strong',{text:'■ TIROS POR PARADA'}),el('span',{text:used.length?Math.round((used.length-tapados)/used.length*100)+'% sanos':'0% sanos'})])]);
    if(filas.length){var chartRows=el('div',{class:'anfo-final-chart-rows'});filas.forEach(function(g){var bars=el('div',{class:'anfo-final-bars'});[['total',g.total],['sanos',g.sanos],['tapados',g.tapados]].forEach(function(x){bars.appendChild(el('span',{class:x[0],style:'width:'+Math.max(x[1]?3:0,x[1]/max*100)+'%'},[el('b',{text:String(x[1])})]));});chartRows.appendChild(el('div',{class:'anfo-final-chart-row'},[el('label',{text:g.trabajo+' · '+g.parada}),bars]));});chart.appendChild(chartRows);}else chart.appendChild(el('p',{class:'anfo-final-empty',text:'Aún no hay tiros registrados.'}));chart.appendChild(el('footer',null,[el('span',null,[el('i',{class:'total'}),document.createTextNode(' Total')]),el('span',null,[el('i',{class:'sanos'}),document.createTextNode(' Sanos')]),el('span',null,[el('i',{class:'tapados'}),document.createTextNode(' Tapados')])]));page.appendChild(chart);
    page.appendChild(el('section',{class:'anfo-final-times'},[el('span',{text:'◷ Perforación '},[el('b',{text:minutosLegibles(J.tPerforacion(p.header))})]),el('span',{text:'Traslado '},[el('b',{text:minutosLegibles(J.diffMin(p.header.hFinPerf,p.header.hSalJej))})]),el('span',{text:'Pérdidas '},[el('b',{text:minutosLegibles(perdida)})])]));
    var details=el('details',{class:'anfo-final-shot-details'}),summary=el('summary',{text:'Ver información de tiros por parada'});details.appendChild(summary);detalleFilas.forEach(function(g){var stop=el('div',{class:'anfo-final-stop-detail'}),items=el('div');stop.appendChild(el('strong',{text:g.trabajo+' · Parada '+g.parada}));g.rows.forEach(function(r,i){var done=tiroCapturado(r),article=el('article',{class:done?'':'pending'});if(!done){article.appendChild(el('b',{text:'Tiro '+(r.tiro||i+1)+' · Pendiente'}));}else{article.appendChild(el('b',{text:'Tiro '+(r.tiro||i+1)+' · '+(r.estado||'Sin estado')+' · '+(r.conAgua==='Si'?'Con agua':r.conAgua==='No'?'Seco':'Agua s/d')}));article.appendChild(el('small',{text:'Diseño '+(r.mDiseno||'—')+' m · Taco '+(r.taco||'—')+' m · Perforado '+(r.mPerf||'—')+' m · Abatimiento '+(r.abat||'—')+'° · Azimut '+(r.rot||'—')+'°'}));article.appendChild(el('small',{text:'Problema '+(r.problema||'Ninguno')+' · Percusión '+(r.pPerc||'—')+' bar · Avance '+(r.pAv||'—')+' bar · Barras '+(r.numBarras||r.barras||'—')+' · Brocas '+(r.brocas||'—')}));}items.appendChild(article);});stop.appendChild(items);details.appendChild(stop);});page.appendChild(details);
    var actions=el('div',{class:'anfo-final-actions'},[el('button',{type:'button',class:'save',text:'▣',onclick:function(){J.store.saveNow();window.location.href='../index.html';}},[el('b',{text:'Guardar y Salir'}),el('small',{text:'Cierra el seguimiento'})]),el('button',{type:'button',class:'cloud',text:'☁',onclick:function(){J.store.saveNow();var button=document.getElementById('btn-subir-onedrive');if(button)button.click();else alert('No está disponible el selector de archivos para OneDrive.');}},[el('b',{text:'OneDrive'}),el('small',{text:'Subir a la nube'})]),el('button',{type:'button',class:'excel',text:'▦',onclick:function(){J.store.saveNow();J.excel.download(p);}},[el('b',{text:'Generar Excel'}),el('small',{text:'Planilla de terreno'})]),el('button',{type:'button',class:'report',text:'▤',onclick:function(){J.store.saveNow();J.informe.abrir(p);}},[el('b',{text:'Generar Nota Técnica'}),el('small',{text:'Con diagramas de tiros'})])]);page.appendChild(actions);
    page.appendChild(el('footer',{class:'anfo-final-footer'},[el('button',{type:'button',text:'‹ Volver a postura',onclick:function(){abrirPostura(p,'tiempos');}}),el('button',{type:'button',text:'+ Registrar otro trabajo',onclick:function(){ir('id');}})]));host.appendChild(page);
  }
  /*
    var R = J.resumen(p), card = el('div', { class: 'anfo-perforacion-card card-wide' });
    card.appendChild(el('h2', { class: 'anfo-perforacion-card-t', text: 'Paso 3: Datos Faltantes y Descarga' }));
    card.appendChild(el('p', { class: 'anfo-perforacion-card-sub', text: 'Complete los datos de la plantilla y descargue su registro.' }));
    card.appendChild(el('div', { class: 'anfo-perforacion-kpis' }, [
      [R.nTiros, 'tiros registrados'], [p.trabajos.length, 'ID(s) de trabajo'], [R.paradas.length, 'paradas'],
      [J.fmt(R.mDis, 1) + ' m', 'metros de diseño'], [J.fmt(R.mPerf, 1) + ' m', 'metros perforados'],
      [pctTxt(R.cumplProm), 'cumplimiento prom. carga de diseño'],
      [J.fmtHM(R.tPerf), 'tiempo en perforación'], [J.fmtHM(R.tPerdidas), 'pérdida operacional total']
    ].map(function (k) { return el('div', { class: 'anfo-perforacion-kpi' }, [el('b', { text: String(k[0]) }), el('span', { text: k[1] })]); })));
    var ok = plantillaCompleta(p);
    card.appendChild(el('div', { class: 'anfo-perforacion-panel wizard-card' }, [
      el('div', { class: 'anfo-perforacion-panel-t', text: ok ? '✅ DATOS DE PLANTILLA COMPLETOS' : '⚠️ FALTAN DATOS DE PLANTILLA' }),
      el('button', { type: 'button', class: 'btn-primary', style: 'margin-top:8px', text: (ok ? '✏️ Editar' : '📋 Rellenar') + ' Datos de Plantilla (Horarios/Operación)', onclick: function () { abrirAsistente('plantilla'); } })
    ]));
    card.appendChild(bloqueDescarga(p));
    card.appendChild(el('button', { type: 'button', class: 'btn-primary', style: 'margin-top:14px', text: '⬅ Volver al Resumen de Paradas', onclick: function () { ir('resumen'); } }));
    host.appendChild(card);
  }
  */

  /* ---------- Navegación y render ---------- */
  function descartarTiroVacio(p) {
    if (ui.tiro && ui.tiro.nuevo) {
      var t = ui.tiro, vacio = J.COLS.perf.every(function (c) { return c.type === 'calc' || c.k === 'parada' || c.k === 'tiro' || c.k === 'trabajo' || !t.row[c.k]; });
      if (vacio) { var i = p.filas.indexOf(t.row); if (i >= 0) p.filas.splice(i, 1); }
    }
  }
  function ir(v) {
    descartarTiroVacio(P());
    ui.asist = null; ui.tiro = null; ui.aviso = ''; ui.vista = v;
    render(); window.scrollTo(0, 0);
  }
  var VISTAS = { datos: vistaDatos, config: vistaConfiguracion, id: vistaId, resumen: vistaResumen, cantidad: vistaCantidad, captura: vistaCapturaTiro, parada: vistaParada, postura: vistaPostura, final: vistaFinal };
  function render() {
    var p = P(), host = U.$('#paso'); host.innerHTML = '';
    document.body.classList.toggle('anfo-step1-mode', ui.vista === 'datos');
    document.body.classList.toggle('anfo-work-mode', ui.vista === 'config' || ui.vista === 'id');
    document.body.classList.toggle('anfo-stop-mode', ui.vista === 'resumen' || ui.vista === 'parada' || ui.vista === 'cantidad' || ui.vista === 'captura' || ui.vista === 'postura' || ui.vista === 'final');
    document.body.classList.toggle('anfo-resumen-tiros-mode', ui.vista === 'parada' || ui.vista === 'cantidad');
    document.body.classList.toggle('anfo-tiro-captura-activo', ui.vista === 'captura');
    document.body.classList.toggle('emulsion-plantilla-mode', ui.vista === 'postura');
    document.body.classList.toggle('anfo-resumen-final-mode', ui.vista === 'final');
    document.body.classList.toggle('emulsion-work-mode', ui.vista === 'id' || ui.vista === 'resumen');
    if (ui.asist) { asistenteVista(host, p); return; }
    if (!p.trabajoActual && (ui.vista === 'resumen' || ui.vista === 'parada' || ui.vista === 'cantidad' || ui.vista === 'captura' || ui.vista === 'postura' || ui.vista === 'final')) ui.vista = 'id';
    if (ui.vista === 'parada' && !ui.parada) ui.vista = 'resumen';
    VISTAS[ui.vista](host, p);
  }

  /* ---------- Arranque ---------- */
  refrescarToolbar();
  render();
  function agregarIngresoMenu() {
    var menu = document.querySelector('#dropdownMenu ul');
    if (!menu) return;
    if (!menu.querySelector('[data-perforacion-ingreso]')) {
      var li = document.createElement('li'), a = document.createElement('a');
      a.href = '#'; a.dataset.perforacionIngreso = '1'; a.textContent = '⚙️ Ingreso / Editar Datos';
      a.addEventListener('click', function (e) { e.preventDefault(); var dd = document.getElementById('dropdownMenu'); if (dd) dd.classList.remove('show'); abrirAsistente('postura'); });
      li.appendChild(a); menu.insertBefore(li, menu.children[1] || null);
    }
    var acciones = [
      ['menuExcelPerforacion', '⬇ Descargar Excel', function () { J.store.saveNow(); J.excel.download(P()); }],
      ['menuPlanillaPerforacion', '📋 Datos faltantes de planilla', function () { abrirAsistente('plantilla'); }],
      ['menuInformePerforacion', '📄 Ver informe técnico', function () { J.store.saveNow(); J.informe.abrir(P()); }]
    ];
    acciones.forEach(function (accion) {
      if (document.getElementById(accion[0])) return;
      var item = document.createElement('li'), enlace = document.createElement('a');
      enlace.id = accion[0]; enlace.href = '#'; enlace.textContent = accion[1];
      enlace.addEventListener('click', function (e) { e.preventDefault(); var dd = document.getElementById('dropdownMenu'); if (dd) dd.classList.remove('show'); accion[2](); });
      item.appendChild(enlace); menu.appendChild(item);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', agregarIngresoMenu); else agregarIngresoMenu();
  window.addEventListener('beforeunload', function () { J.store.saveNow(); });
})();
