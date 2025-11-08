import { SensorModelo } from "../modelos/Sensor.js";

import {
  validarDatosSensor,
  validarParcialDatosSensor,
} from "../schemas/sensor.js";
import { formatZodError } from "../utils/formatZodError.js";

export class SensoresControlador {
  // GET /api/sensores
  static async obtenerTodos(req, res) {
    try {
      const sensores = await SensorModelo.obtenerTodos();

      const sensoresConCalidadAgua = sensores.map((s) => ({
        ...s,
        CalidadAgua: "Buena",
      }));

      res.json(sensoresConCalidadAgua);
    } catch (error) {
      console.error("Error al obtener sensores:", error);
      res.status(500).json({ error: "Error al obtener sensores" });
    }
  }

  // GET /api/sensores/:id
  static async obtenerPorId(req, res) {
    try {
      const { id } = req.params;
      const sensor = await SensorModelo.obtenerPorId({ id });

      if (!sensor) {
        return res.status(404).json({ error: "Sensor no encontrado" });
      }

      const sensorConCalidadAgua = {
        ...sensor,
        CalidadAgua: "Buena",
      };

      res.json(sensorConCalidadAgua);
    } catch (error) {
      console.error("Error al obtener sensor:", error);
      res.status(500).json({ error: "Error al obtener sensor" });
    }
  }

  // POST /api/sensores
  static async crear(req, res) {
    try {
      const nuevoSensor = validarDatosSensor(req.body);

      if (!nuevoSensor.success) {
        const normalized = formatZodError(nuevoSensor.error);
        return res.status(400).json({ error: normalized });
      }

      const sensorCreado = await SensorModelo.crear({ ...nuevoSensor.data });
      res.status(201).json(sensorCreado);
    } catch (error) {
      console.error("Error al crear sensor:", error);
      res.status(500).json({ error: "Error al registrar sensor" });
    }
  }

  // PATCH /api/sensores/:id
  static async actualizar(req, res) {
    try {
      const { id } = req.params;
      const datosActualizados = validarParcialDatosSensor(req.body);

      if (!datosActualizados.success) {
        const normalized = formatZodError(datosActualizados.error);
        return res.status(400).json({ error: normalized });
      }

      const sensor = await SensorModelo.actualizar({
        id,
        datos: datosActualizados.data,
      });

      if (!sensor) {
        return res.status(404).json({ error: "Sensor no encontrado" });
      }

      res.json({ mensaje: "Sensor actualizado correctamente", sensor });
    } catch (error) {
      console.error("Error al actualizar sensor:", error);
      res.status(500).json({ error: "Error al actualizar sensor" });
    }
  }

  // PATCH /api/sensores/:id/desactivar
  static async desactivar(req, res) {
    try {
      const { id } = req.params;
      const sensor = await SensorModelo.desactivar({ id });

      if (!sensor) {
        return res.status(404).json({ error: "Sensor no encontrado" });
      }

      res.json({ mensaje: "Sensor desactivado correctamente", sensor });
    } catch (error) {
      console.error("Error al desactivar sensor:", error);
      res.status(500).json({ error: "Error al desactivar sensor" });
    }
  }

  // DELETE /api/sensores/:id
  static async eliminar(req, res) {
    try {
      const { id } = req.params;
      const eliminado = await SensorModelo.eliminar({ id });

      if (!eliminado) {
        return res.status(404).json({ error: "Sensor no encontrado" });
      }

      res.json({ mensaje: "Sensor eliminado correctamente" });
    } catch (error) {
      console.error("Error al eliminar sensor:", error);
      res.status(500).json({ error: "Error al eliminar sensor" });
    }
  }
}
