import { getConnection } from "../config/db_sqlserver.js";
import sql from "mssql";

export class SensorModelo {
  static sensores = [
    {
      SensorID: 1,
      Nombre: "Sensor de Temperatura",
      Modelo: "Temperatura",
      Fabricante: "Fabricante C",
      Latitud: 34.56,
      Longitud: 78.9,
      Descripcion: "Descripción del sensor de temperatura",
      EstadoOperativo: true,
    },
    {
      SensorID: 2,
      Nombre: "Sensor de pH",
      Modelo: "pH",
      Fabricante: "Fabricante D",
      Latitud: 45.67,
      Longitud: 89.01,
      Descripcion: "Descripción del sensor de pH",
      EstadoOperativo: true,
    },
    {
      SensorID: 3,
      Nombre: "Sensor de Turbidez",
      Modelo: "Turbidez",
      Fabricante: "Fabricante E",
      Latitud: 56.78,
      Longitud: 90.12,
      Descripcion: "Descripción del sensor de turbidez",
      EstadoOperativo: true,
    },
  ];

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
    return result;
  }

  static async crear({
    Nombre,
    Modelo,
    Fabricante,
    Latitud,
    Longitud,
    Descripcion,
    EstadoOperativo = true,
  }) {
    const nuevoSensor = {
      SensorID: this.sensores.length + 1,
      Nombre,
      Modelo,
      Fabricante,
      Latitud,
      Longitud,
      Descripcion,
      EstadoOperativo,
    };
    this.sensores.push(nuevoSensor);
    return nuevoSensor;
  }


  
  static async actualizar({ id, datos }) {
    const idx = this.sensores.findIndex((s) => s.SensorID === Number(id));
    if (idx === -1) return null;

    console.log("Datos a actualizar:", datos);

    this.sensores[idx] = {
      ...this.sensores[idx],
      ...datos,
      SensorID: this.sensores[idx].SensorID,
    };

    return this.sensores[idx];
  }

  static async desactivar({ id }) {
    const sensor = this.sensores.find((s) => s.SensorID === Number(id));
    if (!sensor) return null;

    sensor.EstadoOperativo = false;
    return sensor;
  }

  static async eliminar({ id }) {
    const index = this.sensores.findIndex((s) => s.SensorID === Number(id));
    if (index === -1) return false;

    this.sensores.splice(index, 1);
    return true;
  }
}
