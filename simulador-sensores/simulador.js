import axios from 'axios';
import sensores from './sensores.json' with { type: "json" };
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT ?? 3000

// Configura el endpoint al que enviará los datos
const API_URL = `http://localhost:${PORT}/api/data`;

// Función para generar un valor aleatorio dentro del rango
function generarValor(min, max) {
  return Number((Math.random() * (max - min) + min).toFixed(2));
}

// Envía los datos a la API
async function enviarDatos() {
  for (const sensor of sensores) {
    const valor = generarValor(sensor.min, sensor.max);
    const data = {
      SensorID: sensor.id,
      valor,
      TimestampEnvio: new Date().toISOString(),
    };

    try {
      await axios.post(API_URL, data);
      console.log(`✅ Enviado: ${sensor.ParametroID} -> ${valor} ${sensor.unidad}`);
    } catch (error) {
      console.error(`❌ Error enviando ${sensor.ParametroID}:`, error.message);
    }
  }
}

// Envía datos cada 10 segundos
setInterval(enviarDatos, 10000);

