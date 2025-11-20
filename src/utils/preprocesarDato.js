export function preprocesarDato(dato) {
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

  let estado = "procesado";
  if (
    valorOriginal == null ||
    isNaN(valorOriginal) ||
    valorOriginal < min ||
    valorOriginal > max
  ) {
    estado = "descartado";
  }

  // ✨ CAMBIO: Ya no hacemos clamping - preservamos el valor original
  // El valor procesado ahora es igual al original (sin recortar)
  const valorProcesado = valorOriginal || 0;

  // Normalizamos para visualización, pero permitimos valores fuera de rango
  // Si el valor está fuera de rango, la normalización puede ser <0 o >1
  const valorNormalizado = (valorProcesado - min) / (max - min);

  return {
    ParametroID,
    Tipo: tipo,
    Valor_original: valorOriginal,
    Valor_procesado: valorProcesado,
    Valor_normalizado: parseFloat(valorNormalizado.toFixed(4)),
    Estado: estado,
  };
}
