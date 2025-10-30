export class ServicioIA {
  static async generarPrediccion({ datosHistoricos }) {
    // Simulación de llamada a una API de IA para crear una predicción
    return {
      FechaHoraPrediccion: "2024-01-01T10:00:00Z",
      ValorPredicho: "Bueno",
      ProbabilidadRiesgo: 5.0,
    };
  }

  static async calcularPrecision({ datosReales, datosPredicciones }) {
    // Simulación de llamada a una API de IA para calcular precisión
    return { precision: "95%" };
  }
}

// import Groq from "groq-sdk";
// import dotenv from "dotenv";

// dotenv.config();

// const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// export async function main() {
//   const chatCompletion = await getGroqChatCompletion();
//   // Print the completion returned by the LLM.
//   console.log(chatCompletion.choices[0]?.message?.content || "");
// }

// export async function getGroqChatCompletion() {
//   return groq.chat.completions.create({
//     messages: [
//       {
//         role: "user",
//         content: "Explain the importance of fast language models",
//       },
//     ],
//     model: "openai/gpt-oss-20b",
//   });
// }
