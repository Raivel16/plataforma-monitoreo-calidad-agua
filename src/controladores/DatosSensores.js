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

      // 5️⃣ Validar umbrales y detectar anomalías
      const umbralViolado = await validarUmbrales(resultado);
      const anomaliaDetectada = await detectarAnomalias(resultado);

      const alertasGeneradas = [];

      // 6️⃣ Procesar alertas de umbral
      if (umbralViolado) {
        const alerta = await AlertaModelo.registrarAlerta({
          umbralID: umbralViolado.umbralID,
          datoID: resultado.DatoID,
          tipo: "UMBRAL",
          mensaje: umbralViolado.mensaje,
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
            Valor: resultado.Valor_procesado,
            UnidadMedida: resultado.UnidadMedida,
            Timestamp: resultado.TimestampRegistro,
          },
        });

        alertasGeneradas.push(...notificaciones);
      }

      // 7️⃣ Procesar alertas de anomalía
      if (anomaliaDetectada) {
        const alerta = await AlertaModelo.registrarAlerta({
          umbralID: null,
          datoID: resultado.DatoID,
          tipo: "ANOMALIA",
          mensaje: anomaliaDetectada.mensaje,
        });

        const notificaciones = await AlertaModelo.notificarUsuarios({
          registroAlertaID: alerta.registroAlertaID,
          nivelesPermiso: [4],
          tipo: "ANOMALIA",
          mensaje: anomaliaDetectada.mensaje,
          datoInfo: {
            SensorID: resultado.SensorID,
            SensorNombre: resultado.Nombre,
            ParametroID: resultado.ParametroID,
            NombreParametro: resultado.NombreParametro,
            Valor: resultado.Valor_procesado,
            ValorEsperado: anomaliaDetectada.valorEsperado,
            Desviacion: anomaliaDetectada.desviacion,
            UnidadMedida: resultado.UnidadMedida,
            Timestamp: resultado.TimestampRegistro,
          },
        });

        alertasGeneradas.push(...notificaciones);
      }

      // 8️⃣ Emitir alertas generadas
      if (alertasGeneradas.length > 0) {
        alertasGeneradas.forEach((alerta) => {
          io.emit("nuevaAlerta", alerta);
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