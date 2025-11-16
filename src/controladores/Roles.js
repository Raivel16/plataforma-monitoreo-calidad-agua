import { RolModelo } from "../modelos/Rol.js";
import { validarDatosRol, validarParcialDatosRol } from "../schemas/rol.js";
import { formatZodError } from "../utils/formatZodError.js";

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

  static async obtenerTodosRegistroAdministrativo(req, res) {
    try {
      const roles = await RolModelo.obtenerTodosRegistroAdministrativo();
      res.json(roles);
    } catch (error) {
      console.error("Error al obtener roles:", error);
      res.status(500).json({ error: "Error al obtener roles" });
    }
  }

  static async obtenerPorIDRegistroAdministrativo(req, res) {
    try {
      const { id } = req.params;
      const rol = await RolModelo.obtenerPorIDRegistroAdministrativo({
        RolID: id,
      });
      res.json(rol);
    } catch (error) {
      console.error("Error al obtener roles:", error);
      res.status(500).json({ error: "Error al obtener roles" });
    }
  }

  static async crear(req, res) {
    try {
      const datosActualizados = validarDatosRol(req.body);
      
      if (!datosActualizados.success) {
        const normalized = formatZodError(datosActualizados.error);
        return res.status(400).json({ error: normalized });
      }
      const { NombreRol, EsInterno, NivelPermiso } = datosActualizados.data;

      const nuevoRol = new RolModelo({ NombreRol, EsInterno, NivelPermiso });
      const nuevoRolRegistrado = await nuevoRol.crear();

      console.log(nuevoRolRegistrado);

      res.status(201).json(nuevoRolRegistrado);
    } catch (error) {
      console.error("❌ Error al crear rol:", error);
      res.status(500).json({ error: "Error al registrar rol" });
    }
  }

  static async actualizar(req, res) {
    try {
      const { id } = req.params;
      const datosActualizados = validarParcialDatosRol(req.body);

      console.log(datosActualizados);

      if (!datosActualizados.success) {
        const normalized = formatZodError(datosActualizados.error);
        return res.status(400).json({ error: normalized });
      }

      const rol = await RolModelo.actualizar({
        RolID: Number(id),
        datos: datosActualizados.data,
      });

      if (!rol) {
        return res.status(404).json({ error: "Rol no encontrado" });
      }

      res.json({ mensaje: "Rol actualizado correctamente", rol });
    } catch (error) {
      console.error("❌ Error al actualizar rol:", error);
      res.status(500).json({ error: "Error al actualizar rol" });
    }
  }
}
