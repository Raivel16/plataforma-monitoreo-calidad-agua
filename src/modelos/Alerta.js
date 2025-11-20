import { getConnection } from "../config/db_sqlserver.js";
import sql from "mssql";

export class AlertaModelo {
  // El método registrarAlerta fue movido a RegistroAlertaModelo
  // para mejor separación de responsabilidades

  static async notificarUsuarios({
    registroAlertaID,
    nivelesPermiso,
    tipo,
    mensaje,
    datoInfo,
  }) {
    try {
      const pool = await getConnection();

      // Determinar nivel mínimo basado en el array de niveles
      const nivelMinimo = Math.min(...nivelesPermiso);

      const request = pool.request();
      request.input("NivelMinimo", sql.Int, nivelMinimo);

      const result = await request.execute("sp_ObtenerUsuariosPorNivel");

      const usuarios = result.recordset;

      // Filtrar usuarios según los niveles específicos requeridos
      const usuariosFiltrados = usuarios.filter((u) =>
        nivelesPermiso.includes(u.NivelPermiso)
      );

      const alertasCreadas = [];

      for (const usuario of usuariosFiltrados) {
        const req = pool.request();
        req.input("RegistroAlertaID", sql.BigInt, registroAlertaID);
        req.input("UsuarioID", sql.Int, usuario.UsuarioID);
        req.input("FechaEnvio", sql.DateTime2, new Date());
        req.input("EstadoAlerta", sql.VarChar(50), "Pendiente");

        const result = await req.execute("sp_InsertarAlertaUsuario");

        alertasCreadas.push({
          UsuarioID: usuario.UsuarioID,
          NombreUsuario: usuario.NombreUsuario,
          AlertaUsuarioID: result.recordset[0].AlertaUsuarioID,
          tipo,
          mensaje,
          ...datoInfo,
        });
      }

      return alertasCreadas;
    } catch (error) {
      console.error("Error al notificar usuarios:", error);
      throw error;
    }
  }

  static async obtenerAlertasPendientes(usuarioID) {
    try {
      const pool = await getConnection();
      const request = pool.request();

      request.input("UsuarioID", sql.Int, usuarioID);
      const result = await request.execute(
        "sp_ObtenerAlertasPendientesUsuario"
      );

      return result.recordset;
    } catch (error) {
      console.error("Error al obtener alertas pendientes:", error);
      throw error;
    }
  }

  static async marcarComoLeida(alertaUsuarioID) {
    try {
      const pool = await getConnection();
      const request = pool.request();

      request.input("AlertaUsuarioID", sql.BigInt, alertaUsuarioID);
      await request.execute("sp_MarcarAlertaLeida");

      return true;
    } catch (error) {
      console.error("Error al marcar alerta como leída:", error);
      throw error;
    }
  }
}
