import { filtrarDatos, init } from "../util/js/tablaGenerica.js";
import { inicializar, ocultarSubSeccionesDatosSensores } from "../util/js/inicializar.js";

await inicializar();

const apiUrl = "http://localhost:3000/api/sensores/";

// ===================================
// Inicializar tabla
// ===================================
init({
  apiUrl,
  selectorTbody: "#tablaSensores tbody",
  mapearFilaFn: (s) => `
      <tr>
        <td>${s.SensorID ?? "-"}</td>
        <td>${s.Nombre ?? "-"}</td>
        <td>${s.Descripcion ?? "-"}</td>
        <td>${s.Modelo ?? "-"}</td>
        <td>${s.Fabricante ?? "-"}</td>
        <td>${s.Latitud ?? "-"}</td>
        <td>${s.Longitud ?? "-"}</td>
        <td data-estadoOperativo="${s.EstadoOperativo}">${
          s.EstadoOperativoTexto ?? "-"
        }
        <td>
            <button class="btn-edit" data-id="${s.SensorID}">Modificar</button>
        </td>
      </tr>
  `,
});

// ===================================
// MODALES
// ===================================
const modalAgregar = document.getElementById("modalAgregar");
const modalEditar = document.getElementById("modalEditar");

// abrir modal agregar
document.querySelector(".btn-agregar").addEventListener("click", () => {
  modalAgregar.style.display = "flex";
});

// cerrar modales
document.querySelectorAll(".cerrar").forEach((btn) => {
  btn.addEventListener("click", () => {
    modalAgregar.style.display = "none";
    modalEditar.style.display = "none";
  });
});

window.onclick = (e) => {
  if (e.target === modalAgregar) modalAgregar.style.display = "none";
  if (e.target === modalEditar) modalEditar.style.display = "none";
};

// ===================================
// CLICK EDITAR
// ===================================
document.addEventListener("click", async (e) => {
  if (e.target.classList.contains("btn-edit")) {
    const id = e.target.dataset.id;

    const res = await fetch(apiUrl + id);
    const s = await res.json();

    // llenar campos
    document.getElementById("editar-id").value = s.SensorID;
    document.getElementById("editar-nombre").value = s.Nombre;
    document.getElementById("editar-descripcion").value = s.Descripcion;
    document.getElementById("editar-modelo").value = s.Modelo;
    document.getElementById("editar-fabricante").value = s.Fabricante;
    document.getElementById("editar-latitud").value = s.Latitud;
    document.getElementById("editar-longitud").value = s.Longitud;
    document.getElementById("editar-estado").value = s.EstadoOperativo;

    modalEditar.style.display = "flex";
  }
});

// ===================================
// CLICK ELIMINAR (PATCH /desactivar)
// ===================================
document.addEventListener("click", async (e) => {
  if (e.target.classList.contains("btn-delete")) {
    const id = e.target.dataset.id;

    if (!confirm("¿Seguro que deseas desactivar este sensor?")) return;

    await fetch(apiUrl + id + "/desactivar", {
      method: "PATCH",
    });

    // refrescar tabla
    await filtrarDatos("", apiUrl);
  }
});

// ===================================
// SUBMIT AGREGAR (POST /)
// ===================================
document.getElementById("formAgregar").addEventListener("submit", async (e) => {
  e.preventDefault();

  const nuevo = {
    Nombre: document.getElementById("agregar-nombre").value,
    Descripcion: document.getElementById("agregar-descripcion").value,
    Modelo: document.getElementById("agregar-modelo").value,
    Fabricante: document.getElementById("agregar-fabricante").value,
    Latitud: document.getElementById("agregar-latitud").value,
    Longitud: document.getElementById("agregar-longitud").value,
    EstadoOperativo: document.getElementById("agregar-estado").value,
  };

  await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(nuevo),
  });

  modalAgregar.style.display = "none";

  // refrescar tabla
  await filtrarDatos("", apiUrl);
});

// ===================================
// SUBMIT EDITAR (PATCH /:id)
// ===================================
document.getElementById("formEditar").addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = document.getElementById("editar-id").value;

  const editado = {
    Nombre: document.getElementById("editar-nombre").value,
    Descripcion: document.getElementById("editar-descripcion").value,
    Modelo: document.getElementById("editar-modelo").value,
    Fabricante: document.getElementById("editar-fabricante").value,
    Latitud: document.getElementById("editar-latitud").value,
    Longitud: document.getElementById("editar-longitud").value,
    EstadoOperativo: document.getElementById("editar-estado").value,
  };

  await fetch(apiUrl + id, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(editado),
  });

  modalEditar.style.display = "none";

  // refrescar tabla
  await filtrarDatos("", apiUrl);
});

// ===================================
// FILTRO
// ===================================
document.getElementById("btn-buscar").addEventListener("click", async () => {
  const filtro = document.getElementById("input-busqueda").value.trim();
  await filtrarDatos(filtro, apiUrl);
});

ocultarSubSeccionesDatosSensores();