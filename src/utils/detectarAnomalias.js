import { DatoSensorModelo } from "../modelos/DatoSensor.js";

const CACHE_HISTORICOS = new Map();

// Rangos válidos por parámetro (valores físicamente posibles)
const RANGOS_VALIDOS = {
  1: { min: 0, max: 14, nombre: "pH" }, // pH
  2: { min: 0, max: 1000, nombre: "Turbidez" }, // Turbidez (NTU)
  3: { min: 0, max: 20, nombre: "Oxígeno Disuelto" }, // Oxígeno Disuelto (mg/L)
  4: { min: 0, max: 10000, nombre: "Conductividad" }, // Conductividad (µS/cm)
  5: { min: -5, max: 50, nombre: "Temperatura" }, // Temperatura (°C) - rango razonable para agua
};

export async function detectarAnomalias(dato) {
  try {
    const cacheKey = `${dato.SensorID}_${dato.ParametroID}`;

    let historicos = CACHE_HISTORICOS.get(cacheKey);

    if (!historicos || historicos.length < 5) {
      const todos = await DatoSensorModelo.obtenerUltimoDatoSensores();

      historicos = todos
        .filter((d) => d.Estado === "procesado")
        .slice(0, 10)
        .map((d) => d.Valor_procesado);

      CACHE_HISTORICOS.set(cacheKey, historicos);
    }

    if (historicos.length < 3) return null;

    // 1. Verificar si el valor es físicamente imposible
    const rango = RANGOS_VALIDOS[dato.ParametroID];
    const valorImposible =
      rango &&
      (dato.Valor_procesado < rango.min || dato.Valor_procesado > rango.max);

    // 2. Calcular estadísticas del histórico
    const promedio = historicos.reduce((a, b) => a + b, 0) / historicos.length;
    const desviacion = Math.sqrt(
      historicos.reduce((sum, val) => sum + Math.pow(val - promedio, 2), 0) /
        historicos.length
    );

    // 3. Detectar cambio brusco (más de 3 desviaciones estándar)
    const umbralAnomalia = 3;
    const diferencia = Math.abs(dato.Valor_procesado - promedio);
    const cambioBrusco = diferencia > umbralAnomalia * desviacion;

    // 4. Determinar si es anomalía
    if (valorImposible || cambioBrusco) {
      let tipo = "ANOMALIA";
      let contexto = "";
      let mensaje = "";

      if (valorImposible) {
        contexto = `Valor físicamente imposible para ${
          rango?.nombre || "este parámetro"
        }. Posible falla del sensor.`;
        mensaje = `⚠️ SENSOR DEFECTUOSO: Valor imposible detectado: ${dato.Valor_procesado.toFixed(
          2
        )} ${dato.UnidadMedida} (rango válido: ${rango.min}-${rango.max})`;
      } else if (cambioBrusco) {
        contexto = `Cambio brusco en las lecturas del sensor. Puede indicar falla del sensor o evento repentino.`;
        mensaje = `⚠️ ANOMALÍA: Cambio brusco detectado: ${dato.Valor_procesado.toFixed(
          2
        )} ${dato.UnidadMedida} (esperado: ${promedio.toFixed(
          2
        )} ± ${desviacion.toFixed(2)})`;
      }

      // Actualizar caché antes de retornar
      historicos.unshift(dato.Valor_procesado);
      if (historicos.length > 10) historicos.pop();
      CACHE_HISTORICOS.set(cacheKey, historicos);

      return {
        tipo,
        mensaje,
        contexto,
        valor: dato.Valor_procesado,
        valorEsperado: promedio,
        desviacion: desviacion,
        cambioBrusco,
        valorImposible,
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
