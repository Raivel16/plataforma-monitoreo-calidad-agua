 const authApi = "/api/auth";

    /**
     * Helper genérico para parsear respuestas del backend (de PÁGINA 2)
     */
    async function handleApiResponse(res) {
      const ct = res.headers.get("content-type") || "";
      let data = null;
      if (ct.includes("application/json")) {
        try {
          data = await res.json();
        } catch (e) {
          throw {
            mensaje: `Respuesta JSON inválida del servidor (status ${res.status})`,
          };
        }
      } else {
        const text = await res.text();
        throw {
          mensaje: `Respuesta inesperada del servidor: ${res.status} ${text}`,
        };
      }

      if (res.ok) return data;

      // Zod-normalized: { error: { errors: [ { message, path } ] } }
      if (data && data.error && Array.isArray(data.error.errors)) {
        const mensajes = data.error.errors.map(
          (e) => e.message || JSON.stringify(e)
        );
        throw { errores: mensajes };
      }
      
      // Otros formatos de error
      if (data && Array.isArray(data.error)) {
        const mensajes = data.error.map((e) => e.message || String(e));
        throw { errores: mensajes };
      }
      if (data && Array.isArray(data.errores)) {
        const mensajes = data.errores.map((e) =>
          typeof e === "string" ? e : e.message || String(e)
        );
        throw { errores: mensajes };
      }

      const msg =
        data?.mensaje ||
        data?.message ||
        data?.error ||
        "Error en la petición";
      throw { mensaje: msg };
    }

    /**
     * Función de Login (de PÁGINA 2)
     */
    async function login(usuario, password) {
      // backend espera NombreUsuario y Contrasena
      const res = await fetch(authApi + "/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          NombreUsuario: usuario,
          Contrasena: password,
        }),
      });
      return await handleApiResponse(res);
    }

    /**
     * Función para obtener sesión (de PÁGINA 2)
     */
    async function getSesion() {
      try {
        const res = await fetch(`${authApi}/session`, {
          credentials: "same-origin",
        });

        if (res.status === 401) {
          console.warn("⚠️ No tiene sesión activa");
          return { logeado: false };
        }
        if (!res.ok) {
          console.error("Error al obtener sesión:", res.status);
          return { logeado: false };
        }
        return await res.json();
      } catch (error) {
        console.error("Error de conexión al obtener sesión:", error);
        return { logeado: false };
      }
    }


    // --- Lógica principal de la PÁGINA 1 (adaptada) ---
    document.addEventListener("DOMContentLoaded", () => {
      
      const btnLogin = document.getElementById("btnLogin");
      const anonimoBtn = document.getElementById("anonimoBtn");
      const usuarioInput = document.getElementById("usuario");
      const passInput = document.getElementById("contraseña");
      const mensajeDiv = document.getElementById("mensaje");

      // URL de redirección exitosa (la que usaba tu script original)
      const redirectUrl = "./visualizacion";

      // (MEJORA) Revisar si ya hay sesión al cargar la página
      (async () => {
        const sesion = await getSesion();
        if (sesion.logeado) {
          console.log("Usuario ya logueado, redirigiendo...");
          window.location.href = redirectUrl;
        }
      })();


      // Manejador del botón de Login
      if (btnLogin) {
        btnLogin.addEventListener("click", async () => {
          
          const usuario = usuarioInput.value.trim();
          const contraseña = passInput.value.trim();
          
          if (!usuario || !contraseña) {
            mensajeDiv.style.color = "crimson";
            mensajeDiv.textContent = "⚠️ Por favor completa todos los campos.";
            return;
          }

          mensajeDiv.style.color = "#333";
          mensajeDiv.textContent = "Validando...";
          btnLogin.disabled = true;

          try {
            // Llamamos a la función de login de la API
            const datosUsuario = await login(usuario, contraseña);
            
            // Éxito
            mensajeDiv.style.color = "green";
            mensajeDiv.textContent = "✅ Inicio de sesión exitoso. Redirigiendo...";
            
            // Redirigir (igual que en tu script original)
            setTimeout(() => {
              window.location.href = redirectUrl;
            }, 1000);

          } catch (err) {
            // Error (usando la lógica de PÁGINA 2)
            mensajeDiv.style.color = "crimson";
            if (err && err.errores) {
              mensajeDiv.textContent = Array.isArray(err.errores)
                ? err.errores.join(" | ")
                : String(err.errores);
            } else {
              mensajeDiv.textContent = `❌ ${err.mensaje || err.message || "Usuario o contraseña incorrectos."}`;
            }
            console.error(err);
            btnLogin.disabled = false;
          }
        });
      }

      // Botón "Seguir como invitado" (lógica original)
      if (anonimoBtn) {
        anonimoBtn.addEventListener("click", () => {
          // Redirige a la zona de visualización general
          window.location.href = "./visualizacion/";
        });
      }
    });

















