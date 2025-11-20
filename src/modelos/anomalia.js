export class AnomaliaModelo {
  constructor({
    AnomaliaID = null,
    DatoID = null,
    Tipo = null,
    Descripcion = null,
    Fecha_Detectada = null,
    Estado = null,
  } = {}) {
    this.AnomaliaID = AnomaliaID;
    this.DatoID = DatoID;
    this.Tipo = Tipo;
    this.Descripcion = Descripcion;
    this.Fecha_Detectada = Fecha_Detectada;
    this.Estado = Estado;
  }

  /**
   * Registra una nueva anomalía en la base de datos
   * @param {Object} params - Parámetros de la anomalía
   * @param {number} params.datoID - ID del dato que causó la anomalía
   * @param {string} params.tipo - Tipo de anomalía (ej: "SENSOR_DEFECTUOSO")
   * @param {string} params.descripcion - Descripción detallada de la anomalía
   * @returns {Promise<number>} - ID de la anomalía creada
   */
  static async registrarAnomalia({ datoID, tipo, descripcion }) {
    try {
      const { getConnection } = await import("../config/db_sqlserver.js");
      const sql = (await import("mssql")).default;

      const pool = await getConnection();
      const request = pool.request();

      request.input("DatoID", sql.BigInt, datoID);
      request.input("Tipo", sql.VarChar(50), tipo);
      request.input("Descripcion", sql.VarChar(255), descripcion);

      const result = await request.execute("sp_InsertarAnomalia");
      const anomaliaID = result.recordset[0].AnomaliaID;

      console.log(`✅ Anomalía registrada: ID=${anomaliaID}, Tipo=${tipo}`);
      return anomaliaID;
    } catch (error) {
      console.error("Error al registrar anomalía:", error);
      throw error;
    }
  }
}
