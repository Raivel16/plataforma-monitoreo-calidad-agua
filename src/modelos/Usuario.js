import bcrypt from "bcrypt";

import { getConnection } from "../config/db_sqlserver.js";
import sql from "mssql";

import { usuarios } from "./bd_local/usuarios.js";

export class UsuarioModelo {
  constructor({
    UsuarioID = null,
    RolID = null,
    NombreUsuario = null,
    Correo = null,
    Contrasena = null,
    Activo = null,
  } = {}) {
    this.UsuarioID = UsuarioID;
    this.RolID = RolID;
    this.NombreUsuario = NombreUsuario;
    this.Correo = Correo;
    this.Contrasena = Contrasena;
    this.Activo = Activo;
  }

  static async obtenerTodos({
    UsuarioID = null,
    NombreUsuario = null,
    RolID = null,
  } = {}) {
    try {
      const pool = await getConnection();
      const request = pool.request();

      request.input("UsuarioID", sql.Int, UsuarioID);
      request.input("NombreUsuario", sql.VarChar(100), NombreUsuario);
      request.input("RolID", sql.Int, RolID);

      const result = await request.execute("sp_ObtenerUsuarios");

      return result.recordset;
    } catch (error) {
      console.error("Error en obtenerTodos:", error);
      throw error;
    }
  }

  static async obtenerPorId({ UsuarioID }) {
    return UsuarioModelo.obtenerTodos({ UsuarioID });
  }

  async verificarDuplicados() {
    try {
      const pool = await getConnection();
      const request = pool.request();

      request
        .input("NombreUsuario", sql.VarChar(100), this.NombreUsuario)
        .input("Correo", sql.VarChar(150), this.Correo);

      const result = await request.execute("sp_VerificarUsuarioOCorreo");
      const conflicto = result.recordset[0]?.Conflicto;

      if (conflicto === "usuario") {
        throw new Error("El nombre de usuario ya está en uso");
      } else if (conflicto === "correo") {
        throw new Error("El correo electrónico ya está registrado");
      }

      return false; // No hay duplicado
    } catch (error) {
      console.error("❌ Error en verificarDuplicados:", error.message);
      // Re-lanza el error para que el controlador decida cómo responder
      throw error;
    }
  }

  async register() {
    await this.verificarDuplicados();

    const contrasenaHash = await bcrypt.hash(this.Contrasena, 10);

    try {
      // 1. Obtener la conexión
      const pool = await getConnection();
      const request = pool.request();

      // 2. Mapear los parámetros al SP
      //    (usando los valores recibidos y los defaults)
      request.input("RolID", sql.Int, this.RolID);
      request.input("NombreUsuario", sql.VarChar(100), this.NombreUsuario);
      request.input("Correo", sql.VarChar(150), this.Correo);
      request.input("ContrasenaHash", sql.VarChar(255), contrasenaHash);
      request.input("Activo", sql.Bit, this.Activo);

      // 3. Ejecutar el procedimiento almacenado
      const result = await request.execute("sp_InsertarUsuario");

      const nuevoID = result?.recordset?.[0]?.NuevoUsuarioID ?? null;
      if (!nuevoID) throw new Error("No se pudo insertar el usuario");

      // 4. Devuelve el objeto completo, incluyendo el nuevo ID
      return {
        UsuarioID: nuevoID, // <-- ¡AQUÍ ESTÁ!
        RolID: this.RolID,
        NombreUsuario: this.NombreUsuario,
        Correo: this.Correo,
      };
    } catch (error) {
      console.error("❌ Error al registrar usuario:", error);
      throw error;
    }
  }

  static async actualizar({ UsuarioID, datos }) {
    console.log("UsuarioID a actualizar:", UsuarioID);
    console.log("Datos a actualizar:", datos);

    try {
      const pool = await getConnection();
      const request = pool.request();

      // Si viene contraseña, la encriptamos
      let contrasenaHash = null;
      if (datos.Contrasena) {
        contrasenaHash = await bcrypt.hash(datos.Contrasena, 10);
      }

      // Mapear parámetros
      request.input("UsuarioID", sql.Int, UsuarioID);
      request.input("RolID", sql.Int, datos.RolID);
      request.input("ContrasenaHash", sql.VarChar(255), contrasenaHash);
      request.input("Activo", sql.Bit, datos.Activo);

      // Ejecutar SP
      const result = await request.execute("sp_ActualizarUsuario");

      // Devuelve el usuario actualizado (recordset[0])
      return result.recordset[0];
    } catch (error) {
      console.error("Error al actualizar usuario:", error);
      throw error;
    }
  }

  static async eliminar({ UsuarioID }) {
    const index = usuarios.findIndex((u) => u.UsuarioID === Number(UsuarioID));
    if (index === -1) return false;

    usuarios.splice(index, 1);
    return true;
  }
}
