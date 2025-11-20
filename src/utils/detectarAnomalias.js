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
    // Verificar si el valor es físicamente imposible
    const rango = RANGOS_VALIDOS[dato.ParametroID];

    if (!rango) {
      console.warn(
        `No hay rango definido para ParametroID ${dato.ParametroID}`
      );
      return null;
    }

    const valorImposible =
      dato.Valor_procesado < rango.min || dato.Valor_procesado > rango.max;

    // Solo retornamos anomalía si el valor es físicamente imposible
    if (valorImposible) {
      const contexto = `Valor físicamente imposible para ${rango.nombre}. Posible falla del sensor.`;
      const mensaje = `🔴 SENSOR DEFECTUOSO: Valor imposible detectado: ${dato.Valor_procesado.toFixed(
        2
      )} ${dato.UnidadMedida} (rango válido: ${rango.min}-${rango.max})`;

      return {
        tipo: "ANOMALIA",
        mensaje,
        contexto,
        valor: dato.Valor_procesado,
        rangoMin: rango.min,
        rangoMax: rango.max,
        valorImposible: true,
      };
    }

    return null;
  } catch (error) {
    console.error("Error al detectar anomalías:", error);
    return null;
  }
}
