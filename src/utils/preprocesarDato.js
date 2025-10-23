export function preprocesarDato(dato) {
  const { tipo, valor: valorOriginal } = dato;

  // 1️⃣ Definir los rangos válidos por tipo de sensor
  const rangos = {
    ph: { min: 0, max: 14 },
    temperatura: { min: -10, max: 50 }, // más realista
    turbidez: { min: 0, max: 1000 },
    oxigeno: { min: 0, max: 14 },
  };

  // 2️⃣ Obtener el rango correspondiente o usar uno genérico
  const { min, max } = rangos[tipo] || { min: 0, max: 100 };

  // 3️⃣ Filtrar valores fuera de rango físico
  let estado = "procesado";
  if (valorOriginal < min || valorOriginal > max) {
    estado = "descartado";
  }

  // 4️⃣ Ajustar (clamp) el valor dentro del rango permitido
  const valorProcesado = Math.max(min, Math.min(max, valorOriginal));

  // 5️⃣ Normalizar (escala 0 a 1)
  const valorNormalizado = (valorProcesado - min) / (max - min);

  // quitar campo valor
  const { valor: _, ...restoDato } = dato;

  // 6️⃣ Devolver un nuevo objeto con todos los campos relevantes
  return {
    ...restoDato,
    Valor_original: valorOriginal,
    Valor_procesado: valorProcesado,
    Valor_normalizado: valorNormalizado,
    Estado: estado,
    TimestampRegistro: new Date().toISOString(),
  };
}
