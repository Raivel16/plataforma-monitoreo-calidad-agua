import { SensorModelo } from "../modelos/Sensor.js";
import { DatoSensorModelo } from "../modelos/DatoSensor.js";
import { ServicioIASimulada } from "../servicios/ServicioIASimulada.js";

import {
  validarDatosSensor,
  validarParcialDatosSensor,
} from "../schemas/sensor.js";
import { formatZodError } from "../utils/formatZodError.js";

export class SensoresControlador {
  // GET /api/sensores
  static async obtenerTodosVisualizacion(req, res) {
    try {
      const sensores = await SensorModelo.obtenerTodos();

      const ultimoDatoSensores =
        await DatoSensorModelo.obtenerUltimoDatoSensores();

      const sensoresConCalidadAgua = await Promise.all(
        sensores.map(async (s) => {
          const datos = ultimoDatoSensores
            .filter((d) => d.SensorID === s.SensorID)
            .map(({ ParametroID, Valor_procesado, TimestampRegistro }) => ({
              ParametroID,
              Valor_procesado,
              TimestampRegistro,
            }));

          // Si no tiene datos → devolver sensor sin predicción
          if (datos.length === 0) {
            return {
              ...s,
              Datos: [],
              CalidadAgua: null,
              Explicacion: "Aún no hay datos registrados para este sensor.",
              ProbabilidadRiesgo: null,
              FechaHoraPrediccion: null,
            };
          }

          const datosPrediccion = datos.map((d) => ({
            [d.ParametroID]: d.Valor_procesado,
          }));

          const prediccion = await ServicioIASimulada.generarPrediccion({
            datosHistoricos: datosPrediccion,
          });

          return {
            ...s,
            Datos: datos,
            CalidadAgua: prediccion.ValorPredicho,
            Explicacion: prediccion.Explicacion,
            ProbabilidadRiesgo: prediccion.ProbabilidadRiesgo,
            FechaHoraPrediccion: prediccion.FechaHoraPrediccion,
          };
        })
      );

      res.json({ sensoresConCalidadAgua });
    } catch (error) {
      console.error("Error al obtener sensores:", error);
      res.status(500).json({ error: "Error al obtener sensores" });
    }
  }

  static async obtenerTodos(req, res) {
    try {
      const sensores = await SensorModelo.obtenerTodos();
      res.json(sensores);
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
      res.json(sensor);
    } catch (error) {
      console.error("Error al obtener sensor:", error);
      res.status(500).json({ error: "Error al obtener sensor" });
    }
  }

  // POST /api/sensores
  static async crear(req, res) {
    try {
      const datos = req.body;
      
      

      // 🔥 Convertir tipos ANTES de validar
      if (datos.Latitud !== undefined) datos.Latitud = Number(datos.Latitud);
      if (datos.Longitud !== undefined) datos.Longitud = Number(datos.Longitud);

      if (datos.EstadoOperativo !== undefined) {
        datos.EstadoOperativo =
          datos.EstadoOperativo === "true" || datos.EstadoOperativo === true;
      }

      const nuevoSensor = validarDatosSensor(datos);

      console.log(nuevoSensor);

      if (!nuevoSensor.success) {
        const normalized = formatZodError(nuevoSensor.error);
        return res.status(400).json({ error: normalized });
      }

      const sensorCreado = await SensorModelo.crear(nuevoSensor.data);

      res.status(201).json({
        mensaje: "Sensor registrado correctamente",
        sensor: sensorCreado,
      });
    } catch (error) {
      console.error("❌ Error al crear sensor:", error);
      res.status(500).json({ error: "Error al registrar sensor" });
    }
  }

  // PATCH /api/sensores/:id
  static async actualizar(req, res) {
    try {
      const { id } = req.params;
      const datos = req.body;

      // 🔥 Convertir tipos ANTES de validar
      if (datos.Latitud !== undefined) datos.Latitud = Number(datos.Latitud);
      if (datos.Longitud !== undefined) datos.Longitud = Number(datos.Longitud);
      if (datos.EstadoOperativo !== undefined) {
        datos.EstadoOperativo =
          datos.EstadoOperativo === "true" || datos.EstadoOperativo === true;
      }

      // Validación parcial con Zod
      const datosActualizados = validarParcialDatosSensor(datos);

      if (!datosActualizados.success) {
        const normalized = formatZodError(datosActualizados.error);
        return res.status(400).json({ error: normalized });
      }

      // Ejecutar actualización en el modelo
      const resultado = await SensorModelo.actualizar({
        id: Number(id),
        datos: datosActualizados.data,
      });

      // Si no se afectaron filas → sensor no existe
      if (!resultado || resultado.filasAfectadas === 0) {
        return res.status(404).json({ error: "Sensor no encontrado" });
      }

      // ✔ Como no hay recordset del SP, devolvemos lo enviado
      return res.json({
        mensaje: "Sensor actualizado correctamente",
        sensor: {
          SensorID: Number(id),
          ...datosActualizados.data,
        },
      });
    } catch (error) {
      console.error("❌ Error al actualizar sensor:", error);
      return res.status(500).json({ error: "Error al actualizar sensor" });
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
