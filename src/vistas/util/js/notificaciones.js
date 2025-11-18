// public/js/notificaciones.js
// ES module: exporta initNotificacionesGlobales y mostrarToast
// También expone funciones en window para compatibilidad.

export function mostrarToast(html, { ttl = 8000 } = {}) {
  const id = "__global_toast_container";
  let container = document.getElementById(id);
  if (!container) {
    container = document.createElement("div");
    container.id = id;
    Object.assign(container.style, {
      position: "fixed",
      right: "20px",
      top: "20px",
      zIndex: 99999,
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-end",
      gap: "8px",
      pointerEvents: "none"
    });
    document.body.appendChild(container);
  }

  const box = document.createElement("div");
  box.className = "global-toast";
  box.style.pointerEvents = "auto";
  Object.assign(box.style, {
    background: "#222",
    color: "#fff",
    padding: "10px 14px",
    borderRadius: "8px",
    boxShadow: "0 6px 18px rgba(0,0,0,0.25)",
    maxWidth: "360px",
    fontFamily: "Arial, sans-serif",
    fontSize: "13px",
    opacity: "1",
    transition: "opacity 0.35s ease",
    position: "relative"
  });

  box.innerHTML = html;

  const close = document.createElement("button");
  close.innerHTML = "&times;";
  Object.assign(close.style, {
    border: "none",
    background: "transparent",
    color: "#fff",
    fontSize: "16px",
    cursor: "pointer",
    position: "absolute",
    right: "8px",
    top: "4px"
  });
  close.addEventListener("click", () => box.remove());
  box.appendChild(close);

  container.prepend(box);

  setTimeout(() => {
    box.style.opacity = "0";
    setTimeout(() => box.remove(), 350);
  }, ttl);
}

/**
 * Inicializa las notificaciones globales:
 * - intenta usar la session pasada (si la pasas)
 * - si no, intenta window.getSesion() si existe
 * - hace join a room user_{UsuarioID} si el usuario está logeado
 * - escucha 'nuevaLectura' (broadcast) y 'nuevaAlerta' (directa al usuario)
 *
 * Retorna el objeto socket (o undefined si fallo)
 */
export async function initNotificacionesGlobales(session = null) {
  try {
    // Si socket.io cliente no está cargado en global, intenta cargarlo con <script src="/socket.io/socket.io.js">
    if (typeof io === "undefined") {
      console.warn("socket.io client not found as global `io`. Make sure <script src=\"/socket.io/socket.io.js\"></script> is included.");
    }

    // Intentar obtener sesión si no se pasó
    let ses = session;
    if (!ses && typeof window.getSesion === "function") {
      try {
        ses = await window.getSesion();
      } catch (e) {
        // no fatal
        ses = session;
      }
    }

    const socket = (typeof io !== "undefined") ? io() : null;
    if (!socket) {
      console.warn("Socket.IO client not available; notifications will be limited.");
      return null;
    }

    socket.on("connect", async () => {
      // Si tenemos sesión válida nos unimos a la room de usuario
      if (!ses && typeof window.getSesion === "function") {
        try { ses = await window.getSesion(); } catch (e) { /* ignore */ }
      }

      if (ses && ses.logeado && ses.UsuarioID) {
        socket.emit("joinUserRoom", { UsuarioID: ses.UsuarioID });
      }
    });

    socket.on("nuevaLectura", (payload) => {
      try {
        const nombre = payload.NombreParametro || payload.ParametroID || "Parametro";
        const valor = (payload.Valor_procesado !== undefined && payload.Valor_procesado !== null)
                      ? payload.Valor_procesado
                      : payload.Valor_original;
        // mostrarToast(`Lectura: <strong>${nombre}</strong> — ${valor}`);
      } catch (e) {
        console.error("Error procesando nuevaLectura", e);
      }
    });

    socket.on("nuevaAlerta", (payload) => {
      try {
        let text = `<strong>${payload.tipo}</strong> — ${payload.mensaje || ''}`;
        if (payload.dato) {
          text += `<br>Sensor: ${payload.dato.SensorID} Param: ${payload.dato.ParametroID} Valor: ${payload.dato.Valor_procesado ?? payload.dato.Valor_original}`;
        }
        mostrarToast(text, { ttl: 15000 });

        // Badge update if exists
        const badge = document.getElementById('badge-alertas');
        if (badge) {
          const n = Number(badge.textContent || 0) + 1;
          badge.textContent = n;
          badge.style.display = 'inline-block';
        }
      } catch (e) {
        console.error("Error procesando nuevaAlerta", e);
      }
    });

    socket.on("connect_error", () => {
      mostrarToast("Error de conexión con el servidor (socket).", { ttl: 6000 });
    });

    // Exponer socket globalmente
    window.__GLOBAL_SOCKET__ = socket;
    // También exponer funciones en window por compatibilidad con código antiguo
    window.mostrarToast = mostrarToast;
    window.initNotificacionesGlobales = initNotificacionesGlobales;

    return socket;
  } catch (err) {
    console.error("initNotificacionesGlobales error:", err);
    return null;
  }
}

// también exponer por compatibilidad si se incluye por <script> sin type="module"
if (typeof window !== "undefined") {
  window.mostrarToast = mostrarToast;
  window.initNotificacionesGlobales = initNotificacionesGlobales;
}
