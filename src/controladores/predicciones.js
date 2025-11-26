import { PrediccionModelo } from "../modelos/prediccion.js";
import { ServicioIASimulada } from "../servicios/ServicioIASimulada.js";
import { DatoSensorModelo } from "../modelos/DatoSensor.js";
import { SensorModelo } from "../modelos/Sensor.js";
import { ServicioIA } from "../servicios/ServicioIA.js";

export class PrediccionesControlador {
  static async listarPredicciones(req, res) {
    try {
      const { sensorId } = req.query;
      const historial = await PrediccionModelo.listarPredicciones({
        SensorID: sensorId ? Number(sensorId) : null,
      });
      res.json(historial);
    } catch (error) {
      console.error("Error al listar predicciones:", error);
      res.status(500).json({ error: "Error al listar predicciones" });
    }
  }

  static async obtenerPrediccion(req, res) {
    try {
      const { id } = req.params;
      const prediccion = await PrediccionModelo.obtenerPrediccionPorId({ id });
      if (prediccion) {
        res.json(prediccion);
      } else {
        res.status(404).json({ error: "Predicción no encontrada" });
      }
    } catch (error) {
      console.error("Error al obtener predicción:", error);
      res.status(500).json({ error: "Error al obtener predicción" });
    }
  }

  static async generarPrediccion(req, res) {
    try {
      const { SensorID } = req.body;
      if (!SensorID) {
        return res.status(400).json({ error: "SensorID es requerido" });
      }

      // Obtener últimos datos del sensor para generar predicción
      const datosHistoricos = await DatoSensorModelo.obtenerPorSensor({
        SensorID,
        limit: 10,
      });

      if (datosHistoricos.length === 0) {
        return res
          .status(400)
          .json({ error: "No hay datos suficientes para generar predicción" });
      }

      const prediccion = await ServicioIA.generarPrediccion({
        datosHistoricos,
      });

      const nuevaPrediccion = await PrediccionModelo.crear({
        SensorID,
        ...prediccion,
      });

      res.json(nuevaPrediccion);
    } catch (error) {
      console.error("Error al generar predicción:", error);
      res.status(500).json({ error: "Error al generar predicción" });
    }
  }

  static async calcularPrecision(req, res) {
    try {
      const { sensorId } = req.query;
      if (!sensorId) {
        return res.status(400).json({ error: "SensorID es requerido" });
      }

      const datosReales = await DatoSensorModelo.obtenerPorSensor({
        SensorID: sensorId,
        limit: 50,
      });
      const predicciones = await PrediccionModelo.listarPredicciones({
        SensorID: sensorId,
      });

      const resultado = await ServicioIASimulada.calcularPrecision({
        datosReales,
        predicciones,
      });

      res.json(resultado);
    } catch (error) {
      console.error("Error al calcular precisión:", error);
      res.status(500).json({ error: "Error al calcular precisión" });
    }
  }

  static async obtenerSensoresConPrediccion(req, res) {
    try {
      // 1. Obtener todos los sensores
      const sensores = await SensorModelo.obtenerTodos();

      // 2. Obtener últimas predicciones
      const predicciones = await PrediccionModelo.obtenerUltimasPredicciones();

      // 3. Cruzar información
      const sensoresConPrediccion = sensores.map((sensor) => {
        const prediccion = predicciones.find(
          (p) => p.SensorID === sensor.SensorID
        );
        return {
          ...sensor,
          Prediccion: prediccion || null,
        };
      });

      res.json(sensoresConPrediccion);
    } catch (error) {
      console.error("Error al obtener sensores con predicción:", error);
      res
        .status(500)
        .json({ error: "Error al obtener sensores con predicción" });
    }
  }
}
