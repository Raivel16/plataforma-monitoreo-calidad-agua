export class UmbralAlerta {
  /**
   * Crea una nueva umbral de alerta.
   * @param {Object} umbral - Objeto con la configuración de la umbral de alerta.
   * @param {number} umbral.ParametroID - ID del parámetro a monitorear.
   * @param {number} umbral.ValorCritico - Valor que dispara la alerta.
   * @param {string} umbral.TipoUmbral - Tipo de umbral (MAXIMO, MINIMO).
   * @param {string} umbral.MensajeAlerta - Mensaje de alerta.
   */
  constructor({
    UmbralID = null,
    ParametroID = null,
    ValorCritico = null,
    TipoUmbral = null,
    MensajeAlerta = null,
  } = {}) {
    this.UmbralID = UmbralID;
    this.ParametroID = ParametroID;
    this.ValorCritico = ValorCritico;
    this.TipoUmbral = TipoUmbral;
    this.MensajeAlerta = MensajeAlerta;
  }

  
  //funciones de consulta
}
