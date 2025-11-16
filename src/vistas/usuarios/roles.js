import { init, filtrarDatos } from "../util/js/tablaGenerica.js";
import { inicializar } from "../util/js/inicializar.js";

await inicializar();

const apiUrl = "http://localhost:3000/api/roles/admin";

let rolActualId = null; // null = agregar, distinto = editar

// =========================
// INICIALIZAR TABLA
// =========================
init({
  apiUrl,
  selectorTbody: "#tablaUsuarios tbody",
  mapearFilaFn: (rol) => `
    <tr>
      <td>${rol.RolID ?? "-"}</td>
      <td>${rol.NombreRol ?? "-"}</td>
      <td>${rol.EsInterno ? "Sí" : "No"}</td>
      <td>${rol.NivelPermiso ?? "-"}</td>
      <td>
        <button class="btn-edit" data-id="${rol.RolID}">Modificar</button>
      </td>
    </tr>
  `,
});

// FILTRO
document.getElementById("btn-buscar").addEventListener("click", async () => {
  const filtro = document.getElementById("input-busqueda").value.trim();
  await filtrarDatos(filtro, apiUrl);
});

// =========================
// MANEJO DEL MODAL
// =========================
const modal = document.getElementById("modalRol");
const cerrarModal = document.getElementById("cerrarModal");

const inputNombreRol = document.getElementById("inputNombreRol");
const inputEsInterno = document.getElementById("inputEsInterno");
const inputNivelPermiso = document.getElementById("inputNivelPermiso");
const btnGuardar = document.getElementById("btnGuardarRol");

function abrirModal(modo, datos = null) {
  modal.style.display = "flex";

  if (modo === "agregar") {
    rolActualId = null;
    document.getElementById("tituloModal").textContent = "Nuevo Rol";

    inputNombreRol.value = "";
    inputEsInterno.value = "0";
    inputNivelPermiso.value = "1";
  } else {
    rolActualId = datos.RolID;
    document.getElementById("tituloModal").textContent = "Modificar Rol";

    inputNombreRol.value = datos.NombreRol;
    inputEsInterno.value = datos.EsInterno ? "1" : "0";
    inputNivelPermiso.value = datos.NivelPermiso;
  }
}

function cerrar() {
  modal.style.display = "none";
}

cerrarModal.addEventListener("click", cerrar);

window.addEventListener("click", (e) => {
  if (e.target === modal) cerrar();
});

// =========================
// ABRIR MODAL AGREGAR
// =========================
document.querySelector(".btn-agregar").addEventListener("click", () => {
  abrirModal("agregar");
});

// =========================
// CLICK EN EDITAR
// =========================
document.addEventListener("click", async (e) => {
  if (!e.target.classList.contains("btn-edit")) return;

  const id = e.target.dataset.id;

  const resp = await fetch(`http://localhost:3000/api/roles/admin/${id}`);
  const datos = await resp.json();

  abrirModal("editar", datos);
});

// =========================
// GUARDAR (POST o PATCH)
// =========================
btnGuardar.addEventListener("click", async () => {
  const payload = {
    NombreRol: inputNombreRol.value.trim(),
    EsInterno: inputEsInterno.value === "1",
    NivelPermiso: Number(inputNivelPermiso.value),
  };

  if (!payload.NombreRol) {
    alert("El nombre del rol es obligatorio");
    return;
  }

  let url = "http://localhost:3000/api/roles";
  let metodo = "POST";

  if (rolActualId !== null) {
    url = `http://localhost:3000/api/roles/${rolActualId}`;
    metodo = "PATCH";
  }

  const resp = await fetch(url, {
    method: metodo,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    alert("Error al guardar el rol");
    return;
  }

  cerrar();
  await filtrarDatos("", apiUrl); // vuelve a cargar la tabla
});
