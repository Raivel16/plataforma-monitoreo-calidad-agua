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
  pool: {
    max: 10, // máximo de conexiones activas
    min: 0, // se pueden liberar todas si no hay uso
    idleTimeoutMillis: 30000, // desconecta las que no se usan en 30s
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

// Cierre limpio del pool cuando el servidor se apague
process.on("SIGINT", async () => {
  await sql.close();
  console.log("🔒 Pool SQL cerrado correctamente (SIGINT)");
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await sql.close();
  console.log("🔒 Pool SQL cerrado correctamente (SIGTERM)");
  process.exit(0);
});
