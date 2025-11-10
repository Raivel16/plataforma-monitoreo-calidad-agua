import { getSesion } from "./sesion.js";
import { inicializarMenuUsuario } from "./header.js";
import { inicializarSlider } from "./slider.js";

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
}
