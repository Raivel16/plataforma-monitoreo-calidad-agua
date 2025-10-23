// test-connection.js
import { getConnection } from "../src/config/db_sqlserver.js";

(async () => {
  try {
    const pool = await getConnection();
    await pool.request().execute("sp_TestConexion");
    console.log("✅ Procedimiento ejecutado correctamente");
  } catch (err) {
    console.error("❌ Error al ejecutar el procedimiento:", err.message);
  }
})();
