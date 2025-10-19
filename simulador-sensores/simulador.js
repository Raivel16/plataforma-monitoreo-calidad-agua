import axios from 'axios';

const PORT = process.env.PORT ?? 3000

// Configura el endpoint al que enviará los datos
const API_URL = `http://localhost:${PORT}/api/data`;

// Simulamos 3 sensores diferentes
const sensores = [
  { id: 1, tipo: 'pH', unidad: 'pH', min: 6.5, max: 8.5 },
  { id: 2, tipo: 'Turbidez', unidad: 'NTU', min: 0, max: 10 },
  { id: 3, tipo: 'Temperatura', unidad: '°C', min: 15, max: 30 },
];

// Función para generar un valor aleatorio dentro del rango
function generarValor(min, max) {
  return Number((Math.random() * (max - min) + min).toFixed(2));
}

// Envía los datos a la API
async function enviarDatos() {
  for (const sensor of sensores) {
    const valor = generarValor(sensor.min, sensor.max);
    const data = {
      sensorId: sensor.id,
      tipo: sensor.tipo,
      valor,
      unidad: sensor.unidad,
      fecha: new Date().toISOString(),
    };

    try {
      await axios.post(API_URL, data);
      console.log(`✅ Enviado: ${sensor.tipo} -> ${valor} ${sensor.unidad}`);
    } catch (error) {
      console.error(`❌ Error enviando ${sensor.tipo}:`, error.message);
    }
  }
}

// Envía datos cada 5 segundos
setInterval(enviarDatos, 5000);
