import { ServicioIA } from "../servicios/ServicioIA.js";
import { DatoSensorModelo } from "./DatoSensor.js";

export class PrediccionModelo {
  static predicciones = [
    {
      PrediccionID: 1,
      SensorID: 2,
      FechaHoraPrediccion: "2024-01-01T10:00:00Z",
      ValorPredicho: "Bueno",
      ProbabilidadRiesgo: 5.0,
    },
    {
      PrediccionID: 2,
      SensorID: 3,
      FechaHoraPrediccion: "2024-01-02T11:00:00Z",
      ValorPredicho: "Regular",
      ProbabilidadRiesgo: 15.5,
    },
    {
      PrediccionID: 3,
      SensorID: 2,
      FechaHoraPrediccion: "2024-01-03T12:00:00Z",
      ValorPredicho: "Malo",
      ProbabilidadRiesgo: 25.0,
    },
  ];

  static async listarPredicciones() {
    // Aquí iría la lógica para obtener el historial de predicciones desde la base de datos
    return this.predicciones;
  }

  static async obtenerPrediccionPorId({ id }) {
    // Aquí iría la lógica para obtener una predicción específica desde la base de datos
    return this.predicciones.find(
      (prediccion) => prediccion.PrediccionID === parseInt(id)
    );
  }

  static async generarPrediccion({ SensorID }) {
    //obtener datos historicos del sensor desde BD si es necesario
    const datosHistoricos = []; // Simulación de datos históricos

    // pasar datos a api IA y obtener respuesta;
    const nuevaPrediccion = await ServicioIA.generarPrediccion({
      datosHistoricos,
    });

    // Aquí iría la lógica para guardar la nueva predicción en la base de datos
    const nuevaPrediccionGuardada = {
      PrediccionID: this.predicciones.length + 1,
      SensorID,
      ...nuevaPrediccion,
    };

    this.predicciones.push(nuevaPrediccionGuardada);
    return nuevaPrediccionGuardada;
  }

  static async eliminarPrediccion({ id }) {
    // Aquí iría la lógica para eliminar una predicción de la base de datos
    const index = this.predicciones.findIndex(
      (prediccion) => prediccion.PrediccionID === parseInt(id)
    );
    if (index !== -1) {
      this.predicciones.splice(index, 1);
      return true;
    } else {
      return false;
    }
  }

  static async calcularPrecision({ SensorID }) {
    // Aquí iría la lógica para calcular la precisión de las predicciones

    const datosRealesObtenidos = await DatoSensorModelo.obtenerPorSensor({
      SensorID,
    });
    const datosPredicciones = this.predicciones.filter(
      (prediccion) => prediccion.SensorID === SensorID
    );

    const datosReales = datosRealesObtenidos.map((dato) => ({
      Valor: dato.Valor_procesado,
      Timestamp: dato.TimestampRegistro,
    }));

    return await ServicioIA.calcularPrecision({
      datosReales,
      datosPredicciones,
    });
  }
}
