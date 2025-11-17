export class AnomaliaModelo {
  
  constructor({
    AnomaliaID = null,
    DatoID = null,
    Tipo = null,
    Descripcion = null,
    Fecha_Detectada = null,
    Estado = null,
  } = {}) {
    this.AnomaliaID = AnomaliaID;
    this.DatoID = DatoID;
    this.Tipo = Tipo;
    this.Descripcion = Descripcion;
    this.Fecha_Detectada = Fecha_Detectada;
    this.Estado = Estado;
  }
  //funciones de consulta
}
