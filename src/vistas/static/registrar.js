const authApi = "/api/auth";

/** 
 * Helper para manejar respuestas del backend
 * (copiado de index2.html, adaptado para registro)
 */
async function handleApiResponse(res) {
  const ct = res.headers.get("content-type") || "";
  let data = null;
  if (ct.includes("application/json")) {
    try {
      data = await res.json();
    } catch (e) {
      throw { mensaje: `Respuesta JSON inválida del servidor (status ${res.status})` };
    }
  } else {
    const text = await res.text();
    throw { mensaje: `Respuesta inesperada del servidor: ${res.status} ${text}` };
  }

  if (res.ok) return data;

  if (data?.error?.errors) {
    const mensajes = data.error.errors.map(e => e.message || JSON.stringify(e));
    throw { errores: mensajes };
  }
  if (Array.isArray(data?.error)) {
    throw { errores: data.error.map(e => e.message || String(e)) };
  }
  if (Array.isArray(data?.errores)) {
    throw { errores: data.errores.map(e => typeof e === "string" ? e : e.message || String(e)) };
  }

  throw { mensaje: data?.mensaje || data?.message || "Error en la petición" };
}

/**
 * Función de registro (idéntica a la de index2.html)
 */
async function register(email, usuario, password, password_repeat, rol) {
  const RolID = parseInt(rol);
  const payload = {
    RolID,
    NombreUsuario: usuario,
    Contrasena: password,
    RepetirContrasena: password_repeat,
    Correo: email,
    Activo: true,
  };

  const res = await fetch(authApi + "/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  return await handleApiResponse(res);
}

/**
 * Cargar roles dinámicamente desde la API
 */
async function cargarRoles() {
  const select = document.getElementById("rol");
  try {
    const res = await fetch("/api/roles");
    if (!res.ok) throw new Error("No se pudieron obtener los roles");

    const roles = await res.json();
    select.innerHTML = `<option value="">Seleccionar rol</option>`;
    roles.forEach((r) => {
      const opt = document.createElement("option");
      opt.value = r.RolID;
      opt.textContent = r.NombreRol;
      select.appendChild(opt);
    });
  } catch (error) {
    console.error("❌ Error al cargar roles:", error);
    select.innerHTML = `<option value="">Error al cargar roles</option>`;
  }
}

/**
 * Lógica principal del registro
 */
document.addEventListener("DOMContentLoaded", () => {
  const btnRegistrar = document.getElementById("btnRegistrar");
  const mensaje = document.getElementById("mensaje");

  // Cargar roles al iniciar
  cargarRoles();

  if (btnRegistrar) {
    btnRegistrar.addEventListener("click", async () => {
      const correo = document.getElementById("correo").value.trim();
      const nuevoUsuario = document.getElementById("nuevoUsuario").value.trim();
      const nuevaContraseña = document.getElementById("nuevaContraseña").value.trim();
      const confirmarContraseña = document.getElementById("confirmarContraseña").value.trim();
      const rol = document.getElementById("rol").value;

      mensaje.style.color = "crimson";
      mensaje.textContent = "";

      // Validaciones básicas
      if (!correo || !nuevoUsuario || !nuevaContraseña || !confirmarContraseña || !rol) {
        mensaje.textContent = "⚠️ Por favor completa todos los campos.";
        return;
      }

      if (nuevaContraseña !== confirmarContraseña) {
        mensaje.textContent = "⚠️ Las contraseñas no coinciden.";
        return;
      }

      try {
        await register(correo, nuevoUsuario, nuevaContraseña, confirmarContraseña, rol);
        mensaje.style.color = "green";
        mensaje.textContent = "✅ Registro exitoso. Redirigiendo al login...";
        setTimeout(() => {
          window.location.href = "./index.html";
        }, 1500);
      } catch (err) {
        mensaje.style.color = "crimson";
        if (err.errores) {
          mensaje.textContent = Array.isArray(err.errores)
            ? err.errores.join(" | ")
            : String(err.errores);
        } else {
          mensaje.textContent = err.mensaje || "❌ Error inesperado.";
        }
        console.error("❌ Error al registrar:", err);
      }
    });
  }
});
