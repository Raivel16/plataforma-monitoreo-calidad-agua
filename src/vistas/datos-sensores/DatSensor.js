import { inicializar } from "../util/js/inicializar.js";

const tbody = document.querySelector("#tablaSensores tbody");

// --- Lecturas tabla ---
function agregarNuevaLectura(lectura) {
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
  lista.reverse().forEach(agregarNuevaLectura);
}

async function cargarLecturasIniciales() {
  // cargar lecturas iniciales
  try {
    const res = await fetch("http://localhost:3000/api/datos/ultimos");
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

// --- Inicialización ---
(async () => {
  await inicializar();

  cargarLecturasIniciales();

  // socket
  const socket = io("http://localhost:3000");
  socket.on("nuevaLectura", (lectura) => {
    if (lectura && typeof lectura === "object" && !Array.isArray(lectura))
      agregarNuevaLectura(lectura);
  });
  socket.on("connect_error", () => {
    const ph = tbody.querySelector(".cargando");
    if (ph) ph.textContent = "Error de conexión con el servidor.";
  });
})();
