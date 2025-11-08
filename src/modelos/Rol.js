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
      const result = pool.request();

      if (RolID) {
        result.input("RolID", sql.Int, RolID);
      }
      const datos = await result.execute(procedimiento);

      return datos.recordset;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  static async obtenerTodosRegistroUsuario() {
    const datos = await RolModelo.obtenerRoles({
      procedimiento: "sp_ObtenerRolesRegistroUsuario",
    });
    return datos;
  }

  static async obtenerTodosRegistroAdministrativo() {
    const datos = await RolModelo.obtenerRoles({
      procedimiento: "sp_ObtenerRolesRegistroAdministrativo",
    });
    return datos;
  }

  static async obtenerPorIDRegistroUsuario({ RolID }) {
    const datos = await RolModelo.obtenerRoles({
      procedimiento: "sp_ObtenerRolesRegistroUsuario",
      RolID,
    });
    return datos;
  }

  static async obtenerPorIDRegistroAdministrativo({ RolID }) {
    const datos = await RolModelo.obtenerRoles({
      procedimiento: "sp_ObtenerRolesRegistroAdministrativo",
      RolID,
    });
    return datos;
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
