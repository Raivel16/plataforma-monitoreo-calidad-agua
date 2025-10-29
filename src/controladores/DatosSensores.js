import { preprocesarDato } from "../utils/preprocesarDato.js";

// src/controladores/datosSensoresControlador.js
import { DatoSensorModelo } from "../modelos/DatoSensor.js";
import { validarDatosDatoSensor } from "../schemas/datoSensor.js";
import { formatZodError } from "../utils/formatZodError.js";

export class DatosSensoresControlador {
  // GET /api/datos
  static async obtenerTodos(req, res) {
    try {
      const datos = await DatoSensorModelo.obtenerTodos();
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

  // POST /api/datos
  static async registrar(req, res, io) {
    try {
      const nuevaLectura = req.body;

      // Validar campos mínimos
      if (!nuevaLectura.ParametroID || !nuevaLectura.valor) {
        return res
          .status(400)
          .json({ error: "ParametroID y valor son obligatorios" });
      }

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

      const resultado = await DatoSensorModelo.crear({
        ...lecturaValidada.data,
      });

      // Emitir evento en tiempo real al cliente conectado
      io.emit("nueva-lectura", resultado);

      console.log("✅ Lectura registrada:", resultado);

      res.status(201).json({
        mensaje: "Lectura registrada correctamente",
        data: resultado,
      });
    } catch (error) {
      console.error("Error al registrar lectura:", error);
      res.status(500).json({ error: "Error al registrar lectura" });
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
