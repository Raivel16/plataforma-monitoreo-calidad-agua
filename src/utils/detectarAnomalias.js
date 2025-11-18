import { DatoSensorModelo } from "../modelos/DatoSensor.js";

const CACHE_HISTORICOS = new Map();

export async function detectarAnomalias(dato) {
  try {
    const cacheKey = `${dato.SensorID}_${dato.ParametroID}`;
    
    let historicos = CACHE_HISTORICOS.get(cacheKey);
    
    if (!historicos || historicos.length < 5) {
      const todos = await DatoSensorModelo.obtenerUltimoDatoSensores();
      
      historicos = todos
        .filter(d => d.Estado === 'procesado')
        .slice(0, 10)
        .map(d => d.Valor_procesado);
      
      CACHE_HISTORICOS.set(cacheKey, historicos);
    }

    if (historicos.length < 3) return null;

    const promedio = historicos.reduce((a, b) => a + b, 0) / historicos.length;
    const desviacion = Math.sqrt(
      historicos.reduce((sum, val) => sum + Math.pow(val - promedio, 2), 0) /
        historicos.length
    );

    const umbralAnomalia = 3;
    const diferencia = Math.abs(dato.Valor_procesado - promedio);
    
    if (diferencia > umbralAnomalia * desviacion) {
      return {
        tipo: "ANOMALIA",
        mensaje: `Valor anómalo detectado: ${dato.Valor_procesado.toFixed(2)} (esperado: ${promedio.toFixed(2)} ± ${desviacion.toFixed(2)})`,
        valor: dato.Valor_procesado,
        valorEsperado: promedio,
        desviacion: desviacion,
      };
    }

    // Actualizar caché
    historicos.unshift(dato.Valor_procesado);
    if (historicos.length > 10) historicos.pop();
    CACHE_HISTORICOS.set(cacheKey, historicos);

    return null;
  } catch (error) {
    console.error("Error al detectar anomalías:", error);
    return null;
  }
}