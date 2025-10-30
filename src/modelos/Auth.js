import bcrypt from "bcrypt";
import { usuarios } from "./bd_local/usuarios.js";

export class AuthModelo {
  static async login({ NombreUsuario, Contrasena }) {
    // Aquí iría la lógica para autenticar al usuario con NombreUsuario y Contrasena

    // Login (buscar el nombre)
    // devolver el usuario
    // select nombre usuario y la contreseña

    const usuario = usuarios.find(
      (user) => user.NombreUsuario === NombreUsuario
    );
    if (!usuario) {
      return null;
    }
    const esContrasenaValida = await bcrypt.compare(
      Contrasena,
      usuario.Contrasena
    );

    if (!esContrasenaValida) {
      return null;
    }

    return {
      UsuarioID: usuario.UsuarioID,
      RolID: usuario.RolID,
      NombreUsuario: usuario.NombreUsuario,
      Correo: usuario.Correo,
    };
  }

  static async register({ RolID, NombreUsuario, Contrasena, Correo, Activo }) {
    // VerificarUsuario
    const usuarioExistente = usuarios.find(
      (user) => user.NombreUsuario === NombreUsuario
    );
    if (usuarioExistente) {
      throw new Error("El nombre de usuario ya está en uso");
    }

    const id = usuarios.length + 1;
    const hashedContrasena = await bcrypt.hash(Contrasena, 10);

    // Aquí iría la lógica para registrar al nuevo usuario
    const nuevoUsuario = {
      RolID,
      UsuarioID: id,
      NombreUsuario,
      Contrasena: hashedContrasena,
      Correo,
      Activo,
    };

    // insertarUsuario
    usuarios.push(nuevoUsuario);

    // RolID nunca 1 porque es admin
    return {
      RolID,
      UsuarioID: id,
      NombreUsuario,
      Correo,
    };
  }
}
