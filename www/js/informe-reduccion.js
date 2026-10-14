/* =========================================================
   JEJ · Informe técnico de reducción secundaria
   Mismo formato que el informe técnico de perforación.
   Requiere js/informe-base.js
   ========================================================= */
(function (root) {
    'use strict';
    var B = root.JEJInformeBase;
    var esc = B.esc, dash = B.dash, num = B.num, fmt = B.fmt;

    function vol(c) { var v = num(c.ancho) * num(c.alto) * num(c.largo); return isFinite(v) ? v : 0; }
    function n0(v) { var n = num(v); return isFinite(n) ? n : 0; }
    function efic(v) { var n = num(String(v || '').replace('%', '')); return isFinite(n) ? n : NaN; }
    function quemados(c) { return Math.max(0, c.colpas.length - (n0(c.i2) + n0(c.i3) + n0(c.i4))); }

    function crear(p) {
        var calles = p.calles || [];
        var fecha = B.fechaLarga(p.fecha);
        var allC = [];
        calles.forEach(function (c) { c.colpas.forEach(function (x) { allC.push({ calle: c.id, x: x }); }); });

        var vTot = 0, perfTot = 0, mPerf = 0, cartTot = 0, eS = 0, eN = 0, cumpleSi = 0, cumpleN = 0;
        var porExpl = {}, qTot = 0, i2 = 0, i3 = 0, i4 = 0;
        allC.forEach(function (r) {
            var x = r.x;
            vTot += vol(x); perfTot += n0(x.cperf); mPerf += n0(x.cperf) * n0(x.lperf); cartTot += n0(x.cart);
            var e = efic(x.efic); if (isFinite(e)) { eS += e; eN++; }
            if (x.cumple) { cumpleN++; if (/^s/i.test(x.cumple)) cumpleSi++; }
            if (x.expl) porExpl[x.expl] = (porExpl[x.expl] || 0) + n0(x.cart);
        });
        calles.forEach(function (c) { qTot += quemados(c); i2 += n0(c.i2); i3 += n0(c.i3); i4 += n0(c.i4); });

        var h = [];
        h.push('<h2>Identificación y labor</h2>' + B.ficha([
            ['Fecha', fecha], ['Turno', p.turno], ['Sector', p.sector],
            ['Grupo', p.grupo], ['Encargado seguimiento JeJ', p.encJEJ], ['Encargado operación RS DET', (p.encDET || []).filter(Boolean).join(', ')],
            ['Calles registradas', calles.map(function (c) { return c.id; }).join(', ')], ['Colpas registradas', allC.length], ['Explosivos usados', Object.keys(porExpl).join(', ')]
        ]));

        h.push('<h2>Indicadores del turno</h2>' + B.kpis([
            [calles.length, 'calles registradas', ''],
            [allC.length, 'colpas / puntos registrados', ''],
            [fmt(vTot, 1) + ' m³', 'volumen total a reducir', ''],
            [qTot, 'puntos quemados en total', ''],
            [perfTot, 'perforaciones realizadas', ''],
            [fmt(mPerf, 1) + ' m', 'metros perforados', ''],
            [cartTot, 'cartuchos / APD utilizados', ''],
            [eN ? fmt(eS / eN, 0) + '%' : '—', 'eficiencia promedio', eN ? (eS / eN >= 75 ? 'ok' : 'mal') : ''],
            [cumpleN ? B.pct(cumpleSi / cumpleN) : '—', 'cumplen la recomendación', cumpleN ? (cumpleSi / cumpleN >= 0.8 ? 'ok' : 'mal') : ''],
            [i2 + i3 + i4, 'puntos no quemados', (i2 + i3 + i4) ? 'mal' : '']
        ]));

        /* Horarios por calle */
        h.push('<h2>Horarios por calle</h2><table><thead><tr><th>Calle</th><th>Inicio carguío</th><th>Solicitud</th><th>Inicio aislación</th><th>Hora quemada</th><th>Carguío → quemada</th></tr></thead><tbody>' +
            calles.map(function (c) {
                var hh = c.h || {}, d = B.diffMin(hh.carguio, hh.quemada);
                return '<tr><td><b>' + dash(c.id) + '</b></td><td>' + dash(hh.carguio) + '</td><td>' + dash(hh.solicitud) + '</td><td>' + dash(hh.aislacion) + '</td><td>' + dash(hh.quemada) + '</td><td>' + (isFinite(d) ? B.fmtHM(d) : '—') + '</td></tr>';
            }).join('') + '</tbody></table>');

        /* Resumen por calle */
        h.push('<h2>Resumen por calle</h2><table><thead><tr><th>Calle</th><th>Puntos que necesitan RS</th><th>No quemados: pretil deficiente</th><th>No quemados: goteo</th><th>Colpa sobredim. sin barrenadura</th><th>Puntos quemados</th><th>Volumen [m³]</th><th>Efic. prom.</th></tr></thead><tbody>' +
            calles.map(function (c) {
                var v = 0, es = 0, en = 0;
                c.colpas.forEach(function (x) { v += vol(x); var e = efic(x.efic); if (isFinite(e)) { es += e; en++; } });
                return '<tr><td><b>' + dash(c.id) + '</b></td><td>' + c.colpas.length + '</td><td>' + n0(c.i2) + '</td><td>' + n0(c.i3) + '</td><td>' + n0(c.i4) + '</td><td><b>' + quemados(c) + '</b></td><td>' + fmt(v, 1) + '</td><td>' + (en ? fmt(es / en, 0) + '%' : '—') + '</td></tr>';
            }).join('') +
            '</tbody><tfoot><tr><td>Total</td><td>' + allC.length + '</td><td>' + i2 + '</td><td>' + i3 + '</td><td>' + i4 + '</td><td>' + qTot + '</td><td>' + fmt(vTot, 1) + '</td><td>' + (eN ? fmt(eS / eN, 0) + '%' : '—') + '</td></tr></tfoot></table>');

        /* Registro por colpa, por calle */
        h.push('<h2>Registro por colpa</h2>');
        calles.forEach(function (c) {
            h.push('<div class="par"><h3>Calle ' + dash(c.id) + ' · ' + c.colpas.length + ' colpa(s)</h3>');
            if (!c.colpas.length) { h.push('<p class="nota">Sin colpas registradas.</p></div>'); return; }
            h.push('<div class="tabla-ancha"><table><thead><tr><th>ID</th><th>Punto</th><th>Sit. inicial</th><th>Sit. final</th><th>Ancho [m]</th><th>Alto [m]</th><th>Largo [m]</th><th>Vol. [m³]</th><th>Cant. perf.</th><th>Long. perf. [m]</th><th>Cant. cart. / APD</th><th>Explosivo</th><th>Tag pre</th><th>Tag post</th><th>Dist. proyec. [m]</th><th>Efic.</th><th>¿Cumple?</th></tr></thead><tbody>' +
                c.colpas.map(function (x) {
                    var cl = /^n/i.test(x.cumple || '') ? ' style="color:#b91c1c;font-weight:700"' : '';
                    return '<tr><td><b>' + dash(x.id) + '</b></td><td class="l">' + dash(x.punto) + '</td><td>' + dash(x.ini) + '</td><td>' + dash(x.fin) + '</td><td>' + dash(x.ancho) + '</td><td>' + dash(x.alto) + '</td><td>' + dash(x.largo) + '</td><td><b>' + fmt(vol(x), 2) + '</b></td><td>' + dash(x.cperf) + '</td><td>' + dash(x.lperf) + '</td><td>' + dash(x.cart) + '</td><td>' + dash(x.expl) + '</td><td>' + dash(x.tpre) + '</td><td>' + dash(x.tpost) + '</td><td>' + dash(x.dist) + '</td><td>' + dash(x.efic) + '</td><td' + cl + '>' + dash(x.cumple) + '</td></tr>';
                }).join('') + '</tbody></table></div>');
            h.push('<table><thead><tr><th class="l">Indicador por calle</th><th>Cantidad</th></tr></thead><tbody>' +
                '<tr><td class="l">1. Puntos total en la calle que necesitan RS</td><td>' + c.colpas.length + '</td></tr>' +
                '<tr><td class="l">2. Puntos no quemados por pretil deficiente</td><td>' + n0(c.i2) + '</td></tr>' +
                '<tr><td class="l">3. Puntos no quemados por condición de goteo</td><td>' + n0(c.i3) + '</td></tr>' +
                '<tr><td class="l">4. Colpa sobredimensionada sin barrenadura</td><td>' + n0(c.i4) + '</td></tr>' +
                '<tr><td class="l"><b>5. Puntos quemados total en calle</b></td><td><b>' + quemados(c) + '</b></td></tr></tbody></table>');
            if (c.obs) h.push('<p class="nota"><b>Observaciones:</b></p><div class="obs">' + esc(c.obs) + '</div>');
            h.push('</div>');
        });

        /* Explosivos */
        var ke = Object.keys(porExpl);
        if (ke.length) {
            h.push('<h2>Consumo por tipo de explosivo</h2><table><thead><tr><th class="l">Explosivo (tipo)</th><th>Cantidad [unidades]</th></tr></thead><tbody>' +
                ke.map(function (k) { return '<tr><td class="l">' + esc(k) + '</td><td>' + porExpl[k] + '</td></tr>'; }).join('') + '</tbody></table>');
        }

        /* Gráfico: volumen y eficiencia */
        var gr = allC.filter(function (r) { return vol(r.x) > 0; }).map(function (r) {
            var e = efic(r.x.efic);
            return { t: String(r.x.id || ''), s: String(r.calle || ''), a: vol(r.x), b: isFinite(e) ? e * vol(r.x) / 100 : NaN };
        });
        if (gr.length && gr.length <= 24) {
            h.push('<h2>Volumen por colpa: total vs reducido</h2>' + B.barras(gr, 'Volumen reducido (volumen × eficiencia) [m³]').replace('Diseño [m]', 'Volumen [m³]'));
        }

        return B.pagina({
            titulo: 'Informe técnico reducción secundaria · ' + (p.sector || '') + ' · ' + fecha,
            h1: 'Informe técnico de reducción secundaria',
            sub: (p.sector || 'Sector no informado') + (p.grupo ? ' · Grupo ' + p.grupo : ''),
            fecha: fecha, der: 'Turno ' + (p.turno || '—'),
            cuerpo: h.join('')
        });
    }

    function abrir(p) {
        B.abrir(crear(p), 'Informe_Tecnico_RS_' + (p.sector || '') + '_' + (p.fecha || ''));
    }

    root.JEJInformeReduccion = { abrir: abrir, crear: crear };
})(window);
