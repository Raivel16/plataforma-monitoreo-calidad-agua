import { ParametroModelo } from "../modelos/Parametro.js";

export class ParametrosControlador {
  // GET /api/parametros
  static async obtenerTodos(req, res) {
    try {
      const parametros = await ParametroModelo.obtenerTodos();
      res.json(parametros);
    } catch (error) {
      console.error("Error al obtener parametros:", error);
      res.status(500).json({ error: "Error al obtener parametros" });
    }
  }
}
