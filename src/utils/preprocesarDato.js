export function preprocesarDato(dato) {
  const { tipo, valor } = dato;

  // Validar rangos físicos según el tipo
  const rangos = {
    ph: [0, 14],
    temperatura: [0, 50],
    turbidez: [0, 1000],
    oxigeno: [0, 14],
  };

  const [min, max] = rangos[tipo] || [0, 100];
  const valorClampeado = Math.max(min, Math.min(max, valor));

  return {
    ...dato,
    valor: valorClampeado,
    normalizado: (valorClampeado - min) / (max - min),
  };
}
