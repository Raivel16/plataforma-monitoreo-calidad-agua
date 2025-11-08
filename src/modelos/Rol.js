import { getConnection } from "../config/db_sqlserver.js";
import sql from "mssql";

export class RolModelo {
  constructor({ RolID = null, NombreRol = null } = {}) {
    this.RolID = RolID;
    this.NombreRol = NombreRol;
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
    return result;
  }

  static async crear({ NombreRol }) {
    const nuevoRol = {
      RolID: this.roles.length + 1,
      NombreRol,
    };
    this.roles.push(nuevoRol);
    return nuevoRol;
  }
}
