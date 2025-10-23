import { PrediccionModelo } from "../modelos/prediccion.js";

export class PrediccionesControlador {
  static async crearPrediccion(req, res) {
    // Lógica para crear una predicción
    const { ubicacion } = req.body;
    // Aquí iría la lógica para guardar la predicción en la base de datos
    const nuevaPrediccion = await PrediccionModelo.crearPrediccion({
      ubicacion,
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

  static async obtenerHistorialPredicciones(req, res) {
    // Lógica para obtener el historial de predicciones
    const historial = await PrediccionModelo.obtenerHistorial();

    if (historial) {
      res.json(historial);
    } else {
      res
        .status(500)
        .json({ mensaje: "Error al obtener el historial de predicciones" });
    }
  }

  static async obtenerPrecisionPredicciones(req, res) {
    // Lógica para obtener la precisión de las predicciones
    const precision = await PrediccionModelo.calcularPrecision();

    if (precision) {
      res.json(precision);
    } else {
      res
        .status(500)
        .json({ mensaje: "Error al obtener la precisión de las predicciones" });
    }
  }
}
