import { getSesion } from "./sesion.js";
import { inicializarMenuUsuario } from "./header.js";
import { inicializarSlider } from "./slider.js";

async function ocultarSecciones(sesion) {
  const RolID = sesion?.RolID;

  const btnDatos = document.getElementById("btn-seccion-datos-sensores");
  const btnUsuarios = document.getElementById("btn-seccion-usuarios");
  const btnNotificaciones = document.getElementById(
    "btn-seccion-notificaciones"
  );
  const btnPredicciones = document.getElementById("btn-seccion-predicciones");
  const btnVisualizacion = document.getElementById("btn-seccion-visualizacion");

  if (RolID === 3) {
    // ROL 3 → ve menos cosas
    btnDatos.style.display = "none";
    btnUsuarios.style.display = "none";
    btnNotificaciones.style.display = "block";
    btnPredicciones.style.display = "block";
    btnVisualizacion.style.display = "block";
  } else if (RolID === 2) {
    // ROL 2 → ve algunas cosas
    btnUsuarios.style.display = "none";

    btnNotificaciones.style.display = "block";
    btnDatos.style.display = "block";
    btnPredicciones.style.display = "block";
    btnVisualizacion.style.display = "block";
  } else if (RolID === 1) {
    // ROL 1 → ve todas las cosas
    btnUsuarios.style.display = "block";
    btnNotificaciones.style.display = "block";
    btnDatos.style.display = "block";
    btnPredicciones.style.display = "block";
    btnVisualizacion.style.display = "block";
  } else {
    // Si no hay sesión o no hay RolID → ocultamos todo
    btnDatos.style.display = "none";
    btnUsuarios.style.display = "none";
    btnNotificaciones.style.display = "none";
    btnPredicciones.style.display = "none";
    btnVisualizacion.style.display = "block";
  }
}

export async function inicializar() {
  // mostrar sesión (rellena dropdown)
  const sesion = await getSesion();
  if (sesion.logeado) {
    document.getElementById("nombreUsuario").textContent = sesion.NombreUsuario;
  } else {
    document.getElementById("nombreUsuario").textContent = "Invitado";
  }

  inicializarMenuUsuario();
  inicializarSlider();

  await ocultarSecciones(sesion);
}
