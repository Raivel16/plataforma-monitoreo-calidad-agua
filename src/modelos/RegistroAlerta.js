// models/RegistroAlertaModelo.js
import sql from "mssql";
import { getConnection } from "../config/db_sqlserver.js";

export class RegistroAlertaModelo {
  static async crear(UmbralID, DatoID) {
    const pool = await getConnection();
    const req = pool.request();
    req.input("UmbralID", sql.Int, UmbralID);
    req.input("DatoID", sql.BigInt, DatoID);
    const r = await req.execute("sp_InsertarRegistroAlerta");
    return r.recordset && r.recordset[0] && r.recordset[0].RegistroAlertaID;
  }

  static async crearYNotificar(UmbralID, DatoID, nivelesCSV) {
    const pool = await getConnection();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      const r1 = await transaction.request()
        .input("UmbralID", sql.Int, UmbralID)
        .input("DatoID", sql.BigInt, DatoID)
        .execute("sp_InsertarRegistroAlerta");

      const registroId = r1.recordset && r1.recordset[0] && r1.recordset[0].RegistroAlertaID;

      const r2 = await transaction.request()
        .input("RegistroAlertaID", sql.BigInt, registroId)
        .input("NivelesCSV", sql.VarChar(100), nivelesCSV)
        .execute("sp_CrearAlertasUsuariosParaNiveles");

      await transaction.commit();
      // r2.recordset -> array of { AlertaUsuarioID, UsuarioID }
      return { RegistroAlertaID: registroId, usuarios: r2.recordset || [] };
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
}
