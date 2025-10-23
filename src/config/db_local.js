import DBLocal from 'db-local';
const { Schema } = new DBLocal({ path: './db' }); // guarda los datos JSON en /db

// ----------------------
// 🔹 Tabla: Sensores
// ----------------------
export const Sensor = Schema('sensores', {
  IdSensor: { type: Number, required: true },
  tipo: { type: String, enum: ['ph', 'temperatura', 'turbidez', 'oxigeno'] },
  unidad: { type: String },
  ubicacion: { type: String },
  latitud: { type: Number },
  longitud: { type: Number },
  modelo: { type: String },
  fabricante: { type: String },
  descripcion: { type: String },
  activo: { type: Boolean, default: true }
});

// ----------------------
// 🔹 Tabla: DatosSensores
// ----------------------
export const DatoSensor = Schema('datos_sensores', {
  IdDato: { type: String, required: true },
  IdSensor: { type: Number, required: true },
  valor_original: { type: Number, required: true },
  valor_procesado: { type: Number },
  valor_normalizado: { type: Number },
  estado: { type: String, enum: ['crudo', 'procesado', 'descartado'], default: 'crudo' },
  timestamp: { type: String, required: true }
});

// ----------------------
// 🔹 Tabla: Predicciones
// ----------------------
export const Prediccion = Schema('predicciones', {
  id_prediccion: { type: Number, required: true },
  ubicacion: { type: String, required: true },
  calidad_predicha: { type: String, enum: ['Buena', 'Regular', 'Mala'], required: true },
  valor_predicho: { type: Number, required: true },
  fecha_prediccion: { type: String, required: true }
});

// ----------------------
// 🔹 Tabla: Anomalias
// ----------------------
export const Anomalia = Schema('anomalias', {
  id_anomalia: { type: Number, required: true },
  id_dato: { type: Number, required: true },
  tipo: { type: String },
  descripcion: { type: String },
  fecha_detectada: { type: String },
  estado: { type: String, enum: ['revisada', 'resuelta'], default: 'revisada' }
});
