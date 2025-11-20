import { getConnection } from "../config/db_sqlserver.js";

// Contextos específicos por parámetro cuando se excede umbral
const CONTEXTOS_PARAMETROS = {
  1: {
    // pH
    MAXIMO:
      "pH elevado detectado. Posible contaminación alcalina (descargas industriales, detergentes).",
    MINIMO:
      "pH bajo detectado. Posible contaminación ácida (drenaje ácido de minas, descargas industriales).",
  },
  2: {
    // Turbidez
    MAXIMO:
      "Turbidez elevada. Posible contaminación por sedimentos, erosión, o descargas de aguas residuales.",
  },
  3: {
    // Oxígeno Disuelto
    MINIMO:
      "Bajo nivel de oxígeno disuelto. Posible contaminación orgánica, eutrofización, o proliferación de algas.",
  },
  4: {
    // Conductividad
    MAXIMO:
      "Conductividad alta. Posible contaminación por sales, minerales disueltos, o descargas industriales.",
  },
  5: {
    // Temperatura
    MAXIMO:
      "Temperatura elevada. Posible descarga de agua caliente industrial o disminución de oxígeno disuelto.",
  },
};

export async function validarUmbrales(dato) {
  try {
    const pool = await getConnection();
    const result = await pool.request().execute("sp_ObtenerUmbrales");

    const umbrales = result.recordset;
    const umbralViolado = umbrales.find((u) => {
      if (u.ParametroID !== dato.ParametroID) return false;

      if (u.TipoUmbral === "MAXIMO" && dato.Valor_original > u.ValorCritico) {
        return true;
      }
      if (u.TipoUmbral === "MINIMO" && dato.Valor_original < u.ValorCritico) {
        return true;
      }
      return false;
    });

    if (umbralViolado) {
      // Obtener contexto específico del parámetro
      const contextoParam = CONTEXTOS_PARAMETROS[dato.ParametroID];
      const contexto = contextoParam
        ? contextoParam[umbralViolado.TipoUmbral] ||
          "Umbral excedido. Requiere atención."
        : "Umbral excedido. Requiere atención.";

      // 🆕 Calcular severidad de la violación
      let diferencial = 0;
      if (umbralViolado.TipoUmbral === "MAXIMO") {
        // Cuánto excede el valor máximo permitido
        diferencial =
          (dato.Valor_original - umbralViolado.ValorCritico) /
          umbralViolado.ValorCritico;
      } else if (umbralViolado.TipoUmbral === "MINIMO") {
        // Cuánto está por debajo del valor mínimo permitido
        diferencial =
          (umbralViolado.ValorCritico - dato.Valor_original) /
          umbralViolado.ValorCritico;
      }

      // Factor de severidad: 3.0 (3x el umbral) separa MODERADA de EXTREMA
      const FACTOR_SEVERIDAD = 3.0;
      const severidad =
        diferencial >= FACTOR_SEVERIDAD ? "EXTREMA" : "MODERADA";

      // Crear mensaje mejorado con contexto
      const mensaje = `${
        umbralViolado.MensajeAlerta
      } - Valor: ${dato.Valor_original.toFixed(2)} ${dato.UnidadMedida}`;

      return {
        tipo: "UMBRAL",
        umbralID: umbralViolado.UmbralID,
        mensaje,
        contexto,
        valor: dato.Valor_original,
        parametro: dato.ParametroID,
        tipoUmbral: umbralViolado.TipoUmbral,
        valorCritico: umbralViolado.ValorCritico,
        severidad, // 🆕 MODERADA o EXTREMA
        diferencial: diferencial.toFixed(2), // 🆕 Porcentaje de exceso
      };
    }

    return null;
  } catch (error) {
    console.error("Error al validar umbrales:", error);
    return null;
  }
}
