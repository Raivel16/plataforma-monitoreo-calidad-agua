import { getConnection } from "../config/db_sqlserver.js";
import sql from "mssql";

export class SensorModelo {
  static async obtenerDatos({ EstadoOperativo = null, SensorID = null }) {
    try {
      const pool = await getConnection();
      const request = pool.request();

      if (EstadoOperativo) {
        request.input("EstadoOperativo_Filtro", sql.Bit, EstadoOperativo);
      }
      if (SensorID) {
        request.input("SensorID", sql.Int, SensorID);
      }

      const result = await request.execute("sp_ObtenerSensores");

      return result.recordset;
    } catch (error) {
      console.error("❌ Error al obtener sensores:", error);
      throw error;
    }
  }

  static async obtenerTodos() {
    const result = await this.obtenerDatos({});
    return result;
  }

  static async obtenerPorId({ id }) {
    const result = await this.obtenerDatos({ SensorID: id });
    return result[0];
  }

  static async crear({
    Nombre,
    Modelo,
    Fabricante,
    Latitud,
    Longitud,
    Descripcion,
  }) {
    try {
      const pool = await getConnection();
      const request = pool.request();

      request.input("Nombre", sql.VarChar(100), Nombre);
      request.input("Modelo", sql.VarChar(50), Modelo);
      request.input("Fabricante", sql.VarChar(100), Fabricante);
      request.input("Latitud", sql.Decimal(9, 6), Latitud);
      request.input("Longitud", sql.Decimal(9, 6), Longitud);
      request.input("Descripcion", sql.VarChar(255), Descripcion ?? null);

      const result = await request.execute("sp_InsertarSensor");

      const nuevoId = result.recordset[0]?.NuevoSensorID;

      return {
        SensorID: nuevoId,
        Nombre,
        Modelo,
        Fabricante,
        Latitud,
        Longitud,
        Descripcion,
        EstadoOperativo: true, // por defecto según tu SP
      };
    } catch (error) {
      console.error("❌ Error al crear sensor:", error);
      throw error;
    }
  }

  static async actualizar({ id, datos }) {
    try {
      const pool = await getConnection();
      const request = pool.request();

      // Siempre se envía el ID
      request.input("SensorID", sql.Int, id);

      // Parámetros opcionales
      request.input("Nombre", sql.VarChar(100), datos.Nombre ?? null);
      request.input("Modelo", sql.VarChar(50), datos.Modelo ?? null);
      request.input("Fabricante", sql.VarChar(100), datos.Fabricante ?? null);
      request.input("Latitud", sql.Decimal(9, 6), datos.Latitud ?? null);
      request.input("Longitud", sql.Decimal(9, 6), datos.Longitud ?? null);
      request.input("Descripcion", sql.VarChar(255), datos.Descripcion ?? null);
      request.input("EstadoOperativo", sql.Bit, datos.EstadoOperativo ?? null);

      const result = await request.execute("sp_ActualizarSensor");

      // ✔ Solo validar filas afectadas (ya que tu SP no retorna recordsets)
      if (result.rowsAffected[0] === 0) {
        return null; // No encontrado
      }

      // ✔ Se puede devolver manualmente lo que se actualizó
      return {
        id,
        ...datos,
      };
    } catch (error) {
      console.error("❌ Error al actualizar sensor:", error);
      throw error;
    }
  }
}
