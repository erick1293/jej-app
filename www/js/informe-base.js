/* =========================================================
   JEJ · Base común de los informes técnicos
   Mismo diseño que el informe técnico de perforación:
   portada azul, fichas, indicadores, tablas y pie.
   ========================================================= */
(function (root) {
    'use strict';

    var CSS = [
        ':root{--ink:#0f172a;--mut:#64748b;--line:#e2e8f0;--navy:#12263f;--acc:#ea580c;--blue:#2563eb}',
        '*{box-sizing:border-box}',
        'body{margin:0;font-family:"Segoe UI",system-ui,Arial,sans-serif;color:var(--ink);background:#e9edf3;font-size:13px;line-height:1.45;-webkit-print-color-adjust:exact;print-color-adjust:exact}',
        '.barra{position:sticky;top:0;z-index:5;background:#fff;border-bottom:1px solid var(--line);padding:8px 16px;display:flex;gap:10px;align-items:center;justify-content:space-between;font-size:12px;color:var(--mut)}',
        '.barra button{background:var(--blue);color:#fff;border:0;border-radius:6px;padding:8px 16px;font-size:13px;font-weight:600;cursor:pointer}',
        '.hoja{max-width:900px;margin:16px auto;background:#fff;box-shadow:0 1px 8px rgba(15,23,42,.12)}',
        '.port{background:var(--navy);color:#fff;padding:26px 34px 22px;display:flex;justify-content:space-between;gap:20px;align-items:flex-end;border-bottom:5px solid var(--acc)}',
        '.port .emp{font-size:12px;letter-spacing:.02em;opacity:.8;margin:0 0 6px}',
        '.port h1{margin:0;font-size:24px;line-height:1.15;font-weight:700}',
        '.port .id{font-size:13px;opacity:.9;margin-top:6px}',
        '.port .der{text-align:right;font-size:12px;opacity:.9;white-space:nowrap}',
        '.port .der b{display:block;font-size:20px;opacity:1}',
        '.cuerpo{padding:6px 34px 26px}',
        'h2{font-size:15px;margin:24px 0 8px;padding-left:10px;border-left:4px solid var(--acc);break-after:avoid}',
        'h3{font-size:13.5px;margin:0 0 6px}',
        '.ficha{display:grid;grid-template-columns:repeat(3,1fr);gap:0;border:1px solid var(--line);border-radius:8px;overflow:hidden}',
        '.ficha div{padding:6px 10px;border-bottom:1px solid var(--line);border-right:1px solid var(--line);font-size:12px}',
        '.ficha div:nth-child(3n){border-right:0}',
        '.ficha span{display:block;color:var(--mut);font-size:10.5px}',
        '.ficha b{font-weight:600}',
        '.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}',
        '.kpi{border:1px solid var(--line);border-radius:8px;padding:10px 12px;background:#f8fafc;break-inside:avoid}',
        '.kpi b{display:block;font-size:20px;font-variant-numeric:tabular-nums;color:var(--navy)}',
        '.kpi span{font-size:11px;color:var(--mut)}',
        '.kpi.ok b{color:#15803d}.kpi.mal b{color:#b91c1c}',
        'table{border-collapse:collapse;width:100%;font-size:11.5px;margin:6px 0}',
        'th,td{border:1px solid var(--line);padding:4px 6px;text-align:center}',
        'th{background:#eef2f7;font-weight:600;color:#1e293b}',
        'td.l,th.l{text-align:left}',
        'tbody tr:nth-child(even) td{background:#fafbfd}',
        'tfoot td{background:#fff7d6;font-weight:700}',
        'tr{break-inside:avoid}',
        '.tabla-ancha{overflow-x:auto}',
        '.tabla-ancha table{font-size:10px}',
        '.tabla-ancha th,.tabla-ancha td{padding:3px 4px;overflow-wrap:anywhere}',
        '.par{border:1px solid var(--line);border-radius:10px;padding:12px 14px;margin:12px 0;break-inside:avoid}',
        '.dg{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:12px}',
        '.dg figure{margin:0}',
        '.dg svg,.fig svg{width:100%;height:auto;display:block}',
        '.dg figcaption,.fig figcaption{font-size:11px;color:var(--mut);margin-top:4px;text-align:center}',
        '.fig{margin:8px 0;text-align:center;break-inside:avoid}',
        '.fig img{max-width:100%;height:auto;border:1px solid var(--line);border-radius:8px}',
        '.lg{display:flex;gap:16px;flex-wrap:wrap;font-size:11px;color:#334155;margin:4px 0 8px}',
        '.lg i{display:inline-block;width:18px;height:8px;border-radius:2px;margin-right:6px;vertical-align:middle}',
        '.nota{font-size:11px;color:var(--mut);margin:6px 0 0}',
        '.obs{border:1px solid var(--line);border-radius:8px;padding:10px 12px;background:#fafbfd;white-space:pre-wrap;margin:6px 0}',
        '.pie{padding:10px 34px 16px;font-size:10.5px;color:var(--mut);border-top:1px solid var(--line);display:flex;justify-content:space-between}',
        '@page{size:A4;margin:11mm}',
        '@media print{.tabla-ancha{overflow:visible}.tabla-ancha table{font-size:9px}body{background:#fff}.barra{display:none}.hoja{margin:0;max-width:none;box-shadow:none}.cuerpo{padding:4px 6px 10px}.port{padding:20px 24px 16px}.pie{padding:8px 6px}.ficha div,.kpi{break-inside:avoid}}',
        '@media(max-width:640px){.ficha{grid-template-columns:repeat(2,1fr)}.kpis{grid-template-columns:repeat(2,1fr)}.port{flex-direction:column;align-items:flex-start}.port .der{text-align:left}.cuerpo{padding:6px 14px 20px}.pie{padding:10px 14px}}'
    ].join('\n');

    function esc(s) {
        return String(s === undefined || s === null ? '' : s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }
    function dash(v) { var t = esc(v); return t === '' ? '—' : t; }
    function num(v) { var n = parseFloat(String(v === undefined || v === null ? '' : v).replace(',', '.')); return isNaN(n) ? NaN : n; }
    function fmt(n, d) {
        if (!isFinite(n)) return '—';
        var f = Math.pow(10, d === undefined ? 1 : d);
        return (Math.round(n * f) / f).toString().replace('.', ',');
    }
    function pct(v) { return isFinite(v) ? fmt(v * 100, 1) + '%' : '—'; }
    function toMin(hhmm) {
        var m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm || '').trim());
        return m ? (+m[1]) * 60 + (+m[2]) : NaN;
    }
    function diffMin(a, b) {
        var x = toMin(a), y = toMin(b);
        if (isNaN(x) || isNaN(y)) return NaN;
        var d = y - x; return d < 0 ? d + 1440 : d;
    }
    function fmtHM(min) {
        if (!isFinite(min)) return '—';
        var h = Math.floor(min / 60), m = Math.round(min % 60);
        if (m === 60) { h += 1; m = 0; }
        return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
    }
    /* Acepta "15 min", "00:15", "1h 20", "20" → minutos */
    function minutosLibre(txt) {
        var t = String(txt || '').trim().toLowerCase();
        if (!t) return NaN;
        var hm = /^(\d{1,2}):(\d{2})$/.exec(t);
        if (hm) return (+hm[1]) * 60 + (+hm[2]);
        var h = /(\d+(?:[.,]\d+)?)\s*h/.exec(t), m = /(\d+(?:[.,]\d+)?)\s*(?:m|min)/.exec(t);
        if (h || m) return (h ? parseFloat(h[1].replace(',', '.')) * 60 : 0) + (m ? parseFloat(m[1].replace(',', '.')) : 0);
        var n = parseFloat(t.replace(',', '.'));
        return isNaN(n) ? NaN : n;
    }
    function fechaLarga(f) {
        var s = String(f || '');
        var a = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
        if (a) return a[3] + '-' + a[2] + '-' + a[1];
        var b = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s);
        return b ? b[1] + '-' + b[2] + '-' + b[3] : (s || '—');
    }

    function ficha(items) {
        return '<div class="ficha">' + items.map(function (f) {
            return '<div><span>' + esc(f[0]) + '</span><b>' + dash(f[1]) + '</b></div>';
        }).join('') + '</div>';
    }
    function kpis(items) {
        return '<div class="kpis">' + items.map(function (k) {
            return '<div class="kpi ' + (k[2] || '') + '"><b>' + k[0] + '</b><span>' + esc(k[1]) + '</span></div>';
        }).join('') + '</div>';
    }

    /* Gráfico de barras agrupadas (diseño vs real) en SVG */
    function barras(rows, etiquetaB) {
        var d = rows.filter(function (r) { return isFinite(r.a) || isFinite(r.b); });
        if (!d.length) return '';
        var max = 1; d.forEach(function (r) { max = Math.max(max, r.a || 0, r.b || 0); });
        var W = 760, H = 230, mL = 36, mB = 40, mT = 14, ancho = (W - mL - 10) / d.length;
        var ph = H - mB - mT, o = [];
        o.push('<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" font-family="Segoe UI,Arial,sans-serif">');
        for (var g = 0; g <= 4; g++) {
            var y = mT + ph - ph * g / 4, v = max * g / 4;
            o.push('<line x1="' + mL + '" y1="' + y + '" x2="' + (W - 10) + '" y2="' + y + '" stroke="#e2e8f0"/>' +
                '<text x="' + (mL - 5) + '" y="' + (y + 3) + '" font-size="9" fill="#64748b" text-anchor="end">' + Math.round(v) + '</text>');
        }
        d.forEach(function (r, i) {
            var x0 = mL + i * ancho, bw = Math.min(26, ancho * 0.34);
            var ha = (r.a || 0) / max * ph, hb = (r.b || 0) / max * ph;
            o.push('<rect x="' + (x0 + ancho / 2 - bw - 1) + '" y="' + (mT + ph - ha) + '" width="' + bw + '" height="' + ha + '" fill="#94a3b8"/>');
            o.push('<rect x="' + (x0 + ancho / 2 + 1) + '" y="' + (mT + ph - hb) + '" width="' + bw + '" height="' + hb + '" fill="#2563eb"/>');
            o.push('<text x="' + (x0 + ancho / 2 - bw / 2 - 1) + '" y="' + (mT + ph - ha - 3) + '" font-size="9" fill="#475569" text-anchor="middle">' + fmt(r.a, 1) + '</text>');
            o.push('<text x="' + (x0 + ancho / 2 + bw / 2 + 1) + '" y="' + (mT + ph - hb - 3) + '" font-size="9" fill="#1d4ed8" text-anchor="middle">' + fmt(r.b, 1) + '</text>');
            o.push('<text x="' + (x0 + ancho / 2) + '" y="' + (H - mB + 13) + '" font-size="10" fill="#0f172a" text-anchor="middle">' + esc(r.t) + '</text>');
            if (r.s) o.push('<text x="' + (x0 + ancho / 2) + '" y="' + (H - mB + 25) + '" font-size="9" fill="#64748b" text-anchor="middle">' + esc(r.s) + '</text>');
        });
        o.push('</svg>');
        return '<div class="fig">' + o.join('') + '</div>' +
            '<div class="lg"><span><i style="background:#94a3b8"></i>Diseño [m]</span><span><i style="background:#2563eb"></i>' + esc(etiquetaB || 'Real [m]') + '</span></div>';
    }

    function pagina(opt) {
        var LT = '<';
        var pie = '<div class="pie"><span>J.E.J. Ingeniería · Contrato N° 4600026097</span><span>Generado el ' + new Date().toLocaleString('es-CL') + '</span></div>';
        return LT + '!DOCTYPE html>' + LT + 'html lang="es">' + LT + 'head>' + LT + 'meta charset="UTF-8">' +
            LT + 'meta name="viewport" content="width=device-width, initial-scale=1">' +
            LT + 'title>' + esc(opt.titulo) + LT + '/title>' + LT + 'style>' + CSS + LT + '/style>' + LT + '/head>' + LT + 'body>' +
            LT + 'div class="barra">' + LT + 'span>Para guardar el informe: Imprimir → Destino «Guardar como PDF».' + LT + '/span>' +
            LT + 'button type="button" onclick="window.print()">Imprimir / Guardar PDF' + LT + '/button>' + LT + '/div>' +
            LT + 'main class="hoja">' +
            '<div class="port"><div><p class="emp">J.E.J. Ingeniería · Servicio QA/QC Operaciones de Perforación y Tronadura · Contrato N° 4600026097</p>' +
            '<h1>' + esc(opt.h1) + '</h1><div class="id">' + esc(opt.sub) + '</div></div>' +
            '<div class="der"><b>' + esc(opt.fecha || '—') + '</b>' + esc(opt.der || '') + '</div></div>' +
            '<div class="cuerpo">' + opt.cuerpo + '</div>' + pie + LT + '/main>' + LT + '/body>' + LT + '/html>';
    }

    function abrir(html, nombreArchivo) {
        var w = root.open('', '_blank');
        if (!w) {
            var a = document.createElement('a');
            a.href = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
            a.download = (nombreArchivo || 'Informe_Tecnico') + '.html';
            document.body.appendChild(a); a.click();
            setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
            root.alert('El navegador bloqueó la ventana emergente, así que el informe se descargó como archivo .html. Ábrelo y usa Imprimir → Guardar como PDF.');
            return;
        }
        w.document.open(); w.document.write(html); w.document.close();
        w.focus();
        setTimeout(function () { try { w.print(); } catch (e) { /* se puede imprimir desde el botón */ } }, 700);
    }

    root.JEJInformeBase = {
        esc: esc, dash: dash, num: num, fmt: fmt, pct: pct, toMin: toMin, diffMin: diffMin, fmtHM: fmtHM,
        minutosLibre: minutosLibre, fechaLarga: fechaLarga, ficha: ficha, kpis: kpis, barras: barras,
        pagina: pagina, abrir: abrir
    };
})(window);
