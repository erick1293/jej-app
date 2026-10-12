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
            <div class="user-side">
                <div class="user-avatar" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="26" height="26"><circle cx="12" cy="9" r="4.2" fill="#e5e7eb"/><path d="M3.5 21c0-4.6 3.8-7.2 8.5-7.2s8.5 2.6 8.5 7.2z" fill="#e5e7eb"/></svg>
                </div>
                <button type="button" id="userChevron" class="user-chevron" aria-label="Opciones de usuario" aria-expanded="false" onclick="toggleUserMenu(event)">
                    <svg viewBox="0 0 24 24" width="16" height="16"><path d="M6 9l6 6 6-6" fill="none" stroke="#475569" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </button>
            </div>
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

function cargarBarMenu(esSubcarpeta = false) {
    const rutaPrefix = esSubcarpeta ? "../" : "";
    window.__jejRuta = rutaPrefix;

    const headerHTML = `
    <header class="bar-menu">
        <div class="logo-container">
            <a href="${rutaPrefix}index.html" style="text-decoration: none; display: flex; align-items: center;">
                <img src="${rutaPrefix}css/logo.jpg" alt="Logo JEJ" id="logoImg" onerror="this.style.display='none'; document.getElementById('logoFallback').style.display='block';">
                <span id="logoFallback" class="logo-text" style="display:none;">JEJ</span>
            </a>
        </div>

        <div class="header-right">
            <div id="userPanel" class="user-panel" style="display:none;"></div>
            <div class="hamburger-container">
                <button id="hamburgerBtn" onclick="toggleMenu()" aria-label="Menú">☰</button>
                <nav id="dropdownMenu" class="dropdown-menu">
                    <ul>
                        <li><a href="#" onclick="cerrarSesionDesdePagina('${rutaPrefix}')">Cerrar Sesión</a></li>
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
