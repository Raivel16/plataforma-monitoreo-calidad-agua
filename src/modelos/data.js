export class DataModelo {
  static async guardarLectura({ dato }) {
    // Simulación de guardar en la base de datos
    console.log("Guardando lectura en la base de datos:", dato);
    return { id: Date.now(), ...dato };
  }

  static async obtenerLecturas() {
    // Simulación de obtención de datos desde la base de datos
    const datos = [
      {
        id: 1760841711272,
        normalizado: 0.0839,
        sensorId: 1,
        timestamp: 1760841846482,
        valor: 8.39,
      },
      {
        id: 1760841711272,
        normalizado: 0.0892,
        sensorId: 2,
        timestamp: 1760841711266,
        valor: 8.92,
      },
      {
        id: 1760841846509,
        normalizado: 0.24059999999999998,
        sensorId: 3,
        timestamp: 1760841846501,
        valor: 24.06,
      }
    ];
    console.log("Obteniendo lecturas desde la base de datos");
    return datos;
  }
}
