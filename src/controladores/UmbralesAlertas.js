import { UmbralAlerta } from "../modelos/UmbralAlerta.js";

export class UmbralesAlertasController {
  static async obtenerUmbrales(req, res) {
    try {
      const umbrales = await UmbralAlerta.obtenerTodos();
      res.json(umbrales);
    } catch (error) {
      console.error("Error al obtener umbrales:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }
}
