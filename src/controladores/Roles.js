import { RolModelo } from "../modelos/Rol.js";

export class RolesControlador {
  static async obtenerTodosDesdeUsuario(req, res) {
    try {
      const roles = await RolModelo.obtenerTodosRegistroUsuario();
      res.json(roles);
    } catch (error) {
      console.error("Error al obtener roles:", error);
      res.status(500).json({ error: "Error al obtener roles" });
    }
  }

}