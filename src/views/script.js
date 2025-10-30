const opciones = {
    datos: [
        { nombre: "Ingesta de Datos Sensor", archivo: "DatSensor/IngesDat.html" },
        { nombre: "Almacenamiento de Datos Estructurado", archivo: "DatSensor/AlmacenDat.html" }
    ],
    predicciones: [
        { nombre: "Resumen de Rendimiento", archivo: "Predicciones/resumenRendi.html" },
        { nombre: "Historial de Evaluación", archivo: "Predicciones/HistorialEvalu.html" },
        { nombre: "Historial de Predicciones", archivo: "Predicciones/HistorialPredic.html" }
    ],
    visualizacion: [
        { nombre: "Mapa Interactivo", archivo: "Visualizacion/MapInteractiv.html" },
    ],
    usuarios: [],
    notificaciones: [],
    salir: []
};

document.addEventListener("DOMContentLoaded", () => {
    const enlaces = document.querySelectorAll(".main-header a");
    const listaOpciones = document.getElementById("listaOpciones");
    const content = document.querySelector(".content");

    function mostrarOpciones(seccion) {
        listaOpciones.innerHTML = "";

        if (opciones[seccion] && opciones[seccion].length > 0) {
            opciones[seccion].forEach(item => {
                const li = document.createElement("li");
                li.textContent = item.nombre;

                li.addEventListener("click", () => {
                    document.querySelectorAll("#listaOpciones li").forEach(el => el.classList.remove("active"));
                    li.classList.add("active");
                    cargarContenido(item.archivo);
                });

                listaOpciones.appendChild(li);
            });
        } else {
            const li = document.createElement("li");
            li.textContent = "Selecciona una opción del menú superior";
            listaOpciones.appendChild(li);
        }
    }

    function cargarContenido(archivo) {
        if (!archivo) {
            content.innerHTML = "<p>Selecciona una opción del menú superior.</p>";
            return;
        }

        content.innerHTML = "<p>Cargando...</p>";

        fetch(archivo)
            .then(res => {
                if (!res.ok) throw new Error("No se pudo cargar la página");
                return res.text();
            })
            .then(html => {
                content.innerHTML = html;
            })
            .catch(() => {
                content.innerHTML = "<h2>Error al cargar el contenido.</h2>";
            });
    }
    
    enlaces.forEach(enlace => {
        enlace.addEventListener("click", (e) => {
            e.preventDefault();
            enlaces.forEach(a => a.classList.remove("active"));
            enlace.classList.add("active");

            const section = enlace.getAttribute("data-section");

            let seccion = "";
            if (section.includes("DatSensor")) seccion = "datos";
            else if (section.includes("Predicciones")) seccion = "predicciones";
            else if (section.includes("visualizacion")) seccion = "visualizacion";
            else if (section.includes("usuarios")) seccion = "usuarios";
            else if (section.includes("notificaciones")) seccion = "notificaciones";
            else if (section.includes("salir")) seccion = "salir";

            mostrarOpciones(seccion);

            if (opciones[seccion] && opciones[seccion].length > 0) {
                setTimeout(() => {
                    const primerItem = document.querySelector("#listaOpciones li");
                    if (primerItem) {
                        primerItem.classList.add("active");
                        cargarContenido(opciones[seccion][0].archivo);
                    }
                }, 50);
            } else {
                cargarContenido(null);
            }
        });
    });

    const enlaceVisualizacion = Array.from(enlaces).find(a => {
        const s = a.getAttribute("data-section");
        return s && s.toLowerCase().includes("visualiz");
    });

    if (enlaceVisualizacion) {
        enlaces.forEach(a => a.classList.remove("active"));
        enlaceVisualizacion.classList.add("active");

        mostrarOpciones("visualizacion");

        setTimeout(() => {
            const primerItem = document.querySelector("#listaOpciones li");
            if (primerItem) {
                primerItem.classList.add("active");
            }
        }, 50);

        cargarContenido("Visualizacion/MapInteractiv.html");
    } else {
        console.warn("No se encontró enlace de Visualización en el header.");
    }

        // --- Control del botón de usuario ---
    const userBtn = document.getElementById("userBtn");
    const userDropdown = document.getElementById("userDropdown");
    const arrow = userBtn.querySelector(".arrow");

    let dropdownVisible = false;

    // Mostrar el texto "Usuario" cuando el mouse pasa
    userBtn.addEventListener("mouseenter", () => {
        userBtn.classList.add("hover");
    });

    userBtn.addEventListener("mouseleave", () => {
        if (!dropdownVisible) userBtn.classList.remove("hover");
    });

    // Al presionar la flecha ▼ se despliega el menú
    arrow.addEventListener("click", (e) => {
        e.stopPropagation(); // evita que se cierre inmediatamente
        dropdownVisible = !dropdownVisible;
        userBtn.classList.toggle("active", dropdownVisible);
        userDropdown.classList.toggle("show", dropdownVisible);
    });

    // Cerrar si se hace clic fuera
    document.addEventListener("click", (e) => {
        if (!userMenuContains(e.target)) {
            dropdownVisible = false;
            userBtn.classList.remove("active");
            userDropdown.classList.remove("show");
        }
    });

    function userMenuContains(target) {
        return userBtn.contains(target) || userDropdown.contains(target);
    }

    // Eventos de los botones internos
    document.getElementById("changeAccount").addEventListener("click", () => {
        fetch("usuarios/cambiarCuenta.html")
            .then(r => r.text())
            .then(html => { document.querySelector(".content").innerHTML = html; });
    });

    document.getElementById("logout").addEventListener("click", () => {
        fetch("usuarios/cerrarSesion.html")
            .then(r => r.text())
            .then(html => { document.querySelector(".content").innerHTML = html; });
    });

});
