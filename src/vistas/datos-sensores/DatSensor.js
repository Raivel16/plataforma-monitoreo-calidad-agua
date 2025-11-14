
export let registrosGlobal = [];
let paginaActual = 1;
const porPagina = 20; // cantidad de registros por página

const tbody = document.querySelector("#tablaSensores tbody");

export function renderPagina() {
  tbody.innerHTML = ""; // limpiar tabla

  const inicio = (paginaActual - 1) * porPagina;
  const fin = inicio + porPagina;

  const paginaDatos = registrosGlobal.slice(inicio, fin);
  paginaDatos.forEach(agregarNuevaLectura);

  renderControles();
}

export function renderControles() {
  const cont = document.getElementById("paginacion");
  cont.innerHTML = "";

  const totalPaginas = Math.ceil(registrosGlobal.length / porPagina);

  if (totalPaginas <= 1) return; // si cabe en una sola página, no mostrar nada

  // Botón Anterior
  if (paginaActual > 1) {
    cont.innerHTML += `<button data-pag="${
      paginaActual - 1
    }">Anterior</button>`;
  }

  // Botones numéricos
  for (let i = 1; i <= totalPaginas; i++) {
    cont.innerHTML += `
    <button data-pag="${i}" class="${i === paginaActual ? "activa" : ""}">
      ${i}
    </button>`;
  }

  // Botón Siguiente
  if (paginaActual < totalPaginas) {
    cont.innerHTML += `<button data-pag="${
      paginaActual + 1
    }">Siguiente</button>`;
  }

  // Eventos
  cont.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      paginaActual = Number(btn.dataset.pag);
      renderPagina();
    });
  });
}



// --- Lecturas tabla ---
export function agregarNuevaLectura(lectura) {
  const placeholderRow = tbody.querySelector(".cargando");
  if (placeholderRow) placeholderRow.remove();

  const nuevaFilaHTML = `
              <tr>
                <td>${lectura.DatoID ?? "-"}</td>
                <td data-sensorId="${lectura.SensorID}">${
    lectura.Nombre ?? "-"
  }</td>
                <td> ${lectura.Descripcion ?? "-"}</td>
                <td data-parametroId="${lectura.ParametroID}">${
    lectura.NombreParametro ?? "-"
  }</td>
                <td>${lectura.UnidadMedida ?? "-"}</td>
                <td>${lectura.TimestampRegistro ?? "-"}</td>
                <td>${lectura.TimestampEnvio ?? "-"}</td>
                <td>${lectura.Valor_original.toFixed(4) ?? "-"}</td>
                <td>${lectura.Valor_procesado.toFixed(4) ?? "-"}</td>
                <td>${lectura.Valor_normalizado.toFixed(4) ?? "-"}</td>
              </tr>
            `;
  tbody.insertAdjacentHTML("afterbegin", nuevaFilaHTML);
}

function mostrarRegistrosIniciales(lista) {
  const placeholderRow = tbody.querySelector(".cargando");
  if (placeholderRow) placeholderRow.remove();

  registrosGlobal = lista.reverse(); // guardamos todo
  renderPagina(); // mostramos solo la primera página
}

export async function filtrarDatos(filtro, apiUrl) {
  // 1. Recargar primero para asegurar que sean los últimos datos
  const ok = await recargarDatosDesdeBD(apiUrl);
  if (!ok) return;

  // 2. Aplicar el filtro a los datos ya cargados
  filtro = filtro.toLowerCase();

  const datosFiltrados = registrosGlobal.filter((item) =>
    Object.values(item).some((v) =>
      String(v).toLowerCase().includes(filtro)
    )
  );

  registrosGlobal = datosFiltrados;
  paginaActual = 1;

  renderPagina();
}


export async function recargarDatosDesdeBD(apiUrl) {
  try {
    const res = await fetch(apiUrl);
    if (!res.ok) throw new Error("Falló al recargar");
    const registros = await res.json();

    registrosGlobal = registros.reverse();
    paginaActual = 1;

    return true;
  } catch (err) {
    console.error("Error recargando datos:", err);
    return false;
  }
}


async function cargarLecturasIniciales({ apiUrl }) {
  // cargar lecturas iniciales
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

export async function conectarSocket() {
  // socket
  const socket = io("http://localhost:3000");
  socket.on("nuevaLectura", (lectura) => {
    if (!lectura || typeof lectura !== "object") return;

    registrosGlobal.unshift(lectura); // Lo metemos al inicio
    renderPagina(); // Volvemos a dibujar la página actual
  });
  socket.on("connect_error", () => {
    const ph = tbody.querySelector(".cargando");
    if (ph) ph.textContent = "Error de conexión con el servidor.";
  });
}

export async function init({
  apiUrl = "http://localhost:3000/api/datos/",
} = {}) {
  cargarLecturasIniciales({ apiUrl });
}
