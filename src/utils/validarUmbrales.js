import { getConnection } from "../config/db_sqlserver.js";
import sql from "mssql";

export async function validarUmbrales(dato) {
  try {
    const pool = await getConnection();
    const result = await pool.request().execute("sp_ObtenerUmbrales");

    const umbrales = result.recordset;
    const umbralViolado = umbrales.find((u) => {
      if (u.ParametroID !== dato.ParametroID) return false;

      if (u.TipoUmbral === "MAXIMO" && dato.Valor_procesado > u.ValorCritico) {
        return true;
      }
      if (u.TipoUmbral === "MINIMO" && dato.Valor_procesado < u.ValorCritico) {
        return true;
      }
      return false;
    });

    if (umbralViolado) {
      return {
        tipo: "UMBRAL",
        umbralID: umbralViolado.UmbralID,
        mensaje: umbralViolado.MensajeAlerta,
        valor: dato.Valor_procesado,
        parametro: dato.ParametroID,
      };
    }

    return null;
  } catch (error) {
    console.error("Error al validar umbrales:", error);
    return null;
  }
}