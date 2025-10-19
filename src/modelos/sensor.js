import sensores  from '../../simulador-sensores/sensores.json' with { type: 'json' };

export class SensorModelo {
  // Aquí irían los métodos para interactuar con la base de datos de sensores
  static async obtenerTodos() {
    // Lógica para obtener todos los sensores de la base de datos
    return sensores;
  }

  static async crear({ sensorInfo }) {
    // Lógica para crear un nuevo sensor en la base de datos
    sensores.push(sensorInfo);
    return sensorInfo;
  }

  static async obtenerPorId({ id }) {
    // Lógica para obtener un sensor por su ID
    const sensor = sensores.find(sensor => Number(sensor.id)=== Number(id));
    return sensor ? sensor : null;
  }

  static async actualizar({ id, sensorInfo }) {
    // Lógica para actualizar un sensor existente

    const index = sensores.findIndex(sensor => Number(sensor.id)=== Number(id));
    if (index !== -1) {
      sensores[index] = { ...sensores[index], ...sensorInfo };
      return sensores[index];
    }
    return null;
  }

  static async eliminar({ id }) {
    // Lógica para eliminar un sensor
    const index = sensores.findIndex(sensor => Number(sensor.id)=== Number(id));
    if (index !== -1) {
      const eliminado = sensores.splice(index, 1);
      return eliminado[0];
    }
    return null;
  }
}
