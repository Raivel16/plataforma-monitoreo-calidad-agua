// util/js/conectarSocketSensores.js
import { initNotificacionesGlobales } from "../js/notificaciones.js";
import { getSesion } from "./sesion.js";
import { registrosGlobal, recargarDatosDesdeBD, renderPagina } from "./tablaGenerica.js";

/**
 * insertarOActualizarLectura(reg)
 * - Mutará registrosGlobal (array exportado desde tablaGenerica) de forma segura:
 *   - si ya existe DatoID -> actualizar objeto
 *   - si no existe -> insertar al inicio
 * - luego reordena por DatoID desc, corta (topLimit) y fija paginaActual = 1 vía renderPagina()
 */
function insertarOActualizarLectura(incoming, { topLimit = 1000 } = {}) {
  if (!incoming) return false;
  const id = Number(incoming?.DatoID ?? incoming?.datoId ?? incoming?.id ?? NaN);
  // si no hay id tratable, no modificamos y devolvemos false (trigger recarga como fallback)
  if (!Number.isFinite(id)) return false;

  // buscar índice existente
  const idx = registrosGlobal.findIndex((r) => Number(r?.DatoID ?? r?.datoId ?? r?.id ?? NaN) === id);

  if (idx >= 0) {
    // actualizar la fila completa (reemplazo) manteniendo referencia del array
    registrosGlobal[idx] = { ...registrosGlobal[idx], ...incoming };
  } else {
    // insertar al principio
    registrosGlobal.unshift(incoming);
  }

  // ordenar descendente por DatoID y quitar duplicados (simple y eficiente con Map)
  const map = new Map();
  for (const item of registrosGlobal) {
    const k = String(Number(item?.DatoID ?? item?.datoId ?? item?.id ?? 0));
    if (!map.has(k)) map.set(k, item);
  }
  const arr = Array.from(map.values()).sort((a, b) => {
    const ai = Number(a?.DatoID ?? a?.datoId ?? a?.id ?? 0);
    const bi = Number(b?.DatoID ?? b?.datoId ?? b?.id ?? 0);
    return bi - ai;
  });

  registrosGlobal.length = 0;
  arr.slice(0, topLimit).forEach((x) => registrosGlobal.push(x));

  // Forzar ver la primera página (comportamiento previo)
  try {
    // tablaGenerica mantiene paginaActual internamente; renderPagina mostrará la página activa
    // para forzar mostrar los últimos, le pedimos al usuario que vuelva a la primera página:
    if (typeof window !== "undefined") window.__TABLA_PAGINA_ACTUAL = 1; // opcional debug hook
  } catch (e) {}

  // Llamar a renderPagina para actualizar la vista
  try { renderPagina(); } catch (e) { console.warn("renderPagina error:", e); }

  return true;
}

/**
 * conectarSocketSensores(apiUrl, options)
 * - apiUrl: endpoint para recargar (ej: /api/datos/ultimos)
 * - options:
 *    debounceMs: agrupa lecturas entrantes (por defecto 800ms)
 *    fallbackRecarga: si incoming no tiene DatoID -> hace recargarDatosDesdeBD() una vez
 */
export async function conectarSocketSensores(apiUrl, options = {}) {
  const { debounceMs = 800, fallbackRecarga = true } = options;

  let session = null;
  try { session = await getSesion(); } catch (e) { console.warn("getSesion fallo:", e); }

  // iniciar socket / notificaciones
  let socket;
  try {
    if (typeof initNotificacionesGlobales === "function") {
      socket = await initNotificacionesGlobales(session);
    } else if (window.initNotificacionesGlobales) {
      socket = await window.initNotificacionesGlobales(session);
    } else {
      socket = (typeof io !== "undefined") ? io() : null;
      if (socket && session && session.logeado && session.UsuarioID) {
        socket.on("connect", () => socket.emit("joinUserRoom", { UsuarioID: session.UsuarioID }));
      }
    }
  } catch (err) {
    console.error("Error iniciando socket:", err);
    socket = (typeof io !== "undefined") ? io() : null;
  }

  if (!socket) {
    console.warn("Socket no disponible; intentando recargar datos una vez.");
    if (fallbackRecarga) await recargarDatosDesdeBD(apiUrl);
    return null;
  }

  // debounce para agrupación de recargas (cuando payload no contiene DatoID o para fallback)
  let debounceTimer = null;
  let pendingFallbackRecarga = false;

  socket.on("nuevaLectura", async (payload) => {
    try {
      const incoming = payload?.dato ?? payload; // algunos payloads vienen con campo 'dato'
      const ok = insertarOActualizarLectura(incoming);

      if (!ok) {
        // payload no tiene DatoID (o formato inesperado) -> programar fallback recarga
        if (fallbackRecarga) {
          pendingFallbackRecarga = true;
          if (debounceTimer) clearTimeout(debounceTimer);
          debounceTimer = setTimeout(async () => {
            try {
              await recargarDatosDesdeBD(apiUrl);
            } catch (e) {
              console.error("Fallback recarga error:", e);
            } finally {
              pendingFallbackRecarga = false;
              debounceTimer = null;
            }
          }, debounceMs);
        }
      } else {
        // si había un debounce pendiente para recarga fallback, lo cancelamos (ya integramos la fila)
        if (debounceTimer && pendingFallbackRecarga) {
          clearTimeout(debounceTimer);
          debounceTimer = null;
          pendingFallbackRecarga = false;
        }
      }
    } catch (err) {
      console.error("Error manejando nuevaLectura:", err);
      // último recurso: pedir recarga completa (no ideal)
      if (fallbackRecarga) {
        try { await recargarDatosDesdeBD(apiUrl); } catch (e) { console.error(e); }
      }
    }
  });

  socket.on("connect_error", (err) => {
    console.warn("socket connect_error:", err);
  });

  return socket;
}
