import { getConnection } from "../config/db_sqlserver.js";

export class ParametroModelo {
  static async obtenerTodos() {
    try {
      const pool = await getConnection();
      const request = pool.request();
      const result = await request.execute("sp_ObtenerParametros");
      return result.recordset;
    } catch (error) {
      console.error("❌ Error al obtener parametros:", error);
      throw error;
    }
  }
}