// // Detectar si estamos en login o registro
// document.addEventListener("DOMContentLoaded", () => {
//   const btnLogin = document.getElementById("btnLogin");
//   const btnRegistrar = document.getElementById("btnRegistrar");

//   // === LOGIN ===
//   if (btnLogin) {
//     btnLogin.addEventListener("click", () => {
//       const usuario = document.getElementById("usuario").value.trim();
//       const contraseña = document.getElementById("contraseña").value.trim();
//       const mensaje = document.getElementById("mensaje");

//       if (!usuario || !contraseña) {
//         mensaje.textContent = "⚠️ Por favor completa todos los campos.";
//         return;
//       }

//       // Obtener usuarios guardados
//       const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];

//       // Buscar si existe
//       const usuarioEncontrado = usuarios.find(u => u.usuario === usuario && u.contraseña === contraseña);

//       if (usuarioEncontrado) {
//         mensaje.textContent = "✅ Inicio de sesión exitoso. Redirigiendo...";
//         localStorage.setItem("usuario", usuarioEncontrado.usuario);
//         setTimeout(() => {
//           window.location.href = "./Visualizacion/MapInteractiv.html  "; // Redirige al panel
//         }, 1000);
//       } else {
//         mensaje.textContent = "❌ Usuario o contraseña incorrectos.";
//       }
//     });

//     // Botón "Seguir como invitado"
//     const anonimoBtn = document.getElementById("anonimoBtn");
//     if (anonimoBtn) {
//       anonimoBtn.addEventListener("click", () => {
//         localStorage.setItem("usuario", "Invitado");
//         window.location.href = "./visualizacion/";
//       });
//     }
//   }

//   // === REGISTRO ===
//   if (btnRegistrar) {
//     btnRegistrar.addEventListener("click", () => {
//       const nuevoUsuario = document.getElementById("nuevoUsuario").value.trim();
//       const nuevaContraseña = document.getElementById("nuevaContraseña").value.trim();
//       const confirmarContraseña = document.getElementById("confirmarContraseña").value.trim();
//       const rol = document.getElementById("rol").value;
//       const mensaje = document.getElementById("mensaje");

//       if (!nuevoUsuario || !nuevaContraseña || !confirmarContraseña || !rol) {
//         mensaje.textContent = "⚠️ Por favor completa todos los campos.";
//         return;
//       }

//       if (nuevaContraseña !== confirmarContraseña) {
//         mensaje.textContent = "⚠️ Las contraseñas no coinciden.";
//         return;
//       }

//       // Obtener usuarios guardados
//       const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];

//       // Validar si ya existe
//       const existe = usuarios.some(u => u.usuario === nuevoUsuario);
//       if (existe) {
//         mensaje.textContent = "⚠️ El usuario ya existe.";
//         return;
//       }

//       // Guardar usuario nuevo
//       usuarios.push({ usuario: nuevoUsuario, contraseña: nuevaContraseña, rol });
//       localStorage.setItem("usuarios", JSON.stringify(usuarios));

//       mensaje.textContent = "✅ Registro exitoso. Redirigiendo al login...";
//       setTimeout(() => {
//         window.location.href = "index.html"; // Vuelve al login
//       }, 1500);
//     });
//   }
// });
