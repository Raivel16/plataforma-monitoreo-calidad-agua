export class AlertaModelo {
  constructor({
    AlertaUsuarioID = null,
    RegistroAlertaID = null,
    UsuarioID = null,
    FechaEnvio = null,
    FechaRevisión = null,
    EstadoAlerta = null,
  } = {}) {
    this.AlertaUsuarioID = AlertaUsuarioID;
    this.RegistroAlertaID = RegistroAlertaID;
    this.UsuarioID = UsuarioID;
    this.FechaEnvio = FechaEnvio;
    this.FechaRevisión = FechaRevisión;
    this.EstadoAlerta = EstadoAlerta;
  }

  //funciones de consulta
}
