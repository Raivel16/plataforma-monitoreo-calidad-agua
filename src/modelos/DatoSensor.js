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

  async crear() {
    // Generamos el timestamp de registro justo antes de la inserción
    this.TimestampRegistro = new Date();

    let pool;

    try {
      // 1. Obtener la conexión
      pool = await getConnection();
      const request = pool.request();

      // 2. Mapear los parámetros al SP
      //    (usando los valores recibidos y los defaults)
      request.input("SensorID", sql.Int, this.SensorID);
      request.input("ParametroID", sql.Int, this.ParametroID);
      request.input("TimestampRegistro", sql.DateTime2, this.TimestampRegistro);
      request.input("TimestampEnvio", sql.DateTime2, this.TimestampEnvio);
      request.input("Valor_original", sql.Decimal(10, 4), this.Valor_original);
      request.input(
        "Valor_procesado",
        sql.Decimal(10, 4),
        this.Valor_procesado
      );
      request.input(
        "Valor_normalizado",
        sql.Decimal(10, 4),
        this.Valor_normalizado
      );
      request.input("Estado", sql.VarChar(20), this.Estado);

      // --- CAMBIOS AQUÍ ---

      // 1. Captura el 'result' de la ejecución
      const result = await request.execute("sp_InsertarDatosSensor");

      // 2. Extrae el ID del recordset devuelto por la cláusula OUTPUT

      const nuevoDato = result.recordset[0];

      console.log(
        `✅ Registro insertado en la base de datos. ID: ${nuevoDato.DatoID}`
      );

      this.DatoID = nuevoDato.DatoID;
      this.TimestampRegistro = this.TimestampRegistro.toISOString();
      // // 3. Devuelve el objeto completo, incluyendo el nuevo ID
      return {
        DatoID: nuevoDato.DatoID, // <-- ¡AQUÍ ESTÁ!
        SensorID: this.SensorID,
        Nombre: nuevoDato.Nombre,
        Descripcion: nuevoDato.Descripcion,
        ParametroID: this.ParametroID,
        NombreParametro: nuevoDato.NombreParametro,
        UnidadMedida: nuevoDato.UnidadMedida,
        Valor_original: this.Valor_original,
        Valor_procesado: this.Valor_procesado,
        Valor_normalizado: this.Valor_normalizado,
        Estado: this.Estado,
        TimestampEnvio: this.TimestampEnvio,
        TimestampRegistro: this.TimestampRegistro,
      };
    } catch (err) {
      console.error("❌ Error al ejecutar SP [sp_InsertarDatosSensor]:", err);
      throw new Error(`Error al crear el dato del sensor: ${err.message}`);
    }
  }

}
