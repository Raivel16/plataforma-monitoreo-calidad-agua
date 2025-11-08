// config/db.js
import sql from "mssql";
import dotenv from "dotenv";

dotenv.config(); // Carga las variables del archivo .env

const dbConfig = {
  user: "app_backend_user",
  password: "back3nd*user",
  server: "localhost", // o "localhost\\MSSQLSERVER1" en la universidad
  database: "MonitoreoAguaJunin",
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

// Obtiene una nueva conexión
export async function getConnection() {
  try {
    const pool = await sql.connect(dbConfig);
    console.log("✅ Conexión establecida a SQL Server");
    return pool;
  } catch (err) {
    console.error("❌ Error al conectar con SQL Server:", err);
    throw err;
  }
}

// Cierra la conexión activa (si existe)
export async function closeConnection() {
  try {
    await sql.close();
    console.log("🔒 Conexión a SQL Server cerrada correctamente");
  } catch (err) {
    console.error("⚠️ Error al cerrar la conexión SQL:", err);
  }
}

// Cierra la conexión al terminar el proceso
process.on("SIGINT", async () => {
  await closeConnection();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await closeConnection();
  process.exit(0);
});
