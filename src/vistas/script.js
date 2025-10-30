// logiregs.js

// Detectar si estamos en login o registro
document.addEventListener("DOMContentLoaded", () => {
  const btnLogin = document.getElementById("btnLogin");
  const btnRegistrar = document.getElementById("btnRegistrar");

  // === LOGIN ===
  if (btnLogin) {
    btnLogin.addEventListener("click", () => {
      const usuario = document.getElementById("usuario").value.trim();
      const contraseña = document.getElementById("contraseña").value.trim();
      const mensaje = document.getElementById("mensaje");

      if (!usuario || !contraseña) {
        mensaje.textContent = "⚠️ Por favor completa todos los campos.";
        return;
      }

      // Obtener usuarios guardados
      const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];

      // Buscar si existe
      const usuarioEncontrado = usuarios.find(u => u.usuario === usuario && u.contraseña === contraseña);

      if (usuarioEncontrado) {
        mensaje.textContent = "✅ Inicio de sesión exitoso. Redirigiendo...";
        localStorage.setItem("usuario", usuarioEncontrado.usuario);
        setTimeout(() => {
          window.location.href = "./Visualizacion/MapInteractiv.html  "; // Redirige al panel
        }, 1000);
      } else {
        mensaje.textContent = "❌ Usuario o contraseña incorrectos.";
      }
    });

    // Botón "Seguir como invitado"
    const anonimoBtn = document.getElementById("anonimoBtn");
    if (anonimoBtn) {
      anonimoBtn.addEventListener("click", () => {
        localStorage.setItem("usuario", "Invitado");
        window.location.href = "./visualizacion/";
      });
    }
  }

  // === REGISTRO ===
  if (btnRegistrar) {
    btnRegistrar.addEventListener("click", () => {
      const nuevoUsuario = document.getElementById("nuevoUsuario").value.trim();
      const nuevaContraseña = document.getElementById("nuevaContraseña").value.trim();
      const confirmarContraseña = document.getElementById("confirmarContraseña").value.trim();
      const rol = document.getElementById("rol").value;
      const mensaje = document.getElementById("mensaje");

      if (!nuevoUsuario || !nuevaContraseña || !confirmarContraseña || !rol) {
        mensaje.textContent = "⚠️ Por favor completa todos los campos.";
        return;
      }

      if (nuevaContraseña !== confirmarContraseña) {
        mensaje.textContent = "⚠️ Las contraseñas no coinciden.";
        return;
      }

      // Obtener usuarios guardados
      const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];

      // Validar si ya existe
      const existe = usuarios.some(u => u.usuario === nuevoUsuario);
      if (existe) {
        mensaje.textContent = "⚠️ El usuario ya existe.";
        return;
      }

      // Guardar usuario nuevo
      usuarios.push({ usuario: nuevoUsuario, contraseña: nuevaContraseña, rol });
      localStorage.setItem("usuarios", JSON.stringify(usuarios));

      mensaje.textContent = "✅ Registro exitoso. Redirigiendo al login...";
      setTimeout(() => {
        window.location.href = "index.html"; // Vuelve al login
      }, 1500);
    });
  }
});
