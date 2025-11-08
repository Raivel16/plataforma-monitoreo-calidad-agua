import bcrypt from "bcrypt";

import { getConnection } from "../config/db_sqlserver.js";

export class AuthModelo {
  static async login({ NombreUsuario, Contrasena }) {
    // Aquí iría la lógica para autenticar al usuario con NombreUsuario y Contrasena

    try {
      const pool = await getConnection();
      const request = pool.request();

      // Pasar el parámetro al procedimiento almacenado
      request.input("NombreUsuario", NombreUsuario);

      // Ejecutar el procedimiento
      const result = await request.execute("sp_AutenticarUsuario");

      // Si no hay resultados, el usuario no existe
      if (result.recordset.length === 0) {
        return null;
      }

      const usuario = result.recordset[0];

      // Verificar si el usuario está activo
      if (!usuario.Activo) {
        return null;
      }

      // Comparar contraseña con el hash almacenado
      const esContrasenaValida = await bcrypt.compare(
        Contrasena,
        usuario.ContrasenaHash
      );

      if (!esContrasenaValida) {
        return null;
      }
      // Devolver los datos del usuario autenticado
      return {
        UsuarioID: usuario.UsuarioID,
        RolID: usuario.RolID,
        NombreUsuario: usuario.NombreUsuario,
        Correo: usuario.Correo,
      };
    } catch (error) {
      console.error("Error durante la autenticación:", error);
      throw error;
    }
  }
}
