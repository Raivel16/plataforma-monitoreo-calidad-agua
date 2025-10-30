import { PrediccionModelo } from "../modelos/prediccion.js";
import { validarDatosPrediccion } from "../schemas/prediccion.js";
import { formatZodError } from "../utils/formatZodError.js";

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
    // Lógica para crear una predicción
    const SensorID = validarDatosPrediccion(req.body);
    if (!SensorID.success) {
      const normalized = formatZodError(SensorID.error);
      return res
        .status(400)
        .json({ mensaje: "Datos de predicción inválidos", error: normalized });
    }

    // Aquí iría la lógica para guardar la predicción en la base de datos
    const nuevaPrediccion = await PrediccionModelo.generarPrediccion({
      ...SensorID.data,
    });

    // Aquí iría la lógica para manejar la respuesta de la API y devolver la predicción creada
    if (nuevaPrediccion) {
      res.status(201).json({
        mensaje: "Predicción creada exitosamente",
        data: nuevaPrediccion,
      });
    } else {
      res.status(500).json({ mensaje: "Error al crear la predicción" });
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
      return res
        .status(400)
        .json({
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
