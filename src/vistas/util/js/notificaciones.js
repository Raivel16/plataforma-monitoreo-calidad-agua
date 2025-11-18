// public/js/notificaciones.js
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

/* =========================
   STORAGE HELPERS
   =========================
   - Guarda los IDs de alertas (AlertaUsuarioID preferible) ya mostradas.
   - sessionStorage se borra al cerrar pestaña / navegador.
   - Cambia a localStorage si quieres persistencia entre sesiones.
*/
const STORAGE_KEY = "notificaciones_mostradas_v1"; // versiona si cambias lógica
function leerMostrarStorage() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch (e) {
    return new Set();
  }
}
function guardarMostrarStorage(setIds) {
  try {
    const arr = Array.from(setIds);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  } catch (e) {}
}
function marcarIdsMostrados(ids = []) {
  const s = leerMostrarStorage();
  ids.forEach((id) => s.add(String(id)));
  guardarMostrarStorage(s);
}
function yaMostrado(id) {
  const s = leerMostrarStorage();
  return s.has(String(id));
}

/* =========================
   UTILS
   ========================= */
function getAlertaId(a) {
  // prefer AlertaUsuarioID porque es único y específico por usuario
  return a?.AlertaUsuarioID ?? a?.RegistroAlertaID ?? a?.registroAlertaID ?? null;
}

function actualizarBadge(totalPendientes) {
  const badge = document.getElementById("badge-alertas");
  if (!badge) return;
  badge.textContent = totalPendientes > 0 ? String(totalPendientes) : "";
  badge.style.display = totalPendientes > 0 ? "inline-block" : "none";
}

/* =========================
   initNotificacionesGlobales (actualizado)
   ========================= */
export async function initNotificacionesGlobales(socket, session = null){
  try {
    if (typeof io === "undefined") {
      console.warn("socket.io client not found as global `io`. Make sure /socket.io/socket.io.js is included before this module.");
    }

    let ses = session;
    if (!ses && typeof window.getSesion === "function") {
      try { ses = await window.getSesion(); } catch (e) { /* ignore */ }
    }

    const socket = (typeof io !== "undefined") ? io() : null;
    if (!socket) {
      console.warn("Socket.IO client not available; notifications limited.");
      return null;
    }

    socket.on("connect", async () => {
      // refresh session if needed
      if (!ses && typeof window.getSesion === "function") {
        try { ses = await window.getSesion(); } catch (e) {}
      }

      // join room if logged
      if (ses && ses.logeado && ses.UsuarioID) {
        socket.emit("joinUserRoom", { UsuarioID: ses.UsuarioID });
      }

      // --- FETCH PENDING ALERTS AFTER JOIN ---
      try {
        const usuarioIdParam = ses && ses.UsuarioID ? `?UsuarioID=${ses.UsuarioID}` : "";
        const resp = await fetch(`/api/alertas/mis${usuarioIdParam}`);
        if (resp.ok) {
          const pendientes = await resp.json();
          // total pendiente para badge
          actualizarBadge(pendientes.length);

          // mostrar toasts SOLO si NO fueron mostradas anteriormente en esta sesión
          // y solo la PRIMERA vez: detectamos si storage está vacío para decidir "primera vez"
          const storageSet = leerMostrarStorage();
          const isFirstTime = storageSet.size === 0;

          if (isFirstTime) {
            // mostrar toasts por cada alerta pendiente y marcarla como mostrada
            const idsMostradas = [];
            for (const a of pendientes) {
              const aid = getAlertaId(a);
              // si no tiene id, usar registro/dato combo (evitar duplicados)
              if (aid && !storageSet.has(String(aid))) {
                // construir texto
                const tipo = a.Tipo || (a.UmbralID ? "UMBRAL" : "ANOMALIA");
                const mensaje = a.Mensaje || a.mensaje || a.EstadoNotificacion || "";
                const sensor = a.NombreSensor || a.SensorID || "-";
                const parametro = a.NombreParametro || a.ParametroID || "-";
                const valor = (a.Valor_procesado !== undefined && a.Valor_procesado !== null) ? a.Valor_procesado : a.Valor_original;
                const text = `<strong>${tipo}</strong> — ${mensaje} <br>Sensor: ${sensor} Param: ${parametro} Valor: ${valor}`;
                mostrarToast(text, { ttl: 15000 });
                idsMostradas.push(aid);
              }
            }
            if (idsMostradas.length) marcarIdsMostrados(idsMostradas);
          }
          // si no es primera vez: no mostramos toasts, solo mantenemos badge actualizado
        } else {
          console.warn("No se pudieron obtener alertas pendientes:", resp.status);
        }
      } catch (err) {
        console.warn("Error al obtener alertas pendientes:", err);
      }
    });

    // no mostramos toasts para lecturas
    socket.on("nuevaLectura", (payload) => {
      // solo actualiza tabla (tu tabla ya escucha 'nuevaLectura' en tablaGenerica.js)
    });

    // nuevaAlerta: evento en tiempo real. Mostrar siempre y marcar en storage para no duplicar luego.
    socket.on("nuevaAlerta", (payload) => {
      try {
        // obtener un id para la alerta (si no existe, generar con timestamp)
        const aid = getAlertaId(payload) ?? `tmp_${Date.now()}`;
        // si ya lo mostramos, no volver a mostrar
        if (!yaMostrado(aid)) {
          let text = `<strong>${payload.tipo}</strong> — ${payload.mensaje || ''}`;
          if (payload.dato) {
            text += `<br>Sensor: ${payload.dato.SensorID} Param: ${payload.dato.ParametroID} Valor: ${payload.dato.Valor_procesado ?? payload.dato.Valor_original}`;
          }
          mostrarToast(text, { ttl: 15000 });
          marcarIdsMostrados([aid]);
        }
        // actualizar badge: aumentar 1
        const badge = document.getElementById("badge-alertas");
        if (badge) {
          const n = Number(badge.textContent || 0) + 1;
          badge.textContent = n;
          badge.style.display = "inline-block";
        }
      } catch (e) {
        console.error("Error procesando nuevaAlerta", e);
      }
    });

    socket.on("connect_error", () => {
      // opcional: notificar error de conexión
    });

    window.__GLOBAL_SOCKET__ = socket;
    window.mostrarToast = mostrarToast;
    window.initNotificacionesGlobales = initNotificacionesGlobales;

    return socket;
  } catch (err) {
    console.error("initNotificacionesGlobales error:", err);
    return null;
  }
}

// compatibilidad global si se incluye por <script>
if (typeof window !== "undefined") {
  window.mostrarToast = mostrarToast;
  window.initNotificacionesGlobales = initNotificacionesGlobales;
}
