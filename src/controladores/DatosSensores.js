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

      // 5️⃣ Detectar anomalías PRIMERO (para capturar valores imposibles)
      const anomaliaDetectada = await detectarAnomalias(resultado);

      // 6️⃣ Solo validar umbrales si NO es una anomalía por valor imposible
      let umbralViolado = null;
      if (!anomaliaDetectada || !anomaliaDetectada.valorImposible) {
        umbralViolado = await validarUmbrales(resultado);

        // Si hay umbral violado Y anomalía (cambio brusco), es contaminación crítica
        if (umbralViolado && anomaliaDetectada) {
          anomaliaDetectada.tipo = "CONTAMINACION_CRITICA";
          anomaliaDetectada.contexto = `Cambio brusco detectado junto con superación de umbral. Posible evento de contaminación repentina que requiere atención inmediata.`;
          anomaliaDetectada.mensaje = `🚨 CONTAMINACIÓN CRÍTICA: Cambio abrupto a ${resultado.Valor_procesado.toFixed(
            2
          )} ${resultado.UnidadMedida} y superación de umbral`;
        }
      }

      const alertasGeneradas = [];

      // 7️⃣ Procesar alertas de umbral (solo si no hay anomalía por valor imposible)
      if (
        umbralViolado &&
        (!anomaliaDetectada || !anomaliaDetectada.valorImposible)
      ) {
        const alerta = await AlertaModelo.registrarAlerta({
          umbralID: umbralViolado.umbralID,
          datoID: resultado.DatoID,
          tipo: "UMBRAL",
          mensaje: umbralViolado.mensaje,
          contexto: umbralViolado.contexto,
        });

        const notificaciones = await AlertaModelo.notificarUsuarios({
          registroAlertaID: alerta.registroAlertaID,
          nivelesPermiso: [2, 3, 4],
          tipo: "UMBRAL",
          mensaje: umbralViolado.mensaje,
          datoInfo: {
            SensorID: resultado.SensorID,
            SensorNombre: resultado.Nombre,
            ParametroID: resultado.ParametroID,
            NombreParametro: resultado.NombreParametro,
            Valor: resultado.Valor_original,
            UnidadMedida: resultado.UnidadMedida,
            Timestamp: resultado.TimestampRegistro,
            Contexto: umbralViolado.contexto,
          },
        });

        alertasGeneradas.push(...notificaciones);
      }

      // 8️⃣ Procesar alertas de anomalía o contaminación crítica
      if (anomaliaDetectada) {
        // Determinar niveles de permiso según el tipo de alerta
        const nivelesPermiso =
          anomaliaDetectada.tipo === "CONTAMINACION_CRITICA"
            ? [2, 3, 4] // Notificar a todos si es contaminación crítica
            : [4]; // Solo administradores para anomalías normales

        const alerta = await AlertaModelo.registrarAlerta({
          umbralID: null,
          datoID: resultado.DatoID,
          tipo: anomaliaDetectada.tipo,
          mensaje: anomaliaDetectada.mensaje,
          contexto: anomaliaDetectada.contexto,
        });

        const notificaciones = await AlertaModelo.notificarUsuarios({
          registroAlertaID: alerta.registroAlertaID,
          nivelesPermiso,
          tipo: anomaliaDetectada.tipo,
          mensaje: anomaliaDetectada.mensaje,
          datoInfo: {
            SensorID: resultado.SensorID,
            SensorNombre: resultado.Nombre,
            ParametroID: resultado.ParametroID,
            NombreParametro: resultado.NombreParametro,
            Valor: resultado.Valor_original,
            ValorEsperado: anomaliaDetectada.valorEsperado,
            Desviacion: anomaliaDetectada.desviacion,
            UnidadMedida: resultado.UnidadMedida,
            Timestamp: resultado.TimestampRegistro,
            Contexto: anomaliaDetectada.contexto,
          },
        });

        alertasGeneradas.push(...notificaciones);
      }

      // 9️⃣ Emitir alertas generadas (normalizar nombres de campos)
      if (alertasGeneradas.length > 0) {
        alertasGeneradas.forEach((alerta) => {
          // Normalizar campos de SQL Server a JavaScript para socket.io
          const alertaNormalizada = {
            ...alerta,
            tipo: alerta.tipo,
            contexto: alerta.Contexto || alerta.contexto,
            mensaje: alerta.mensaje,
            SensorNombre: alerta.SensorNombre,
            NombreParametro: alerta.NombreParametro,
            Valor: alerta.Valor, // ✨ Usar el valor original enviado en datoInfo
            UnidadMedida: alerta.UnidadMedida,
            Timestamp: alerta.Timestamp,
            FechaEnvio: new Date(),
          };

          io.emit("nuevaAlerta", alertaNormalizada);
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
