export class ServicioIASimulada {
  /**
   * Simula una predicción de calidad de agua según los últimos datos.
   * @param {Array} datosHistoricos - Últimos registros del sensor (con ParametroID y Valor_procesado).
   * @returns {Object} Resultado con calidad, riesgo y explicación.
   */
  static async generarPrediccion({ datosHistoricos }) {
    if (!Array.isArray(datosHistoricos) || datosHistoricos.length === 0) {
      throw new Error("No se proporcionaron datos históricos del sensor.");
    }

    // Solo analizamos los últimos 10 registros
    const ultimos = datosHistoricos.slice(-10);
    // Mapeo de IDs → nombres de parámetros
    const parametros = {
      1: "ph",
      2: "turbidez",
      3: "oxigeno",
      4: "conductividad",
      5: "temperatura",
    };

    // Inicializamos acumuladores
    const acumulados = {
      ph: 0,
      turbidez: 0,
      oxigeno: 0,
      temperatura: 0,
      conductividad: 0,
    };
    const contadores = {
      ph: 0,
      turbidez: 0,
      oxigeno: 0,
      temperatura: 0,
      conductividad: 0,
    };

    // Recorremos los datos recientes
    for (const d of ultimos) {
      // Soporte flexible: acepta ParametroID o "parametroId" o incluso clave numérica
      const parametroID = d.ParametroID ?? d.parametroId ?? Object.keys(d)[0];
      const valor = d.Valor_procesado ?? d.valorProcesado ?? d[parametroID];

      const nombre = parametros[parametroID];
      if (nombre && Object.hasOwn(acumulados, nombre)) {
        acumulados[nombre] += parseFloat(valor) || 0;
        contadores[nombre]++;
      }
    }

    // Calcular promedios
    const promedio = {};
    for (const k in acumulados) {
      promedio[k] = contadores[k] > 0 ? acumulados[k] / contadores[k] : 0;
    }

    // 🔹 Reglas de clasificación
    let calidad = "Buena";
    let riesgo = 0;
    let explicacion = "";
    const fueraDeRango = [];

    // pH
    if (promedio.ph < 6.5) {
      riesgo += 20;
      fueraDeRango.push("pH bajo");
    } else if (promedio.ph > 8.5) {
      riesgo += 15;
      fueraDeRango.push("pH alto");
    }

    // Turbidez
    if (promedio.turbidez > 5) {
      riesgo += 25;
      fueraDeRango.push("alta turbidez");
    }

    // Oxígeno disuelto
    if (promedio.oxigeno < 5) {
      riesgo += 25;
      fueraDeRango.push("bajo oxígeno disuelto");
    }

    // Temperatura
    if (promedio.temperatura < 20 || promedio.temperatura > 25) {
      riesgo += 10;
      fueraDeRango.push("temperatura fuera del rango ideal");
    }

    // Conductividad (opcional: valores altos pueden indicar sales disueltas)
    if (promedio.conductividad > 1500) {
      riesgo += 15;
      fueraDeRango.push("conductividad elevada");
    }

    console.log(riesgo);

    // Ajustar calidad según riesgo
    if (riesgo <= 30) {
      calidad = "Buena";
      explicacion =
        "Los valores están dentro de los rangos óptimos. El agua es de buena calidad.";
    } else if (riesgo <= 70) {
      calidad = "Regular";
      explicacion = "Algunos valores están ligeramente fuera del rango ideal.";
    } else {
      calidad = "Mala";
      explicacion = `El agua muestra condiciones críticas: ${fueraDeRango.join(
        ", "
      )}.`;
    }

    riesgo = Math.min(100, Math.max(0, riesgo));

    return {
      FechaHoraPrediccion: new Date().toISOString(),
      ValorPredicho: calidad,
      ProbabilidadRiesgo: riesgo,
      Explicacion: explicacion,
    };
  }
}
