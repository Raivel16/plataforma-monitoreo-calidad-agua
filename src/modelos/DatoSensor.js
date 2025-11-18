import { getConnection } from "../config/db_sqlserver.js";
import sql from "mssql";



// src/modelos/DatosSensoresModelo.js
export class DatoSensorModelo {
  constructor({
    DatoID = null,
    SensorID = null,
    ParametroID = null,
    Valor_original = null,
    Valor_procesado = null,
    Valor_normalizado = null,
    Estado = null,
    TimestampEnvio = null,
    TimestampRegistro = null,
  } = {}) {
    this.DatoID = DatoID;
    this.SensorID = SensorID;
    this.ParametroID = ParametroID;
    this.Valor_original = Valor_original;
    this.Valor_procesado = Valor_procesado;
    this.Valor_normalizado = Valor_normalizado;
    this.Estado = Estado;
    this.TimestampEnvio = TimestampEnvio;
    this.TimestampRegistro = TimestampRegistro;
  }

  static async obtenerTodos({
    sensorID = null,
    parametroID = null,
    fechaInicio = null,
    fechaFin = null,
    ultimosDiez = false,
  }) {
    let pool;
    try {
      pool = await getConnection();
      const request = pool.request();

      // 1. Asignar los parámetros de entrada (input)
      // El paquete 'mssql' enviará NULL a la DB si el valor es null o undefined,
      // lo cual funciona perfecto con la lógica de tu SP.
      request.input("SensorID_Filtro", sql.Int, sensorID);
      request.input("ParametroID_Filtro", sql.Int, parametroID);
      request.input("FechaInicio", sql.DateTime2, fechaInicio);
      request.input("FechaFin", sql.DateTime2, fechaFin);
      request.input("UltimosDiez", sql.Bit, ultimosDiez);

      // 2. Ejecutar el procedimiento almacenado
      const result = await request.execute("sp_ObtenerDatosSensores");

      // 3. Devolver el conjunto de registros (los datos del SELECT)
      // 'result.recordset' es un arreglo con todas las filas devueltas

      return result.recordset;
    } catch (err) {
      console.error("❌ Error al ejecutar SP [sp_ObtenerDatosSensores]:", err);
      throw new Error(`Error al obtener los datos de sensores: ${err.message}`);
    }
  }

  static async obtenerUltimoDatoSensores() {
    try {
      const pool = await getConnection();
      const request = pool.request();
      const result = await request.execute("sp_ObtenerUltimoDatoSensores");

      return result.recordset;
    } catch (error) {
      console.error("❌ Error al obtener sensores:", error);
      throw error;
    }
  }


  /**
   * Inserta crudo y retorna contexto:
   * {
   *   fila: { ... }      // fila completa desde vw_DatosSensores_Detalle (recordsets[0][0])
   *   umbrales: [...],   // recordsets[1]
   *   historial: [...]   // recordsets[2]
   * }
   */
  async insertarCrudoConContexto(histCount = 10) {
    const pool = await getConnection();
    const req = pool.request();
    req.input("SensorID", sql.Int, this.SensorID);
    req.input("ParametroID", sql.Int, this.ParametroID);
    req.input("TimestampEnvio", sql.DateTime2, this.TimestampEnvio || null);
    req.input("Valor_original", sql.Decimal(10, 4), this.Valor_original);
    req.input("HistCount", sql.Int, histCount);

    const result = await req.execute("sp_InsertarDatoCrudo_ConContexto");
    const recordsets = result.recordsets || [];

    const fila = (recordsets[0] && recordsets[0][0]) ? recordsets[0][0] : null;
    const umbrales = recordsets[1] || [];
    const historial = recordsets[2] || [];

    return {
      fila,
      umbrales,
      historial
    };
  }

  /**
   * Actualiza procesado y devuelve la fila actualizada (desde la view)
   */
  static async actualizarProcesado(DatoID, { Valor_procesado, Valor_normalizado, Estado }) {
    const pool = await getConnection();
    const req = pool.request();
    req.input("DatoID", sql.BigInt, DatoID);
    req.input("Valor_procesado", sql.Decimal(10, 4), Valor_procesado);
    req.input("Valor_normalizado", sql.Decimal(10, 4), Valor_normalizado);
    req.input("Estado", sql.VarChar(20), Estado);

    const result = await req.execute("sp_ActualizarDatoProcesado");
    // sp_ActualizarDatoProcesado ahora devuelve la fila completa como recordset[0]
    const fila = result.recordset && result.recordset[0] ? result.recordset[0] : null;
    return fila;
  }

  /**
   * obtenerPorID sigue llamando al SP sp_ObtenerDatoPorID (si lo necesitas)
   */
  static async obtenerPorID(DatoID) {
    const pool = await getConnection();
    const req = pool.request();
    req.input("DatoID", sql.BigInt, DatoID);
    const result = await req.execute("sp_ObtenerDatoPorID");
    return result.recordset && result.recordset[0] ? result.recordset[0] : null;
  }
}
