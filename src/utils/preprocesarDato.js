export function preprocesarDato(dato) {
  const { ParametroID, valor: valorOriginal } = dato;
  // Mapear ParametroID a tipo de sensor
  const tipoMap = {
    1: "ph",
    2: "temperatura",
    3: "turbidez",
    4: "oxigeno",
    5: "conductividad",
  };
  const tipo = tipoMap[ParametroID] || "desconocido";

  // 1️⃣ Definir los rangos válidos por tipo de sensor
  const rangos = {
    ph: { min: 0, max: 14 },
    temperatura: { min: -10, max: 50 }, // más realista
    turbidez: { min: 0, max: 1000 },
    oxigeno: { min: 0, max: 14 },
    conductividad: { min: 0, max: 2000 },
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
  
  // 6️⃣ Devolver un nuevo objeto con todos los campos relevantes
  return {
    Valor_original: valorOriginal,
    Valor_procesado: valorProcesado,
    Valor_normalizado: valorNormalizado,
    Estado: estado,
  };
}
