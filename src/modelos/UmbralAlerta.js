import { getConnection } from "../config/db_sqlserver.js";

export class UmbralAlerta {
  constructor({
    UmbralID = null,
    ParametroID = null,
    ValorCritico = null,
    TipoUmbral = null,
    MensajeAlerta = null,
  } = {}) {
    this.UmbralID = UmbralID;
    this.ParametroID = ParametroID;
    this.ValorCritico = ValorCritico;
    this.TipoUmbral = TipoUmbral;
    this.MensajeAlerta = MensajeAlerta;
  }


  static async obtenerTodos() {
    try {
      const pool = await getConnection();
      const result = await pool
        .request()
        .execute("sp_ObtenerUmbrales");
      return result.recordset;
    } catch (error) {
      console.error("❌ Error al obtener todos los umbrals:", error);
      throw error;
    }
  }
}
