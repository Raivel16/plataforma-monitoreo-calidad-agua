import { init, filtrarDatos } from "../util/js/tablaGenerica.js";
import { inicializar } from "../util/js/inicializar.js";

await inicializar();

const apiUrl = "http://localhost:3000/api/usuarios/";

init({
  apiUrl,
  selectorTbody: "#tablaUsuarios tbody",
  mapearFilaFn: (lectura) => `
              <tr>
                <td>${lectura.UsuarioID ?? "-"}</td>
                <td>${lectura.NombreUsuario ?? "-"}</td>
                <td>${lectura.Correo ?? "-"}</td>
                <td data-rolId="${lectura.RolID}">${lectura.NombreRol ?? "-"}
                <td>${lectura.EstadoUsuario ?? "-"}</td>
                <td>
                    <button class="btn-edit" data-id="${
                      lectura.UsuarioID
                    }">Modificar</button>
                    </td>
              </tr>
            `,
});

// ===================================
// FILTRO
// ===================================
document.getElementById("btn-buscar").addEventListener("click", async () => {
  const filtro = document.getElementById("input-busqueda").value.trim();
  await filtrarDatos(filtro, apiUrl);
});

// ===============================
// MODAL - AGREGAR / EDITAR
// ===============================
// ===============================
// REFERENCIAS
// ===============================
const modal = document.getElementById("modalUsuario");
const btnAgregar = document.querySelector(".btn-agregar");
const btnCerrar = document.getElementById("cerrarModal");
const btnGuardar = document.getElementById("btnGuardar");

const tituloModal = document.getElementById("tituloModal");
const nombreInput = document.getElementById("nombreUsuarioInput");
const correoInput = document.getElementById("correoInput");
const rolInput = document.getElementById("rolInput");
const estadoInput = document.getElementById("estadoInput");

const grupoPassword = document.getElementById("grupoPassword");
const passwordInput = document.getElementById("passwordInput");
const password2Input = document.getElementById("password2Input");


let editId = null; // null → agregar, número → editar

// ===============================
// Cargar roles en el select
// ===============================
async function cargarRoles() {
  try {
    const res = await fetch("http://localhost:3000/api/roles/admin");
    const roles = await res.json();
    rolInput.innerHTML = roles
      .map((r) => `<option value="${r.RolID}">${r.NombreRol}</option>`)
      .join("");
  } catch (error) {
    console.error("Error cargando roles", error);
  }
}

// ===============================
// CERRAR MODAL
// ===============================
btnCerrar.onclick = () => (modal.style.display = "none");
window.onclick = (e) => {
  if (e.target === modal) modal.style.display = "none";
};


// ===============================
// ABRIR MODAL PARA AGREGAR
// ===============================
btnAgregar.addEventListener("click", async () => {
  editId = null;

  tituloModal.textContent = "Agregar Usuario";

  nombreInput.value = "";
  correoInput.value = "";
  passwordInput.value = "";
  password2Input.value = "";
  estadoInput.value = "1";

  nombreInput.disabled = false;
  correoInput.disabled = false;

  grupoPassword.style.display = "block"; // mostrar contraseñas

  await cargarRoles();
  modal.style.display = "flex";
});

// ===============================
// CLICK EN EDITAR
// ===============================
document.addEventListener("click", async (e) => {
  if (e.target.classList.contains("btn-edit")) {
    editId = e.target.dataset.id;

    tituloModal.textContent = "Modificar Usuario";

    const res = await fetch(apiUrl + editId);
    const result = await res.json();
    const usr = result[0];

    nombreInput.value = usr.NombreUsuario;
    correoInput.value = usr.Correo;
    estadoInput.value = usr.Activo ? "1" : "0";
    await cargarRoles();
    rolInput.value = usr.RolID;

    // No permitir modificar usuario ni correo
    nombreInput.disabled = true;
    correoInput.disabled = true;

    // Campos contraseña NO visibles en editar
    grupoPassword.style.display = "none";

    modal.style.display = "flex";
  }
});

// ===============================
// GUARDAR
// ===============================
btnGuardar.addEventListener("click", async () => {
  let payload;

  if (editId === null) {
    // ===========================
    // AGREGAR
    // ===========================
    if (!nombreInput.value.trim() || !correoInput.value.trim()) {
      alert("Complete Usuario y Correo.");
      return;
    }

    if (!passwordInput.value.trim() || !password2Input.value.trim()) {
      alert("Debe ingresar la contraseña dos veces.");
      return;
    }

    if (passwordInput.value !== password2Input.value) {
      alert("Las contraseñas no coinciden.");
      return;
    }

    payload = {
      NombreUsuario: nombreInput.value.trim(),
      Correo: correoInput.value.trim(),
      Contrasena: passwordInput.value.trim(),
      RepetirContrasena: password2Input.value.trim(),
      RolID: Number(rolInput.value),
      Activo: estadoInput.value === "1",
    };
  } else {
    // ===========================
    // EDITAR → NO enviar usuario ni correo
    // ===========================
    payload = {
      RolID: Number(rolInput.value),
      Activo: estadoInput.value === "1",
    };
  }

  try {
    let res;

    if (editId === null) {
      res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      res = await fetch(apiUrl + editId, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    if (!res.ok) throw new Error("Error al guardar");

    modal.style.display = "none";
    await filtrarDatos("", apiUrl);

  } catch (err) {
    console.error(err);
    alert("Hubo un error al guardar.");
  }
});