// models/AnomaliaModelo.js
import { getConnection } from "../config/db_sqlserver.js";
import sql from "mssql";

export class AnomaliaModelo {
  static async crear({ DatoID, Tipo, Descripcion }) {
    const pool = await getConnection();
    const req = pool.request();
    req.input("DatoID", sql.BigInt, DatoID);
    req.input("Tipo", sql.VarChar(50), Tipo);
    req.input("Descripcion", sql.VarChar(255), Descripcion);
    const r = await req.execute("sp_InsertarAnomalia");
    return r.recordset && r.recordset[0] && r.recordset[0].AnomaliaID;
  }
}
