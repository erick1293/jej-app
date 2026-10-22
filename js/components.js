/* ---------- Panel de usuario (barra superior) ---------- */
function _jejFechaHora(ms) {
    const d = new Date(ms), p = n => String(n).padStart(2, "0");
    return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

function _jejEscape(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
}

function registrarUltimaConexion(usuario) {
    let mapa = {};
    try { mapa = JSON.parse(localStorage.getItem("jej_ultima_conexion") || "{}"); } catch (e) { mapa = {}; }
    mapa[usuario] = Date.now();
    localStorage.setItem("jej_ultima_conexion", JSON.stringify(mapa));
}

function actualizarPanelUsuario() {
    const host = document.getElementById("userPanel");
    if (!host) return;
    const usuario = localStorage.getItem("jej_usuario_activo");
    if (!usuario) { host.style.display = "none"; host.innerHTML = ""; return; }

    let mapa = {};
    try { mapa = JSON.parse(localStorage.getItem("jej_ultima_conexion") || "{}"); } catch (e) { mapa = {}; }
    if (!mapa[usuario]) { registrarUltimaConexion(usuario); mapa[usuario] = Date.now(); }
    const ultima = _jejFechaHora(mapa[usuario]);

    host.style.display = "flex";
    host.innerHTML = `
        <div class="user-card">
            <div class="user-text">
                <span class="user-name">${_jejEscape(usuario).toUpperCase()}</span>
                <span class="user-last">Última Conexión:<br>${ultima}</span>
            </div>
        </div>
             <div id="userDropdown" class="user-dropdown">
                   <div class="user-dd-head"><b>${_jejEscape(usuario)}</b><small>Última conexión: ${ultima}</small></div>
                   <a href="#" onclick="cerrarSesionDesdePagina(window.__jejRuta || '')">Cerrar sesión</a>
              </div>`;
}

function toggleUserMenu(e) {
    if (e) e.stopPropagation();
    const dd = document.getElementById("userDropdown");
    const btn = document.getElementById("userChevron");
    if (!dd) return;
    const abierto = dd.classList.toggle("show");
    if (btn) { btn.setAttribute("aria-expanded", abierto ? "true" : "false"); btn.classList.toggle("open", abierto); }
}

document.addEventListener("click", function (e) {
    const dd = document.getElementById("userDropdown");
    if (dd && dd.classList.contains("show") && !dd.contains(e.target) && !(e.target.closest && e.target.closest("#userChevron"))) {
        dd.classList.remove("show");
        const btn = document.getElementById("userChevron");
        if (btn) { btn.classList.remove("open"); btn.setAttribute("aria-expanded", "false"); }
    }
});

/* ---------- Procesos (menú lateral y buscador) ---------- */
const JEJ_PROCESOS = [
    { t: "Gestionar Personal (DET / JeJ)", p: "usuarios.html" }
];

function _jejNorm(s) { return String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); }

function jejBuscar(q) {
    const box = document.getElementById("searchResults");
    if (!box) return;
    const n = _jejNorm(q).trim();
    const res = n ? JEJ_PROCESOS.filter(x => _jejNorm(x.t).includes(n)) : [];
    if (!n) { box.classList.remove("show"); box.innerHTML = ""; return; }
    box.innerHTML = res.length
        ? res.map(x => `<a href="${(window.__jejRuta || "")}pages/${x.p}">${_jejEscape(x.t)}</a>`).join("")
        : `<span class="sr-vacio">Sin resultados</span>`;
    box.classList.add("show");
}

