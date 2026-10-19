/* =========================================================
   JEJ · Informe técnico de carguío (ANFO y Emulsión)
   Mismo formato que el informe técnico de perforación.
   Requiere js/informe-base.js (y js/diagrama-carga.js para Emulsión).
   ========================================================= */
(function (root) {
    'use strict';
    var B = root.JEJInformeBase;
    var esc = B.esc, dash = B.dash, num = B.num, fmt = B.fmt;

    function valor(id) {
        var c = document.getElementById(id);
        return c ? String(c.value || '').trim() : '';
    }
    function lista(selector) {
        return Array.from(document.querySelectorAll(selector)).map(function (i) { return i.value.trim(); }).filter(Boolean).join(', ');
    }
    function primero() {
        for (var i = 0; i < arguments.length; i++) { var v = valor(arguments[i]); if (v) return v; }
        return '';
    }

    /* ---- cálculos por tiro ---- */
    function calc(t) {
        var dis = num(t.longDiseno), taco = num(t.taco), mom = num(t.largoMomento), tr = num(t.tacoReal);
        var carg = isFinite(num(t.longCargada)) ? num(t.longCargada) : (isFinite(mom) && isFinite(tr) ? mom - tr : NaN);
        var cargDis = isFinite(dis) && isFinite(taco) ? dis - taco : NaN;
        return { dis: dis, taco: taco, mom: mom, tacoReal: tr, carg: carg, cargDis: cargDis,
                 cumpl: isFinite(carg) && cargDis > 0 ? carg / cargDis : NaN };
    }

    function aplanar(trabajos) {
        var filas = [];
        trabajos.forEach(function (tr) {
            (tr.paradas || []).forEach(function (pa) {
                (pa.tiros || []).forEach(function (t, i) {
                    filas.push({ trabajo: tr.idTrabajo || '', parada: pa.idParada || '', n: t.tiroNum || (i + 1), t: t, c: calc(t) });
                });
            });
        });
        return filas;
    }

    /* ---- diagrama de carga por tiro (esquema longitudinal) ---- */
    function colorCarga(tipo) { return tipo === 'ANFO' ? '#2563eb' : '#ea580c'; }

    function diagramaParada(filas, tipo) {
        var maxL = 5; filas.forEach(function (f) { maxL = Math.max(maxL, f.c.dis || 0, f.c.mom || 0); });
        var n = filas.length, colW = 78, mL = 44, W = Math.max(360, mL + n * colW + 20), top = 34, alto = 230, H = top + alto + 34;
        var k = alto / maxL, o = [];
        o.push('<svg viewBox="0 0 ' + W + ' ' + H + '" style="max-width:' + Math.min(W * 1.15, 720) + 'px;margin:0 auto" xmlns="http://www.w3.org/2000/svg" font-family="Segoe UI,Arial,sans-serif">');
        for (var g = 0; g <= 4; g++) {
            var m = maxL * g / 4, y = top + m * k;
            o.push('<line x1="' + mL + '" y1="' + y + '" x2="' + (W - 8) + '" y2="' + y + '" stroke="#eef2f7"/>' +
                '<text x="' + (mL - 5) + '" y="' + (y + 3) + '" font-size="9" fill="#64748b" text-anchor="end">' + fmt(m, 0) + ' m</text>');
        }
        o.push('<text x="' + (mL - 5) + '" y="' + (top - 14) + '" font-size="9" fill="#64748b" text-anchor="end">Boca</text>');
        filas.forEach(function (f, i) {
            var x = mL + i * colW + colW / 2, bw = 22, c = f.c;
            if (isFinite(c.dis)) o.push('<rect x="' + (x - bw / 2 - 4) + '" y="' + top + '" width="' + (bw + 8) + '" height="' + (c.dis * k) + '" fill="none" stroke="#94a3b8" stroke-dasharray="4 3"/>');
            var tr = isFinite(c.tacoReal) ? c.tacoReal : (isFinite(c.taco) ? c.taco : 0);
            var fin = isFinite(c.mom) ? c.mom : (isFinite(c.dis) ? c.dis : tr);
            o.push('<rect x="' + (x - bw / 2) + '" y="' + top + '" width="' + bw + '" height="' + (tr * k) + '" fill="#cbd5e1"/>');
            o.push('<rect x="' + (x - bw / 2) + '" y="' + (top + tr * k) + '" width="' + Math.max(0, (fin - tr) * k) + '" height="0" fill="none"/>');
            o.push('<rect x="' + (x - bw / 2) + '" y="' + (top + tr * k) + '" width="' + bw + '" height="' + Math.max(0, (fin - tr) * k) + '" fill="' + colorCarga(tipo) + '"/>');
            if (String(f.t.estado || '') && String(f.t.estado) !== 'Sano') o.push('<rect x="' + (x - bw / 2 - 2) + '" y="' + (top - 2) + '" width="' + (bw + 4) + '" height="' + (fin * k + 4) + '" fill="none" stroke="#dc2626" stroke-width="2"/>');
            if (f.t.ceboSup) o.push('<rect x="' + (x - 5) + '" y="' + (top + tr * k + 3) + '" width="10" height="7" rx="2" fill="#fed7aa" stroke="#9a3412"/>');
            o.push('<text x="' + x + '" y="' + (top + Math.max(fin, c.dis || 0) * k + 14) + '" font-size="10" font-weight="700" fill="#0f172a" text-anchor="middle">T' + esc(f.n) + '</text>');
            o.push('<text x="' + x + '" y="' + (top - 6) + '" font-size="9" fill="#475569" text-anchor="middle">' + fmt(fin, 1) + ' m</text>');
        });
        o.push('</svg>');
        return o.join('');
    }

    /* ---- campos de la plantilla (generico, sin horas) ---- */
    function camposDeGrupo(group) {
        var label = group.querySelector('label');
        var controls = Array.from(group.querySelectorAll('input, select, textarea'));
        var values = controls.map(function (c) { return c.type === 'checkbox' ? (c.checked ? 'Sí' : 'No') : c.value.trim(); }).filter(Boolean);
        return label && values.length ? { label: label.textContent.replace(/:\s*$/, '').trim(), value: values.join(' / ') } : null;
    }
    function camposPlantilla() {
        var out = [];
        document.querySelectorAll('#modalPlantillaFinal .form-group-field, #modalConfiguracionPostura .form-group-field').forEach(function (g) {
            var f = camposDeGrupo(g);
            if (f && !/^H\.|^Hora/i.test(f.label)) out.push([f.label, f.value]);
        });
        return out;
    }

    function crear(tipo, trabajos) {
        var esEm = tipo === 'EMULSION';
        var nombre = esEm ? 'Emulsión' : 'ANFO';
        var filas = aplanar(trabajos);
        var multi = trabajos.length > 1;
        var fecha = B.fechaLarga(primero('fechaAnfo', 'fechaEmulsion'));
        var turno = primero('turnoAnfo', 'turnoEmulsion');
        var idTr = valor('modalIdTronadura'), mina = valor('modalMina');

        /* totales */
        var mDis = 0, mCarg = 0, sumCumpl = 0, nCumpl = 0, nAgua = 0, nNeg = 0, nProb = 0, kg = 0, nKg = 0;
        filas.forEach(function (f) {
            if (isFinite(f.c.dis)) mDis += f.c.dis;
            if (isFinite(f.c.carg)) mCarg += f.c.carg;
            if (isFinite(f.c.cumpl)) { sumCumpl += f.c.cumpl; nCumpl++; }
            if (/agua/i.test(f.t.agua || '')) nAgua++;
            if (/neg/i.test(f.t.posNeg || '')) nNeg++;
            if (f.t.estado && f.t.estado !== 'Sano') nProb++;
            var k = num(f.t.kilosEmulsion); if (isFinite(k)) { kg += k; nKg++; }
        });
        var cumplProm = nCumpl ? sumCumpl / nCumpl : NaN;
        var tCarg = B.diffMin(valor('hInicioCarguio'), valor('hFinCarguio'));
        var tPost = B.diffMin(valor('hLlegadaPyT'), valor('hSalidaPyT'));
        var tAmarre = B.diffMin(valor('hInicioAmarre'), valor('hFinAmarre'));
        var pCarg = B.minutosLibre(valor('tiempoPerdidaCarguio')), pAmarre = B.minutosLibre(valor('tiempoPerdidaAmarre'));
        var pTot = (isFinite(pCarg) ? pCarg : 0) + (isFinite(pAmarre) ? pAmarre : 0);

        var h = [];

        /* Identificación */
        h.push('<h2>Identificación y labor</h2>' + B.ficha([
            ['Fecha', fecha], ['Turno', turno], ['Mina', mina],
            ['Nivel', valor('modalNivel')], ['Bloque', valor('modalBloque')], ['ID Tronadura', idTr],
            ['Supervisor JeJ', valor('modalSupJeJ')], ['Encargado seguimiento JeJ', valor('modalEncargado')],
            ['Supervisor(es) DET', lista('#modalPersonal [name="supervisorDet"]')],
            ['Responsable(s) DET', lista('#modalPersonal [name="responsableDet"]')],
            ['Explosivo', nombre], ['ID(s) de trabajo', trabajos.map(function (t) { return t.idTrabajo; }).filter(Boolean).join(', ')]
        ]));

        /* Indicadores */
        var dens = esEm && kg > 0 && mCarg > 0 ? kg / mCarg : NaN;
        var ind = [
            [filas.length, 'tiros registrados', ''],
            [fmt(mDis, 1) + ' m', 'metros de diseño', ''],
            [fmt(mCarg, 1) + ' m', 'metros cargados', ''],
            [B.pct(cumplProm), 'cumplimiento promedio de carga de diseño', isFinite(cumplProm) ? (cumplProm >= 0.95 ? 'ok' : 'mal') : ''],
            [isFinite(tCarg) ? B.fmtHM(tCarg) : '—', 'tiempo en carguío', ''],
            [isFinite(tPost) ? B.fmtHM(tPost) : '—', 'tiempo en postura', ''],
            [isFinite(tCarg) && tCarg > 0 ? fmt(mCarg / (tCarg / 60), 1) + ' m/h' : '—', 'rendimiento de carguío', ''],
            [pTot > 0 ? B.fmtHM(pTot) : '00:00', 'pérdida operacional total', pTot > 0 ? 'mal' : '']
        ];
        ind.push([nAgua, 'tiros con agua', nAgua ? 'mal' : '']);
        ind.push([nProb, 'tiros con estado distinto de «Sano»', nProb ? 'mal' : '']);
        ind.push([nNeg, 'tiros negativos', '']);
        ind.push(esEm ? [nKg ? fmt(kg, 1) + ' kg' : '—', 'emulsión cargada' + (isFinite(dens) ? ' · ' + fmt(dens, 2) + ' kg/m' : ''), ''] : [isFinite(tAmarre) ? B.fmtHM(tAmarre) : '—', 'tiempo de amarre', '']);
        h.push('<h2>Indicadores del turno</h2>' + B.kpis(ind));

        /* Horarios */
        h.push('<h2>Horarios</h2><table><thead><tr><th>Llegada JeJ</th><th>Salida JeJ</th><th>Llegada PyT</th><th>Inicio carguío</th><th>Fin carguío</th><th>Salida PyT</th><th>Inicio amarre</th><th>Fin amarre</th><th>Tiempo en postura</th><th>Tiempo en carguío</th></tr></thead><tbody><tr>' +
            ['hLlegadaJeJ', 'hSalidaJeJ', 'hLlegadaPyT', 'hInicioCarguio', 'hFinCarguio', 'hSalidaPyT', 'hInicioAmarre', 'hFinAmarre'].map(function (id) { return '<td>' + dash(valor(id)) + '</td>'; }).join('') +
            '<td><b>' + (isFinite(tPost) ? B.fmtHM(tPost) : '—') + '</b></td><td><b>' + (isFinite(tCarg) ? B.fmtHM(tCarg) : '—') + '</b></td></tr></tbody></table>');

        /* Datos de plantilla (zanja, presiones, geófono, etc.) */
        var extra = camposPlantilla();
        if (extra.length) h.push('<h2>Datos de plantilla</h2>' + B.ficha(extra));

        /* Resumen por parada */
        var pars = [], idx = {};
        filas.forEach(function (f) {
            var k = f.trabajo + '||' + f.parada;
            if (!idx[k]) { idx[k] = { trabajo: f.trabajo, parada: f.parada, n: 0, dis: 0, carg: 0, cs: 0, cn: 0 }; pars.push(idx[k]); }
            var p = idx[k]; p.n++;
            if (isFinite(f.c.dis)) p.dis += f.c.dis;
            if (isFinite(f.c.carg)) p.carg += f.c.carg;
            if (isFinite(f.c.cumpl)) { p.cs += f.c.cumpl; p.cn++; }
        });
        if (pars.length) {
            h.push('<h2>Resumen por parada</h2><table><thead><tr>' + (multi ? '<th>Trabajo</th>' : '') + '<th>Parada</th><th>Tiros</th><th>Diseño [m]</th><th>Cargado [m]</th><th>Cumpl. carga</th></tr></thead><tbody>' +
                pars.map(function (p) {
                    return '<tr>' + (multi ? '<td>' + dash(p.trabajo) + '</td>' : '') + '<td>' + dash(p.parada) + '</td><td>' + p.n + '</td><td>' + fmt(p.dis, 1) + '</td><td>' + fmt(p.carg, 1) + '</td><td>' + (p.cn ? B.pct(p.cs / p.cn) : '—') + '</td></tr>';
                }).join('') + '</tbody></table>');
        }

        /* Registro por tiro */
        if (filas.length) {
            var colX = esEm ? ['Kg emul.', 'Producto'] : ['Núm. pera', 'Int. destape'];
            h.push('<h2>Registro por tiro</h2><div class="tabla-ancha"><table><thead><tr>' + (multi ? '<th>Trabajo</th>' : '') +
                '<th>Parada</th><th>Tiro</th><th>Diseño [m]</th><th>Taco [m]</th><th>Largo mom. [m]</th><th>Taco real [m]</th><th>Cargado [m]</th><th>Cumpl.</th><th>Estado</th><th>Agua</th><th>+ / −</th><th>Cama [m]</th><th>' + colX[0] + '</th><th>' + colX[1] + '</th></tr></thead><tbody>' +
                filas.map(function (f) {
                    var t = f.t, x = esEm ? [t.kilosEmulsion, t.tipoEmulsion] : [t.numPera, t.intentosDestape];
                    return '<tr>' + (multi ? '<td>' + dash(f.trabajo) + '</td>' : '') + '<td>' + dash(f.parada) + '</td><td><b>' + dash(f.n) + '</b></td><td>' + dash(t.longDiseno) + '</td><td>' + dash(t.taco) + '</td><td>' + dash(t.largoMomento) + '</td><td>' + dash(t.tacoReal) + '</td><td><b>' + (isFinite(f.c.carg) ? fmt(f.c.carg, 1) : '—') + '</b></td><td>' + B.pct(f.c.cumpl) + '</td><td>' + dash(t.estado) + '</td><td>' + dash(t.agua) + '</td><td>' + dash(t.posNeg) + '</td><td>' + dash(t.camaExplosivo) + '</td><td>' + dash(x[0]) + '</td><td>' + dash(x[1]) + '</td></tr>';
                }).join('') +
                '</tbody><tfoot><tr><td colspan="' + (multi ? 3 : 2) + '">Total</td><td>' + fmt(mDis, 1) + '</td><td colspan="3"></td><td>' + fmt(mCarg, 1) + '</td><td>' + B.pct(cumplProm) + '</td><td colspan="6"></td></tr></tfoot></table></div>');

            /* Cebos y retenedores */
            var cols = ['Cebo sup.', 'Araña sup.', 'Cant. cartuchos sup.', 'Cebo inf.', esEm ? '' : 'Araña inf.', esEm ? '' : 'Cant. cartuchos inf.', esEm ? '' : 'Núm. retenedores', esEm ? '' : 'Tipo retenedor'].filter(Boolean);
            h.push('<h2>Cebado y retenedores</h2><div class="tabla-ancha"><table><thead><tr><th>Parada</th><th>Tiro</th>' + cols.map(function (c) { return '<th>' + c + '</th>'; }).join('') + '</tr></thead><tbody>' +
                filas.map(function (f) {
                    var t = f.t, v = esEm ? [t.ceboSup, t.aranaSup, t.cantCartuchos, t.ceboInf] : [t.ceboSup, t.aranaSup, t.cantCartuchos, t.ceboInf, t.aranaInf, t.cantCartuchosInf, t.numRetenedores, t.tipoRetenedor];
                    return '<tr><td>' + dash(f.parada) + '</td><td><b>' + dash(f.n) + '</b></td>' + v.map(function (x) { return '<td>' + dash(x) + '</td>'; }).join('') + '</tr>';
                }).join('') + '</tbody></table></div>');

            /* Metros diseño vs cargado */
            h.push('<h2>Metros por tiro: diseño vs cargado</h2>' + B.barras(filas.map(function (f) {
                return { t: 'T' + f.n, s: 'P' + f.parada, a: f.c.dis, b: f.c.carg };
            }), 'Cargado [m]'));
        }

        /* Emulsión: detalle de carga de columna + imagen de referencia */
        if (esEm) {
            var L = [['longTerminarCama', 'Long. al terminar la cama'], ['long1erCebo', 'Long. 1er cebo'], ['longTerminarIntermedia', 'Long. al terminar carga intermedia'],
                     ['long2doCebo', 'Long. 2do cebo'], ['longCargaInferior', 'Long. carga inferior'], ['longRetenedor', 'Long. retenedor'], ['longTacoGreda', 'Long. taco de greda']];
            var hay = filas.some(function (f) { return L.some(function (l) { return f.t[l[0]] !== undefined && f.t[l[0]] !== ''; }); });
            h.push('<h2>Detalle de la carga de columna</h2>');
            if (hay) {
                h.push('<div class="tabla-ancha"><table><thead><tr><th>Parada</th><th>Tiro</th>' + L.map(function (l) { return '<th>' + l[1] + ' [m]</th>'; }).join('') + '<th>1er cebo = cama + 0,3 m</th><th>2do cebo = intermedia + 0,3 m</th></tr></thead><tbody>' +
                    filas.map(function (f) {
                        var t = f.t;
                        function chk(a, b) {
                            var x = num(a), y = num(b);
                            if (!isFinite(x) || !isFinite(y)) return '—';
                            return Math.abs((x - y) - 0.3) <= 0.05 ? '✔' : '✖ (' + fmt(x - y, 2) + ' m)';
                        }
                        return '<tr><td>' + dash(f.parada) + '</td><td><b>' + dash(f.n) + '</b></td>' + L.map(function (l) { return '<td>' + dash(t[l[0]]) + '</td>'; }).join('') +
                            '<td>' + chk(t.long1erCebo, t.longTerminarCama) + '</td><td>' + chk(t.long2doCebo, t.longTerminarIntermedia) + '</td></tr>';
                    }).join('') + '</tbody></table></div>');
            } else {
                h.push('<p class="nota">No se registraron longitudes de la carga de columna en este turno.</p>');
            }
            if (root.JEJ_DIAGRAMA_CARGA) {
                h.push('<div class="fig"><img src="' + root.JEJ_DIAGRAMA_CARGA + '" alt="Esquema de longitudes de la carga de columna"><figcaption>Esquema de referencia: longitudes de la carga de columna (cama, cebos, carga intermedia e inferior, retenedor y taco de greda).</figcaption></div>');
            }
        }

        /* Diagramas de carga por parada */
        if (filas.length) {
            h.push('<h2>Diagramas de carga</h2><div class="lg"><span><i style="background:#cbd5e1"></i>Taco real</span><span><i style="background:' + colorCarga(tipo) + '"></i>Carga (' + nombre + ')</span><span><i style="background:none;border:1px dashed #94a3b8"></i>Largo de diseño</span><span><i style="background:none;border:2px solid #dc2626"></i>Tiro con estado distinto de «Sano»</span></div>' +
                '<p class="nota">Esquema longitudinal medido desde la boca del tiro.</p>');
            pars.forEach(function (p) {
                var rows = filas.filter(function (f) { return f.trabajo === p.trabajo && f.parada === p.parada; });
                h.push('<div class="par"><h3>' + (p.trabajo ? esc(p.trabajo) + ' · ' : '') + 'Parada ' + dash(p.parada) + ' · ' + rows.length + ' tiro(s)</h3><div class="fig">' + diagramaParada(rows, tipo) + '</div></div>');
            });
        }

        /* Pérdidas y observaciones */
        var perd = [['Pérdida operacional durante el carguío', valor('obsPerdidaCarguio'), valor('tiempoPerdidaCarguio')],
                    ['Pérdida operacional durante el amarre', valor('obsPerdidaAmarre'), valor('tiempoPerdidaAmarre')]].filter(function (x) { return x[1] || x[2]; });
        if (perd.length) {
            h.push('<h2>Pérdida operacional</h2><table><thead><tr><th class="l">Tipo · Observación</th><th>Tiempo</th></tr></thead><tbody>' +
                perd.map(function (x) { return '<tr><td class="l"><b>' + esc(x[0]) + '</b>' + (x[1] ? ' · ' + esc(x[1]) : '') + '</td><td>' + dash(x[2]) + '</td></tr>'; }).join('') +
                '</tbody><tfoot><tr><td class="l">Total pérdida operacional</td><td>' + (pTot > 0 ? B.fmtHM(pTot) : '—') + '</td></tr></tfoot></table>');
        }
        var gen = valor('obsGenerales');
        if (gen) h.push('<h2>Observaciones en terreno</h2><div class="obs">' + esc(gen) + '</div>');

        return B.pagina({
            titulo: 'Informe técnico carguío ' + nombre + (idTr ? ' · ' + idTr : '') + ' · ' + fecha,
            h1: 'Informe técnico de carguío · ' + nombre,
            sub: (idTr ? 'ID Tronadura ' + idTr : 'ID de tronadura no informado') + (mina ? ' · ' + mina : ''),
            fecha: fecha, der: 'Turno ' + (turno || '—'),
            cuerpo: h.join('')
        });
    }

    function abrir(config) {
        var tipo = config.tipo === 'ANFO' ? 'ANFO' : 'EMULSION';
        var trabajos = Array.isArray(config.trabajos) ? config.trabajos.filter(function (t) { return t && Array.isArray(t.paradas); }) : [];
        var fecha = B.fechaLarga(primero('fechaAnfo', 'fechaEmulsion'));
        B.abrir(crear(tipo, trabajos), 'Informe_Tecnico_' + tipo + '_' + fecha.replace(/[^\w-]/g, '-'));
    }

    root.JEJInformeCarguio = { abrir: abrir, crear: crear };
})(window);
