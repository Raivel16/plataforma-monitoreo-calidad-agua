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

  static async obtenerTodos() {
    return this.datos;
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
    const nuevo = {
      DatoID: this.datos.length + 1,
      SensorID,
      ParametroID,
      Valor_original,
      Valor_procesado,
      Valor_normalizado,
      Estado,
      TimestampEnvio,
      TimestampRegistro: new Date().toISOString(),
    };
    this.datos.push(nuevo);
    return nuevo;
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
