import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
dayjs.extend(utc);
dayjs.extend(timezone);

import { preprocesarDato } from "../utils/preprocesarDato.js";
import { validarUmbrales } from "../utils/validarUmbrales.js";
import { detectarAnomalias } from "../utils/detectarAnomalias.js";

import { DatoSensorModelo } from "../modelos/DatoSensor.js";
import { AlertaModelo } from "../modelos/Alerta.js";
import { RegistroAlertaModelo } from "../modelos/RegistroAlerta.js"; // 🆕 NUEVO
import { AnomaliaModelo } from "../modelos/anomalia.js"; // 🆕 NUEVO

import { validarDatosDatoSensor } from "../schemas/datoSensor.js";
import { formatZodError } from "../utils/formatZodError.js";

export class DatosSensoresControlador {
  static formatearTimestamp(timestamp) {
    return dayjs(timestamp).tz("America/Lima").format("DD/MM/YYYY HH:mm:ss");
  }

  static async obtenerTodos(req, res) {
    try {
      const datos = await DatoSensorModelo.obtenerTodos({});

      datos.forEach((d) => {
        d.TimestampRegistro = DatosSensoresControlador.formatearTimestamp(
          d.TimestampRegistro
        );
        d.TimestampEnvio = DatosSensoresControlador.formatearTimestamp(
          d.TimestampEnvio
        );
      });
      res.json(datos);
    } catch (error) {
      console.error("Error al obtener datos de sensores:", error);
      res.status(500).json({ error: "Error al obtener datos de sensores" });
    }
  }

  static async obtenerUltimosRegistros(req, res) {
    try {
      const datos = await DatoSensorModelo.obtenerTodos({ ultimosDiez: true });

      datos.forEach((d) => {
        d.TimestampRegistro = DatosSensoresControlador.formatearTimestamp(
          d.TimestampRegistro
        );
        d.TimestampEnvio = DatosSensoresControlador.formatearTimestamp(
          d.TimestampEnvio
        );
      });

      res.json(datos);
    } catch (error) {
      console.error("Error al obtener datos de sensores:", error);
      res.status(500).json({ error: "Error al obtener datos de sensores" });
    }
  }

  static async obtenerPorId(req, res) {
    try {
      const { id } = req.params;
      const dato = await DatoSensorModelo.obtenerPorId({ id });

      if (!dato) {
        return res.status(404).json({ error: "Lectura no encontrada" });
      }

      res.json(dato);
    } catch (error) {
      console.error("Error al obtener lectura:", error);
      res.status(500).json({ error: "Error al obtener lectura" });
    }
  }

