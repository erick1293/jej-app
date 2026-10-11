(function (root) {
    'use strict';

    var CAMPOS_TIRO = {
        ANFO: [
            ['longDiseno', 'Long. diseño [m]'],
            ['taco', 'Taco [m]'],
            ['largoMomento', 'Largo momento cargar [m]'],
            ['tacoReal', 'Taco real [m]'],
            ['longCargada', 'Longitud cargada [m]'],
            ['estado', 'Estado del tiro'],
            ['intentosDestape', 'Intentos de destape'],
            ['agua', 'Tiro con agua'],
            ['posNeg', 'Tiro negativo / positivo'],
            ['numPera', 'Núm. pera'],
            ['camaExplosivo', 'Cama explosivo [m]'],
            ['ceboSup', 'Cebo superior'],
            ['aranaSup', 'Araña cebo superior'],
            ['cantCartuchos', 'Cant. cartuchos superiores'],
            ['ceboInf', 'Cebo inferior'],
            ['aranaInf', 'Araña cebo inferior'],
            ['cantCartuchosInf', 'Cant. cartuchos inferiores'],
            ['numRetenedores', 'Núm. retenedores'],
            ['tipoRetenedor', 'Tipo retenedor']
        ],
        EMULSION: [
            ['longDiseno', 'Long. diseño [m]'],
            ['taco', 'Taco [m]'],
            ['largoMomento', 'Largo momento cargar [m]'],
            ['tacoReal', 'Taco real [m]'],
            ['longCargada', 'Longitud cargada [m]'],
            ['estado', 'Estado del tiro'],
            ['intentosDestape', 'Intentos de destape'],
            ['agua', 'Tiro con agua'],
            ['posNeg', 'Tiro negativo / positivo'],
            ['tipoEmulsion', 'Tipo de emulsión / producto'],
            ['kilosEmulsion', 'Kilos / litros usados'],
            ['numPera', 'Núm. pera'],
            ['camaExplosivo', 'Cama explosivo [m]'],
            ['ceboSup', 'Cebo superior'],
            ['aranaSup', 'Araña cebo superior'],
            ['cantCartuchos', 'Cant. cartuchos / boosters'],
            ['ceboInf', 'Cebo inferior']
        ]
    };

    function esc(value) {
        return String(value == null ? '' : value).replace(/[&<>"']/g, function (character) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            }[character];
        });
    }

    function valor(id) {
        var control = document.getElementById(id);
        return control ? control.value.trim() : '';
    }

    function camposDeGrupo(group) {
        var label = group.querySelector('label');
        var controls = Array.from(group.querySelectorAll('input, select, textarea'));
        var values = controls.map(function (control) {
            if (control.type === 'checkbox') return control.checked ? 'Sí' : 'No';
            return control.value.trim();
        }).filter(Boolean);
        return label && values.length ? { label: label.textContent.trim(), value: values.join(' / ') } : null;
    }

    function seccionesPlantilla() {
        var modal = document.getElementById('modalPlantillaFinal');
        if (!modal) return [];
        var sections = [];
        var current;

        Array.from(modal.querySelector('.modal-content').children).forEach(function (child) {
            if (child.classList.contains('section-title')) {
                current = { title: child.textContent.trim(), fields: [] };
                sections.push(current);
                return;
            }
            if (!current) return;
            child.querySelectorAll('.form-group-field').forEach(function (group) {
                var field = camposDeGrupo(group);
                if (field) current.fields.push(field);
            });
        });

        return sections.filter(function (section) { return section.fields.length; });
    }

    function personal() {
        return [
            ['Mina', valor('modalMina')],
            ['Nivel', valor('modalNivel')],
            ['Bloque', valor('modalBloque')],
            ['ID Tronadura', valor('modalIdTronadura')],
            ['Supervisor JeJ', valor('modalSupJeJ')],
            ['Encargado seguimiento JeJ', valor('modalEncargado')],
            ['Supervisor(es) DET', Array.from(document.querySelectorAll('#modalPersonal [name="supervisorDet"]')).map(function (input) { return input.value.trim(); }).filter(Boolean).join(', ')],
            ['Responsable(s) DET', Array.from(document.querySelectorAll('#modalPersonal [name="responsableDet"]')).map(function (input) { return input.value.trim(); }).filter(Boolean).join(', ')]
        ];
    }

    function observaciones() {
        return [
            ['Pérdida operacional durante el carguío', valor('obsPerdidaCarguio')],
            ['Tiempo de pérdida en carguío', valor('tiempoPerdidaCarguio')],
            ['Pérdida operacional durante el amarre', valor('obsPerdidaAmarre')],
            ['Tiempo de pérdida en amarre', valor('tiempoPerdidaAmarre')],
            ['Observaciones generales', valor('obsGenerales')]
        ].filter(function (field) { return field[1]; });
    }

    function trabajosValidos(trabajos) {
        return Array.isArray(trabajos) ? trabajos.filter(function (trabajo) {
            return trabajo && Array.isArray(trabajo.paradas);
        }) : [];
    }

    function crearInforme(tipo, trabajos) {
        var totalParadas = 0;
        var totalTiros = 0;
        var filasResumen = [];
        var detalle = [];
        var campos = CAMPOS_TIRO[tipo];

        trabajos.forEach(function (trabajo) {
            trabajo.paradas.forEach(function (parada) {
                var tiros = Array.isArray(parada.tiros) ? parada.tiros : [];
                totalParadas += 1;
                totalTiros += tiros.length;
                filasResumen.push(
                    '<tr><td>' + esc(trabajo.idTrabajo || '—') + '</td><td>' + esc(parada.idParada || '—') +
                    '</td><td>' + tiros.length + '</td></tr>'
                );
                tiros.forEach(function (tiro, index) {
                    var datos = campos.map(function (field) {
                        var value = tiro[field[0]];
                        return '<div><span>' + esc(field[1]) + '</span><b>' +
                            esc(value === '' || value == null ? '—' : value) + '</b></div>';
                    }).join('');
                    detalle.push(
                        '<section class="tiro"><h3>' + esc(trabajo.idTrabajo || 'Trabajo') +
                        ' · Parada ' + esc(parada.idParada || '—') + ' · Tiro ' +
                        esc(tiro.tiroNum || index + 1) + '</h3><div class="datos-tiro">' + datos + '</div></section>'
                    );
                });
            });
        });

        var fecha = valor('fechaAnfo');
        var fechaInforme = fecha.replace(/^(\d{2})\/(\d{2})\/(\d{4})$/, '$1-$2-$3');
        var turno = valor('turnoAnfo');
        var tipoTexto = tipo === 'ANFO' ? 'ANFO' : 'Emulsión';
        var meta = personal().map(function (field) {
            return '<div><span>' + esc(field[0]) + '</span><b>' + esc(field[1] || '—') + '</b></div>';
        }).join('');
        var secciones = seccionesPlantilla().map(function (section) {
            return '<h2>' + esc(section.title) + '</h2><div class="ficha">' +
                section.fields.map(function (field) {
                    return '<div><span>' + esc(field.label) + '</span><b>' + esc(field.value) + '</b></div>';
                }).join('') + '</div>';
        }).join('');
        var obs = observaciones();
        var observacionesHtml = obs.length
            ? '<h2>Observaciones y pérdidas operacionales</h2><div class="ficha">' +
                obs.map(function (field) {
                    return '<div><span>' + esc(field[0]) + '</span><b>' + esc(field[1]) + '</b></div>';
                }).join('') + '</div>'
            : '';

        return '<!doctype html><html lang="es"><head><meta charset="utf-8">' +
            '<meta name="viewport" content="width=device-width, initial-scale=1">' +
            '<title>InformeTecnico_' + esc(tipo) + '_' + esc(fechaInforme.replace(/[^\w-]/g, '-')) + '</title>' +
            '<style>' +
            '*{box-sizing:border-box}body{margin:0;background:#e9edf3;color:#0f172a;font:13px/1.45 "Segoe UI",Arial,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}' +
            '.barra{position:sticky;top:0;z-index:2;display:flex;justify-content:space-between;align-items:center;gap:12px;padding:9px 16px;background:#fff;border-bottom:1px solid #e2e8f0;color:#64748b}' +
            '.barra button{border:0;border-radius:6px;background:#2563eb;color:#fff;padding:9px 16px;font-size:13px;font-weight:700;cursor:pointer}' +
            '.hoja{max-width:900px;margin:16px auto;background:#fff;box-shadow:0 1px 8px #0f172a20}' +
            '.port{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;padding:25px 32px 21px;background:#12263f;color:#fff;border-bottom:5px solid #ea580c}' +
            '.emp{margin:0 0 6px;font-size:12px;opacity:.8}.port h1{margin:0;font-size:24px;line-height:1.2}.id{margin-top:6px;opacity:.9}.der{text-align:right;white-space:nowrap}.der b{display:block;font-size:20px}' +
            '.cuerpo{padding:8px 32px 18px}h2{margin:18px 0 8px;padding-bottom:5px;border-bottom:2px solid #e2e8f0;font-size:16px}h3{margin:0 0 10px;font-size:13px}' +
            '.ficha{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));border:1px solid #e2e8f0;border-radius:8px;overflow:hidden}' +
            '.ficha>div,.datos-tiro>div{min-width:0;padding:8px 10px;border-right:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;overflow-wrap:anywhere}' +
            '.ficha span,.datos-tiro span{display:block;color:#64748b;font-size:10px}.ficha b,.datos-tiro b{display:block;margin-top:2px;font-size:12px}' +
            '.kpis{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.kpi{padding:12px;border:1px solid #e2e8f0;border-radius:8px;background:#f8fafc}.kpi b{display:block;font-size:21px}.kpi span{color:#64748b;font-size:11px}' +
            'table{width:100%;border-collapse:collapse;font-size:11px}th,td{padding:7px;border:1px solid #e2e8f0;text-align:left}th{background:#f1f5f9}' +
            '.tiro{margin:10px 0;padding:12px;border:1px solid #e2e8f0;border-radius:9px;break-inside:avoid}.datos-tiro{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));border-top:1px solid #e2e8f0;border-left:1px solid #e2e8f0}' +
            '.pie{display:flex;justify-content:space-between;padding:10px 32px;border-top:1px solid #e2e8f0;color:#64748b;font-size:10px}' +
            '@page{size:A4;margin:11mm}@media print{body{background:#fff}.barra{display:none}.hoja{max-width:none;margin:0;box-shadow:none}.cuerpo{padding:6px 8px}.port{padding:20px 24px 16px}.pie{padding:8px}.ficha>div,.kpi{break-inside:avoid}}' +
            '@media(max-width:640px){.hoja{margin:0}.port{flex-direction:column;align-items:flex-start}.der{text-align:left}.cuerpo{padding:8px 14px}.ficha,.datos-tiro{grid-template-columns:repeat(2,minmax(0,1fr))}.kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.pie{padding:10px 14px}}' +
            '</style></head><body><div class="barra"><span>Para guardar el informe: Imprimir → Destino «Guardar como PDF».</span>' +
            '<button type="button" onclick="window.print()">Imprimir / Guardar PDF</button></div>' +
            '<main class="hoja"><header class="port"><div><p class="emp">J.E.J. Ingeniería · Servicio QA/QC Operaciones de Perforación y Tronadura · Contrato N° 4600026097</p>' +
            '<h1>Informe técnico de carguío · ' + esc(tipoTexto) + '</h1><div class="id">' +
            esc(valor('modalIdTronadura') || 'ID de tronadura no informado') + ' · ' + esc(valor('modalMina') || 'Mina no informada') +
            '</div></div><div class="der"><b>' + esc(fechaInforme || '—') + '</b>Turno ' + esc(turno || '—') + '</div></header>' +
            '<div class="cuerpo"><h2>Identificación y labor</h2><div class="ficha">' + meta + '</div>' +
            '<h2>Indicadores del turno</h2><div class="kpis">' +
            '<div class="kpi"><b>' + trabajos.length + '</b><span>trabajos registrados</span></div>' +
            '<div class="kpi"><b>' + totalParadas + '</b><span>paradas registradas</span></div>' +
            '<div class="kpi"><b>' + totalTiros + '</b><span>tiros registrados</span></div></div>' +
            secciones +
            '<h2>Resumen por parada</h2>' +
            (filasResumen.length
                ? '<table><thead><tr><th>ID trabajo</th><th>Parada</th><th>Tiros</th></tr></thead><tbody>' + filasResumen.join('') + '</tbody></table>'
                : '<p>No hay paradas registradas.</p>') +
            '<h2>Registro por tiro</h2>' +
            (detalle.length ? detalle.join('') : '<p>No hay tiros registrados.</p>') +
            observacionesHtml +
            '</div><footer class="pie"><span>Informe técnico de carguío · ' + esc(tipoTexto) + '</span><span>J.E.J. Ingeniería</span></footer></main></body></html>';
    }

    function abrir(config) {
        var tipo = config.tipo === 'ANFO' ? 'ANFO' : 'EMULSION';
        var trabajos = trabajosValidos(config.trabajos);
        var ventana = root.open('', '_blank');
        if (!ventana) {
            root.alert('No se pudo abrir el informe. Permite las ventanas emergentes para esta aplicación e inténtalo nuevamente.');
            return;
        }
        ventana.document.open();
        ventana.document.write(crearInforme(tipo, trabajos));
        ventana.document.close();
    }

    root.JEJInformeCarguio = { abrir: abrir };
})(window);
