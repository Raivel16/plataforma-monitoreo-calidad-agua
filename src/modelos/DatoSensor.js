import { getConnection } from "../config/db_sqlserver.js";
import sql from "mssql";

// src/modelos/DatosSensoresModelo.js
export class DatoSensorModelo {
  static datos = [
    {
      DatoID: 1,
      SensorID: 2,
      ParametroID: 5,
      Valor_original: 7.4,
      Valor_procesado: 7.4,
      Valor_normalizado: 0.07400000000000001,
      Estado: "procesado",
      TimestampEnvio: "2025-10-23T20:00:00.000Z",
      TimestampRegistro: "2025-10-24T20:03:13.804Z",
    },
  ];

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

  static async obtenerPorId({ id }) {
    return this.datos.find((d) => d.DatoID === Number(id));
  }

  static async crear({
    SensorID,
    ParametroID,
    Valor_original,
    Valor_procesado,
    Valor_normalizado,
    Estado,
    TimestampEnvio,
  }) {
    // Generamos el timestamp de registro justo antes de la inserción
    const TimestampRegistro = new Date();

    let pool;

    try {
      // 1. Obtener la conexión
      pool = await getConnection();
      const request = pool.request();

      // 2. Mapear los parámetros al SP
      //    (usando los valores recibidos y los defaults)
      request.input("SensorID", sql.Int, SensorID);
      request.input("ParametroID", sql.Int, ParametroID);
      request.input("TimestampRegistro", sql.DateTime2, TimestampRegistro);
      request.input("TimestampEnvio", sql.DateTime2, TimestampEnvio);
      request.input("Valor_original", sql.Decimal(10, 4), Valor_original);
      request.input("Valor_procesado", sql.Decimal(10, 4), Valor_procesado);
      request.input("Valor_normalizado", sql.Decimal(10, 4), Valor_normalizado);
      request.input("Estado", sql.VarChar(20), Estado);

      // --- CAMBIOS AQUÍ ---

      // 1. Captura el 'result' de la ejecución
      const result = await request.execute("sp_InsertarDatosSensor");

      // 2. Extrae el ID del recordset devuelto por la cláusula OUTPUT
      // result.recordset será algo como: [ { DatoID: 123 } ]
      const nuevoDatoID = result.recordset[0].DatoID;

      console.log(
        `✅ Registro insertado en la base de datos. ID: ${nuevoDatoID}`
      );

      // 3. Devuelve el objeto completo, incluyendo el nuevo ID
      return {
        DatoID: nuevoDatoID, // <-- ¡AQUÍ ESTÁ!
        SensorID,
        ParametroID,
        Valor_original,
        Valor_procesado,
        Valor_normalizado,
        Estado,
        TimestampEnvio,
        TimestampRegistro: TimestampRegistro.toISOString(),
      };
      // --- FIN DE LOS CAMBIOS ---
    } catch (err) {
      console.error("❌ Error al ejecutar SP [sp_InsertarDatosSensor]:", err);
      throw new Error(`Error al crear el dato del sensor: ${err.message}`);
    }
  }

  static async obtenerPorSensor({ SensorID }) {
    return this.datos.filter((d) => d.SensorID === Number(SensorID));
  }

  static async eliminar({ id }) {
    const index = this.datos.findIndex((d) => d.DatoID === Number(id));
    if (index === -1) return false;
    this.datos.splice(index, 1);
    return true;
  }
}
