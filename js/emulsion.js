/* ============================================
 * EMULSIÓN · Lógica de la página
 * Archivo de lógica: js/emulsion.js
 * Secciones de la lógica conservan el flujo de la página.
 * ============================================ */

        cargarBarMenu(true);
        document.body.classList.add("emulsion-step1-mode");
        const menuEmulsion = document.querySelector("#dropdownMenu ul");
        if (menuEmulsion && !document.getElementById("menuIngresoDatosEmulsion")) {
            const item = document.createElement("li");
            const enlace = document.createElement("a");
            enlace.id = "menuIngresoDatosEmulsion";
            enlace.href = "#";
            enlace.textContent = "⚙️ Ingreso / Editar Datos";
            enlace.addEventListener("click", evento => {
                evento.preventDefault();
                document.getElementById("dropdownMenu").classList.remove("show");
                abrirModalPersonal();
            });
            item.appendChild(enlace);
            menuEmulsion.insertBefore(item, menuEmulsion.children[1] || null);
        }
        function agregarAccionesMenuEmulsion() {
            const menu = document.querySelector("#dropdownMenu ul");
            if (!menu) return;
            const cerrar = () => document.getElementById("dropdownMenu")?.classList.remove("show");
            const acciones = [
                ["menuExcelEmulsion", "⬇ Descargar Excel", () => guardarFormularioEmulsionYExportarExcel()],
                ["menuPlanillaEmulsion", "📋 Datos faltantes de planilla", () => window.abrirDatosPlantillaEmulsion("tiempos")],
                ["menuInformeEmulsion", "📄 Ver informe técnico", () => generarInformeTecnicoHTML()]
            ];
            acciones.forEach(([id, texto, ejecutar]) => {
                if (document.getElementById(id)) return;
                const item = document.createElement("li"), enlace = document.createElement("a");
                enlace.id = id; enlace.href = "#"; enlace.textContent = texto;
                enlace.addEventListener("click", evento => { evento.preventDefault(); cerrar(); ejecutar(); });
                item.appendChild(enlace); menu.appendChild(item);
            });
        }
        agregarAccionesMenuEmulsion();
        function sincronizarBotonesTurnoEmulsion() {
            const turno = document.getElementById("turnoEmulsion").value;
            document.querySelectorAll("[data-turno-emulsion]").forEach(boton => {
                const activo = boton.dataset.turnoEmulsion === turno;
                boton.classList.toggle("activo", activo);
                boton.setAttribute("aria-pressed", activo ? "true" : "false");
            });
        }
        document.querySelectorAll("[data-turno-emulsion]").forEach(boton => {
            boton.addEventListener("click", () => {
                const selector = document.getElementById("turnoEmulsion");
                selector.value = boton.dataset.turnoEmulsion;
                selector.dispatchEvent(new Event("change", { bubbles: true }));
            });
        });
        const camposConfiguracionEmulsion = {
            cfgEmulsionMina: "modalMina", cfgEmulsionNivel: "modalNivel", cfgEmulsionBloque: "modalBloque",
            cfgEmulsionNumZanja: "numZanja", cfgEmulsionCalleZanja: "calleZanja", cfgEmulsionCalleUcl: "calleUcl",
            cfgEmulsionParadas: "paradasInicioFin", cfgEmulsionPanel2: "detallePanel2", cfgEmulsionFase: "faseZanja"
        };

        function sincronizarBotonesConfiguracionEmulsion() {
            document.querySelectorAll("[data-emulsion-select]").forEach(boton => {
                const control = document.getElementById(boton.dataset.emulsionSelect);
                const activo = Boolean(control && control.value === boton.dataset.value);
                boton.classList.toggle("selected", activo);
                boton.setAttribute("aria-pressed", activo ? "true" : "false");
            });
        }

        function mostrarSeccionNivelEmulsion() {
            const nivel = document.getElementById("cfgEmulsionNivel").value;
            document.querySelectorAll("[data-emulsion-level-fields]").forEach(seccion => {
                seccion.hidden = seccion.dataset.emulsionLevelFields !== nivel;
            });
        }

        function sincronizarCampoConfiguracionEmulsion(idVista) {
            const idOrigen = camposConfiguracionEmulsion[idVista];
            const vista = document.getElementById(idVista);
            const origen = document.getElementById(idOrigen);
            if (!vista || !origen) return;
            origen.value = vista.value;
            origen.dispatchEvent(new Event("input", { bubbles: true }));
            origen.dispatchEvent(new Event("change", { bubbles: true }));
            if (idVista === "cfgEmulsionNivel") {
                cambiarNivelModal();
                mostrarSeccionNivelEmulsion();
            }
            actualizarIdTronaduraAuto();
            const idGenerado = document.getElementById("modalIdTronadura").value;
            document.getElementById("cfgEmulsionIdTronadura").value = idGenerado;
            sincronizarBotonesConfiguracionEmulsion();
        }

        document.querySelectorAll("[data-emulsion-select]").forEach(boton => {
            boton.addEventListener("click", () => {
                const control = document.getElementById(boton.dataset.emulsionSelect);
                if (!control) return;
                control.value = boton.dataset.value;
                sincronizarCampoConfiguracionEmulsion(control.id);
            });
        });
        Object.keys(camposConfiguracionEmulsion).forEach(id => {
            const control = document.getElementById(id);
            control.addEventListener(control.tagName === "SELECT" ? "change" : "input", () => sincronizarCampoConfiguracionEmulsion(id));
        });
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
                sincronizarBotonesTurnoEmulsion();
                limpiarAsignacionPersonalTemporal();
                actualizarListasPorTurno();
                actualizarResumenUnificado();
                ejecutarAutosave();
            });

            const listaTrabajosEmulsion = document.getElementById("listaTrabajosEmulsion");
            if (listaTrabajosEmulsion) {
                listaTrabajosEmulsion.addEventListener("click", evento => {
                    const botonEliminar = evento.target.closest("[data-eliminar-trabajo-emulsion]");
                    if (botonEliminar) {
                        const select = document.getElementById("selectIdExistente");
                        select.value = botonEliminar.dataset.eliminarTrabajoEmulsion;
                        eliminarIdSeleccionado();
                        return;
                    }
                    const tarjeta = evento.target.closest("[data-seleccionar-trabajo-emulsion]");
                    if (tarjeta) seleccionarTrabajoDesdeTarjetaEmulsion(tarjeta.dataset.seleccionarTrabajoEmulsion);
                });
            }

            const listaParadasEmulsion = document.getElementById("listaParadasEmulsion");
            if (listaParadasEmulsion) {
                listaParadasEmulsion.addEventListener("click", evento => {
                    const tarjeta = evento.target.closest("[data-seleccionar-parada-emulsion]");
                    if (tarjeta) seleccionarParadaDesdeTarjetaEmulsion(tarjeta.dataset.seleccionarParadaEmulsion);
                });
            }

            cargarBorradorAutosave();
            sincronizarBotonesTurnoEmulsion();
            actualizarListasPorTurno();
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
            ["paso7", "paso8", "paso9"].forEach(id => { const paso = document.getElementById(id); if (paso) paso.style.display = "none"; });
        }

        function irAPaso1() {
            ocultarTodosPasos();
            document.getElementById("paso1").style.display = "block";
            document.body.classList.remove("emulsion-work-mode", "emulsion-stop-mode");
            document.body.classList.add("emulsion-step1-mode");
        }

        function irAPaso2() {
            const turno = document.getElementById("turnoEmulsion").value;
            if (!turno) {
                alert("Por favor seleccione un Turno antes de continuar.");
                return;
            }
            abrirConfiguracionEmulsion();
        }

        function irAGestionTrabajoEmulsion() {
            ocultarTodosPasos();
            document.getElementById("paso2").style.display = "block";
            document.body.classList.remove("emulsion-step1-mode", "emulsion-stop-mode");
            document.body.classList.add("emulsion-work-mode");
            actualizarSelectIdsTrabajo();
            actualizarContextoTrabajoEmulsion();
        }

        function abrirConfiguracionEmulsion() {
            Object.entries(camposConfiguracionEmulsion).forEach(([idVista, idOrigen]) => {
                const vista = document.getElementById(idVista);
                const origen = document.getElementById(idOrigen);
                if (vista && origen) vista.value = origen.value;
            });
            cambiarNivelModal();
            mostrarSeccionNivelEmulsion();
            actualizarIdTronaduraAuto();
            document.getElementById("cfgEmulsionIdTronadura").value = document.getElementById("modalIdTronadura").value;
            sincronizarBotonesConfiguracionEmulsion();
            document.getElementById("modalConfiguracionEmulsion").style.display = "flex";
        }

        function cerrarConfiguracionEmulsion() {
            document.getElementById("modalConfiguracionEmulsion").style.display = "none";
        }

        function guardarConfiguracionEmulsion() {
            Object.keys(camposConfiguracionEmulsion).forEach(sincronizarCampoConfiguracionEmulsion);
            ejecutarAutosave();
            cerrarConfiguracionEmulsion();
            irAGestionTrabajoEmulsion();
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
            mostrarGestionParadasEmulsion();
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
            mostrarGestionParadasEmulsion();
            ocultarTodosPasos();
            document.getElementById("paso3").style.display = "block";
        }

        window.usarTrabajoSeleccionadoEmulsion = function () {
            const select = document.getElementById("selectIdExistente");
            const tarjetaActiva = document.querySelector("#listaTrabajosEmulsion [data-seleccionar-trabajo-emulsion][aria-pressed='true']");
            const idTrabajoSeleccionado = tarjetaActiva?.dataset.seleccionarTrabajoEmulsion || select?.value || "";
            if (!idTrabajoSeleccionado) {
                alert("Seleccione un trabajo de la lista para continuar.");
                return;
            }
            const trabajo = trabajosGuardados.find(item => String(item.idTrabajo) === String(idTrabajoSeleccionado));
            if (!trabajo) {
                alert("No se encontró el trabajo seleccionado. Actualice la lista e inténtelo otra vez.");
                actualizarSelectIdsTrabajo();
                return;
            }

            if (select) select.value = idTrabajoSeleccionado;
            idTrabajoActual = String(trabajo.idTrabajo);
            cargarSelectParadas();
            mostrarGestionParadasEmulsion();
            ocultarTodosPasos();
            document.getElementById("paso3").style.display = "block";
        };

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
            document.body.classList.remove("emulsion-stop-mode");
            document.body.classList.add("emulsion-work-mode");
            actualizarSelectIdsTrabajo();
            actualizarContextoTrabajoEmulsion();
        }

        function volverAPaso3() {
            mostrarGestionParadasEmulsion();
            ocultarTodosPasos();
            document.getElementById("paso3").style.display = "block";
            cargarSelectParadas();
        }

        function mostrarGestionParadasEmulsion() {
            document.body.classList.remove("emulsion-work-mode");
            document.body.classList.add("emulsion-stop-mode");
            const etiqueta = document.getElementById("etiquetaTrabajoParadasEmulsion");
            if (etiqueta) etiqueta.textContent = idTrabajoActual || "TRABAJO";
        }

        function cargarSelectParadas() {
            const select = document.getElementById("selectParadaExistente");
            if (!select) return;
            const seleccionAnterior = select.value;
            select.replaceChildren(new Option("-- Seleccione una parada guardada --", "", true, true));
            select.options[0].disabled = true;
            
            let trabajo = trabajosGuardados.find(t => String(t.idTrabajo) === String(idTrabajoActual));
            if (!trabajo) {
                trabajo = { idTrabajo: idTrabajoActual, paradas: [] };
                trabajosGuardados.push(trabajo);
            }

            const paradas = Array.isArray(trabajo.paradas) ? trabajo.paradas : [];
            paradas.forEach(parada => {
                const tiros = Array.isArray(parada.tiros) ? parada.tiros : [];
                const total = Math.max(tiros.length, Number(parada.cantidadTiros || parada.totalTiros) || 0);
                select.add(new Option(`${parada.idParada} (${total} tiros)`, parada.idParada));
            });
            select.value = paradas.some(parada => parada.idParada === seleccionAnterior) ? seleccionAnterior : "";
            renderizarTarjetasParadasEmulsion();
        }

        function renderizarTarjetasParadasEmulsion() {
            const lista = document.getElementById("listaParadasEmulsion");
            if (!lista) return;
            const select = document.getElementById("selectParadaExistente");
            const seleccionado = select?.value || "";
            const trabajo = trabajosGuardados.find(item => item.idTrabajo === idTrabajoActual);
            const paradas = Array.isArray(trabajo?.paradas) ? trabajo.paradas : [];
            const contador = document.getElementById("conteoParadasEmulsion");
            if (contador) contador.textContent = String(paradas.length);

            if (!paradas.length) {
                lista.innerHTML = '<p class="anfo-sin-trabajos">Aún no hay paradas registradas en este trabajo.</p>';
                return;
            }

            lista.innerHTML = paradas.map(parada => {
                const id = String(parada.idParada ?? "");
                const idSeguro = escaparHtmlEmulsion(id);
                const tiros = Array.isArray(parada.tiros) ? parada.tiros : [];
                const capturados = tiros.filter(Boolean).length;
                const total = Math.max(capturados, Number(parada.cantidadTiros || parada.totalTiros) || 0);
                const completa = total > 0 && capturados >= total;
                const detalle = total === 0
                    ? "0 tiros · pendiente"
                    : completa
                        ? `${total} ${total === 1 ? "tiro" : "tiros"} · completa`
                        : `${capturados} de ${total} capturados`;
                const estado = total === 0
                    ? '<span class="anfo-parada-estado en-curso">● Pendiente</span>'
                    : completa
                        ? '<span class="anfo-parada-estado">● OK</span>'
                        : '<span class="anfo-parada-estado en-curso">● En curso</span>';
                return `<button type="button" class="anfo-parada-fila" data-seleccionar-parada-emulsion="${idSeguro}" aria-pressed="${id === seleccionado}">
                    <span class="anfo-parada-badge">${idSeguro}</span>
                    <span class="anfo-parada-detalle"><strong>Parada ${idSeguro}</strong><small>${detalle}</small></span>
                    ${estado}
                </button>`;
            }).join("");
        }

        function seleccionarParadaDesdeTarjetaEmulsion(idParada) {
            const select = document.getElementById("selectParadaExistente");
            if (!select) return;
            select.value = idParada;
            renderizarTarjetasParadasEmulsion();
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
                const paradas = Array.isArray(trabajo.paradas) ? trabajo.paradas : [];
                const paradaExistente = paradas.find(p => p.idParada === idParadaActual);
                if (paradaExistente) {
                    const tiros = Array.isArray(paradaExistente.tiros) ? paradaExistente.tiros : [];
                    const cantidad = Number(paradaExistente.cantidadTiros || paradaExistente.totalTiros) || tiros.length || 3;
                    document.getElementById("cantTirosInput").value = Math.min(50, Math.max(1, cantidad));
                } else {
                    document.getElementById("cantTirosInput").value = 3;
                }
            }

            document.getElementById("subtituloPaso4").innerText = `Trabajo: ${idTrabajoActual} | Parada: ${idParadaActual}`;
            document.body.classList.remove("emulsion-stop-mode");
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
                const paradas = Array.isArray(trabajo.paradas) ? trabajo.paradas : [];
                const paradaExistente = paradas.find(p => p.idParada === idParadaActual);
                if (paradaExistente) {
                    const tiros = Array.isArray(paradaExistente.tiros) ? paradaExistente.tiros : [];
                    const cantidad = Number(paradaExistente.cantidadTiros || paradaExistente.totalTiros) || tiros.length || 1;
                    document.getElementById("cantTirosInput").value = Math.min(50, Math.max(1, cantidad));
                }
            }

            document.getElementById("subtituloPaso4").innerText = `Trabajo: ${idTrabajoActual} | Parada: ${idParadaActual}`;
            document.body.classList.remove("emulsion-stop-mode");
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
            mostrarResumenFinalEmulsion();
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
            const seleccionadoAnterior = select.value;
            select.replaceChildren(new Option("-- Seleccione un trabajo guardado --", "", true, true));
            select.options[0].disabled = true;
            (Array.isArray(trabajosGuardados) ? trabajosGuardados : []).forEach(trabajo => {
                const paradas = Array.isArray(trabajo.paradas) ? trabajo.paradas : [];
                const tiros = paradas.reduce((total, parada) => total + (Array.isArray(parada.tiros) ? parada.tiros.length : 0), 0);
                select.add(new Option(`${trabajo.idTrabajo} (${paradas.length} paradas · ${tiros} tiros)`, trabajo.idTrabajo));
            });
            select.value = (trabajosGuardados || []).some(trabajo => trabajo.idTrabajo === seleccionadoAnterior) ? seleccionadoAnterior : "";
            renderizarTarjetasTrabajosEmulsion();
            actualizarSugerenciaTrabajoEmulsion();
        }

        function escaparHtmlEmulsion(valor) {
            return String(valor ?? "").replace(/[&<>"']/g, caracter => ({
                "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"
            }[caracter]));
        }

        function renderizarTarjetasTrabajosEmulsion() {
            const lista = document.getElementById("listaTrabajosEmulsion");
            if (!lista) return;
            const select = document.getElementById("selectIdExistente");
            const seleccionado = select ? select.value : "";
            const trabajos = Array.isArray(trabajosGuardados) ? trabajosGuardados : [];
            const contador = document.getElementById("conteoTrabajosEmulsion");
            if (contador) contador.textContent = String(trabajos.length);
            if (!trabajos.length) {
                lista.innerHTML = '<p class="anfo-sin-trabajos">Aún no hay trabajos guardados.</p>';
                return;
            }
            lista.innerHTML = trabajos.map(trabajo => {
                const id = String(trabajo.idTrabajo ?? "");
                const idSeguro = escaparHtmlEmulsion(id);
                const paradas = Array.isArray(trabajo.paradas) ? trabajo.paradas : [];
                const tiros = paradas.reduce((total, parada) => total + (Array.isArray(parada.tiros) ? parada.tiros.length : 0), 0);
                const completa = paradas.length > 0 && paradas.every(parada => Array.isArray(parada.tiros) && parada.tiros.length > 0);
                const etiquetaParadas = `${paradas.length} ${paradas.length === 1 ? "parada" : "paradas"}`;
                return `<div class="anfo-trabajo-fila">
                    <button type="button" class="anfo-trabajo-seleccion" data-seleccionar-trabajo-emulsion="${idSeguro}" aria-pressed="${id === seleccionado}">
                        <span class="anfo-trabajo-radio" aria-hidden="true"></span>
                        <span class="anfo-trabajo-detalle"><strong>${idSeguro}</strong><small>${etiquetaParadas} · ${tiros} ${tiros === 1 ? "tiro" : "tiros"}</small></span>
                        <span class="anfo-trabajo-estado${completa ? "" : " sin-tiros"}">${completa ? "Completo" : "En curso"}</span>
                    </button>
                    <button type="button" class="anfo-btn-eliminar-trabajo" data-eliminar-trabajo-emulsion="${idSeguro}" aria-label="Eliminar el trabajo ${idSeguro}" title="Eliminar">🗑</button>
                </div>`;
            }).join("");
        }

        function seleccionarTrabajoDesdeTarjetaEmulsion(idTrabajo) {
            const select = document.getElementById("selectIdExistente");
            if (!select) return;
            select.value = idTrabajo;
            renderizarTarjetasTrabajosEmulsion();
            window.usarTrabajoSeleccionadoEmulsion();
        }

        function actualizarSugerenciaTrabajoEmulsion() {
            const etiqueta = document.getElementById("sugerenciaTrabajoEmulsion");
            if (!etiqueta) return;
            const numeros = (trabajosGuardados || []).map(trabajo => {
                const coincidencia = String(trabajo.idTrabajo || "").match(/^TRABAJO-(\d+)$/i);
                return coincidencia ? Number(coincidencia[1]) : 0;
            });
            etiqueta.textContent = `TRABAJO-${String(Math.max(0, ...numeros) + 1).padStart(2, "0")}`;
        }

        function actualizarContextoTrabajoEmulsion() {
            const turno = document.getElementById("turnoEmulsion")?.value || "A";
            const fecha = document.getElementById("fechaEmulsion")?.value || "";
            const idTronadura = document.getElementById("modalIdTronadura")?.value.trim() || "Sin asignar";
            const resumenTurno = document.getElementById("resumenTurnoTrabajoEmulsion");
            const resumenId = document.getElementById("resumenIdTronaduraTrabajoEmulsion");
            if (resumenTurno) resumenTurno.textContent = `${turno} · ${fecha}`;
            if (resumenId) resumenId.textContent = idTronadura;
        }

        function ejecutarAutosave() {
            guardarHistoricoTrabajos();
            const borrador = {
                trabajos: trabajosGuardados,
                turno: document.getElementById("turnoEmulsion").value,
                personalFecha: document.getElementById("fechaEmulsion")?.value || "",
                personalTurno: document.getElementById("turnoEmulsion")?.value || "A",
                supJeJ: document.getElementById("modalSupJeJ")?.value || "",
                supervisorDet: Array.from(document.querySelectorAll('#modalPersonal input[name="supervisorDet"]')).map(input => input.value.trim()).filter(Boolean),
                responsableDet: Array.from(document.querySelectorAll('#modalPersonal input[name="responsableDet"]')).map(input => input.value.trim()).filter(Boolean),
                mina: document.getElementById("modalMina").value,
                nivel: document.getElementById("modalNivel").value,
                bloque: document.getElementById("modalBloque").value,
                numZanja: document.getElementById("numZanja").value,
                calleZanja: document.getElementById("calleZanja").value,
                calleUcl: document.getElementById("calleUcl").value,
                paradasInicioFin: document.getElementById("paradasInicioFin").value,
                detallePanel2: document.getElementById("detallePanel2").value,
                faseZanja: document.getElementById("faseZanja").value
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
                if (b.turno === "A" || b.turno === "B") document.getElementById("turnoEmulsion").value = b.turno;
                const mismaAsignacionDiaria = b.personalFecha === (document.getElementById("fechaEmulsion")?.value || "") &&
                    b.personalTurno === (document.getElementById("turnoEmulsion")?.value || "A");
                ["mina", "nivel", "bloque", "numZanja", "calleZanja", "calleUcl", "paradasInicioFin", "detallePanel2", "faseZanja"].forEach(campo => {
                    const control = document.getElementById(({ mina: "modalMina", nivel: "modalNivel", bloque: "modalBloque", numZanja: "numZanja", calleZanja: "calleZanja", calleUcl: "calleUcl", paradasInicioFin: "paradasInicioFin", detallePanel2: "detallePanel2", faseZanja: "faseZanja" })[campo]);
                    if (control && b[campo] !== undefined) control.value = b[campo];
                });
                if (b.trabajos && Array.isArray(b.trabajos)) {
                    trabajosGuardados = b.trabajos;
                }
                cambiarNivelModal();
                actualizarIdTronaduraAuto();
                limpiarAsignacionPersonalTemporal();
                actualizarListasPorTurno();
                if (mismaAsignacionDiaria) {
                    if (b.supJeJ !== undefined) document.getElementById("modalSupJeJ").value = b.supJeJ;
                    restaurarGrupoPersonal("supervisorDet", "contenedorSupDetModal", b.supervisorDet);
                    restaurarGrupoPersonal("responsableDet", "contenedorRespDetModal", b.responsableDet);
                    actualizarResumenUnificado();
                }
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

        function agregarCampoModal(contenedorId, nameInput, actualizar = true) {
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
            if (actualizar) actualizarListasPorTurno();
        }

        function actualizarResumenUnificado() {
            const encargado = localStorage.getItem("jej_usuario_activo") || "Sin asignar";
            const supJeJ = document.getElementById("modalSupJeJ").value.trim() || "Sin asignar";
            const supsDet = Array.from(document.querySelectorAll('#modalPersonal input[name="supervisorDet"]'))
                                .map(i => i.value.trim()).filter(Boolean).join(", ") || "Sin asignar";
            const respsDet = Array.from(document.querySelectorAll('#modalPersonal input[name="responsableDet"]'))
                                .map(i => i.value.trim()).filter(Boolean).join(", ") || "Sin asignar";
            const personas = [
                { rol: "Encargado JeJ", nombre: encargado },
                { rol: "Supervisor JeJ", nombre: supJeJ },
                { rol: "Supervisor(es) DET", nombre: supsDet, det: true },
                { rol: "Responsable(s) DET", nombre: respsDet, det: true }
            ];
            const resumen = document.getElementById("resumenUnificado");
            resumen.replaceChildren();
            personas.forEach(persona => {
                const fila = document.createElement("div");
                fila.className = "anfo-persona";
                const avatar = document.createElement("span");
                avatar.className = "anfo-avatar" + (persona.det ? " det" : "");
                avatar.textContent = persona.nombre.split(/\s+/).filter(Boolean).slice(0, 2).map(parte => Array.from(parte)[0]).join("").toUpperCase() || "—";
                const texto = document.createElement("span");
                const rol = document.createElement("small");
                rol.textContent = persona.rol;
                const nombre = document.createElement("strong");
                nombre.textContent = persona.nombre;
                texto.append(rol, nombre);
                fila.append(avatar, texto);
                resumen.appendChild(fila);
            });
            const completo = personas.every(persona => persona.nombre !== "Sin asignar");
            const estado = document.getElementById("estadoPersonalEmulsion");
            estado.textContent = completo ? "✓ Completo" : "Pendiente";
            estado.classList.toggle("incompleto", !completo);
        }

        function limpiarAsignacionPersonalTemporal() {
            const supJeJ = document.getElementById("modalSupJeJ");
            if (supJeJ) supJeJ.value = "";
            ["contenedorSupDetModal", "contenedorRespDetModal"].forEach(id => {
                const contenedor = document.getElementById(id);
                if (!contenedor) return;
                while (contenedor.children.length > 1) contenedor.lastElementChild.remove();
                contenedor.querySelectorAll("input").forEach(input => { input.value = ""; });
            });
        }

        function restaurarGrupoPersonal(name, containerId, valores) {
            if (!Array.isArray(valores)) return;
            const contenedor = document.getElementById(containerId);
            if (!contenedor) return;
            while (contenedor.children.length > 1) contenedor.lastElementChild.remove();
            valores.forEach((valor, index) => { if (index > 0) agregarCampoModal(containerId, name, false); });
            const inputs = Array.from(document.querySelectorAll(`#modalPersonal input[name="${name}"]`));
            valores.forEach((valor, index) => { if (inputs[index]) inputs[index].value = valor; });
        }

        function actualizarListasPorTurno() {
            const turnoSeleccionado = document.getElementById("turnoEmulsion").value;
            let personalMap = {};
            try { personalMap = JSON.parse(localStorage.getItem("jej_personal_map") || "{}"); } catch (error) { console.error("No se pudo leer el personal guardado", error); }

            function nombresDelRol(rolKey, turno) {
                if (window.JEJUsuarios && typeof window.JEJUsuarios.nombres === "function") return window.JEJUsuarios.nombres(rolKey, turno);
                const registros = Array.isArray(personalMap[rolKey]) ? personalMap[rolKey] : [];
                return Array.from(new Set(registros.map(item => typeof item === "object" ? item : { nombre: item, turno: "Ambos" })
                    .filter(item => item && item.nombre && (!turno || !item.turno || item.turno === "Ambos" || item.turno === turno))
                    .map(item => String(item.nombre).trim()).filter(Boolean)));
            }

            function asegurarCampos(rolKey, selectorNombre, contenedorId) {
                const requeridos = nombresDelRol(rolKey, turnoSeleccionado).length;
                let campos = document.getElementsByName(selectorNombre).length;
                while (campos < requeridos) {
                    agregarCampoModal(contenedorId, selectorNombre, false);
                    campos++;
                }
            }
            asegurarCampos("supervisorDet", "supervisorDet", "contenedorSupDetModal");
            asegurarCampos("responsableDet", "responsableDet", "contenedorRespDetModal");

            function poblarGrupo(rolKey, selectorNombre, baseListId) {
                const inputs = document.querySelectorAll(`input[name="${selectorNombre}"]`);
                const todosLosNombres = nombresDelRol(rolKey, "");
                const nombresTurno = nombresDelRol(rolKey, turnoSeleccionado);
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

                    datalist.replaceChildren();
                    nombresTurno.forEach(nombre => {
                        const opcion = document.createElement("option");
                        opcion.value = nombre;
                        datalist.appendChild(opcion);
                    });
                    const valorActual = input.value.trim();
                    const valorGestionado = todosLosNombres.some(nombre => nombre.toLocaleLowerCase() === valorActual.toLocaleLowerCase());
                    const valorDisponible = nombresTurno.some(nombre => nombre.toLocaleLowerCase() === valorActual.toLocaleLowerCase());
                    if (!valorActual || (valorGestionado && !valorDisponible)) {
                        input.value = nombresTurno[index] || (index === 0 ? nombresTurno[0] || "" : "");
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
                const paradas = Array.isArray(trabajo.paradas) ? trabajo.paradas : [];
                const paradaExistente = paradas.find(p => p.idParada === idParadaActual);
                if (paradaExistente) {
                    tirosTemporales = Array.isArray(paradaExistente.tiros) ? [...paradaExistente.tiros] : [];
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
                appearance: "perforacion",
                cancelText: "Cancelar tiro",
                context: `Trabajo ${idTrabajoActual} · Parada ${idParadaActual} · Tiro ${numeroTiro} de ${totalTirosParadaActual}`,
                finishText: numeroTiro === totalTirosParadaActual ? "Finalizar parada ✓" : "Siguiente tiro →",
                onNext: siguienteTiroEmulsion,
                onPrevious: anteriorTiroEmulsion,
                onCancel: function () {
                    tirosTemporales = [];
                    mostrarGestionParadasEmulsion();
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
            const trabajo = trabajosGuardados.find(t => t.idTrabajo === idTrabajoActual);
            if (!trabajo) return;
            if (!Array.isArray(trabajo.paradas)) trabajo.paradas = [];
            let parada = trabajo.paradas.find(p => p.idParada === idParadaActual);
            if (!parada) { parada = { idParada: idParadaActual }; trabajo.paradas.push(parada); }
            parada.tiros = [...tirosTemporales];
            parada.cantidadTiros = totalTirosParadaActual;
            guardarHistoricoTrabajos();
            ejecutarAutosave();
            window.mostrarResumenTirosParadaEmulsion();
        }

        window.mostrarResumenTirosParadaEmulsion = function () {
            const trabajo = trabajosGuardados.find(t => t.idTrabajo === idTrabajoActual);
            const parada = trabajo?.paradas?.find(p => p.idParada === idParadaActual);
            if (!parada) return;
            const tiros = Array.isArray(parada.tiros) ? parada.tiros : [];
            const total = Math.min(50, Math.max(1, Number(parada.cantidadTiros || parada.totalTiros) || tiros.length || 1));
            totalTirosParadaActual = total;
            const capturados = tiros.filter(Boolean).length;
            const sanos = tiros.filter(t => t?.estado === "Sano").length;
            const tapados = tiros.filter(t => t?.estado === "Tapado").length;
            const pendiente = Array.from({ length: total }, (_, i) => i + 1).find(n => !tiros[n - 1]);
            const root = document.getElementById("paso7");
            const escapeHtmlEmulsion = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
            root.innerHTML = `<div class="anfo-resumen-progreso">${Array.from({length:8},(_,i)=>`<i class="${i<6?'done':i===6?'current':''}"></i>`).join("")}</div>
                <header class="anfo-resumen-head"><div><p>PARADA ${escapeHtmlEmulsion(idParadaActual)} · ${escapeHtmlEmulsion(idTrabajoActual)}</p><h2>Tiros de la Parada</h2></div><span class="anfo-resumen-guardado">✓ Guardado</span></header>
                <section class="anfo-resumen-stats"><div class="anfo-resumen-stat"><strong>${capturados}<span>/${total}</span></strong><small>Capturados</small></div><div class="anfo-resumen-stat sanos"><strong>${sanos}</strong><small>Sanos</small></div><div class="anfo-resumen-stat tapados"><strong>${tapados}</strong><small>Tapados</small></div></section>
                <div class="anfo-tiros-grid">${Array.from({length:total},(_,i)=>{const n=i+1,t=tiros[i];return t?`<button type="button" class="anfo-tiro-resumen-card ${n===indiceTiroActual?'actual':''} ${t.estado==='Tapado'?'tapado':''}" data-emulsion-tiro="${n}"><span class="anfo-mini-diagrama"></span><span class="anfo-tiro-resumen-info"><span class="anfo-tiro-resumen-top"><strong>${n}</strong><small>${Number(t.largoMomento||t.longDiseno||0).toFixed(1)} m</small></span><span class="anfo-tiro-tags"><span class="${t.estado==='Tapado'?'tapado':''}">${escapeHtmlEmulsion(t.estado||'Sano')}</span><span class="${t.agua==='Agua'?'agua':''}">${escapeHtmlEmulsion(t.agua||'Seco')}</span></span></span></button>`:`<button type="button" class="anfo-tiro-resumen-card pendiente" data-emulsion-tiro="${n}"><span class="anfo-mini-diagrama"></span><span class="anfo-tiro-resumen-info"><span class="anfo-tiro-resumen-top"><strong>${n}</strong><small>Pendiente</small></span></span></button>`}).join("")}</div>
                <div class="anfo-tiro-leyenda"><span><i></i>Taco</span><span><i class="carga"></i>Emulsión</span><span><i class="edicion"></i>Tiro en edición</span></div>
                <p class="anfo-resumen-aviso">ⓘ Toque un tiro para corregirlo o complete los pendientes.</p>
                <footer class="anfo-resumen-actions"><button type="button" class="anfo-resumen-volver" id="volverResumenTirosEmulsion">‹ Paradas</button><button type="button" class="anfo-resumen-capturar" id="continuarResumenTirosEmulsion">${pendiente ? `Capturar tiro ${pendiente} ›` : 'Tiempos ›'}</button></footer>`;
            document.body.classList.add("anfo-resumen-tiros-mode", "emulsion-resumen-tiros-mode");
            ocultarTodosPasos(); root.style.display = "flex";
            root.querySelectorAll("[data-emulsion-tiro]").forEach(b => b.onclick = () => abrirTiroEmulsion(Number(b.dataset.emulsionTiro)));
            document.getElementById("volverResumenTirosEmulsion").onclick = () => { document.body.classList.remove("anfo-resumen-tiros-mode", "emulsion-resumen-tiros-mode"); mostrarGestionParadasEmulsion(); ocultarTodosPasos(); document.getElementById("paso3").style.display="block"; cargarSelectParadas(); };
            document.getElementById("continuarResumenTirosEmulsion").onclick = () => pendiente ? abrirTiroEmulsion(pendiente) : window.abrirDatosPlantillaEmulsion("tiempos");
        };

        function abrirTiroEmulsion(numero) {
            const trabajo = trabajosGuardados.find(t => t.idTrabajo === idTrabajoActual);
            const parada = trabajo?.paradas?.find(p => p.idParada === idParadaActual);
            totalTirosParadaActual = Number(parada?.cantidadTiros || parada?.totalTiros) || 1;
            tirosTemporales = Array.isArray(parada?.tiros) ? [...parada.tiros] : [];
            indiceTiroActual = numero;
            ocultarTodosPasos(); document.getElementById("paso5").style.display="block";
            cargarFormularioTiroWizard(numero);
        }

        window.abrirDatosPlantillaEmulsion = function (pestana = "tiempos") {
            document.body.classList.remove("anfo-resumen-tiros-mode", "emulsion-resumen-tiros-mode");
            document.body.classList.add("emulsion-plantilla-mode");
            ocultarTodosPasos();
            const page = document.getElementById("paso8");
            page.style.display = "flex";
            document.getElementById("emulsionPosturaParada").textContent = idParadaActual || "—";
            const tabs = ["tiempos", "equipos", "perdidas"];
            const titulos = ["Tiempos de la postura", "Equipos y geófono", "Pérdidas y observaciones"];
            const mostrar = nombre => {
                const index = tabs.indexOf(nombre);
                page.querySelectorAll("[data-emulsion-postura-tab]").forEach(b => {
                    const active = b.dataset.emulsionPosturaTab === nombre;
                    b.classList.toggle("active", active); b.setAttribute("aria-selected", String(active));
                });
                page.querySelectorAll("[data-emulsion-postura-panel]").forEach(panel => panel.hidden = panel.dataset.emulsionPosturaPanel !== nombre);
                page.dataset.tab = nombre;
                document.getElementById("emulsionPosturaTitulo").textContent = titulos[index];
                document.getElementById("emulsionPosturaContador").textContent = `${index + 1}/3`;
                document.getElementById("emulsionPosturaAtras").textContent = index ? `‹ ${["Tiempos", "Equipos"][index - 1]}` : "‹ Resumen tiros";
                document.getElementById("emulsionPosturaSiguiente").textContent = index < 2 ? `${["Equipos", "Pérdidas"][index]} ›` : "Ir al resumen ✓";
            };
            page.querySelectorAll("[data-emulsion-source]").forEach(input => {
                const original = document.getElementById(input.dataset.emulsionSource);
                if (!original) return;
                input.value = original.value || "";
                input.oninput = () => { original.value = input.value; ejecutarAutosave(); };
            });
            page.querySelectorAll("[data-emulsion-choice]").forEach(button => {
                const original = document.getElementById(button.dataset.emulsionChoice);
                button.classList.toggle("selected", original?.value === button.dataset.value);
                button.onclick = () => {
                    if (!original) return;
                    original.value = button.dataset.value;
                    page.querySelectorAll(`[data-emulsion-choice="${button.dataset.emulsionChoice}"]`).forEach(item => item.classList.toggle("selected", item.dataset.value === original.value));
                    ejecutarAutosave();
                };
            });
            page.querySelectorAll("[data-emulsion-step]").forEach(button => button.onclick = () => {
                const input = page.querySelector(`[data-emulsion-source="${button.dataset.emulsionStep}"]`);
                if (!input) return;
                input.value = (Math.max(0, Number(input.value || input.placeholder || 0) + Number(button.dataset.delta))).toFixed(1);
                input.dispatchEvent(new Event("input", { bubbles: true }));
            });
            page.querySelectorAll("[data-emulsion-min-value]").forEach(input => {
                const original = document.getElementById(input.dataset.emulsionMinValue);
                input.value = (original?.value.match(/\d+(?:\.\d+)?/) || ["0"])[0];
                input.oninput = () => { if (original) original.value = `${Math.max(0, Number(input.value) || 0)} min`; ejecutarAutosave(); };
            });
            const actualizarTotalPerdidasEmulsion = () => {
                const mins = ["tiempoPerdidaCarguio", "tiempoPerdidaAmarre"].reduce((sum, id) => {
                    const value = document.getElementById(id)?.value || "";
                    return sum + (Number((value.match(/\d+(?:\.\d+)?/) || ["0"])[0]) || 0);
                }, 0);
                const resumen = document.getElementById("emulsionPerdidaTotal");
                if (resumen) resumen.textContent = `⚠ Pérdida total ${mins} min. Se descontará del tiempo efectivo.`;
            };
            const configurarPerdidaEmulsion = (tipo, registrar, limpiar = false) => {
                const card = page.querySelector(`[data-emulsion-perdida="${tipo}"]`);
                if (!card) return;
                const sufijo = tipo === "carguio" ? "Carguio" : "Amarre";
                const motivo = document.getElementById(`obsPerdida${sufijo}`);
                const tiempo = document.getElementById(`tiempoPerdida${sufijo}`);
                const detalle = card.querySelector(`[data-emulsion-perdida-detalle="${tipo}"]`);
                const btnClear = card.querySelector(`[data-emulsion-perdida-clear="${tipo}"]`);
                const btnRegister = card.querySelector(`[data-emulsion-perdida-register="${tipo}"]`);
                if (limpiar) { if (motivo) motivo.value = ""; if (tiempo) tiempo.value = "0 min"; }
                detalle.hidden = !registrar;
                btnClear.classList.toggle("active", !registrar);
                btnRegister.classList.toggle("active", registrar);
                card.classList.toggle("registrando", registrar);
                actualizarTotalPerdidasEmulsion();
                ejecutarAutosave();
            };
            ["carguio", "amarre"].forEach(tipo => {
                const card = page.querySelector(`[data-emulsion-perdida="${tipo}"]`);
                const sufijo = tipo === "carguio" ? "Carguio" : "Amarre";
                const motivo = document.getElementById(`obsPerdida${sufijo}`);
                const tiempo = document.getElementById(`tiempoPerdida${sufijo}`);
                const detalle = card.querySelector(`[data-emulsion-perdida-detalle="${tipo}"]`);
                const labels = [...card.querySelectorAll(`[data-emulsion-perdida-chips="${tipo}"] button`)];
                const known = labels.filter(b => !b.hasAttribute("data-emulsion-otro-chip")).map(b => b.textContent.trim());
                const raw = (motivo?.value || "").split(" · ").filter(Boolean);
                const selected = new Set(raw.filter(item => known.includes(item) || item.startsWith("Otro:")));
                const legacy = raw.filter(item => !known.includes(item) && !item.startsWith("Otro:"));
                const otroInput = card.querySelector(`[data-emulsion-perdida-otro="${tipo}"]`);
                const otherValue = raw.find(item => item.startsWith("Otro:"));
                otroInput.value = otherValue ? otherValue.slice(5).trim() : legacy.join(" · ");
                const hayPerdida = Boolean(raw.length || Number((tiempo?.value.match(/\d+(?:\.\d+)?/) || ["0"])[0]) > 0);
                configurarPerdidaEmulsion(tipo, hayPerdida);
                labels.forEach(button => {
                    const isOther = button.hasAttribute("data-emulsion-otro-chip");
                    const isSelected = isOther ? Boolean(otherValue || legacy.length) : selected.has(button.textContent.trim());
                    button.classList.toggle("selected", isSelected);
                    button.onclick = () => {
                        button.classList.toggle("selected");
                        const otroActivo = card.querySelector("[data-emulsion-otro-chip]").classList.contains("selected");
                        otroInput.hidden = !otroActivo;
                        const values = [...card.querySelectorAll(`[data-emulsion-perdida-chips="${tipo}"] button.selected`)]
                            .filter(item => !item.hasAttribute("data-emulsion-otro-chip")).map(item => item.textContent.trim());
                        if (otroActivo) values.push(`Otro: ${otroInput.value.trim()}`);
                        if (motivo) motivo.value = values.join(" · ");
                        configurarPerdidaEmulsion(tipo, true);
                    };
                });
                const otroSeleccionado = card.querySelector("[data-emulsion-otro-chip]").classList.contains("selected");
                otroInput.hidden = !otroSeleccionado;
                otroInput.oninput = () => {
                    const values = [...card.querySelectorAll(`[data-emulsion-perdida-chips="${tipo}"] button.selected`)]
                        .filter(item => !item.hasAttribute("data-emulsion-otro-chip")).map(item => item.textContent.trim());
                    if (otroSeleccionado) values.push(`Otro: ${otroInput.value.trim()}`);
                    if (motivo) motivo.value = values.join(" · ");
                    ejecutarAutosave();
                };
                card.querySelector(`[data-emulsion-perdida-clear="${tipo}"]`).onclick = () => {
                    card.querySelectorAll(`[data-emulsion-perdida-chips="${tipo}"] button`).forEach(button => button.classList.remove("selected"));
                    otroInput.value = ""; otroInput.hidden = true;
                    configurarPerdidaEmulsion(tipo, false, true);
                };
                card.querySelector(`[data-emulsion-perdida-register="${tipo}"]`).onclick = () => configurarPerdidaEmulsion(tipo, true);
                const timer = card.querySelector(`[data-emulsion-min-value="tiempoPerdida${sufijo}"]`);
                timer.oninput = () => { if (tiempo) tiempo.value = `${Math.max(0, Number(timer.value) || 0)} min`; actualizarTotalPerdidasEmulsion(); ejecutarAutosave(); };
            });
            page.querySelectorAll("[data-emulsion-min]").forEach(button => button.onclick = () => {
                const input = page.querySelector(`[data-emulsion-min-value="${button.dataset.emulsionMin}"]`);
                input.value = String(Math.max(0, Number(input.value || 0) + Number(button.dataset.delta)));
                input.dispatchEvent(new Event("input", { bubbles: true }));
            });
            page.querySelectorAll("[data-emulsion-min-preset]").forEach(button => button.onclick = () => {
                const input = page.querySelector(`[data-emulsion-min-value="${button.dataset.emulsionMinPreset}"]`);
                input.value = button.dataset.min; input.dispatchEvent(new Event("input", { bubbles: true }));
            });
            page.querySelectorAll("[data-emulsion-postura-tab]").forEach(button => button.onclick = () => mostrar(button.dataset.emulsionPosturaTab));
            document.getElementById("emulsionPosturaAtras").onclick = () => {
                const index = tabs.indexOf(page.dataset.tab);
                if (index > 0) mostrar(tabs[index - 1]); else window.mostrarResumenTirosParadaEmulsion();
            };
            document.getElementById("emulsionPosturaSiguiente").onclick = () => {
                const index = tabs.indexOf(page.dataset.tab);
                if (index < tabs.length - 1) mostrar(tabs[index + 1]);
                else { guardarHistoricoTrabajos(); ejecutarAutosave(); document.body.classList.remove("emulsion-work-mode", "emulsion-stop-mode", "emulsion-plantilla-mode"); mostrarResumenFinalEmulsion(); }
            };
            mostrar(tabs.includes(pestana) ? pestana : "tiempos");
        };

        function minutosEmulsion(valor) {
            const texto = String(valor || "").trim();
            const reloj = /^(\d{1,2}):(\d{2})$/.exec(texto);
            if (reloj) return Number(reloj[1]) * 60 + Number(reloj[2]);
            return Number((texto.match(/\d+(?:\.\d+)?/) || ["0"])[0]) || 0;
        }

        function formatearMinutosEmulsion(total) {
            return `${Math.floor(total / 60)} h ${String(total % 60).padStart(2, "0")} min`;
        }

        function diferenciaHorasEmulsion(inicioId, finId) {
            const inicio = document.getElementById(inicioId)?.value, fin = document.getElementById(finId)?.value;
            if (!inicio || !fin) return 0;
            const [ih, im] = inicio.split(":").map(Number), [fh, fm] = fin.split(":").map(Number);
            const diferencia = fh * 60 + fm - (ih * 60 + im);
            return diferencia < 0 ? diferencia + 1440 : diferencia;
        }

        function mostrarResumenFinalEmulsion() {
            guardarHistoricoTrabajos(); ejecutarAutosave();
            const paradas = trabajosGuardados.flatMap(trabajo => (trabajo.paradas || []).map(parada => ({ ...parada, trabajo: trabajo.idTrabajo })));
            const filas = paradas.map(parada => {
                const tiros = Array.isArray(parada.tiros) ? parada.tiros : [];
                const capturados = tiros.filter(Boolean);
                return { ...parada, tiros, total: capturados.length, sanos: capturados.filter(t => t.estado === "Sano").length, tapados: capturados.filter(t => t.estado === "Tapado").length };
            });
            const tiros = filas.flatMap(parada => parada.tiros.filter(Boolean));
            const sanos = tiros.filter(tiro => tiro.estado === "Sano").length;
            const tapados = tiros.filter(tiro => tiro.estado === "Tapado").length;
            const kilos = tiros.reduce((sum, tiro) => sum + (Number(String(tiro.kilosEmulsion || "").replace(",", ".")) || 0), 0);
            const max = Math.max(1, ...filas.map(fila => fila.total));
            const perdida = minutosEmulsion(document.getElementById("tiempoPerdidaCarguio")?.value) + minutosEmulsion(document.getElementById("tiempoPerdidaAmarre")?.value);
            const root = document.getElementById("paso9");
            const escape = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
            const peso = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 1 }).format(kilos);
            root.innerHTML = `
                <div class="anfo-final-progress" aria-label="Paso 8 de 8">${Array.from({length:8},()=>"<i></i>").join("")}</div>
                <header class="anfo-final-head"><div><p>EMULSIÓN · ${escape(idTrabajoActual || "SEGUIMIENTO")}</p><h2>Resumen General</h2></div><span>✓ Guardado</span></header>
                <div class="anfo-final-stats"><article><strong>${trabajosGuardados.length}</strong><small>Trabajos</small></article><article><strong>${paradas.length}</strong><small>Paradas</small></article><article><strong>${tiros.length}</strong><small>Tiros</small></article><article><strong>${escape(peso)}</strong><small>Kg usados</small></article></div>
                <section class="anfo-final-chart"><header><strong>■ TIROS POR PARADA</strong><span>${tiros.length ? Math.round(sanos / tiros.length * 100) : 0}% sanos</span></header>
                    ${filas.length ? `<div class="anfo-final-chart-rows">${filas.map(fila=>`<div class="anfo-final-chart-row"><label>${escape(fila.trabajo)} · ${escape(fila.idParada)}</label><div class="anfo-final-bars"><span class="total" style="width:${fila.total/max*100}%"><b>${fila.total}</b></span><span class="sanos" style="width:${fila.sanos/max*100}%"><b>${fila.sanos}</b></span><span class="tapados" style="width:${fila.tapados/max*100}%"><b>${fila.tapados}</b></span></div></div>`).join("")}</div>` : `<p class="anfo-final-empty">Aún no hay tiros registrados.</p>`}
                    <footer><span><i class="total"></i>Total</span><span><i class="sanos"></i>Sanos</span><span><i class="tapados"></i>Tapados</span></footer>
                </section>
                <section class="anfo-final-times"><span>◷ Carguío <b>${formatearMinutosEmulsion(diferenciaHorasEmulsion("hInicioCarguio", "hFinCarguio"))}</b></span><span>Amarre <b>${formatearMinutosEmulsion(diferenciaHorasEmulsion("hInicioAmarre", "hFinAmarre"))}</b></span><span>Pérdidas <b>${formatearMinutosEmulsion(perdida)}</b></span></section>
                <details class="anfo-final-shot-details"><summary>Ver información de tiros por parada</summary>${filas.map(parada=>`<div class="anfo-final-stop-detail"><strong>${escape(parada.trabajo)} · ${escape(parada.idParada)}</strong><div>${Array.from({length:Number(parada.cantidadTiros)||parada.tiros.length},(_,index)=>{const tiro=parada.tiros[index];return tiro?`<article><b>Tiro ${index+1} · ${escape(tiro.estado||"Sin estado")} · ${escape(tiro.agua||"Sin agua")}</b><small>Diseño ${escape(tiro.longDiseno||"—")} m · Taco ${escape(tiro.taco||"—")} m · Al cargar ${escape(tiro.largoMomento||"—")} m · Taco real ${escape(tiro.tacoReal||"—")} m</small><small>${escape(tiro.tipoEmulsion||"Emulsión")} · ${escape(tiro.kilosEmulsion||"—")} kg · Pera ${escape(tiro.numPera||"—")} · Cebo sup. ${escape(tiro.ceboSup||"—")} · Cartuchos ${escape(tiro.cantCartuchos||"—")}</small></article>`:`<article class="pending"><b>Tiro ${index+1} · Pendiente</b></article>`}).join("")}</div></div>`).join("")}</details>
                <div class="anfo-final-actions"><button class="save" type="button" id="emulsionFinalGuardar">▣<b>Guardar y Salir</b><small>Cierra el seguimiento</small></button><button class="cloud" type="button" id="emulsionFinalOneDrive">☁<b>OneDrive</b><small>Subir a la nube</small></button><button class="excel" type="button" id="emulsionFinalExcel">▦<b>Generar Excel</b><small>Planilla de terreno</small></button><button class="report" type="button" id="emulsionFinalInforme">▤<b>Generar Nota Técnica</b><small>Con diagramas de disparo</small></button></div>
                <footer class="anfo-final-footer"><button type="button" id="emulsionFinalPlantilla">‹ Volver a plantilla</button><button type="button" id="emulsionFinalNuevoTrabajo">+ Registrar otro trabajo</button></footer>`;
            document.body.classList.remove("anfo-resumen-tiros-mode", "anfo-resumen-final-mode", "emulsion-resumen-tiros-mode", "emulsion-plantilla-mode");
            document.body.classList.add("anfo-resumen-final-mode", "emulsion-final-mode");
            ocultarTodosPasos(); root.style.display = "flex";
            document.getElementById("emulsionFinalGuardar").onclick = () => {
                if (!paradas.length) { alert("Registre al menos una parada antes de guardar."); return; }
                guardarHistoricoTrabajos(); localStorage.removeItem("jej_emulsion_draft");
                alert("¡Registro de Emulsión guardado correctamente!"); window.location.href = "../index.html";
            };
            document.getElementById("emulsionFinalOneDrive").onclick = () => alert("La carga a OneDrive para Emulsión aún no está habilitada.");
            document.getElementById("emulsionFinalExcel").onclick = guardarFormularioEmulsionYExportarExcel;
            document.getElementById("emulsionFinalInforme").onclick = generarInformeTecnicoHTML;
            document.getElementById("emulsionFinalPlantilla").onclick = () => { document.body.classList.remove("anfo-resumen-final-mode", "emulsion-final-mode"); window.abrirDatosPlantillaEmulsion("tiempos"); };
            document.getElementById("emulsionFinalNuevoTrabajo").onclick = () => { document.body.classList.remove("anfo-resumen-final-mode", "emulsion-final-mode"); irAGestionTrabajoEmulsion(); };
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
            document.body.classList.remove("emulsion-stop-mode");
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
                const tiros = Array.isArray(parada.tiros) ? parada.tiros : [];
                const cantidad = Number(parada.cantidadTiros || parada.totalTiros) || tiros.length || 1;
                document.getElementById("cantTirosInput").value = Math.min(50, Math.max(1, cantidad));
            }

            document.getElementById("subtituloPaso4").innerText = `Trabajo: ${idTrabajoActual} | Parada: ${idParadaActual}`;
            document.body.classList.remove("emulsion-stop-mode");
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
                selectButtons: true,
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
                const duracionExcel = (inicio, fin) => {
                    const a = /^(\d{1,2}):(\d{2})$/.exec(String(inicio || "").trim());
                    const b = /^(\d{1,2}):(\d{2})$/.exec(String(fin || "").trim());
                    if (!a || !b) return "";
                    let minutos = (Number(b[1]) * 60 + Number(b[2])) - (Number(a[1]) * 60 + Number(a[2]));
                    if (minutos < 0) minutos += 1440;
                    return minutos / 1440;
                };
                const duracionLibreExcel = (valor) => {
                    const texto = String(valor || "").trim().toLowerCase();
                    if (!texto) return "";
                    const hm = /^(\d{1,2}):(\d{2})$/.exec(texto);
                    if (hm) return (Number(hm[1]) * 60 + Number(hm[2])) / 1440;
                    const h = /(\d+(?:[.,]\d+)?)\s*h/.exec(texto), m = /(\d+(?:[.,]\d+)?)\s*(?:m|min)/.exec(texto);
                    const total = h || m ? (h ? parseFloat(h[1].replace(',', '.')) * 60 : 0) + (m ? parseFloat(m[1].replace(',', '.')) : 0) : parseFloat(texto.replace(',', '.'));
                    return Number.isFinite(total) ? total / 1440 : "";
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
                ['H5','H6','H7','H8','H9','H10'].forEach(celda => { worksheet.getCell(celda).numFmt = 'hh:mm'; });
                asignarValorCelda('H11', duracionExcel(val("hLlegadaPyT"), val("hSalidaPyT")));
                asignarValorCelda('H12', duracionExcel(val("hInicioCarguio"), val("hFinCarguio")));
                worksheet.getCell('H11').numFmt = '[h]:mm';
                worksheet.getCell('H12').numFmt = '[h]:mm';
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
                worksheet.getCell('U5').numFmt = 'hh:mm';
                worksheet.getCell('X5').numFmt = 'hh:mm';

                // Pérdidas operacionales (texto en T7 / T12, tiempo en AC7 / AC12)
                asignarValorCelda('T7', val("obsPerdidaCarguio"));
                asignarValorCelda('AC7', duracionLibreExcel(val("tiempoPerdidaCarguio")));
                worksheet.getCell('AC7').numFmt = '[h]:mm';
                asignarValorCelda('T12', val("obsPerdidaAmarre"));
                asignarValorCelda('AC12', duracionLibreExcel(val("tiempoPerdidaAmarre")));
                worksheet.getCell('AC12').numFmt = '[h]:mm';

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
                if (window.JEJArchivo && typeof window.JEJArchivo.guardar === 'function') {
                    await window.JEJArchivo.guardar(nombreArchivo, blob, blob.type);
                } else {
                    const enlace = document.createElement('a');
                    enlace.href = URL.createObjectURL(blob);
                    enlace.download = nombreArchivo;
                    document.body.appendChild(enlace);
                    enlace.click();
                    document.body.removeChild(enlace);
                    setTimeout(() => URL.revokeObjectURL(enlace.href), 2500);
                }
                alert(window.JEJArchivo && window.JEJArchivo.esNativo()
                    ? "Archivo Excel de Emulsión generado. Usa el menú de Android para guardarlo o compartirlo."
                    : "¡Archivo Excel de Emulsión generado con éxito manteniendo la nueva estructura!");

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

const botonUsarTrabajoEmulsion = document.getElementById("btnUsarTrabajoEmulsion");
if (botonUsarTrabajoEmulsion) {
    botonUsarTrabajoEmulsion.addEventListener("click", evento => {
        evento.preventDefault();
        window.usarTrabajoSeleccionadoEmulsion();
    });
}


/* Captura de tiros integrada desde emulsion-captura.js */
/* Captura de tiros de Emulsión en cuatro pestañas, conservando los campos originales. */
(function () {
    "use strict";

    const pestañas = ["medidas", "estado", "producto", "columna"];
    const nombres = { medidas: "Medidas", estado: "Estado", producto: "Producto", columna: "Columna" };
    const campos = {
        medidas: ["emulsionLongDiseno", "emulsionTaco", "emulsionLargoMomento", "emulsionTacoReal", "emulsionCamaExplosivo"],
        estado: ["emulsionEstado", "emulsionIntentosDestape", "emulsionAgua", "emulsionPosNeg", "emulsionNumPera"],
        producto: ["tipoEmulsion", "kilosEmulsion", "emulsionCeboSup", "emulsionAranaSup", "emulsionCantCartuchos", "emulsionCeboInf"],
        columna: ["emulsionLongTerminarCama", "emulsionLong1erCebo", "emulsionLongTerminarIntermedia", "emulsionLong2doCebo", "emulsionLongCargaInferior", "emulsionLongRetenedor", "emulsionLongTacoGreda"]
    };
    let pestañaActiva = "medidas";
    const autoEditado = { emulsionLong1erCebo: false, emulsionLong2doCebo: false };
    const autoDependencias = {
        emulsionLong1erCebo: { base: "emulsionLongTerminarCama", delta: 0.3 },
        emulsionLong2doCebo: { base: "emulsionLongTerminarIntermedia", delta: 0.3 }
    };

    const el = id => document.getElementById(id);
    const valor = id => el(id)?.value ?? "";

    function calcularCebo(id, reiniciar) {
        const dependencia = autoDependencias[id];
        if (!dependencia || (autoEditado[id] && !reiniciar)) return;
        if (reiniciar) autoEditado[id] = false;
        const base = Number(valor(dependencia.base));
        el(id).value = valor(dependencia.base).trim() && Number.isFinite(base) ? (base + dependencia.delta).toFixed(2) : "";
        actualizarDiagrama();
    }

    function calcularTodosCebos() {
        Object.keys(autoDependencias).forEach(id => calcularCebo(id, true));
    }

    function actualizarDiagrama() {
        const diseno = Math.max(1, Number(valor("emulsionLongDiseno")) || 12.9);
        const taco = Math.min(diseno, Math.max(0, Number(valor("emulsionTacoReal")) || 0));
        const cargado = Math.max(0, Number(valor("emulsionLargoMomento")) - taco || 0);
        const yCarga = 28 + 230 * taco / diseno;
        const ceboSup = String(valor("emulsionCeboSup") || "150").replace(/[&<>"']/g, "");
        const largoIntermedia = Number(valor("emulsionLongTerminarIntermedia")) || 0;
        const ceboIntermedio = Number(valor("emulsionLong2doCebo")) || 0;
        el("diagramaTiroEmulsion").innerHTML = `<svg class="emulsion-tiro-diagrama" viewBox="0 0 160 310" role="img" aria-label="Vista del tiro ${indiceTiroActual}: diseño ${diseno} metros y carga ${cargado.toFixed(1)} metros">
            <defs><pattern id="emulTaco" width="8" height="8" patternTransform="rotate(42)" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="#d8caa9"/><path d="M0 0V8" stroke="#aa9874" stroke-width="2"/></pattern><pattern id="emulCarga" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="#f4c437"/><circle cx="2" cy="2" r="1" fill="#a97900"/></pattern></defs>
            <text x="80" y="13" text-anchor="middle" font-size="9" font-weight="800" fill="#31538c">TIRO ${indiceTiroActual} · VISTA</text>
            <text x="9" y="31" font-size="8" fill="#42608e">0</text><text x="9" y="108" font-size="8" fill="#42608e">${(diseno*.33).toFixed(0)}</text><text x="9" y="187" font-size="8" fill="#42608e">${(diseno*.66).toFixed(0)}</text><text x="9" y="270" font-size="8" fill="#42608e">${diseno.toFixed(0)}</text>
            <rect x="25" y="25" width="46" height="247" rx="7" fill="url(#emulTaco)" stroke="#52698c" stroke-width="2"/><rect x="27" y="${yCarga}" width="42" height="${Math.max(0,272-yCarga)}" fill="url(#emulCarga)"/><line x1="25" y1="${yCarga}" x2="71" y2="${yCarga}" stroke="#795015" stroke-width="5"/>
            <circle cx="48" cy="${Math.min(258,yCarga+28)}" r="8" fill="#fff" stroke="#168fc4" stroke-width="3"/><text x="48" y="${Math.min(261,yCarga+31)}" text-anchor="middle" font-size="8" font-weight="900" fill="#12689a">1</text>
            <circle cx="48" cy="${Math.min(242,Math.max(yCarga+55,260-(largoIntermedia?20:0)))}" r="8" fill="#fff" stroke="#168fc4" stroke-width="3"/><text x="48" y="${Math.min(245,Math.max(yCarga+58,263-(largoIntermedia?20:0)))}" text-anchor="middle" font-size="8" font-weight="900" fill="#12689a">2</text>
            <text x="79" y="${Math.max(66,yCarga*.52)}" font-size="8" font-weight="700" fill="#244477">Taco real</text><text x="79" y="${Math.max(76,yCarga*.52+10)}" font-size="8" fill="#52698c">${taco.toFixed(1)} m</text>
            <text x="79" y="${Math.min(218,yCarga+22)}" font-size="8" font-weight="700" fill="#244477">Emulsión</text><text x="79" y="${Math.min(228,yCarga+32)}" font-size="8" fill="#52698c">${cargado.toFixed(1)} m</text>
            <text x="79" y="${Math.min(250,yCarga+50)}" font-size="8" font-weight="700" fill="#b35b00">Cama</text><text x="79" y="${Math.min(260,yCarga+60)}" font-size="8" fill="#52698c">${(Number(valor("emulsionCamaExplosivo"))||0).toFixed(1)} m</text>
            <text x="30" y="${Math.max(42,yCarga-7)}" font-size="7" fill="#31538c">${ceboSup} g</text>
        </svg>`;
        el("resumenDiagramaTiroEmulsion").innerHTML = `Diseño ${diseno.toFixed(1)} m<br>Al cargar ${(Number(valor("emulsionLargoMomento"))||0).toFixed(1)} m`;
    }

    function sincronizar(copia, origen) {
        origen.value = copia.value;
        origen.dispatchEvent(new Event("input", { bubbles: true }));
        origen.dispatchEvent(new Event("change", { bubbles: true }));
        if (origen.id === "emulsionEstado") toggleIntentosDestapeEmulsion();
        const intentos = document.querySelector('#camposCapturaTiroEmulsion [data-source-id="emulsionIntentosDestape"]');
        if (intentos) {
            intentos.disabled = el("emulsionIntentosDestape").disabled;
            intentos.closest(".emulsion-tiro-stepper")?.querySelectorAll("button").forEach(boton => boton.disabled = intentos.disabled);
        }
        const auto = Object.entries(autoDependencias).find(([, depende]) => depende.base === origen.id);
        if (auto) calcularCebo(auto[0], true);
        if (autoDependencias[origen.id]) { autoEditado[origen.id] = true; actualizarEtiquetaAuto(origen.id); }
        actualizarDiagrama();
    }

    function actualizarEtiquetaAuto(id) {
        const grupo = document.querySelector(`#camposCapturaTiroEmulsion [data-source-id="${id}"]`)?.closest(".emulsion-tiro-campo");
        if (!grupo) return;
        let etiqueta = grupo.querySelector(".emulsion-auto-tag");
        if (!etiqueta) { etiqueta = document.createElement("span"); etiqueta.className = "emulsion-auto-tag"; grupo.querySelector("label")?.append(etiqueta); }
        etiqueta.textContent = autoEditado[id] ? "corregido" : "auto";
        etiqueta.classList.toggle("corregido", autoEditado[id]);
    }

    function agregarStepper(input, origen, id) {
        const wrap = document.createElement("div"); wrap.className = "emulsion-tiro-stepper";
        const menos = document.createElement("button"); menos.type = "button"; menos.textContent = "−"; menos.setAttribute("aria-label", "Disminuir valor");
        const mas = document.createElement("button"); mas.type = "button"; mas.textContent = "+"; mas.setAttribute("aria-label", "Aumentar valor");
        input.parentNode.insertBefore(wrap, input); wrap.append(menos, input, mas);
        const step = Number(origen.step) > 0 ? Number(origen.step) : 1;
        const ajustar = delta => {
            if (input.disabled) return;
            if (autoDependencias[id]) { autoEditado[id] = true; actualizarEtiquetaAuto(id); }
            const actual = input.value === "" ? 0 : Number(input.value);
            const nuevo = Math.max(Number(origen.min || 0), Math.min(origen.max === "" ? Infinity : Number(origen.max), (Number.isFinite(actual) ? actual : 0) + delta * step));
            input.value = String(Number(nuevo.toFixed(3)));
            input.dispatchEvent(new Event("input", { bubbles: true })); input.dispatchEvent(new Event("change", { bubbles: true }));
        };
        menos.addEventListener("click", () => ajustar(-1)); mas.addEventListener("click", () => ajustar(1));
        const estado = () => {
            const v = Number(input.value);
            menos.disabled = input.disabled || (Number.isFinite(v) && v <= Number(origen.min || 0));
            mas.disabled = input.disabled || (origen.max !== "" && Number.isFinite(v) && v >= Number(origen.max));
        };
        input.addEventListener("input", estado); estado();
    }

    function mostrarPestana(pestana) {
        pestañaActiva = pestana;
        document.querySelectorAll("[data-tab-tiro-emulsion]").forEach(boton => {
            const activa = boton.dataset.tabTiroEmulsion === pestana;
            boton.classList.toggle("activo", activa); boton.setAttribute("aria-selected", activa ? "true" : "false");
        });
        const contenedor = el("camposCapturaTiroEmulsion"); contenedor.replaceChildren();
        campos[pestana].forEach(id => {
            const origen = el(id), grupo = origen?.closest(".form-group-field");
            if (!origen || !grupo) return;
            const copiaGrupo = grupo.cloneNode(true); copiaGrupo.classList.add("emulsion-tiro-campo");
            copiaGrupo.querySelectorAll("input,select,textarea").forEach(copia => {
                const fuente = grupo.querySelector(`#${copia.id}`); if (!fuente) return;
                copia.removeAttribute("id"); copia.dataset.sourceId = id;
                if (fuente.tagName === "SELECT") {
                    const opciones = document.createElement("div"); opciones.className = "emulsion-choice-row";
                    Array.from(fuente.options).filter(o => !o.disabled && o.value !== "").forEach(opcion => {
                        const b = document.createElement("button"); b.type = "button"; b.textContent = opcion.textContent.trim(); b.classList.toggle("selected", opcion.value === fuente.value);
                        b.addEventListener("click", () => { fuente.value = opcion.value; opciones.querySelectorAll("button").forEach(x => x.classList.toggle("selected", x === b)); sincronizar({ value: opcion.value }, fuente); });
                        opciones.appendChild(b);
                    }); copia.replaceWith(opciones);
                } else {
                    copia.value = fuente.value; copia.disabled = fuente.disabled;
                    copia.addEventListener("input", () => sincronizar(copia, fuente)); copia.addEventListener("change", () => sincronizar(copia, fuente));
                    if (copia.type === "number") agregarStepper(copia, fuente, id);
                }
            });
            contenedor.appendChild(copiaGrupo);
            if (autoDependencias[id]) actualizarEtiquetaAuto(id);
        });
        const ix = pestañas.indexOf(pestana);
        el("anteriorCapturaTiroEmulsion").textContent = ix ? `‹ ${nombres[pestañas[ix-1]]}` : (indiceTiroActual > 1 ? "‹ Anterior" : "‹ Cantidad");
        el("siguienteCapturaTiroEmulsion").textContent = ix < pestañas.length - 1 ? `${nombres[pestañas[ix+1]]} ›` : "Guardar tiro ✓";
        actualizarDiagrama(); actualizarNavegacion();
    }

    function actualizarNavegacion() {
        const nav = el("navegacionTirosEmulsion"); nav.replaceChildren();
        for (let n=1; n<=totalTirosParadaActual; n++) {
            const b = document.createElement("button"); const hecho = Boolean(tirosTemporales[n-1]) && n !== indiceTiroActual;
            b.type="button"; b.textContent=hecho ? "✓" : String(n); b.classList.toggle("completo", hecho); b.classList.toggle("actual", n===indiceTiroActual);
            b.setAttribute("aria-label", `Tiro ${n}`); b.setAttribute("aria-current", n===indiceTiroActual ? "step" : "false");
            b.addEventListener("click", () => { if(n===indiceTiroActual)return; guardarDatosTiroActual(); indiceTiroActual=n; cargarFormularioTiroWizard(n); }); nav.appendChild(b);
        }
        el("badgeCapturaTiroEmulsion").textContent=`Tiro ${indiceTiroActual} de ${totalTirosParadaActual}`;
        el("contextoCapturaTiroEmulsion").textContent=`PASO 6 DE 8 · PARADA ${idParadaActual || "-"}`;
        el("progresoCapturaTiroEmulsion").innerHTML=Array.from({length:8},(_,i)=>`<i class="${i<5?"done":i===5?"current":""}"></i>`).join("");
    }

    function mostrarModal() {
        el("paso5").style.display="none"; document.body.classList.add("emulsion-captura-activa");
        const modal=el("modalCapturaTiroEmulsion"); modal.classList.add("visible"); modal.setAttribute("aria-hidden","false"); mostrarPestana("medidas");
    }
    function cerrarModal() {
        const modal=el("modalCapturaTiroEmulsion");
        if (modal.contains(document.activeElement)) document.activeElement.blur();
        modal.classList.remove("visible"); modal.setAttribute("aria-hidden","true"); document.body.classList.remove("emulsion-captura-activa");
    }

    window.iniciarRegistroTiros = function () {
        const input=el("cantTirosInput"); input.value=String(Math.min(50,Math.max(1,Number(input.value)||1)));
        totalTirosParadaActual=Number(input.value);
        const trabajo=trabajosGuardados.find(t=>t.idTrabajo===idTrabajoActual);
        const parada=trabajo?.paradas?.find(p=>p.idParada===idParadaActual);
        tirosTemporales=Array.isArray(parada?.tiros)?[...parada.tiros]:[];
        indiceTiroActual=1; ocultarTodosPasos(); el("paso5").style.display="block"; cargarFormularioTiroWizard(1);
    };

    window.cargarFormularioTiroWizard = function (numero) {
        el("tituloTiroActual").textContent=`Captura de Tiro ${numero} - Emulsión`;
        el("subtituloParadaActual").textContent=`Trabajo: ${idTrabajoActual} | Parada: ${idParadaActual}`;
        el("badgeProgreso").textContent=`Tiro ${numero} de ${totalTirosParadaActual}`;
        const t=tirosTemporales[numero-1];
        const valores={emulsionLongDiseno:t?.longDiseno??12.9,emulsionTaco:t?.taco??8.0,emulsionLargoMomento:t?.largoMomento??13.0,emulsionTacoReal:t?.tacoReal??8.0,emulsionEstado:t?.estado??"Sano",emulsionIntentosDestape:t?.intentosDestape??"",emulsionAgua:t?.agua??"Seco",emulsionPosNeg:t?.posNeg??"Positivo",tipoEmulsion:t?.tipoEmulsion??"Emulnor 3000",kilosEmulsion:t?.kilosEmulsion??"",emulsionNumPera:t?.numPera??7,emulsionCamaExplosivo:t?.camaExplosivo??"",emulsionCeboSup:t?.ceboSup??"150.0",emulsionAranaSup:t?.aranaSup??"Si",emulsionCantCartuchos:t?.cantCartuchos??1,emulsionCeboInf:t?.ceboInf??"",emulsionLongTerminarCama:t?.longTerminarCama??"",emulsionLong1erCebo:t?.long1erCebo??"",emulsionLongTerminarIntermedia:t?.longTerminarIntermedia??"",emulsionLong2doCebo:t?.long2doCebo??"",emulsionLongCargaInferior:t?.longCargaInferior??"",emulsionLongRetenedor:t?.longRetenedor??"",emulsionLongTacoGreda:t?.longTacoGreda??""};
        Object.entries(valores).forEach(([id,v])=>el(id).value=v);
        Object.keys(autoEditado).forEach(id=>autoEditado[id]=false);
        for (const [id,dep] of Object.entries(autoDependencias)) {
            const base=Number(valor(dep.base)), esperado=valor(dep.base).trim()&&Number.isFinite(base)?(base+dep.delta).toFixed(2):"";
            autoEditado[id]=Boolean(t && String(t[id=== "emulsionLong1erCebo" ? "long1erCebo" : "long2doCebo"] ?? "") !== String(esperado));
            if (!valor(id) || !t) calcularCebo(id, true);
        }
        toggleIntentosDestapeEmulsion(); mostrarModal();
    };

    document.querySelectorAll("[data-tab-tiro-emulsion]").forEach(b=>b.addEventListener("click",()=>mostrarPestana(b.dataset.tabTiroEmulsion)));
    el("siguienteCapturaTiroEmulsion").addEventListener("click",()=>{
        const ix=pestañas.indexOf(pestañaActiva);
        if(ix<pestañas.length-1) { mostrarPestana(pestañas[ix+1]); return; }
        cerrarModal(); siguienteTiroEmulsion();
    });
    el("anteriorCapturaTiroEmulsion").addEventListener("click",()=>{
        const ix=pestañas.indexOf(pestañaActiva);
        if(ix>0) { mostrarPestana(pestañas[ix-1]); return; }
        cerrarModal(); anteriorTiroEmulsion();
    });
    document.querySelectorAll("[data-cantidad-tiros]").forEach(b=>b.addEventListener("click",()=>{
        const input=el("cantTirosInput"); input.value=String(Math.min(50,Math.max(1,(Number(input.value)||1)+Number(b.dataset.cantidadTiros)))); actualizarCantidad();
    }));
    document.querySelectorAll("[data-cantidad-preset]").forEach(b=>b.addEventListener("click",()=>{el("cantTirosInput").value=b.dataset.cantidadPreset; actualizarCantidad();}));
    function actualizarCantidad(){
        const input=el("cantTirosInput"); input.value=String(Math.min(50,Math.max(1,Number(input.value)||1)));
        document.querySelectorAll("[data-cantidad-preset]").forEach(b=>b.classList.toggle("selected",Number(b.dataset.cantidadPreset)===Number(input.value)));
    }
    el("cantTirosInput").addEventListener("change",actualizarCantidad);
    Object.values(autoDependencias).forEach(dep=>el(dep.base).addEventListener("input",()=>{
        const id=Object.keys(autoDependencias).find(k=>autoDependencias[k]===dep); calcularCebo(id,true);
        const copia=document.querySelector(`#camposCapturaTiroEmulsion [data-source-id="${id}"]`); if(copia)copia.value=valor(id);
    }));
    actualizarCantidad();
})();
