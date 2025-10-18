import sql from "mssql";

const config = {
  user: process.env.USER_DB ?? "sa",
  password: process.env.PASSWORD_DB ?? "12345",
  server: process.env.SERVER_DB ?? "localhost",
  database: process.env.DATABASE_DB ?? "TuBaseDatos",
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

export async function conectarBD() {
  try {
    const pool = await sql.connect(config);
    console.log("✅ Conectado a SQL Server");
    return pool;
  } catch (err) {
    console.error("❌ Error al conectar:", err);
  }
}

export { sql };
