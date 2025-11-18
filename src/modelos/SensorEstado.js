// models/SensorEstadoModelo.js
import { getConnection } from "../config/db_sqlserver.js";
import sql from "mssql";

export class SensorEstadoModelo {
  static async incrementar(SensorID, ParametroID, threshold = 3) {
    const pool = await getConnection();
    const req = pool.request();
    req.input("SensorID", sql.Int, SensorID);
    req.input("ParametroID", sql.Int, ParametroID);
    req.input("Threshold", sql.Int, threshold);
    const r = await req.execute("sp_IncrementarEstadoSensor");
    return r.recordset && r.recordset[0] ? r.recordset[0] : null;
  }

  static async reset(SensorID, ParametroID) {
    const pool = await getConnection();
    const req = pool.request();
    req.input("SensorID", sql.Int, SensorID);
    req.input("ParametroID", sql.Int, ParametroID);
    const r = await req.execute("sp_ResetEstadoSensor");
    return r.recordset && r.recordset[0] ? r.recordset[0] : null;
  }
}
