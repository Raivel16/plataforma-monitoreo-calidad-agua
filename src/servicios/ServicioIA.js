import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY, // 👈 Se guarda en .env (no se expone al cliente)
});

console.log(
  "🔑 Clave Groq:",
  process.env.GROQ_API_KEY ? "Cargada" : "No cargada"
);

export class ServicioIA {
  /**
   * Genera una predicción de la calidad del agua según los últimos datos del sensor.
   * @param {Array} datosHistoricos - Últimos registros del sensor (pH, turbidez, temperatura, oxígeno, etc.)
   * @returns {Object} Resultado con calidad, riesgo y explicación.
   */
  static async generarPrediccion({ datosHistoricos }) {
    if (!Array.isArray(datosHistoricos) || datosHistoricos.length === 0) {
      throw new Error("No se proporcionaron datos históricos del sensor.");
    }

    // Solo analizamos los últimos 10 registros
    const ultimos = datosHistoricos.slice(-10);

    // Transformar datos crudos (con ParametroID) a formato legible para la IA
    // Agrupamos por TimestampRegistro para reconstruir "lecturas completas" si es posible,
    // o simplemente enviamos una lista de mediciones individuales si no están sincronizadas.
    // Dado que el prompt espera un array de objetos con {ph, turbidez, ...}, intentaremos agrupar.

    const lecturasAgrupadas = {};

    ultimos.forEach((d) => {
      const timestamp = d.TimestampRegistro;
      if (!lecturasAgrupadas[timestamp]) {
        lecturasAgrupadas[timestamp] = {};
      }

      // Mapeo de IDs a nombres (mismo que en ServicioIASimulada)
      const parametros = {
        1: "ph",
        2: "turbidez",
        3: "oxigeno",
        4: "conductividad",
        5: "temperatura",
      };

      const nombreParametro = parametros[d.ParametroID];
      if (nombreParametro) {
        lecturasAgrupadas[timestamp][nombreParametro] =
          parseFloat(d.Valor_procesado) || parseFloat(d.Valor_original) || 0;
      }
    });

    const datosEstructurados = Object.values(lecturasAgrupadas);
    const textoDatos = JSON.stringify(datosEstructurados, null, 2);

    const messages = [
      {
        role: "system",
        content: `
                Eres una IA experta en análisis ambiental y calidad de agua.
                Tu tarea es evaluar la calidad del agua a partir de las mediciones recientes de sensores:
                - pH (ideal entre 6.5 y 8.5)
                - Turbidez (ideal menor a 5 NTU)
                - Oxígeno disuelto (ideal mayor a 5 mg/L)
                - Conductividad (ideal menor a 500 µS/cm)
                - Temperatura (ideal entre 20 y 25 °C)
                Responde SIEMPRE en formato JSON con:
                {
                  "calidad": "Buena" | "Regular" | "Mala",
                  "riesgo": número entre 0 y 100,
                  "explicacion": "texto breve explicando la razón"
                }
                No devuelvas texto adicional fuera del JSON.
                        `.trim(),
      },
      {
        role: "user",
        content: `
[
  {"ph":7.2,"turbidez":1.2,"temperatura":21.4,"oxigeno":8.3,"conductividad":120},
  {"ph":7.0,"turbidez":1.5,"temperatura":22.1,"oxigeno":8.1,"conductividad":120}
]
        `.trim(),
      },
      {
        role: "assistant",
        content: JSON.stringify({
          calidad: "Buena",
          riesgo: 5,
          explicacion:
            "Los valores se encuentran dentro de los rangos óptimos. El agua es de buena calidad.",
        }),
      },
      {
        role: "user",
        content: `
[
  {"ph":6.3,"turbidez":6.8,"temperatura":24.5,"oxigeno":4.2,"conductividad":120},
  {"ph":6.1,"turbidez":7.1,"temperatura":24.8,"oxigeno":4.0,"conductividad":120}
]
        `.trim(),
      },
      {
        role: "assistant",
        content: JSON.stringify({
          calidad: "Mala",
          riesgo: 85,
          explicacion:
            "El pH bajo y la alta turbidez indican contaminación significativa o exceso de materia orgánica.",
        }),
      },
      // 🔹 Datos reales del sensor:
      {
        role: "user",
        content: textoDatos,
      },
    ];

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages,
    });

    const respuesta = completion.choices[0]?.message?.content?.trim();
    console.log("🧠 Respuesta IA:", respuesta);

    // Convertir respuesta a JSON de forma segura
    let resultado;
    try {
      resultado = JSON.parse(respuesta);
    } catch (e) {
      console.error("⚠️ Error al interpretar respuesta IA:", e.message);
      resultado = {
        calidad: "Desconocida",
        riesgo: 0,
        explicacion: "No se pudo interpretar la respuesta de la IA.",
      };
    }

    return {
      FechaHoraPrediccion: new Date().toISOString(),
      ValorPredicho: resultado.calidad,
      ProbabilidadRiesgo: resultado.riesgo,
      Explicacion: resultado.explicacion,
    };
  }
}
