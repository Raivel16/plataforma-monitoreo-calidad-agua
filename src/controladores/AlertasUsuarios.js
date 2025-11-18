// controllers/AlertasController.js
import { AlertasUsuarioModelo } from "../models/AlertasUsuarioModelo.js";

/**
 * GET /api/alertas/mis
 * Si tienes autenticación: usa req.user.UsuarioID.
 * Para pruebas puedes pasar ?UsuarioID=1
 */
export async function getMisAlertas(req, res) {
  try {
    const usuarioIdQuery = req.query.UsuarioID ? Number(req.query.UsuarioID) : null;
    const userFromReq = req.user && req.user.UsuarioID ? Number(req.user.UsuarioID) : null;
    const UsuarioID = usuarioIdQuery || userFromReq;

    if (!UsuarioID) {
      return res.status(400).json({ error: "UsuarioID no proporcionado (sesión requerida)" });
    }

    const pendientes = await AlertasUsuarioModelo.obtenerPendientesPorUsuario(UsuarioID);
    return res.json(pendientes);
  } catch (err) {
    console.error("Error getMisAlertas:", err);
    return res.status(500).json({ error: "Error al obtener alertas" });
  }
}