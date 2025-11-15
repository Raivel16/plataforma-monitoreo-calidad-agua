import { RolModelo } from "../modelos/Rol.js";
import { UsuarioModelo } from "../modelos/Usuario.js";

import {
  validarDatosUsuario,
  validarParcialDatosUsuario,
} from "../schemas/usuario.js";

import { procesarRegistroUsuario } from "../utils/procesarRegistroUsuario.js";

function verificarRolID({ req, id }) {
  // Descomentar cuando se pruebe el fetch en la vista
  // const UsuarioLogeado = req.session?.usuario?.RolID ?? -1;
  // if (UsuarioLogeado != id && UsuarioLogeado != 1) return false;
  return true;
}

export class UsuarioControlador {
  static async obtenerTodos(req, res) {
    try {
      const usuarios = await UsuarioModelo.obtenerTodos();
      res.json(usuarios);
    } catch (error) {
      console.error("Error al obtener usuarios:", error);
      res.status(500).json({ error: "Error al obtener usuarios" });
    }
  }

  static async obtenerPorId(req, res) {
    try {
      const { id } = req.params;

      if (!verificarRolID({ req, id }))
        return res
          .status(404)
          .json({ error: "No tiene permitido buscar datos de otros usuarios" });

      const usuario = await UsuarioModelo.obtenerPorId({ UsuarioID: id });

      if (!usuario) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      res.json(usuario);
    } catch (error) {
      console.error("Error al obtener usuario:", error);
      res.status(500).json({ error: "Error al obtener usuario" });
    }
  }

  static async crearEnRegistroAdministrativo(req, res) {
    await procesarRegistroUsuario(
      req,
      res,
      validarDatosUsuario,
      RolModelo.obtenerPorIDRegistroAdministrativo.bind(RolModelo)
    );
  }

  static async registroUsuario(req, res) {
    await procesarRegistroUsuario(
      req,
      res,
      validarDatosUsuario,
      RolModelo.obtenerPorIDRegistroUsuario.bind(RolModelo)
    );
  }

  static async actualizar(req, res) {
    try {
      const { id } = req.params;

      console.log(req.body);

      if (!verificarRolID({ req, id }))
        return res
          .status(404)
          .json({ error: "No tiene permitido actualizar otro usuario." });

      const datosActualizados = validarParcialDatosUsuario(req.body);

      
      if (!datosActualizados.success) {
        const zodError = datosActualizados.error;
        const issues = zodError.issues || zodError.errors || [];
        const errores = issues.map((it) => ({
          message: it.message,
          path: it.path || [],
        }));

        return res.status(400).json({ error: { errors: errores } });
      }

      const usuario = await UsuarioModelo.actualizar({
        UsuarioID: Number(id),
        datos: datosActualizados.data,
      });

      if (!usuario) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      res.json({ mensaje: "Usuario actualizado correctamente", usuario });
    } catch (error) {
      console.error("Error al actualizar usuario:", error);
      res.status(500).json({ error: "Error al actualizar usuario" });
    }
  }

  static async eliminar(req, res) {
    try {
      const { id } = req.params;
      if (!verificarRolID({ req, id }))
        return res
          .status(404)
          .json({ error: "No tiene permitido eliminar otro usuario." });

      const eliminado = await UsuarioModelo.eliminar({ UsuarioID: id });

      if (!eliminado) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      res.json({ mensaje: "Usuario eliminado correctamente" });
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
      res.status(500).json({ error: "Error al eliminar usuario" });
    }
  }
}
