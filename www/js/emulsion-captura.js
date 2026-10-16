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
        const modal=el("modalCapturaTiroEmulsion"); modal.classList.remove("visible"); modal.setAttribute("aria-hidden","true"); document.body.classList.remove("emulsion-captura-activa");
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
