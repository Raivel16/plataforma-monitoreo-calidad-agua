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

  const valorProcesado = Math.max(min, Math.min(max, valorOriginal || 0));
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
