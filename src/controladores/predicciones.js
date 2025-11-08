import { PrediccionModelo } from "../modelos/prediccion.js";
import { ServicioIA } from "../servicios/ServicioIA.js";

export class PrediccionesControlador {
  static async listarPredicciones(req, res) {
    // Lógica para obtener el historial de predicciones
    const historial = await PrediccionModelo.listarPredicciones();

    if (historial) {
      res.json(historial);
    } else {
      res
        .status(500)
        .json({ mensaje: "Error al obtener el historial de predicciones" });
    }
  }

  static async obtenerPrediccion(req, res) {
    // Lógica para obtener una predicción específica por ID
    const { id } = req.params;
    const prediccion = await PrediccionModelo.obtenerPrediccionPorId({ id });

    if (prediccion) {
      res.json(prediccion);
    } else {
      res.status(404).json({ mensaje: "Predicción no encontrada" });
    }
  }

  static async generarPrediccion(req, res) {
    try {
      const { datosHistoricos } = req.body;

      const prediccion = await ServicioIA.generarPrediccion({
        datosHistoricos,
      });

      res.status(200).json({
        ok: true,
        mensaje: "Predicción generada correctamente",
        data: prediccion,
      });
    } catch (error) {
      console.error("❌ Error en predicción:", error);
      res.status(500).json({
        ok: false,
        mensaje: "Error al generar la predicción",
        error: error.message,
      });
    }
  }

  static async eliminarPrediccion(req, res) {
    // Lógica para eliminar una predicción por ID
    const { id } = req.params;
    const eliminado = await PrediccionModelo.eliminarPrediccion({ id });
    if (eliminado) {
      res.json({ mensaje: "Predicción eliminada exitosamente" });
    } else {
      res.status(404).json({ mensaje: "Predicción no encontrada" });
    }
  }

  static async calcularPrecision(req, res) {
    // Lógica para obtener la precisión de las predicciones
    const { SensorID } = req.body;
    if (!SensorID) {
      return res.status(400).json({
        mensaje: "El SensorID es obligatorio para calcular la precisión",
      });
    }

    const precision = await PrediccionModelo.calcularPrecision({ SensorID });

    if (precision) {
      res.json(precision);
    } else {
      res
        .status(500)
        .json({ mensaje: "Error al obtener la precisión de las predicciones" });
    }
  }
}
