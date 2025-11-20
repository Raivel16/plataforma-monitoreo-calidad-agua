import { getConnection } from "../config/db_sqlserver.js";
import sql from "mssql";

export class RegistroAlertaModelo {
  constructor({
    RegistroAlertaID = null,
    UmbralID = null,
    AnomaliaID = null,
    DatoID = null,
    FechaHoraAlerta = null,
    EstadoNotificacion = null,
    Tipo = null,
    Contexto = null,
  } = {}) {
    this.RegistroAlertaID = RegistroAlertaID;
    this.UmbralID = UmbralID;
    this.AnomaliaID = AnomaliaID;
    this.DatoID = DatoID;
    this.FechaHoraAlerta = FechaHoraAlerta;
    this.EstadoNotificacion = EstadoNotificacion;
    this.Tipo = Tipo;
    this.Contexto = Contexto;
  }

  /**
   * Registra una alerta en la tabla RegistroAlertas
   * (Movido desde AlertaModelo para mejor separación de responsabilidades)
   */
  static async registrarAlerta({
    umbralID = null,
    anomaliaID = null,
    datoID,
    tipo,
    contexto = null,
  }) {
    try {
      const pool = await getConnection();
      const request = pool.request();

      request.input("UmbralID", sql.Int, umbralID);
      request.input("AnomaliaID", sql.BigInt, anomaliaID);
      request.input("DatoID", sql.BigInt, datoID);
      request.input("FechaHoraAlerta", sql.DateTime2, new Date());
      request.input("EstadoNotificacion", sql.VarChar(50), "Enviado");
      request.input("Tipo", sql.VarChar(20), tipo);
      request.input("Contexto", sql.VarChar(500), contexto);

      const result = await request.execute("sp_InsertarRegistroAlerta");
      const registroAlertaID = result.recordset[0].RegistroAlertaID;

      console.log(
        `✅ RegistroAlerta creado: ID=${registroAlertaID}, Tipo=${tipo}`
      );
      return { registroAlertaID, tipo, contexto };
    } catch (error) {
      console.error("Error al registrar alerta:", error);
      throw error;
    }
  }

  //funciones de consulta
}
