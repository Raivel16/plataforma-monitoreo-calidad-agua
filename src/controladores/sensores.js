import { SensorModelo } from "../modelos/sensor.js";

export class SensoresControlador {
  static async obtenerSensores(req, res) {
    // Lógica para obtener todos los sensores
    const sensores = await SensorModelo.obtenerTodos();
    res.json(sensores);
  }

  static async crearSensor(req, res) {
    // Lógica para crear un nuevo sensor
    const sensorInfo = req.body;
    const nuevoSensor = await SensorModelo.crear({ sensorInfo });
    res.status(201).json(nuevoSensor);
  }

  static async obtenerSensorPorId(req, res) {
    // Lógica para obtener un sensor por su ID
    const { id } = req.params;
    const sensor = await SensorModelo.obtenerPorId({ id });
    if (sensor) {
      res.json(sensor);
    } else {
      res.status(404).send("Sensor no encontrado");
    }
  }

  static async actualizarSensor(req, res) {
    // Lógica para actualizar un sensor existente
    const { id } = req.params;
    const sensorInfo = req.body;
    const sensorActualizado = await SensorModelo.actualizar({ id, sensorInfo });

    if (sensorActualizado) {
      res.json(sensorActualizado);
    } else {
      res.status(404).send("Sensor no encontrado");
    }
  }

  static async eliminarSensor(req, res) {
    // Lógica para eliminar un sensor
    const { id } = req.params;
    await SensorModelo.eliminar({ id });
    res.status(204).send();
  }
}
