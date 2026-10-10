function cargarBarMenu(esSubcarpeta = false) {
    const rutaPrefix = esSubcarpeta ? "../" : "";
    
    const headerHTML = `
    <header class="bar-menu">
        <div class="logo-container">
            <a href="${rutaPrefix}index.html" style="text-decoration: none; display: flex; align-items: center;">
                <img src="${rutaPrefix}css/logo.jpg" alt="Logo JEJ" id="logoImg" onerror="this.style.display='none'; document.getElementById('logoFallback').style.display='block';">
                <span id="logoFallback" class="logo-text" style="display:none;">JEJ</span>
            </a>
        </div>
        
        <div class="hamburger-container">
            <button id="hamburgerBtn" onclick="toggleMenu()" aria-label="Menú">☰</button>
            <nav id="dropdownMenu" class="dropdown-menu">
                <ul>
                    <li><a href="#" onclick="cerrarSesionDesdePagina('${rutaPrefix}')">Cerrar Sesión</a></li>
                </ul>
            </nav>
        </div>
    </header>
    `;

    document.body.insertAdjacentHTML("afterbegin", headerHTML);
}

function cerrarSesionDesdePagina(rutaPrefix) {
    localStorage.removeItem("jej_usuario_activo");
    window.location.href = rutaPrefix + "index.html";
}