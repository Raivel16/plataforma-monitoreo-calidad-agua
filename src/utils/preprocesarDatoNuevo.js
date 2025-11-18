// utils/preprocesarDatoNuevo.js
export function preprocesarDatoNuevo(dato) {
  const { ParametroID, valor: valorOriginal } = dato;

  const tipoMap = {
    1: "ph",
    2: "turbidez",
    3: "oxigeno",
    4: "conductividad",
    5: "temperatura",
  };

  const tipo = tipoMap[ParametroID] || "desconocido";

  const rangos = {
    ph: { min: 0, max: 14 },
    oxigeno: { min: 0, max: 14 },
    turbidez: { min: 0, max: 1000 },
    conductividad: { min: 0, max: 5000 },
    temperatura: { min: 0, max: 50 },
  };

  const { min, max } = rangos[tipo] || { min: 0, max: 100 };

  // Si no es número → descartado
  if (valorOriginal == null || isNaN(valorOriginal)) {
    return {
      ParametroID,
      Tipo: tipo,
      Valor_original: valorOriginal,
      Valor_procesado: null,
      Valor_normalizado: null,
      Estado: "descartado",
      FueraRangoFisico: null
    };
  }

  // No clamp: mantenemos el valor tal cual
  const valorProcesado = Number(valorOriginal);

  // Normalización — puede salir <0 o >1 si está fuera de rango físico
  const valorNormalizado = (valorProcesado - min) / (max - min);

  // Flag si valor está físicamente fuera del rango esperado
  const fuera = (valorProcesado < min || valorProcesado > max);

  return {
    ParametroID,
    Tipo: tipo,
    Valor_original: valorOriginal,
    Valor_procesado: parseFloat(valorProcesado.toFixed(4)),
    Valor_normalizado: parseFloat(Number(valorNormalizado).toFixed(4)),
    Estado: "procesado",
    FueraRangoFisico: fuera
  };
}
