import { preprocesarDato } from "../utils/preprocesarDato.js";

// mode
import { DataModelo } from "../modelos/data.js";

export class DataControlador {
  static async recibirDatos(req, res, io) {
    try {
      // Lógica para obtener datos de sensores
      const datoBruto = req.body;

      console.log("Datos recibidos de sensor:", datoBruto);

      // Preprocesamiento básico (validar y normalizar)
      const datoProcesado = preprocesarDato(datoBruto);

      console.log("Dato procesado:", datoProcesado);

      const lectura = await DataModelo.guardarLectura({ dato: datoProcesado });

      console.log("Lectura guardada en BD:", lectura);
      
      // Emitir por socket al dashboard
      io.emit("nuevaLectura", lectura);

      res.status(201).json({ mensaje: "Lectura registrada", lectura });
    } catch (error) {
      console.error("Error al recibir datos de sensores:", error);
      res
        .status(500)
        .json({ error: "Error al procesar los datos de sensores" });
    }
  }

  static async obtenerDatos(req, res) {
    try {
      // probar con filtros en params
      const { sensorId, parametroId, fechaInicio, fechaFin } = req.params;

      const filters = { sensorId, parametroId, fechaInicio, fechaFin };

      const datos = await DataModelo.obtenerLecturas({ filters });
      res.status(200).json({ datos });
    } catch (error) {
      console.error("Error al obtener datos de sensores:", error);
      res.status(500).json({ error: "Error al obtener los datos de sensores" });
    }
  }
}
