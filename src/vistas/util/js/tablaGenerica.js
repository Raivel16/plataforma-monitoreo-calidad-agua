// archivo: util/js/tablaGenerica.js  (reemplaza la función conectarSocket)
import { initNotificacionesGlobales } from "../js/notificaciones.js"; // si usas bundler/ESM; si no, notificaciones se expone en window
import { getSesion } from "./sesion.js"; // tu función existente (usa la misma ruta)



export let registrosGlobal = [];
let paginaActual = 1;
let porPagina = 20;

let tbody = null;
let mapearFila = null; // 👈 función que arma la fila según la tabla

export function configurarTabla({
  selectorTbody,
  filasPorPagina = 20,
  mapear,
}) {
  tbody = document.querySelector(selectorTbody);
  porPagina = filasPorPagina;
  mapearFila = mapear;
}


export function renderPagina() {
  tbody.innerHTML = "";

  const inicio = (paginaActual - 1) * porPagina;
  const fin = inicio + porPagina;

  const paginaDatos = registrosGlobal.slice(inicio, fin);
  paginaDatos.forEach((item) => {
    const html = mapearFila(item);
    tbody.insertAdjacentHTML("beforeend", html);
  });

  renderControles();
}



export function renderControles() {
  const cont = document.getElementById("paginacion");
  cont.innerHTML = "";

  const totalPaginas = Math.ceil(registrosGlobal.length / porPagina);
  if (totalPaginas <= 1) return;

  if (paginaActual > 1)
    cont.innerHTML += `<button data-pag="${paginaActual - 1}">Anterior</button>`;

  for (let i = 1; i <= totalPaginas; i++)
    cont.innerHTML += `
      <button data-pag="${i}" class="${i === paginaActual ? "activa" : ""}">
        ${i}
      </button>`;

  if (paginaActual < totalPaginas)
    cont.innerHTML += `<button data-pag="${paginaActual + 1}">Siguiente</button>`;

  cont.querySelectorAll("button").forEach((btn) =>
    btn.addEventListener("click", () => {
      paginaActual = Number(btn.dataset.pag);
      renderPagina();
    })
  );
}

function mostrarRegistrosIniciales(lista) {
  const placeholderRow = tbody.querySelector(".cargando");
  if (placeholderRow) placeholderRow.remove();

  registrosGlobal = lista.reverse();
  renderPagina();
}

export async function recargarDatosDesdeBD(apiUrl) {
  try {
    const res = await fetch(apiUrl);
    if (!res.ok) throw new Error("Falló petición");
    registrosGlobal = (await res.json()).reverse();
    paginaActual = 1;
    return true;
  } catch (err) {
    console.error("Error recargando:", err);
    return false;
  }
}

async function cargarLecturasIniciales(apiUrl) {
  try {
    const res = await fetch(apiUrl);
    if (!res.ok) throw new Error("falló");

    const registros = await res.json();
    if (Array.isArray(registros) && registros.length)
      mostrarRegistrosIniciales(registros);
    else {
      const ph = tbody.querySelector(".cargando");
      if (ph) ph.textContent = "No hay datos disponibles.";
    }
  } catch (err) {
    const ph = tbody.querySelector(".cargando");
    if (ph)
      ph.textContent = "No se pueden obtener los datos en este momento.";
    console.error(err);
  }
}


export async function filtrarDatos(filtro, apiUrl) {
  await recargarDatosDesdeBD(apiUrl);

  filtro = filtro.toLowerCase();
  registrosGlobal = registrosGlobal.filter((item) =>
    Object.values(item).some((v) =>
      String(v).toLowerCase().includes(filtro)
    )
  );

  paginaActual = 1;
  renderPagina();
}

export async function conectarSocket() {
  // Inicia sistema global de notificaciones (se unirá a la room si hay sesión)
  let session = null;
  try {
    session = await getSesion(); // tu implementación devuelve { logeado, UsuarioID, NivelPermiso, ... }
  } catch (e) {
    console.warn("No se pudo obtener session en conectarSocket:", e);
  }

  // inicializa notificaciones (esto crea io() y hace join si session.UsuarioID)
  // Si tu entorno no usa módulos para notificaciones, window.initNotificacionesGlobales existe.
  let socket;
  if (typeof initNotificacionesGlobales === "function") {
    socket = await initNotificacionesGlobales(session);
  } else if (window.initNotificacionesGlobales) {
    socket = await window.initNotificacionesGlobales(session);
  } else {
    // Fallback simple: fallback to previous simple socket
    socket = io("http://localhost:3000");
    if (session && session.logeado && session.UsuarioID) {
      socket.on("connect", () => socket.emit("joinUserRoom", { UsuarioID: session.UsuarioID }));
    }

    socket.on("nuevaAlerta", (payload) => {
      // simple toast if not using notifications.js
      console.log("Alerta recibida:", payload);
      alert(`${payload.tipo} - ${payload.mensaje}`);
    });
  }

  // Mantener comportamiento original con nuevaLectura
  socket.on("nuevaLectura", (lectura) => {
    if (lectura && typeof lectura === "object") {
      registrosGlobal.unshift(lectura);
      // Si la longitud es alta, recorta (opcional)
      // registrosGlobal = registrosGlobal.slice(0, 1000);
      renderPagina();
    }
  });

  socket.on("connect_error", () => {
    const ph = tbody.querySelector(".cargando");
    if (ph) ph.textContent = "Error de conexión con el servidor.";
  });

  return socket;
}

export async function init({ apiUrl, selectorTbody, mapearFilaFn }) {
  configurarTabla({
    selectorTbody,
    mapear: mapearFilaFn,
  });

  cargarLecturasIniciales(apiUrl);
}
