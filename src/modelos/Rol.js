import { getConnection } from "../config/db_sqlserver.js";
import sql from "mssql";

export class RolModelo {
  constructor({
    RolID = null,
    NombreRol = null,
    EsInterno = 0,
    NivelPermiso = 1,
  } = {}) {
    this.RolID = RolID;
    this.NombreRol = NombreRol;
    this.EsInterno = EsInterno;
    this.NivelPermiso = NivelPermiso;
  }
  static async obtenerRoles({ procedimiento, RolID = null }) {
    try {
      const pool = await getConnection();
      const request = pool.request();

      if (RolID) {
        request.input("RolID", sql.Int, RolID);
      }
      const result = await request.execute(procedimiento);

      return result.recordset;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  static async obtenerTodosRegistroUsuario() {
    const result = await RolModelo.obtenerRoles({
      procedimiento: "sp_ObtenerRolesRegistroUsuario",
    });
    return result;
  }

  static async obtenerTodosRegistroAdministrativo() {
    const result = await RolModelo.obtenerRoles({
      procedimiento: "sp_ObtenerRolesRegistroAdministrativo",
    });
    return result;
  }

  static async obtenerPorIDRegistroUsuario({ RolID }) {
    const result = await RolModelo.obtenerRoles({
      procedimiento: "sp_ObtenerRolesRegistroUsuario",
      RolID,
    });
    return result;
  }

  static async obtenerPorIDRegistroAdministrativo({ RolID }) {
    const result = await RolModelo.obtenerRoles({
      procedimiento: "sp_ObtenerRolesRegistroAdministrativo",
      RolID,
    });
    return result[0];
  }

  async crear() {
    try {
      const pool = await getConnection();
      const request = pool.request();

      // Entradas para el SP
      request.input("NombreRol", sql.VarChar(50), this.NombreRol);
      request.input("EsInterno", sql.Bit, this.EsInterno);
      request.input("NivelPermiso", sql.Int, this.NivelPermiso);

      // Ejecutar SP
      const result = await request.execute("sp_InsertarRol");

      const nuevoRolID = result.recordset[0]?.NuevoRolID;

      // Retornar nuevo objeto RolModelo
      return {
        RolID: nuevoRolID,
        NombreRol: this.NombreRol,
        EsInterno: this.EsInterno,
        NivelPermiso: this.NivelPermiso,
      };
    } catch (error) {
      console.error("Error al crear rol:", error);
      throw error;
    }
  }

  static async actualizar({ RolID, datos }) {
    try {
      const pool = await getConnection();
      const request = pool.request();

      // --------------------------------------
      // Validación mínima
      // --------------------------------------
      if (!RolID) {
        throw new Error("RolID es obligatorio para actualizar.");
      }

      // Parámetro obligatorio
      request.input("RolID", sql.Int, RolID);

      // Parámetros opcionales (solo si vienen)
      if (datos.NombreRol !== undefined) {
        request.input("NombreRol", sql.VarChar(50), datos.NombreRol);
      } else {
        request.input("NombreRol", sql.VarChar(50), null);
      }

      if (datos.EsInterno !== undefined) {
        request.input("EsInterno", sql.Bit, Number(datos.EsInterno));
      } else {
        request.input("EsInterno", sql.Bit, null);
      }

      if (datos.NivelPermiso !== undefined) {
        request.input("NivelPermiso", sql.Int, Number(datos.NivelPermiso));
      } else {
        request.input("NivelPermiso", sql.Int, null);
      }

      // Ejecutar procedimiento
      await request.execute("sp_ModificarRol");

      // --------------------------------------
      // Retornar estructura uniforme
      // --------------------------------------
      return {
        RolID,
        ...datos,
      };
    } catch (error) {
      console.error("Error al actualizar rol:", error);
      throw error;
    }
  }
}
