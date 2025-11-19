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
    cont.innerHTML += `<button data-pag="${
      paginaActual - 1
    }">Anterior</button>`;

  for (let i = 1; i <= totalPaginas; i++)
    cont.innerHTML += `
      <button data-pag="${i}" class="${i === paginaActual ? "activa" : ""}">
        ${i}
      </button>`;

  if (paginaActual < totalPaginas)
    cont.innerHTML += `<button data-pag="${
      paginaActual + 1
    }">Siguiente</button>`;

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
    if (ph) ph.textContent = "No se pueden obtener los datos en este momento.";
    console.error(err);
  }
}

export async function filtrarDatos(filtro, apiUrl) {
  await recargarDatosDesdeBD(apiUrl);

  filtro = filtro.toLowerCase();
  registrosGlobal = registrosGlobal.filter((item) =>
    Object.values(item).some((v) => String(v).toLowerCase().includes(filtro))
  );

  paginaActual = 1;
  renderPagina();
}

export async function conectarSocket() {
  // Usar el socket global si existe, sino crear uno local
  const socket = window.socket || io("http://localhost:3000");

  // Si no había socket global, crearlo
  if (!window.socket) {
    window.socket = socket;
  }

  socket.on("nuevaLectura", (lectura) => {
    if (lectura && typeof lectura === "object") {
      registrosGlobal.unshift(lectura);
      renderPagina();
    }
  });

  socket.on("connect_error", () => {
    const ph = tbody?.querySelector(".cargando");
    if (ph) ph.textContent = "Error de conexión con el servidor.";
  });
}

export async function init({ apiUrl, selectorTbody, mapearFilaFn }) {
  configurarTabla({
    selectorTbody,
    mapear: mapearFilaFn,
  });

  cargarLecturasIniciales(apiUrl);
}
