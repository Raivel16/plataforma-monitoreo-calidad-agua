import { usuarios } from "./bd_local/usuarios.js";

export class UsuarioModelo {
  static async obtenerTodos() {
    return usuarios;
  }
  static async obtenerPorId({ UsuarioID }) {
    return usuarios.find((u) => u.UsuarioID === Number(UsuarioID));
  }
  static async actualizar({ UsuarioID, datos }) {
    const idx = usuarios.findIndex((u) => u.UsuarioID === Number(UsuarioID));
    if (idx === -1) return null;

    console.log("Datos a actualizar:", datos);

    usuarios[idx] = {
      ...usuarios[idx],
      ...datos,
      UsuarioID: usuarios[idx].UsuarioID,
    };

    return usuarios[idx];
  }
  static async eliminar({ UsuarioID }) {
    const index = usuarios.findIndex((u) => u.UsuarioID === Number(UsuarioID));
    if (index === -1) return false;

    usuarios.splice(index, 1);
    return true;
  }
}
