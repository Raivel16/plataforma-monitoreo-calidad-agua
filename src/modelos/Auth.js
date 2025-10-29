import bcrypt from "bcrypt";

export class AuthModelo {
  static usuarios = [
    {
      UsuarioID: 1,
      RolID: 1,
      NombreUsuario: "admin",
      Contrasena:
        "$2a$10$veZ8cibHpGfDLgmEAinXcu6gQDOg.5iU3B4C/DFfx4jm8dnuxsLEC", // "admin123"
      Correo: "admin@example.com",
      Activo: true,
    },
  ];

  static async login({ NombreUsuario, Contrasena }) {
    // Aquí iría la lógica para autenticar al usuario con NombreUsuario y Contrasena

    const usuario = this.usuarios.find(
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
    const usuarioExistente = this.usuarios.find(
      (user) => user.NombreUsuario === NombreUsuario
    );
    if (usuarioExistente) {
      throw new Error("El nombre de usuario ya está en uso");
    }

    const id = this.usuarios.length + 1;
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

    this.usuarios.push(nuevoUsuario);

    // RolID nunca 1 porque es admin
    return {
      RolID,
      UsuarioID: id,
      NombreUsuario,
      Correo,
    };
  }
}
