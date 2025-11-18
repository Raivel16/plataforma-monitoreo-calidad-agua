// services/analizadorAvanzado.js
import { RegistroAlertaModelo } from "../modelos/RegistroAlerta.js";
import { AnomaliaModelo } from "../modelos/Anomalia.js";
import { SensorEstadoModelo } from "../modelos/SensorEstado.js";

/**
 * detectarAnomalia: igual que antes
 */
function detectarAnomaliaSimple(historial, valorProcesado, fueraRangoFisico) {
  const anterior = (historial && historial.length > 0) ? Number(historial[0].Valor_procesado) : null;
  if (anterior === null && !fueraRangoFisico) return null;

  // Si está físicamente fuera del rango → anomalia inmediata
  if (fueraRangoFisico) {
    return { tipo: "VALOR_IMPOSIBLE", descripcion: "Valor fuera de rango físico esperado" };
  }

  const delta = Math.abs(valorProcesado - anterior);
  const porcentaje = (delta / (Math.abs(anterior) || 1)) * 100;

  if (delta > 5) return { tipo: "CAMBIO_BRUSCO", descripcion: `Cambio absoluto ${delta} respecto a ${anterior}` };
  if (porcentaje > 40) return { tipo: "SALTO_PORCENTUAL", descripcion: `Cambio ${porcentaje.toFixed(1)}% respecto a ${anterior}` };
  if (valorProcesado < 0) return { tipo: "VALOR_NEGATIVO", descripcion: "Valor negativo no físico" };

  return null;
}

/**
 * Analiza y notifica:
 * - umbrales -> niveles 2,3,4
 * - anomalías -> nivel 4
 * - incrementa contador de anomalías por sensor/param, y si >= threshold -> crea ANOMALIA tipo SENSOR_DANADO (y notifica)
 *
 * Emite por socket **solo a los usuarios** afectados usando room 'user_{UsuarioID}'
 */
export async function analizarYNotificarAvanzado({ DatoID, SensorID, ParametroID, Valor_procesado, umbrales, historial, fueraRangoFisico = false, sensorDamageThreshold = 3 }, io) {
  const acciones = { alertaUmbral: null, anomalia: null, registroAlerta: null, usuariosNotificados: [] };

  // 1) comprobar umbrales
  let alertaUmbral = null;
  for (const u of (umbrales || [])) {
    const crit = Number(u.ValorCritico);
    if (u.TipoUmbral === "MAXIMO" && Valor_procesado > crit) { alertaUmbral = { UmbralID: u.UmbralID, mensaje: u.MensajeAlerta || `Supera máximo ${crit}` }; break; }
    if (u.TipoUmbral === "MINIMO" && Valor_procesado < crit) { alertaUmbral = { UmbralID: u.UmbralID, mensaje: u.MensajeAlerta || `Por debajo mínimo ${crit}` }; break; }
  }

  // 2) detectar anomalia (incluye fueraRangoFisico)
  const anomaliaDetectada = detectarAnomaliaSimple(historial, Valor_procesado, fueraRangoFisico);

  // 3) si anomalia -> incrementar contador en SensorEstados
  let sensorEstadoResult = null;
  if (anomaliaDetectada) {
    sensorEstadoResult = await SensorEstadoModelo.incrementar(SensorID, ParametroID, sensorDamageThreshold);
  } else {
    // si no hay anomalia, resetear contador
    sensorEstadoResult = await SensorEstadoModelo.reset(SensorID, ParametroID);
  }

  // 4) Umbral -> crear registro y notificar niveles 2,3,4 (en batch), luego emitir por rooms
  if (alertaUmbral) {
    const registro = await RegistroAlertaModelo.crearYNotificar(alertaUmbral.UmbralID, DatoID, "2,3,4");
    acciones.alertaUmbral = alertaUmbral;
    acciones.registroAlerta = registro;

    // Emisión por rooms: registro.usuarios -> array { AlertaUsuarioID, UsuarioID }
    for (const u of registro.usuarios || []) {
      const payload = {
        tipo: "UMBRAL",
        mensaje: alertaUmbral.mensaje,
        registroAlertaID: registro.RegistroAlertaID,
        alertaUsuarioID: u.AlertaUsuarioID,
        usuarioID: u.UsuarioID,
        dato: { DatoID, SensorID, ParametroID, Valor_procesado }
      };
      try { io.to(`user_${u.UsuarioID}`).emit("nuevaAlerta", payload); } catch (e) { /* ignore */ }
    }
    acciones.usuariosNotificados.push(...(registro.usuarios || []));
  }

  // 5) Anomalia -> crear anomalia, crear registro (UmbralID=null) y notificar nivel 4
  if (anomaliaDetectada) {
    const anomaliaId = await AnomaliaModelo.crear({ DatoID, Tipo: anomaliaDetectada.tipo, Descripcion: anomaliaDetectada.descripcion });
    acciones.anomalia = { AnomaliaID: anomaliaId, ...anomaliaDetectada };

    // Si sensorEstadoResult indica EstadoSensor = 'DANADO' -> creamos una anomalía adicional SENSOR_DANADO
    if (sensorEstadoResult && sensorEstadoResult.EstadoSensor === 'DANADO') {
      // crear anomalia SENSOR_DANADO
      const descr = `Sensor ${SensorID} PAR=${ParametroID} reportó ${sensorEstadoResult.ConsecutivasAnomalias} anomalías consecutivas → POSIBLE SENSOR DAÑADO`;
      const anomId2 = await AnomaliaModelo.crear({ DatoID, Tipo: "SENSOR_DANADO", Descripcion: descr });
      acciones.anomaliaSensorDanado = { AnomaliaID: anomId2, descripcion: descr };
      // (podemos también crear un registro de alerta especial)
    }

    // Crear registro alerta (UmbralID = NULL) y notificar nivel 4
    const registro = await RegistroAlertaModelo.crearYNotificar(null, DatoID, "4");
    acciones.registroAlerta = acciones.registroAlerta || registro;

    for (const u of registro.usuarios || []) {
      const payload = {
        tipo: "ANOMALIA",
        mensaje: anomaliaDetectada.descripcion,
        anomaliaId: anomaliaId,
        registroAlertaID: registro.RegistroAlertaID,
        alertaUsuarioID: u.AlertaUsuarioID,
        usuarioID: u.UsuarioID,
        dato: { DatoID, SensorID, ParametroID, Valor_procesado }
      };
      try { io.to(`user_${u.UsuarioID}`).emit("nuevaAlerta", payload); } catch (e) {}
    }
    acciones.usuariosNotificados.push(...(registro.usuarios || []));
  }

  return acciones;
}
