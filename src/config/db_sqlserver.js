// config/db.js
import sql from "mssql";
import dotenv from "dotenv";

dotenv.config(); // Carga las variables del archivo .env

const dbConfig = {
  user: "app_backend_user",
  password: "back3nd*user",
  server: "localhost", // nombre de tu servidor
  database: "MonitoreoAguaJunin", // reemplaza con el nombre real
  options: {
    encrypt: false, // poner true si usas Azure o SSL
    trustServerCertificate: true, // necesario en local
  },
};

export async function getConnection() {
  try {
    const pool = await sql.connect(dbConfig);
    console.log("✅ Conexión exitosa a SQL Server");
    return pool;
  } catch (err) {
    console.error("❌ Error al conectar con SQL Server:", err);
    throw err;
  }
}
