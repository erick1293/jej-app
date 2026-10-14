/* ============================================
 * EMULSIÓN · Lógica de la página
 * Archivo de lógica: js/emulsion.js
 * Secciones de la lógica conservan el flujo de la página.
 * ============================================ */

        cargarBarMenu(true);
        let trabajosGuardados = []; 
        let idTrabajoActual = "";
        let idParadaActual = "";
        let tirosTemporales = [];
        let indiceTiroActual = 0;
        let totalTirosParadaActual = 0;

        document.addEventListener("DOMContentLoaded", () => {
            const hoy = new Date();
            const fechaFormateada = String(hoy.getDate()).padStart(2, '0') + '/' + 
                                    String(hoy.getMonth() + 1).padStart(2, '0') + '/' + 
                                    hoy.getFullYear();
            document.getElementById("fechaEmulsion").value = fechaFormateada;

            const usuarioActivo = localStorage.getItem("jej_usuario_activo");
            if (usuarioActivo) {
                document.getElementById("modalEncargado").value = usuarioActivo;
            }

            document.getElementById("turnoEmulsion").addEventListener("change", () => {
                actualizarListasPorTurno();
                actualizarResumenUnificado();
                ejecutarAutosave();
            });

            cargarBorradorAutosave();
            actualizarResumenUnificado();
            actualizarSelectIdsTrabajo();
        });

        function ocultarTodosPasos() {
            document.getElementById("paso1").style.display = "none";
            document.getElementById("paso2").style.display = "none";
            document.getElementById("paso3").style.display = "none";
            document.getElementById("paso4").style.display = "none";
            document.getElementById("paso5").style.display = "none";
            document.getElementById("paso6").style.display = "none";
        }

        function irAPaso1() {
            ocultarTodosPasos();
            document.getElementById("paso1").style.display = "block";
        }

        function irAPaso2() {
            const turno = document.getElementById("turnoEmulsion").value;
            if (!turno) {
                alert("Por favor seleccione un Turno antes de continuar.");
                return;
            }
            ocultarTodosPasos();
            document.getElementById("paso2").style.display = "block";
            actualizarSelectIdsTrabajo();
        }

        function crearNuevoIdTrabajo() {
            const nuevoId = document.getElementById("nuevoIdInput").value.trim();
            if (!nuevoId) {
                alert("Ingrese un nombre para el nuevo ID de Trabajo.");
                return;
            }

            let trabajo = trabajosGuardados.find(t => t.idTrabajo === nuevoId);
            if (!trabajo) {
                trabajo = { idTrabajo: nuevoId, paradas: [] };
                trabajosGuardados.push(trabajo);
            }

            idTrabajoActual = nuevoId;
            document.getElementById("nuevoIdInput").value = "";
            actualizarSelectIdsTrabajo();
            ejecutarAutosave();

            cargarSelectParadas();
            document.getElementById("subtituloPaso3").innerText = `ID Trabajo: ${idTrabajoActual}`;
            ocultarTodosPasos();
            document.getElementById("paso3").style.display = "block";
        }

        function seleccionarIdExistente() {
            const select = document.getElementById("selectIdExistente");
            const seleccionado = select.value;
            if (!seleccionado) {
                alert("Seleccione un ID de Trabajo existente de la lista.");
                return;
            }

            idTrabajoActual = seleccionado;
            cargarSelectParadas();
            document.getElementById("subtituloPaso3").innerText = `ID Trabajo: ${idTrabajoActual}`;
            ocultarTodosPasos();
            document.getElementById("paso3").style.display = "block";
        }

        function eliminarIdSeleccionado() {
            const select = document.getElementById("selectIdExistente");
            const seleccionado = select.value;
            if (!seleccionado) {
                alert("Seleccione un ID de la lista para eliminar.");
                return;
            }

            if (confirm(`¿Desea eliminar el ID de Trabajo "${seleccionado}" y todas sus paradas?`)) {
                trabajosGuardados = trabajosGuardados.filter(t => t.idTrabajo !== seleccionado);
                actualizarSelectIdsTrabajo();
                guardarHistoricoTrabajos();
                ejecutarAutosave();
                alert(`ID "${seleccionado}" eliminado con éxito.`);
            }
        }

        function volverAPaso2() {
            ocultarTodosPasos();
            document.getElementById("paso2").style.display = "block";
        }

        function volverAPaso3() {
            ocultarTodosPasos();
            document.getElementById("paso3").style.display = "block";
            cargarSelectParadas();
        }

        function cargarSelectParadas() {
            const select = document.getElementById("selectParadaExistente");
            if (!select) return;
            select.innerHTML = '<option value="" disabled selected>-- Seleccione una parada guardada --</option>';
            
            let trabajo = trabajosGuardados.find(t => t.idTrabajo === idTrabajoActual);
            if (!trabajo) {
                trabajo = { idTrabajo: idTrabajoActual, paradas: [] };
                trabajosGuardados.push(trabajo);
            }

            if (trabajo.paradas) {
                trabajo.paradas.forEach(p => {
                    select.innerHTML += `<option value="${p.idParada}">${p.idParada} (${p.tiros.length} tiros)</option>`;
                });
            }
        }

        function irAPaso4DesdeCrearParada() {
            const idParadaInput = document.getElementById("idParadaInput").value.trim();
            if (!idParadaInput) {
                alert("Ingrese un nombre o código para la Parada.");
                return;
            }

            idParadaActual = idParadaInput;
            document.getElementById("idParadaInput").value = "";

            const trabajo = trabajosGuardados.find(t => t.idTrabajo === idTrabajoActual);
            if (trabajo) {
                const paradaExistente = trabajo.paradas.find(p => p.idParada === idParadaActual);
                if (paradaExistente) {
                    document.getElementById("cantTirosInput").value = paradaExistente.tiros.length;
                } else {
                    document.getElementById("cantTirosInput").value = 3;
                }
            }

            document.getElementById("subtituloPaso4").innerText = `Trabajo: ${idTrabajoActual} | Parada: ${idParadaActual}`;
            ocultarTodosPasos();
            document.getElementById("paso4").style.display = "block";
        }

        function seleccionarParadaExistente() {
            const select = document.getElementById("selectParadaExistente");
            const seleccionado = select.value;
            if (!seleccionado) {
                alert("Seleccione una Parada de la lista.");
                return;
            }

            idParadaActual = seleccionado;
            const trabajo = trabajosGuardados.find(t => t.idTrabajo === idTrabajoActual);
            if (trabajo) {
                const paradaExistente = trabajo.paradas.find(p => p.idParada === idParadaActual);
                if (paradaExistente) {
                    document.getElementById("cantTirosInput").value = paradaExistente.tiros.length;
                }
            }

            document.getElementById("subtituloPaso4").innerText = `Trabajo: ${idTrabajoActual} | Parada: ${idParadaActual}`;
            ocultarTodosPasos();
            document.getElementById("paso4").style.display = "block";
        }

        function eliminarParadaSeleccionada() {
            const select = document.getElementById("selectParadaExistente");
            const seleccionado = select.value;
            if (!seleccionado) {
                alert("Seleccione una Parada para eliminar.");
                return;
            }

            if (confirm(`¿Desea eliminar la Parada "${seleccionado}"?`)) {
                const trabajo = trabajosGuardados.find(t => t.idTrabajo === idTrabajoActual);
                if (trabajo) {
                    trabajo.paradas = trabajo.paradas.filter(p => p.idParada !== seleccionado);
                }
                cargarSelectParadas();
                guardarHistoricoTrabajos();
                ejecutarAutosave();
                alert(`Parada "${seleccionado}" eliminada con éxito.`);
            }
        }

        function irAResumenFinalDesdeParadas() {
            mostrarResumenParadasFinal();
        }

        function guardarHistoricoTrabajos() {
            localStorage.setItem("jej_emulsion_historicos", JSON.stringify(trabajosGuardados));
        }

        function cargarHistoricoTrabajos() {
            const historico = localStorage.getItem("jej_emulsion_historicos");
            if (historico) {
                try {
                    const parsed = JSON.parse(historico);
                    if (Array.isArray(parsed)) {
                        trabajosGuardados = parsed;
                    }
                } catch(e) {
                    console.error("Error al cargar histórico", e);
                }
            }
        }

        function actualizarSelectIdsTrabajo() {
            const select = document.getElementById("selectIdExistente");
            if (!select) return;
            select.innerHTML = '<option value="" disabled selected>-- Seleccione un ID guardado --</option>';
            trabajosGuardados.forEach(t => {
                select.innerHTML += `<option value="${t.idTrabajo}">${t.idTrabajo} (${t.paradas.length} paradas)</option>`;
            });
        }

        function ejecutarAutosave() {
            guardarHistoricoTrabajos();
            const borrador = {
                trabajos: trabajosGuardados
            };
            localStorage.setItem("jej_emulsion_draft", JSON.stringify(borrador));
            
            const badge = document.getElementById("indicadorAutosave");
            if (badge) {
                badge.style.display = "inline-flex";
                setTimeout(() => { badge.style.display = "none"; }, 1500);
            }
        }

        function cargarBorradorAutosave() {
            cargarHistoricoTrabajos();
            const borradorRaw = localStorage.getItem("jej_emulsion_draft");
            if (!borradorRaw) return;

            try {
                const b = JSON.parse(borradorRaw);
                if (b.trabajos && Array.isArray(b.trabajos)) {
                    trabajosGuardados = b.trabajos;
                }
                actualizarListasPorTurno();
                actualizarSelectIdsTrabajo();
            } catch (e) {
                console.error("Error al cargar borrador", e);
            }
        }

        function abrirModalPersonal() {
            document.getElementById("modalPersonal").style.display = "flex";
            actualizarListasPorTurno();
        }

        function cerrarModalPersonal() {
            document.getElementById("modalPersonal").style.display = "none";
        }

        function guardarModalPersonal() {
            actualizarResumenUnificado();
            ejecutarAutosave();
            cerrarModalPersonal();
        }

        function abrirModalObservaciones() {
            document.getElementById("modalObservaciones").style.display = "flex";
        }

        function cerrarModalObservaciones() {
            document.getElementById("modalObservaciones").style.display = "none";
        }

        function guardarModalObservaciones() {
            ejecutarAutosave();
            cerrarModalObservaciones();
            alert("Observaciones guardadas localmente.");
        }

        function agregarCampoModal(contenedorId, nameInput) {
            const contenedor = document.getElementById(contenedorId);
            const div = document.createElement("div");
            div.style.display = "flex";
            div.style.gap = "8px";
            
            const listId = nameInput === 'supervisorDet' ? 'listaSupDet' : 'listaRespDet';
            const nuevoListId = listId + "_" + Date.now();

            div.innerHTML = `
                <input type="text" name="${nameInput}" list="${nuevoListId}" placeholder="Seleccione o escriba..." style="flex: 1;">
                <datalist id="${nuevoListId}"></datalist>
                <button type="button" onclick="this.parentElement.remove()" style="background: #fee2e2; color: #991b1b; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">✕</button>
            `;
            contenedor.appendChild(div);
            actualizarListasPorTurno();
        }

        function actualizarResumenUnificado() {
            const mina = document.getElementById("modalMina").value || "Esmeralda";
            const nivel = document.getElementById("modalNivel").value || "NP";
            const bloque = document.getElementById("modalBloque").value || "Ext Fw";
            const tronadura = document.getElementById("modalIdTronadura").value || "Sin asignar";

            const supJeJ = document.getElementById("modalSupJeJ").value || "Sin asignar";
            const supsDet = Array.from(document.querySelectorAll('#modalPersonal input[name="supervisorDet"]'))
                                .map(i => i.value).filter(Boolean).join(", ") || "Sin asignar";
            const respsDet = Array.from(document.querySelectorAll('#modalPersonal input[name="responsableDet"]'))
                                .map(i => i.value).filter(Boolean).join(", ") || "Sin asignar";

            document.getElementById("resumenUnificado").innerHTML = `
                <hr style="border: 0; border-top: 1px solid #cbd5e1; margin: 8px 0;">
                <strong>Encargado JeJ:</strong> ${localStorage.getItem("jej_usuario_activo") || 'N/A'}<br>
                <strong>Supervisor JeJ:</strong> ${supJeJ}<br>
                <strong>Supervisor(es) DET:</strong> ${supsDet}<br>
                <strong>Responsable(s) DET:</strong> ${respsDet}
            `;
        }

        function actualizarListasPorTurno() {
            const turnoSeleccionado = document.getElementById("turnoEmulsion").value;
            let personalMap = JSON.parse(localStorage.getItem("jej_personal_map") || "{}");

            function poblarGrupo(rolKey, selectorNombre, baseListId) {
                const inputs = document.querySelectorAll(`input[name="${selectorNombre}"]`);
                inputs.forEach((input, index) => {
                    let datalistId = input.getAttribute("list") || baseListId;
                    let datalist = document.getElementById(datalistId);

                    if (!datalist) {
                        datalistId = baseListId + "_dinamico_" + index;
                        input.setAttribute("list", datalistId);
                        datalist = document.createElement("datalist");
                        datalist.id = datalistId;
                        document.body.appendChild(datalist);
                    }

                    datalist.innerHTML = "";
                    let primerNombre = "";

                    if (personalMap[rolKey] && Array.isArray(personalMap[rolKey])) {
                        personalMap[rolKey].forEach(item => {
                            const nombre = typeof item === 'object' ? item.nombre : item;
                            const turno = typeof item === 'object' ? item.turno : "Ambos";

                            if (!turnoSeleccionado || turno === turnoSeleccionado || turno === "Ambos") {
                                datalist.innerHTML += `<option value="${nombre}">`;
                                if (!primerNombre) primerNombre = nombre;
                            }
                        });
                    }

                    if (index === 0 && input && primerNombre && !input.value) {
                        input.value = primerNombre;
                    }
                });
            }

            poblarGrupo("supervisorJeJ", "supervisorJeJ", "listaSupJeJ");
            poblarGrupo("supervisorDet", "supervisorDet", "listaSupDet");
            poblarGrupo("responsableDet", "responsableDet", "listaRespDet");
            actualizarResumenUnificado();
        }

        function toggleIntentosDestapeEmulsion() {
            const estado = document.getElementById("emulsionEstado").value;
            const inputIntentos = document.getElementById("emulsionIntentosDestape");
            if (estado === "Tapado") {
                inputIntentos.disabled = false;
                inputIntentos.focus();
            } else {
                inputIntentos.disabled = true;
                inputIntentos.value = "";
            }
        }

        function iniciarRegistroTiros() {
            totalTirosParadaActual = parseInt(document.getElementById("cantTirosInput").value) || 1;
            
            const trabajo = trabajosGuardados.find(t => t.idTrabajo === idTrabajoActual);
            if (trabajo) {
                const paradaExistente = trabajo.paradas.find(p => p.idParada === idParadaActual);
                if (paradaExistente) {
                    tirosTemporales = [...paradaExistente.tiros];
                } else {
                    tirosTemporales = [];
                }
            } else {
                tirosTemporales = [];
            }

            indiceTiroActual = 1;
            ocultarTodosPasos();
            document.getElementById("paso5").style.display = "block";
            cargarFormularioTiroWizard(indiceTiroActual);
        }

        function cargarFormularioTiroWizard(numeroTiro) {
            document.getElementById("tituloTiroActual").innerText = `Captura de Tiro ${numeroTiro} - Emulsión`;
            document.getElementById("subtituloParadaActual").innerText = `Trabajo: ${idTrabajoActual} | Parada: ${idParadaActual}`;
            document.getElementById("badgeProgreso").innerText = `Tiro ${numeroTiro} de ${totalTirosParadaActual}`;

            const tiroExistente = tirosTemporales[numeroTiro - 1];

            document.getElementById("emulsionLongDiseno").value = tiroExistente ? tiroExistente.longDiseno : 12.9;
            document.getElementById("emulsionTaco").value = tiroExistente ? tiroExistente.taco : 8.0;
            document.getElementById("emulsionLargoMomento").value = tiroExistente ? tiroExistente.largoMomento : 13.0;
            document.getElementById("emulsionTacoReal").value = tiroExistente ? tiroExistente.tacoReal : 8.0;
            document.getElementById("emulsionEstado").value = tiroExistente ? tiroExistente.estado : "Sano";
            document.getElementById("emulsionIntentosDestape").value = tiroExistente ? tiroExistente.intentosDestape : "";
            document.getElementById("emulsionAgua").value = tiroExistente ? tiroExistente.agua : "Seco";
            document.getElementById("emulsionPosNeg").value = tiroExistente ? tiroExistente.posNeg : "Positivo";
            document.getElementById("tipoEmulsion").value = tiroExistente ? tiroExistente.tipoEmulsion : "Emulnor 3000";
            document.getElementById("kilosEmulsion").value = tiroExistente ? tiroExistente.kilosEmulsion : "";
            document.getElementById("emulsionNumPera").value = tiroExistente ? tiroExistente.numPera : 7;
            document.getElementById("emulsionCamaExplosivo").value = tiroExistente ? tiroExistente.camaExplosivo : "";
            document.getElementById("emulsionCeboSup").value = tiroExistente ? tiroExistente.ceboSup : "150.0";
            document.getElementById("emulsionAranaSup").value = tiroExistente ? tiroExistente.aranaSup : "Si";
            document.getElementById("emulsionCantCartuchos").value = tiroExistente ? tiroExistente.cantCartuchos : 1;
            document.getElementById("emulsionCeboInf").value = tiroExistente ? tiroExistente.ceboInf : "";
            [["emulsionLongTerminarCama","longTerminarCama"],["emulsionLong1erCebo","long1erCebo"],["emulsionLongTerminarIntermedia","longTerminarIntermedia"],
             ["emulsionLong2doCebo","long2doCebo"],["emulsionLongCargaInferior","longCargaInferior"],["emulsionLongRetenedor","longRetenedor"],["emulsionLongTacoGreda","longTacoGreda"]]
                .forEach(function (par) { document.getElementById(par[0]).value = tiroExistente && tiroExistente[par[1]] !== undefined ? tiroExistente[par[1]] : ""; });

            toggleIntentosDestapeEmulsion();

            const btnSig = document.getElementById("btnSiguienteTiroEmulsion");
            if (numeroTiro === totalTirosParadaActual) {
                btnSig.innerHTML = "Finalizar Parada ✔";
                btnSig.style.backgroundColor = "#16a34a";
            } else {
                btnSig.innerHTML = "Siguiente Tiro ➔";
                btnSig.style.backgroundColor = "#2563eb";
            }

            window.JEJCarguioWizard.mostrarTiro({
                containerId: "paso5",
                context: `Trabajo ${idTrabajoActual} · Parada ${idParadaActual} · Tiro ${numeroTiro} de ${totalTirosParadaActual}`,
                finishText: numeroTiro === totalTirosParadaActual ? "Finalizar parada ✓" : "Siguiente tiro →",
                onNext: siguienteTiroEmulsion,
                onPrevious: anteriorTiroEmulsion,
                onCancel: function () {
                    tirosTemporales = [];
                    ocultarTodosPasos();
                    document.getElementById("paso3").style.display = "block";
                    cargarSelectParadas();
                }
            });
        }

        function guardarDatosTiroActual() {
            const largoMomento = parseFloat(document.getElementById("emulsionLargoMomento").value) || 0;
            const tacoReal = parseFloat(document.getElementById("emulsionTacoReal").value) || 0;
            const longCargadaCalc = (largoMomento - tacoReal).toFixed(1);

            const datosTiro = {
                tiroNum: indiceTiroActual,
                longDiseno: document.getElementById("emulsionLongDiseno").value,
                taco: document.getElementById("emulsionTaco").value,
                largoMomento: document.getElementById("emulsionLargoMomento").value,
                tacoReal: document.getElementById("emulsionTacoReal").value,
                longCargada: longCargadaCalc,
                estado: document.getElementById("emulsionEstado").value,
                intentosDestape: document.getElementById("emulsionIntentosDestape").value,
                agua: document.getElementById("emulsionAgua").value,
                posNeg: document.getElementById("emulsionPosNeg").value,
                tipoEmulsion: document.getElementById("tipoEmulsion").value,
                kilosEmulsion: document.getElementById("kilosEmulsion").value,
                numPera: document.getElementById("emulsionNumPera").value,
                camaExplosivo: document.getElementById("emulsionCamaExplosivo").value,
                ceboSup: document.getElementById("emulsionCeboSup").value,
                aranaSup: document.getElementById("emulsionAranaSup").value,
                cantCartuchos: document.getElementById("emulsionCantCartuchos").value,
                ceboInf: document.getElementById("emulsionCeboInf").value,
                longTerminarCama: document.getElementById("emulsionLongTerminarCama").value,
                long1erCebo: document.getElementById("emulsionLong1erCebo").value,
                longTerminarIntermedia: document.getElementById("emulsionLongTerminarIntermedia").value,
                long2doCebo: document.getElementById("emulsionLong2doCebo").value,
                longCargaInferior: document.getElementById("emulsionLongCargaInferior").value,
                longRetenedor: document.getElementById("emulsionLongRetenedor").value,
                longTacoGreda: document.getElementById("emulsionLongTacoGreda").value
            };

            tirosTemporales[indiceTiroActual - 1] = datosTiro;
        }

        function siguienteTiroEmulsion() {
            guardarDatosTiroActual();

            if (indiceTiroActual < totalTirosParadaActual) {
                indiceTiroActual++;
                cargarFormularioTiroWizard(indiceTiroActual);
            } else {
                let trabajo = trabajosGuardados.find(t => t.idTrabajo === idTrabajoActual);
                if (trabajo) {
                    let paradaIndex = trabajo.paradas.findIndex(p => p.idParada === idParadaActual);
                    if (paradaIndex >= 0) {
                        trabajo.paradas[paradaIndex].tiros = [...tirosTemporales];
                    } else {
                        trabajo.paradas.push({
                            idParada: idParadaActual,
                            tiros: [...tirosTemporales]
                        });
                    }
                }

                ejecutarAutosave();
                ocultarTodosPasos();
                document.getElementById("paso3").style.display = "block";
                cargarSelectParadas();
            }
        }

        function anteriorTiroEmulsion() {
            guardarDatosTiroActual();
            if (indiceTiroActual > 1) {
                indiceTiroActual--;
                cargarFormularioTiroWizard(indiceTiroActual);
            } else {
                ocultarTodosPasos();
                document.getElementById("paso4").style.display = "block";
            }
        }

        function mostrarResumenParadasFinal() {
            ocultarTodosPasos();
            document.getElementById("paso6").style.display = "block";
            document.querySelector("#paso6 h2").innerText = `Resumen de Paradas (Emulsión) - Trabajo: ${idTrabajoActual}`;
            filtrarParadasResumen();
        }

        function filtrarParadasResumen() {
            const filtro = (document.getElementById("searchParada").value || "").toLowerCase();
            const contenedor = document.getElementById("listaParadasRegistradas");
            contenedor.innerHTML = "";

            const trabajoActualObj = trabajosGuardados.find(t => t.idTrabajo === idTrabajoActual);
            if (!trabajoActualObj || !trabajoActualObj.paradas || trabajoActualObj.paradas.length === 0) {
                contenedor.innerHTML = "<p style='color: #64748b; font-size: 13px;'>No hay paradas registradas para este trabajo aún.</p>";
                return;
            }

            let totalParadasCount = 0;
            trabajoActualObj.paradas.forEach(parada => {
                if (parada.idParada.toLowerCase().includes(filtro)) {
                    totalParadasCount++;
                    contenedor.innerHTML += `
                        <div class="item-parada-card">
                            <div>
                                <strong>📍 Parada: ${parada.idParada}</strong><br>
                                <span style="font-size: 12px; color: #64748b;">${parada.tiros.length} tiros cargados</span>
                            </div>
                            <div style="display: flex; gap: 6px;">
                                <button type="button" onclick="editarParadaDesdeResumen('${trabajoActualObj.idTrabajo}', '${parada.idParada}')" style="background: #e0f2fe; color: #0369a1; border: none; padding: 6px 10px; border-radius: 4px; font-weight: bold; cursor: pointer;">✏️ Editar</button>
                                <button type="button" onclick="eliminarParadaDesdeResumen('${trabajoActualObj.idTrabajo}', '${parada.idParada}')" style="background: #fee2e2; color: #991b1b; border: none; padding: 6px 10px; border-radius: 4px; font-weight: bold; cursor: pointer;">🗑️</button>
                            </div>
                        </div>
                    `;
                }
            });

            if (totalParadasCount === 0) {
                contenedor.innerHTML = "<p style='color: #64748b; font-size: 13px;'>No se encontraron paradas con ese filtro.</p>";
            }
        }

        function editarParadaDesdeResumen(idTrabajo, idParada) {
            idTrabajoActual = idTrabajo;
            idParadaActual = idParada;
            
            const trabajo = trabajosGuardados.find(t => t.idTrabajo === idTrabajoActual);
            const parada = trabajo ? trabajo.paradas.find(p => p.idParada === idParadaActual) : null;

            if (parada) {
                document.getElementById("cantTirosInput").value = parada.tiros.length;
            }

            document.getElementById("subtituloPaso4").innerText = `Trabajo: ${idTrabajoActual} | Parada: ${idParadaActual}`;
            ocultarTodosPasos();
            document.getElementById("paso4").style.display = "block";
        }

        function eliminarParadaDesdeResumen(idTrabajo, idParada) {
            if (confirm(`¿Desea eliminar la parada "${idParada}" del trabajo "${idTrabajo}"?`)) {
                const trabajo = trabajosGuardados.find(t => t.idTrabajo === idTrabajo);
                if (trabajo) {
                    trabajo.paradas = trabajo.paradas.filter(p => p.idParada !== idParada);
                }
                guardarHistoricoTrabajos();
                ejecutarAutosave();
                filtrarParadasResumen();
            }
        }

        function abrirModalPlantillaFinal() {
            window.JEJCarguioWizard.abrirPlantilla({
                rootId: "modalPlantillaFinal",
                context: "Datos de plantilla · Emulsión",
                onFinish: guardarModalPlantillaFinal,
                onCancel: cerrarModalPlantillaFinal
            });
        }

        function cerrarModalPlantillaFinal() {
            document.getElementById("modalPlantillaFinal").style.display = "none";
        }

        function guardarModalPlantillaFinal() {
            ejecutarAutosave();
            cerrarModalPlantillaFinal();
            alert("Datos de la plantilla guardados correctamente.");
        }

        function generarInformeTecnicoHTML() {
            const totalTiros = trabajosGuardados.reduce((total, trabajo) =>
                total + trabajo.paradas.reduce((subtotal, parada) => subtotal + parada.tiros.length, 0), 0);
            if (!totalTiros) {
                alert("Registre al menos un tiro antes de generar el informe técnico.");
                return;
            }
            guardarHistoricoTrabajos();
            window.JEJInformeCarguio.abrir({ tipo: "EMULSION", trabajos: trabajosGuardados });
        }

        // FUNCIÓN DE EXPORTACIÓN A EXCEL PARA EMULSIÓN USANDO EXCELJS
       async function guardarFormularioEmulsionYExportarExcel() {
            let totalParadas = 0;
            trabajosGuardados.forEach(t => totalParadas += t.paradas.length);

            if (totalParadas === 0) {
                alert("Por favor registre al menos un ID de trabajo con su respectiva parada y tiros antes de generar el archivo.");
                return;
            }

            guardarHistoricoTrabajos();

            try {
                // 1. Cargamos la plantilla base de emulsión
                const response = await fetch('../plantillas/plantillaEmulsion.xlsx');
                const arrayBuffer = await response.arrayBuffer();

                const workbook = new ExcelJS.Workbook();
                await workbook.xlsx.load(arrayBuffer);
                const worksheet = workbook.getWorksheet("JEJ") || workbook.worksheets[0];

                function asignarValorCelda(cellRef, valor) {
                    worksheet.getCell(cellRef).value = valor;
                }

                // =========================
                // CABECERAS GENERALES (alineadas a la plantilla oficial: hoja «JEJ»)
                // =========================
                const val = (id) => (document.getElementById(id)?.value || "").trim();
                const horaExcel = (v) => {
                    const m = /^(\d{1,2}):(\d{2})$/.exec(String(v || "").trim());
                    return m ? (parseInt(m[1], 10) * 60 + parseInt(m[2], 10)) / 1440 : (v || "");
                };
                const fechaExcel = (v) => {
                    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(v || "").trim());
                    return m ? new Date(Date.UTC(+m[3], +m[2] - 1, +m[1])) : (v || "");
                };
                const numONada = (v) => { const n = parseFloat(String(v).replace(",", ".")); return isNaN(n) ? (v || "") : n; };

                // Columna D: datos generales (D10 «ID Tronadura» es fórmula de la plantilla: no se toca)
                asignarValorCelda('D5', fechaExcel(val("fechaEmulsion")));
                asignarValorCelda('D6', val("turnoEmulsion"));
                asignarValorCelda('D7', val("modalMina"));
                asignarValorCelda('D8', val("modalNivel"));
                asignarValorCelda('D9', val("modalBloque"));
                asignarValorCelda('D11', val("modalSupJeJ"));
                asignarValorCelda('D12', val("modalEncargado"));

                const supervisoresDet = Array.from(document.querySelectorAll('[name="supervisorDet"]'))
                    .map(i => i.value.trim()).filter(Boolean).join(", ");
                const responsablesDet = Array.from(document.querySelectorAll('[name="responsableDet"]'))
                    .map(i => i.value.trim()).filter(Boolean).join(", ");
                asignarValorCelda('D13', supervisoresDet);
                asignarValorCelda('D14', responsablesDet);

                // Columna H: horarios y parámetros (H11 y H12 son fórmulas de la plantilla)
                asignarValorCelda('H5', horaExcel(val("hLlegadaJeJ")));
                asignarValorCelda('H6', horaExcel(val("hSalidaJeJ")));
                asignarValorCelda('H7', horaExcel(val("hLlegadaPyT")));
                asignarValorCelda('H8', horaExcel(val("hInicioCarguio")));
                asignarValorCelda('H9', horaExcel(val("hFinCarguio")));
                asignarValorCelda('H10', horaExcel(val("hSalidaPyT")));
                asignarValorCelda('H13', numONada(val("diametroTiros")));
                asignarValorCelda('H14', val("tiroVod"));

                // Zanja, fase, calle UCL, paradas y geófono (columnas O / P)
                asignarValorCelda('O5', numONada(val("numZanja")));
                const calles = val("calleZanja").split(/[\/,\s-]+/).filter(Boolean);
                asignarValorCelda('O6', numONada(calles[0] || ""));
                asignarValorCelda('P6', numONada(calles[1] || ""));
                asignarValorCelda('O8', numONada(val("faseZanja")));
                asignarValorCelda('O9', val("calleUcl"));
                const paradasIF = val("paradasInicioFin").split(/\s*(?:a|-|\/)\s*/i).filter(Boolean);
                asignarValorCelda('O10', paradasIF[0] || "");
                asignarValorCelda('O11', paradasIF[1] || "");
                asignarValorCelda('O12', val("ubicacionGeofono"));
                const geo = val("distanciaGeofono").split("/").map(s => s.trim());
                asignarValorCelda('O13', numONada(val("alturaGeofono") || (geo.length > 1 ? geo[0] : "")));
                asignarValorCelda('O14', numONada(val("alturaGeofono") ? val("distanciaGeofono") : (geo.length > 1 ? geo[1] : geo[0] || "")));

                // Matriz de emulsión (R5…R12) si el formulario las trae
                asignarValorCelda('R5', numONada(val("temperaturaMatriz")));
                asignarValorCelda('R11', numONada(val("tiempoGasificacion")));

                // Amarre: inicio (U5), fin (X5); AA5 es fórmula de la plantilla
                asignarValorCelda('U5', horaExcel(val("hInicioAmarre")));
                asignarValorCelda('X5', horaExcel(val("hFinAmarre")));

                // Pérdidas operacionales (texto en T7 / T12, tiempo en AC7 / AC12)
                asignarValorCelda('T7', val("obsPerdidaCarguio"));
                asignarValorCelda('AC7', horaExcel(val("tiempoPerdidaCarguio")));
                asignarValorCelda('T12', val("obsPerdidaAmarre"));
                asignarValorCelda('AC12', horaExcel(val("tiempoPerdidaAmarre")));

                // =========================
                // TABLA DE TIROS DE EMULSIÓN (DESDE LA FILA 17)
                // Sin peras, adaptada con Emulsión Cargada y los nuevos campos
                // =========================
                let rowIndex = 16; // la plantilla oficial parte los tiros en la fila 16
                const VERDE_PARADA = 'FF99FFCC';
                let colorAlternado = false;

                trabajosGuardados.forEach(trabajo => {
                    trabajo.paradas.forEach(parada => {
                        colorAlternado = !colorAlternado; 

                        parada.tiros.forEach(tiro => {
                            const row = worksheet.getRow(rowIndex);

                            // B: PARADA
                            const celdaParada = row.getCell(2);
                            celdaParada.value = parada.idParada;
                            celdaParada.style = Object.assign({}, celdaParada.style);
                            if (colorAlternado) {
                                celdaParada.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: VERDE_PARADA } };
                            } else {
                                celdaParada.fill = { type: 'pattern', pattern: 'none' };
                            }

                            // C: TIRO
                            row.getCell(3).value = parseInt(tiro.tiroNum);
                            // D: LONG. DISEÑO [M]
                            row.getCell(4).value = parseFloat(tiro.longDiseno);
                            // E: TACO DISEÑO [M]
                            row.getCell(5).value = parseFloat(tiro.taco);
                            // F: LARGO MOMENTO CARGAR [M]
                            row.getCell(6).value = parseFloat(tiro.largoMomento);
                            // G: TACO REAL [M]
                            row.getCell(7).value = parseFloat(tiro.tacoReal);
                            // H: TACO EN FONDO EN TIROS LARGOS
                            row.getCell(8).value = parseFloat(tiro.tacoFondoLargo) || 0;
                            // I: NÚM DE GREDAS
                            row.getCell(9).value = parseInt(tiro.numGredas) || 0;
                            // J: TACO EN FONDO REAL
                            row.getCell(10).value = parseFloat(tiro.tacoFondoReal) || 0;
                            // K: NÚM GREDAS REAL
                            row.getCell(11).value = parseInt(tiro.numGredasReal) || 0;
                            // L: METROS CARGADOS [M] → fórmula de la plantilla (=F-G), no se sobreescribe
                            // M: ESTADO TIRO
                            row.getCell(13).value = tiro.estado;
                            // N: TIRO CON AGUA
                            row.getCell(14).value = tiro.agua;
                            // O: TIRO NEGATIVO / POSITIVO
                            row.getCell(15).value = tiro.posNeg;
                            // P: EMULSION CARGADA [kg] (Sustituye a la pera)
                            row.getCell(16).value = parseFloat(tiro.kilosEmulsion) || parseFloat(tiro.emulsionCargada) || 0;
                            // Q: CAMA EXPLOSIVO [M]
                            row.getCell(17).value = tiro.camaExplosivo || "";
                            // R: CEBO SUPERIOR
                            row.getCell(18).value = tiro.ceboSup;
                            // S: ARAÑA EN CEBO SUPERIOR
                            row.getCell(19).value = tiro.aranaSup;
                            // T: CANT. CARTUCHOS
                            row.getCell(20).value = parseInt(tiro.cantCartuchos);
                            // U: CEBO INFERIOR
                            row.getCell(21).value = tiro.ceboInf || "";
                            // V: ARAÑA EN CEBO INFERIOR
                            row.getCell(22).value = tiro.aranaInf;
                            // W: CANT. CARTUCHOS
                            row.getCell(23).value = parseInt(tiro.cantCartuchosInf) || 0;
                            // X: ARAÑA EMULSIÓN
                            row.getCell(24).value = tiro.aranaEmulsion || "No";
                            // Y: USO RETENEDOR
                            row.getCell(25).value = tiro.usoRetenedor || "No";

                            // AO..AU: DETALLE DE LA CARGA DE COLUMNA
                            [tiro.longTerminarCama, tiro.long1erCebo, tiro.longTerminarIntermedia, tiro.long2doCebo, tiro.longCargaInferior, tiro.longRetenedor, tiro.longTacoGreda]
                                .forEach(function (v, k) {
                                    const n = parseFloat(v);
                                    if (!isNaN(n)) row.getCell(41 + k).value = n;
                                });

                            row.commit();
                            rowIndex++;
                        });
                    });
                });

                // Un número NaN (campo vacío) corrompe el .xlsx: se deja la celda vacía
                worksheet.eachRow({ includeEmpty: false }, function (fila) {
                    fila.eachCell({ includeEmpty: false }, function (celda) {
                        if (typeof celda.value === "number" && !isFinite(celda.value)) celda.value = null;
                    });
                });
                const outBuffer = await workbook.xlsx.writeBuffer();
                const blob = new Blob([outBuffer], {
                    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                });

                const nombreArchivo = `Seguimiento_Emulsion_Turno_${document.getElementById("turnoEmulsion").value}_${Date.now()}.xlsx`;
                const enlace = document.createElement('a');
                enlace.href = URL.createObjectURL(blob);
                enlace.download = nombreArchivo;
                document.body.appendChild(enlace);
                enlace.click();
                document.body.removeChild(enlace);
                URL.revokeObjectURL(enlace.href);

                alert("¡Archivo Excel de Emulsión generado con éxito manteniendo la nueva estructura!");

            } catch (error) {
                console.error("Error al generar el Excel:", error);
                alert("Hubo un error al procesar la plantilla de emulsión.");
            }
        }
        function cambiarNivelModal() {
    const nivel = document.getElementById("modalNivel").value;
    const secNP = document.getElementById("seccionNP");
    const secUCL = document.getElementById("seccionUCL");
    const secPanel2 = document.getElementById("seccionPanel2");

    // Ocultar todas las secciones condicionales por defecto
    secNP.style.display = "none";
    secUCL.style.display = "none";
    secPanel2.style.display = "none";

    // Mostrar únicamente la que corresponda según la selección
    if (nivel === "NP") {
        secNP.style.display = "block";
    } else if (nivel === "UCL") {
        secUCL.style.display = "block";
    } else if (nivel === "Panel2") {
        secPanel2.style.display = "block";
    }
}