  static async registrar(req, res, io) {
    try {
      const nuevaLectura = req.body;

      // 1️⃣ Validar campos mínimos
      if (!nuevaLectura.ParametroID || !nuevaLectura.valor) {
        return res
          .status(400)
          .json({ error: "ParametroID y valor son obligatorios" });
      }

      // 2️⃣ Preprocesar datos
      const { Valor_original, Valor_procesado, Valor_normalizado, Estado } =
        preprocesarDato(nuevaLectura);

      const lecturaValidada = validarDatosDatoSensor({
        ...nuevaLectura,
        Valor_original,
        Valor_procesado,
        Valor_normalizado,
        Estado,
      });

      if (!lecturaValidada.success) {
        const normalized = formatZodError(lecturaValidada.error);
        return res.status(400).json({ error: normalized });
      }

      // 3️⃣ Registrar en BD
      const nuevoDato = new DatoSensorModelo(lecturaValidada.data);
      const resultado = await nuevoDato.crear();

      resultado.TimestampRegistro = dayjs(nuevoDato.TimestampRegistro)
        .tz("America/Lima")
        .format("DD/MM/YYYY HH:mm:ss");
      resultado.TimestampEnvio = dayjs(nuevoDato.TimestampEnvio)
        .tz("America/Lima")
        .format("DD/MM/YYYY HH:mm:ss");

      // 4️⃣ Emitir dato procesado
      io.emit("nuevaLectura", resultado);

      // 5️⃣ Detectar anomalías (solo valores físicamente imposibles)
      const anomaliaDetectada = await detectarAnomalias(resultado);

      // 6️⃣ Validar umbrales (solo si NO es un valor imposible)
      let umbralViolado = null;
      if (!anomaliaDetectada) {
        umbralViolado = await validarUmbrales(resultado);
      }

      const alertasGeneradas = [];

      // 7️⃣ Procesar alertas de umbral o contaminación crítica
      if (umbralViolado) {
        // Determinar tipo según severidad
        const tipoAlerta =
          umbralViolado.severidad === "EXTREMA"
            ? "CONTAMINACION_CRITICA"
            : "UMBRAL";

        // Ajustar mensaje si es extremo
        let mensajeFinal = umbralViolado.mensaje;
        let contextoFinal = umbralViolado.contexto;

        if (tipoAlerta === "CONTAMINACION_CRITICA") {
          mensajeFinal = `🚨 CONTAMINACIÓN CRÍTICA: Superación extrema del umbral (${umbralViolado.diferencial}x) - ${umbralViolado.mensaje}`;
          contextoFinal = `${umbralViolado.contexto} El valor excede el umbral en más de ${umbralViolado.diferencial} veces, requiere acción inmediata.`;
        }

        // 🆕 Usar RegistroAlertaModelo en lugar de AlertaModelo
        const alerta = await RegistroAlertaModelo.registrarAlerta({
          umbralID: umbralViolado.umbralID,
          anomaliaID: null, // 🆕 No es anomalía
          datoID: resultado.DatoID,
          tipo: tipoAlerta,
          contexto: contextoFinal,
        });

        const notificaciones = await AlertaModelo.notificarUsuarios({
          registroAlertaID: alerta.registroAlertaID,
          nivelesPermiso: [2, 3, 4], // Tanto UMBRAL como CONTAMINACION_CRITICA a todos
          tipo: tipoAlerta,
          mensaje: mensajeFinal,
          datoInfo: {
            SensorID: resultado.SensorID,
            SensorNombre: resultado.Nombre,
            ParametroID: resultado.ParametroID,
            NombreParametro: resultado.NombreParametro,
            Valor: resultado.Valor_original,
            UnidadMedida: resultado.UnidadMedida,
            Timestamp: resultado.TimestampRegistro,
            Contexto: contextoFinal,
          },
        });

        alertasGeneradas.push(...notificaciones);
      }

      // 8️⃣ Procesar alertas de anomalía (solo valores imposibles - fallas de sensor)
      if (anomaliaDetectada) {
        // 🆕 1. Registrar en tabla Anomalias
        const anomaliaID = await AnomaliaModelo.registrarAnomalia({
          datoID: resultado.DatoID,
          tipo: "SENSOR_DEFECTUOSO",
          descripcion: anomaliaDetectada.contexto,
        });

        // 🆕 2. Registrar en tabla RegistroAlertas vinculando la anomalía
        const alerta = await RegistroAlertaModelo.registrarAlerta({
          umbralID: null,
          anomaliaID, // 🆕 Vincular con anomalía registrada
          datoID: resultado.DatoID,
          tipo: "ANOMALIA",
          contexto: anomaliaDetectada.contexto,
        });

        const notificaciones = await AlertaModelo.notificarUsuarios({
          registroAlertaID: alerta.registroAlertaID,
          nivelesPermiso: [4], // Solo administradores para anomalías
          tipo: "ANOMALIA",
          mensaje: anomaliaDetectada.mensaje,
          datoInfo: {
            SensorID: resultado.SensorID,
            SensorNombre: resultado.Nombre,
            ParametroID: resultado.ParametroID,
            NombreParametro: resultado.NombreParametro,
            Valor: resultado.Valor_original,
            UnidadMedida: resultado.UnidadMedida,
            Timestamp: resultado.TimestampRegistro,
            Contexto: anomaliaDetectada.contexto,
            RangoMin: anomaliaDetectada.rangoMin,
            RangoMax: anomaliaDetectada.rangoMax,
          },
        });

        alertasGeneradas.push(...notificaciones);
      }

      // 9️⃣ Emitir alertas generadas UNA SOLA VEZ (no por cada usuario)
      if (alertasGeneradas.length > 0) {
        // Agrupar alertas por tipo de alerta (UMBRAL, ANOMALIA, CONTAMINACION_CRITICA)
        // Cada grupo representa una única alerta real que debe emitirse
        const alertasUnicas = new Map();

        alertasGeneradas.forEach((alerta) => {
          // Usar el registroAlertaID como clave única (misma alerta a múltiples usuarios)
          const key = `${alerta.tipo}-${alerta.mensaje}`;

          if (!alertasUnicas.has(key)) {
            // Normalizar campos de SQL Server a JavaScript para socket.io
            const alertaNormalizada = {
              AlertaUsuarioID: alerta.AlertaUsuarioID, // Primer usuario para compatibilidad
              tipo: alerta.tipo, // ✅ Mantener el tipo original (UMBRAL/ANOMALIA/CONTAMINACION_CRITICA)
              contexto: alerta.Contexto || alerta.contexto,
              mensaje: alerta.mensaje,
              SensorNombre: alerta.SensorNombre,
              NombreParametro: alerta.NombreParametro,
              Valor: alerta.Valor, // ✨ Usar el valor original enviado en datoInfo
              UnidadMedida: alerta.UnidadMedida,
              Timestamp: alerta.Timestamp,
              FechaEnvio: new Date(),
              UsuariosAfectados: [], // Lista de usuarios que reciben esta alerta
            };

            alertasUnicas.set(key, alertaNormalizada);
          }

          // Agregar usuario a la lista de afectados
          alertasUnicas.get(key).UsuariosAfectados.push({
            UsuarioID: alerta.UsuarioID,
            NombreUsuario: alerta.NombreUsuario,
            AlertaUsuarioID: alerta.AlertaUsuarioID,
          });
        });

        // 🆕 Emitir con eventos diferenciados según tipo (para filtrado por permiso en frontend)
        alertasUnicas.forEach((alerta) => {
          console.log(
            `📡 Emitiendo alerta tipo "${alerta.tipo}" a ${alerta.UsuariosAfectados.length} usuario(s)`
          );

          // Diferenciar eventos según tipo para filtrado por permisos en frontend
          if (alerta.tipo === "ANOMALIA") {
            io.emit("nuevaAnomalia", alerta); // Solo nivel 4
          } else {
            io.emit("nuevaAlertaUmbral", alerta); // Niveles 2, 3, 4
          }
        });
      }

      res.status(201).json({
        mensaje: "Lectura registrada correctamente",
        data: resultado,
        alertas: alertasGeneradas.length,
      });
    } catch (error) {
      console.error("Error al registrar lectura:", error);
      res.status(500).json({ error: "Error al registrar lectura" });
    }
  }

  static async obtenerPorSensor(req, res) {
    try {
      const { sensorId } = req.params;
      const datos = await DatoSensorModelo.obtenerPorSensor({
        SensorID: sensorId,
      });
      res.json(datos);
    } catch (error) {
      console.error("Error al obtener lecturas por sensor:", error);
      res.status(500).json({ error: "Error al obtener lecturas por sensor" });
    }
  }

  static async eliminar(req, res) {
    try {
      const { id } = req.params;
      const eliminado = await DatoSensorModelo.eliminar({ id });

      if (!eliminado) {
        return res.status(404).json({ error: "Lectura no encontrada" });
      }

      res.json({ mensaje: "Lectura eliminada correctamente" });
    } catch (error) {
      console.error("Error al eliminar lectura:", error);
      res.status(500).json({ error: "Error al eliminar lectura" });
    }
  }
}
