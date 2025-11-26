import { getConnection } from "../config/db_sqlserver.js";
import sql from "mssql";

export class PrediccionModelo {
  static async listarPredicciones({ SensorID = null }) {
    try {
      const pool = await getConnection();
      const request = pool.request();

      if (SensorID) {
        request.input("SensorID_Filtro", sql.Int, SensorID);
      }

      const result = await request.execute("sp_ObtenerPredicciones");
      return result.recordset;
    } catch (error) {
      console.error("❌ Error al obtener predicciones:", error);
      throw error;
    }
  }

  static async obtenerPrediccionPorId({ id }) {
    try {
      const pool = await getConnection();
      const request = pool.request();
      request.input("PrediccionID", sql.BigInt, id);
      const result = await request.execute("sp_ObtenerPrediccionPorID");
      return result.recordset[0];
    } catch (error) {
      console.error("❌ Error al obtener predicción:", error);
      throw error;
    }
  }

  static async crear({
    SensorID,
    FechaHoraPrediccion,
    ValorPredicho,
    ProbabilidadRiesgo,
    Explicacion,
  }) {
    try {
      const pool = await getConnection();
      const request = pool.request();

      request.input("SensorID", sql.Int, SensorID);
      request.input("FechaHoraPrediccion", sql.DateTime2, FechaHoraPrediccion);
      request.input("ValorPredicho", sql.VarChar(50), ValorPredicho);
      request.input(
        "ProbabilidadRiesgo",
        sql.Decimal(5, 2),
        ProbabilidadRiesgo
      );
      request.input("Explicacion", sql.VarChar(500), Explicacion);

      await request.execute("sp_InsertarPrediccion");

      return {
        SensorID,
        FechaHoraPrediccion,
        ValorPredicho,
        ProbabilidadRiesgo,
        Explicacion,
      };
    } catch (error) {
      console.error("❌ Error al crear predicción:", error);
      throw error;
    }
  }

  static async obtenerUltimasPredicciones() {
    try {
      const pool = await getConnection();
      const request = pool.request();
      const result = await request.execute("sp_ObtenerUltimasPredicciones");
      return result.recordset;
    } catch (error) {
      console.error("❌ Error al obtener últimas predicciones:", error);
      throw error;
    }
  }
}
