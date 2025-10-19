export class dataModelo {
  static async guardarLectura(dato) {
    // Simulación de guardar en la base de datos
    console.log("Guardando lectura en la base de datos:", dato);
    return { id: Date.now(), ...dato };
  }

  static async obtenerLecturas() {
    // Simulación de obtención de datos desde la base de datos
    const datos = [];
    console.log("Obteniendo lecturas desde la base de datos");
    return datos;
  }
}
