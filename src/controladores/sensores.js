import { preprocesarDato } from "../utils/preprocesarDato.js";

// modelos
import { SensoresModelo } from "../modelos/sensores.js";

export class SensoresControlador {
  static async recibirDatos(req, res, io) {
    try {
      // Lógica para obtener datos de sensores
      const datoBruto = req.body;

      // Preprocesamiento básico (validar y normalizar)
      const datoLimpio = preprocesarDato(datoBruto);

      // guardar en la BD
      const lectura = await SensoresModelo.guardarLectura(datoLimpio);

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
}
