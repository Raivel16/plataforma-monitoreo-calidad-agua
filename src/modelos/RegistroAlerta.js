export class RegistroAlertaModelo {
  constructor({
    RegistroAlertaID = null,
    UmbralID = null,
    DatoID = null,
    FechaHoraAlerta = null,
    EstadoNotificacion = null,
  } = {}) {
    this.RegistroAlertaID = RegistroAlertaID;
    this.UmbralID = UmbralID;
    this.DatoID = DatoID;
    this.FechaHoraAlerta = FechaHoraAlerta;
    this.EstadoNotificacion = EstadoNotificacion;
  }

  //funciones de consulta
}