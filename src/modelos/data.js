export class dataModelo {
  static async guardarLectura(dato) {
    // Simulación de guardar en la base de datos
    console.log("Guardando lectura en la base de datos:", dato);
    return { id: Date.now(), ...dato };
  }
}
