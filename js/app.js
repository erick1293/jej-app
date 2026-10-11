// Tiempo de expiración: 24 horas en milisegundos
const TIEMPO_24H = 86400000; 

document.addEventListener("DOMContentLoaded", () => {
    verificarEstadoSesion();
    
    // Cerrar menú hamburguesa al hacer clic fuera
    document.addEventListener("click", (e) => {
        const menu = document.getElementById("dropdownMenu");
        const btn = document.getElementById("hamburgerBtn");
        if (menu && btn && !menu.contains(e.target) && !btn.contains(e.target)) {
            menu.classList.remove("show");
        }
    });
});

function toggleMenu() {
    const menu = document.getElementById("dropdownMenu");
    if (menu) menu.classList.toggle("show");
}

// Limpiar usuarios que superen las 24 horas en localStorage
function limpiarUsuariosExpirados() {
    const ahora = Date.now();
    let usuariosMap = JSON.parse(localStorage.getItem("jej_usuarios_map") || "{}");
    let modificado = false;

    for (let usuario in usuariosMap) {
        if ((ahora - usuariosMap[usuario]) > TIEMPO_24H) {
            delete usuariosMap[usuario];
            modificado = true;
        }
    }

    if (modificado) {
        localStorage.setItem("jej_usuarios_map", JSON.stringify(usuariosMap));
    }
}

// Cargar autocompletado y verificar si hay sesión activa
function verificarEstadoSesion() {
    limpiarUsuariosExpirados();
    
    const usuarioActivo = localStorage.getItem("jej_usuario_activo");
    const seccionLogin = document.getElementById("seccionLogin");
    const seccionMenu = document.getElementById("seccionMenu");
    const lblUsuario = document.getElementById("usuarioLogueado");

    if (usuarioActivo) {
        // Si ya hay un usuario activo guardado, mostramos directamente el menú en la misma página
        if (seccionLogin) seccionLogin.style.display = "none";
        if (seccionMenu) seccionMenu.style.display = "block";
        if (lblUsuario) lblUsuario.innerText = usuarioActivo;
    } else {
        // Si no hay sesión, mostramos el login y cargamos los nombres frecuentes en el datalist
        if (seccionLogin) seccionLogin.style.display = "block";
        if (seccionMenu) seccionMenu.style.display = "none";
        
        cargarUsuariosAutocompletado();
    }
}

function cargarUsuariosAutocompletado() {
    let usuariosMap = JSON.parse(localStorage.getItem("jej_usuarios_map") || "{}");
    const datalist = document.getElementById("listaUsuarios");
    
    if (!datalist) return;
    
    datalist.innerHTML = "";
    Object.keys(usuariosMap).forEach(user => {
        const option = document.createElement("option");
        option.value = user;
        datalist.appendChild(option);
    });
}

// Ingresar y cambiar a la vista de menú en la misma página
function ingresarApp() {
    const input = document.getElementById("usuarioInput");
    const nombreUsuario = input ? input.value.trim() : "";

    if (!nombreUsuario) {
        alert("Por favor, ingrese su usuario responsable.");
        return;
    }

    let usuariosMap = JSON.parse(localStorage.getItem("jej_usuarios_map") || "{}");
    usuariosMap[nombreUsuario] = Date.now();
    localStorage.setItem("jej_usuarios_map", JSON.stringify(usuariosMap));
    localStorage.setItem("jej_usuario_activo", nombreUsuario);
    verificarEstadoSesion();
}

// Botón para volver al login (Cambiar de usuario)
function cerrarSesionUnica() {
    localStorage.removeItem("jej_usuario_activo");
    const input = document.getElementById("usuarioInput");
    if (input) input.value = "";
    verificarEstadoSesion();
}

// Redirección hacia las páginas de seguimiento específicas en pages/
function navegarA(pagina) {
    if (pagina) {
        // Aseguramos la ruta relativa limpia hacia la carpeta pages
        window.location.href = `./pages/${pagina}`;
    }
}
// Cargar listas guardadas de personal
        let personalMap = JSON.parse(localStorage.getItem("jej_personal_map") || "{}");
        
        if (personalMap.supervisorJeJ) {
            const listSupJeJ = document.getElementById("listaSupJeJ");
            personalMap.supervisorJeJ.forEach(n => listSupJeJ.innerHTML += `<option value="${n}">`);
        }
        if (personalMap.supervisorDet) {
            const listSupDet = document.getElementById("listaSupDet");
            personalMap.supervisorDet.forEach(n => listSupDet.innerHTML += `<option value="${n}">`);
        }
        if (personalMap.responsableDet) {
            const listRespDet = document.getElementById("listaRespDet");
            personalMap.responsableDet.forEach(n => listRespDet.innerHTML += `<option value="${n}">`);
        }