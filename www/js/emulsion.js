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
            document.getElementById("subtituloPaso3").innerText = `ID Trabajo: ${idTrabajoActual}`;
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
            document.getElementById("subtituloPaso3").innerText = `ID Trabajo: ${idTrabajoActual}`;
            mostrarGestionParadasEmulsion();
            ocultarTodosPasos();
            document.getElementById("paso3").style.display = "block";
        }

        function usarTrabajoSeleccionadoEmulsion() {
            const select = document.getElementById("selectIdExistente");
            const tarjetaActiva = document.querySelector("#listaTrabajosEmulsion [data-seleccionar-trabajo-emulsion][aria-pressed='true']");
            const idTrabajoSeleccionado = select?.value || tarjetaActiva?.dataset.seleccionarTrabajoEmulsion || "";
            if (!idTrabajoSeleccionado) {
                alert("Seleccione un trabajo de la lista para continuar.");
                return;
            }
            if (select) select.value = idTrabajoSeleccionado;
            seleccionarIdExistente();
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
            
            let trabajo = trabajosGuardados.find(t => t.idTrabajo === idTrabajoActual);
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
                ["mina", "nivel", "bloque", "numZanja", "calleZanja", "calleUcl", "paradasInicioFin", "detallePanel2", "faseZanja"].forEach(campo => {
                    const control = document.getElementById(({ mina: "modalMina", nivel: "modalNivel", bloque: "modalBloque", numZanja: "numZanja", calleZanja: "calleZanja", calleUcl: "calleUcl", paradasInicioFin: "paradasInicioFin", detallePanel2: "detallePanel2", faseZanja: "faseZanja" })[campo]);
                    if (control && b[campo] !== undefined) control.value = b[campo];
                });
                if (b.trabajos && Array.isArray(b.trabajos)) {
                    trabajosGuardados = b.trabajos;
                }
                cambiarNivelModal();
                actualizarIdTronaduraAuto();
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

            if (indiceTiroActual < totalTirosParadaActual) {
                indiceTiroActual++;
                cargarFormularioTiroWizard(indiceTiroActual);
            } else {
                let trabajo = trabajosGuardados.find(t => t.idTrabajo === idTrabajoActual);
                if (trabajo) {
                    let paradaIndex = trabajo.paradas.findIndex(p => p.idParada === idParadaActual);
                    if (paradaIndex >= 0) {
                        trabajo.paradas[paradaIndex].tiros = [...tirosTemporales];
                        trabajo.paradas[paradaIndex].cantidadTiros = totalTirosParadaActual;
                    } else {
                        trabajo.paradas.push({
                            idParada: idParadaActual,
                            cantidadTiros: totalTirosParadaActual,
                            tiros: [...tirosTemporales]
                        });
                    }
                }

                ejecutarAutosave();
                mostrarGestionParadasEmulsion();
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