function cargarBarMenu(esSubcarpeta = false) {
    const rutaPrefix = esSubcarpeta ? "../" : "";
    window.__jejRuta = rutaPrefix;


    const buscador = `
        <div class="hdr-search">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#1e293b" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5.5 5.5"/></svg>
            <input type="text" id="searchInput" placeholder="Búsqueda..." autocomplete="off" oninput="jejBuscar(this.value)" aria-label="Buscar proceso">
            <div id="searchResults" class="search-results"></div>
        </div>`;

    const headerHTML = `
    <header class="bar-menu">
        

        <div class="logo-container">
            <a href="${rutaPrefix}index.html" style="text-decoration: none; display: flex; align-items: center;">
                <img src="${rutaPrefix}css/logo-blanco.png" alt="Logo JEJ" id="logoImg" onerror="this.style.display='none'; document.getElementById('logoFallback').style.display='block';">
                <span id="logoFallback" class="logo-text" style="display:none;">JEJ</span>
            </a>
        </div>

        ${esSubcarpeta ? '<div class="hdr-spacer"></div>' : buscador}

        <div class="header-right">
            <div id="userPanel" class="user-panel" style="display:none;"></div>
                <div class="hamburger-container">
            <button id="hamburgerBtn" onclick="toggleMenu()" aria-label="Menú">
                <svg viewBox="0 0 24 24" width="28" height="28" stroke="#fff" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M4 6.5h16M4 12h16M4 17.5h16"/></svg>
            </button>
            <nav id="dropdownMenu" class="dropdown-menu">
                <ul>
                    <li><a href="${rutaPrefix}index.html">Inicio</a></li>
                    ${JEJ_PROCESOS.map(x => `<li><a href="${rutaPrefix}pages/${x.p}">${_jejEscape(x.t)}</a></li>`).join("")}
                    <li><a href="#" onclick="cerrarSesionDesdePagina('${rutaPrefix}')">Cerrar sesión</a></li>
                </ul>
            </nav>
        </div>
        </div>
    </header>
    `;

    document.body.insertAdjacentHTML("afterbegin", headerHTML);
    actualizarPanelUsuario();
}

function cerrarSesionDesdePagina(rutaPrefix) {
    localStorage.removeItem("jej_usuario_activo");
    window.location.href = rutaPrefix + "index.html";
}

document.addEventListener("click", function (e) {
    const box = document.getElementById("searchResults");
    if (box && !(e.target.closest && e.target.closest(".hdr-search"))) box.classList.remove("show");
});


/* ---------- Roles de color de botones (solo presentación, diseño v2) ----------
   Asigna una clase de rol según el texto del botón, para que todas las páginas
   usen la misma paleta: secundario / confirmar / acción / atención / eliminar.
   No cambia eventos ni IDs. Ignora botones con color definido en línea. */
(function () {
    var REGLAS = [
        ['btn-del',  /^(eliminar|cancelar tiro|quitar)/],
        ['btn-sec',  /^(volver|anterior|cancelar|cerrar|omitir|sin problemas)/],
        ['btn-ok',   /^(guardar|crear|capturar tiro)/],
        ['btn-warn', /^(ver resumen)/],
        ['btn-dl',   /^(descargar)/],
        ['btn-act',  /^(usar|ingreso|editar|rellenar|agregar|registrar|continuar)/]
    ];
    function rolDe(btn) {
        var t = (btn.textContent || '').trim().toLowerCase().replace(/^[^a-z0-9áéíóúñ]+/, '');
        for (var i = 0; i < REGLAS.length; i++) if (REGLAS[i][1].test(t)) return REGLAS[i][0];
        return '';
    }
    function aplicar(raiz) {
        var lista = (raiz || document).querySelectorAll('.btn-primary:not([data-rol])');
        for (var i = 0; i < lista.length; i++) {
            var b = lista[i];
            if (b.tagName === 'INPUT' || b.tagName === 'SELECT') continue;
            var st = b.getAttribute('style') || '';
            b.setAttribute('data-rol', '1');
            if (/background/i.test(st)) continue;
            var r = rolDe(b);
            if (r) b.classList.add(r);
        }
    }
    var pendiente = false;
    function programar() {
        if (pendiente) return;
        pendiente = true;
        requestAnimationFrame(function () { pendiente = false; aplicar(document); });
    }
    function iniciar() {
        aplicar(document);
        if (window.MutationObserver) new MutationObserver(programar).observe(document.body, { childList: true, subtree: true, characterData: true });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
