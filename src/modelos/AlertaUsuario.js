// models/AnomaliaModelo.js
import { getConnection } from "../config/db_sqlserver.js";
import sql from "mssql";

export class AlertaUsuarioModelo {
   static async obtenerPendientesPorUsuario(UsuarioID) {
    const pool = await getConnection();
    const req = pool.request();
    req.input("UsuarioID", sql.Int, UsuarioID);
    const result = await req.execute("sp_ObtenerAlertasPendientesPorUsuario");
    return result.recordset || [];
  }
  //funciones de consulta
}