function actualizarIdTronaduraAuto() {
    const nivel = document.getElementById("modalNivel")?.value || "NP";
    const zanjaRaw = document.getElementById("numZanja")?.value.trim() || "";
    const calleZanja = document.getElementById("calleZanja")?.value.trim() || "";
    const calleUcl = document.getElementById("calleUcl")?.value.trim() || "";
    const detallePanel = document.getElementById("detallePanel2")?.value.trim() || "";
    const faseRaw = document.getElementById("faseZanja")?.value.trim() || "";

    // Formatear fase de manera consistente (ej. "Fase 1")
    let faseFormateada = "";
    if (faseRaw) {
        faseFormateada = faseRaw.toLowerCase().startsWith("fase") ? faseRaw : "Fase " + faseRaw;
    }

    let idGenerado = "";

    if (nivel === "NP") {
        // Formato NP: Z + Núm. Zanja + Calle Zanja + Fase (Ej: Z47 C41-43 Fase 1)
        const zanjaFormateada = zanjaRaw ? (zanjaRaw.toUpperCase().startsWith("Z") ? zanjaRaw : "Z" + zanjaRaw) : "";
        idGenerado = [zanjaFormateada, calleZanja, faseFormateada].filter(Boolean).join(" ");
    } else if (nivel === "UCL") {
        // Formato UCL: Calle UCL + palabra 'UCL' + Fase (Ej: C41 UCL Fase 1)
        idGenerado = [calleUcl, "UCL", faseFormateada].filter(Boolean).join(" ");
    } else if (nivel === "Panel2") {
        // Formato Panel 2: Detalle + Fase
        idGenerado = [detallePanel, faseFormateada].filter(Boolean).join(" ");
    }

    // Reflejar el valor en el input de ID de Tronadura
    const inputTronadura = document.getElementById("modalIdTronadura");
    if (inputTronadura) {
        inputTronadura.value = idGenerado;
    }

    ejecutarAutosave();
}
