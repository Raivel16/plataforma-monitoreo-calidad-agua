import { AnomaliaModelo } from "../modelos/anomalia.js";

export class AnomaliasControlador {
  static async obtenerAnomalias(req, res) {
    // Lógica para obtener anomalías
    const anomalias = await AnomaliaModelo.detectarAnomalias();

    if (anomalias) {
      res.json(anomalias);
    } else {
      res.status(500).json({ mensaje: "Error al obtener anomalías" });
    }
  }
}
