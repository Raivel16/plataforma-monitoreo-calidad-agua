import { AlertaModelo } from "../modelos/Alerta.js";

export class AlertasControlador {
  static async obtenerPendientes(req, res) {
    try {
      const usuarioID = req.session?.usuario?.UsuarioID;
      
      if (!usuarioID) {
        return res.status(401).json({ error: "No autenticado" });
      }

      const alertas = await AlertaModelo.obtenerAlertasPendientes(usuarioID);
      res.json(alertas);
    } catch (error) {
      console.error("Error al obtener alertas:", error);
      res.status(500).json({ error: "Error al obtener alertas" });
    }
  }

  static async marcarLeida(req, res) {
    try {
      const { id } = req.params;
      await AlertaModelo.marcarComoLeida(id);
      res.json({ mensaje: "Alerta marcada como leída" });
    } catch (error) {
      console.error("Error al marcar alerta:", error);
      res.status(500).json({ error: "Error al marcar alerta" });
    }
  }
}