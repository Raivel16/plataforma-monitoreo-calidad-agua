import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
dayjs.extend(utc);
dayjs.extend(timezone);

import { preprocesarDatoNuevo } from "../utils/preprocesarDatoNuevo.js";
import { formatZodError } from "../utils/formatZodError.js";

import { validarDatosDatoSensor } from "../schemas/datoSensor.js";

// src/controladores/datosSensoresControlador.js
import { DatoSensorModelo } from "../modelos/DatoSensor.js";

import { analizarYNotificarAvanzado } from "../servicios/analizadorAvanzado.js";


export class DatosSensoresControlador {
  static formatearTimestamp(timestamp) {
    return dayjs(timestamp).tz("America/Lima").format("DD/MM/YYYY HH:mm:ss");
  }

  // GET /api/datos
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

  // GET /api/datos/:id
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

      if (!nuevaLectura.ParametroID || (nuevaLectura.valor === undefined || nuevaLectura.valor === null)) {
        return res.status(400).json({ error: "ParametroID y valor son obligatorios" });
      }

      // 1) insertar crudo y recibir contexto (1 viaje a BD)
      const datoModel = new DatoSensorModelo({
        SensorID: nuevaLectura.SensorID,
        ParametroID: nuevaLectura.ParametroID,
        TimestampEnvio: nuevaLectura.TimestampEnvio || null,
        Valor_original: parseFloat(nuevaLectura.valor)
      });

      // contexto.fila es la fila completa desde la view (igual que antes)
      const contexto = await datoModel.insertarCrudoConContexto(10);
      const DatoID = contexto.fila?.DatoID;

      // 2) preprocesar con la nueva función (no clampa)
      const pre = preprocesarDatoNuevo({
        ParametroID: nuevaLectura.ParametroID,
        valor: nuevaLectura.valor
      });

      // 3) validación opcional (Zod)
      const lecturaValidada = validarDatosDatoSensor({
        ...nuevaLectura,
        Valor_original: pre.Valor_original,
        Valor_procesado: pre.Valor_procesado,
        Valor_normalizado: pre.Valor_normalizado,
        Estado: pre.Estado,
      });

      if (!lecturaValidada.success) {
        const normalized = formatZodError(lecturaValidada.error);
        return res.status(400).json({ error: normalized });
      }

      // 4) actualizar dato con procesado -> ahora retorna fila actualizada
      const filaActualizada = await DatoSensorModelo.actualizarProcesado(DatoID, {
        Valor_procesado: pre.Valor_procesado,
        Valor_normalizado: pre.Valor_normalizado,
        Estado: pre.Estado
      });

      // 5) formatear timestamps (si vienen como DATETIME2)
      if (filaActualizada?.TimestampRegistro) {
        filaActualizada.TimestampRegistro = dayjs(filaActualizada.TimestampRegistro).tz("America/Lima").format("DD/MM/YYYY HH:mm:ss");
      }
      if (filaActualizada?.TimestampEnvio) {
        filaActualizada.TimestampEnvio = dayjs(filaActualizada.TimestampEnvio).tz("America/Lima").format("DD/MM/YYYY HH:mm:ss");
      }

      // 6) emitir lectura procesada al frontend (socket)
      io.emit("nuevaLectura", filaActualizada);

      // 7) analizar y notificar (pasando umbrales + historial)
      const acciones = await analizarYNotificarAvanzado({
        DatoID,
        SensorID: filaActualizada.SensorID,
        ParametroID: filaActualizada.ParametroID,
        Valor_procesado: Number(filaActualizada.Valor_procesado),
        umbrales: contexto.umbrales,
        historial: contexto.historial,
        fueraRangoFisico: pre.FueraRangoFisico,
        sensorDamageThreshold: 3 // configurable
      }, io);

      // 8) responder al simulador
      return res.status(201).json({
        mensaje: "Lectura registrada y procesada",
        data: { DatoID },
        acciones
      });

    } catch (error) {
      console.error("Error al registrar lectura:", error);
      return res.status(500).json({ error: "Error al registrar lectura" });
    }
  }
  
  // GET /api/datos/sensor/:sensorId
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

  // DELETE /api/datos/:id
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
