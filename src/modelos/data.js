import { getConnection } from "../config/db_sqlserver.js";
import sql from "mssql";

export class DataModelo {
  static async guardarLectura({ dato }) {
    // Simulación de guardar en la base de datos
    try {
      const pool = await getConnection();
      const result = await pool
        .request()
        .input("SensorID", dato.SensorID)
        .input("TimestampRegistro", dato.TimestampRegistro)
        .input("TimestampEnvio", dato.TimestampEnvio)
        .input("Valor_original", dato.Valor_original)
        .input("Valor_procesado", dato.Valor_procesado)
        .input("Valor_normalizado", dato.Valor_normalizado)
        .input("Estado", dato.Estado)
        .execute("usp_InsertarDatosSensor");

      const nuevoDatoID = result.recordset[0].NuevoDatoID;

      return {
        id: nuevoDatoID,
        ...dato,
      };
    } catch (error) {
      console.error("Error al guardar la lectura:", error);
      throw error;
    }
  }

  /**
   * Obtener lecturas con filtros opcionales.
   * filters: { sensorId, parametroId, fechaInicio, fechaFin }
   */
  static async obtenerLecturas({  filters = {} } = {}) {
    try {
      const pool = await getConnection();
      const request = pool.request();

      // Añadir parámetros solo si vienen definidos (si vienen null se pasa null)
      if (typeof filters.sensorId !== "undefined") {
        request.input("SensorID_Filtro", sql.Int, filters.sensorId);
      } else {
        request.input("SensorID_Filtro", sql.Int, null);
      }

      if (typeof filters.parametroId !== "undefined") {
        request.input("ParametroID_Filtro", sql.Int, filters.parametroId);
      } else {
        request.input("ParametroID_Filtro", sql.Int, null);
      }

      if (typeof filters.fechaInicio !== "undefined") {
        // aceptar Date o string ISO
        request.input("FechaInicio", sql.DateTime2, filters.fechaInicio);
      } else {
        request.input("FechaInicio", sql.DateTime2, null);
      }

      if (typeof filters.fechaFin !== "undefined") {
        request.input("FechaFin", sql.DateTime2, filters.fechaFin);
      } else {
        request.input("FechaFin", sql.DateTime2, null);
      }

      const result = await request.execute("usp_ObtenerDatosSensores");
      return result.recordset;
    } catch (error) {
      console.error("Error al obtener las lecturas:", error);
      throw error;
    }
  }
}
