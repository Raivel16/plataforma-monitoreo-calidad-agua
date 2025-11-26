import { getSesion } from "./sesion.js";
import { inicializarMenuUsuario } from "./header.js";
import { inicializarSlider } from "./slider.js";

import { SistemaNotificaciones } from "./notificaciones.js"; // ✅ Nuevo

let sesion = null;
let sistemaNotificaciones = null; // ✅ Nuevo

function ocultarSecciones() {
  const nivel = sesion?.NivelPermiso;

  const btnDatos = document.getElementById("btn-seccion-datos-sensores");
  const btnUsuarios = document.getElementById("btn-seccion-usuarios");
  const btnNotificaciones = document.getElementById(
    "btn-seccion-notificaciones"
  );
  const btnPredicciones = document.getElementById("btn-seccion-predicciones");
  const btnVisualizacion = document.getElementById("btn-seccion-visualizacion");

  // Primero ocultamos todo
  btnDatos.style.display = "none";
  btnUsuarios.style.display = "none";
  btnNotificaciones.style.display = "none";
  btnPredicciones.style.display = "none";
  btnVisualizacion.style.display = "none";

  // Si no hay sesión → solo visualización pública
  if (!nivel) {
    btnVisualizacion.style.display = "block";
    return;
  }

  // ==== Nivel 1: Muy bajo ====
  // visualización + predicción
  if (nivel >= 1) {
    btnVisualizacion.style.display = "block";
    btnPredicciones.style.display = "block";
  }

  // ==== Nivel 2: Bajo ====
  // agrega notificaciones
  if (nivel >= 2) {
    btnNotificaciones.style.display = "block";
  }

  // ==== Nivel 3: Medio ====
  // agrega datos sensores
  if (nivel >= 3) {
    btnDatos.style.display = "block";
  }

  // ==== Nivel 4: Alto ====
  // agrega gestión de usuarios
  if (nivel >= 4) {
    btnUsuarios.style.display = "block";
  }
}

export function ocultarSubSeccionesDatosSensores() {
  const nivel = sesion?.NivelPermiso;

  const btnIngesta = document.getElementById("btn-subseccion-ingesta");
  const btnFiltro = document.getElementById("btn-subseccion-filtro");
  const btnSensores = document.getElementById("btn-subseccion-sensores");
  const btnParametros = document.getElementById("btn-subseccion-parametros");
  const btnUmbrales = document.getElementById("btn-subseccion-umbrales");

  // Primero ocultamos todo
  btnIngesta.style.display = "none";
  btnFiltro.style.display = "none";
  btnSensores.style.display = "none";
  btnParametros.style.display = "none";
  btnUmbrales.style.display = "none";

  // Si no hay sesión → solo visualización pública
  if (!nivel) {
    return;
  }

  // ==== Nivel 3: Medio ====
  // ver filtro y ingesta
  if (nivel >= 3) {
    btnFiltro.style.display = "block";
  }

  // ==== Nivel 4: Alto ====
  // ver filtro, sensores y parametros
  if (nivel >= 4) {
    btnIngesta.style.display = "block";
    btnSensores.style.display = "block";
    btnParametros.style.display = "block";
    btnUmbrales.style.display = "block";
  }
}

export async function inicializar() {
  // mostrar sesión (rellena dropdown)
  sesion = await getSesion();
  if (sesion.logeado) {
    document.getElementById("nombreUsuario").textContent = sesion.NombreUsuario;

    // ✅ Conectar Socket.IO GLOBALMENTE
    if (typeof io !== "undefined") {
      window.socket = io("http://localhost:3000");
      console.log("🔌 Socket.IO conectado globalmente");

      window.socket.on("connect", () => {
        console.log("✅ Socket.IO: Conexión establecida");
      });

      window.socket.on("connect_error", (error) => {
        console.error("❌ Socket.IO: Error de conexión", error);
      });
    } else {
      console.warn(
        "⚠️ Socket.IO no está cargado - verifique que socket.io.js esté incluido en el HTML"
      );
    }

    // ✅ Inicializar sistema de notificaciones DESPUÉS de conectar socket
    sistemaNotificaciones = new SistemaNotificaciones();
    await sistemaNotificaciones.inicializar();
  } else {
    document.getElementById("nombreUsuario").textContent = "Invitado";
  }

  inicializarMenuUsuario();
  inicializarSlider();

  ocultarSecciones();
}
