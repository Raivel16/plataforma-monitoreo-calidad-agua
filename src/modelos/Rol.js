export class RolModelo {
  static roles = [
    { RolID: 1, NombreRol: "Gestor ANA" },
    { RolID: 2, NombreRol: "Investigador" },
    { RolID: 3, NombreRol: "Usuario Comun" },
  ];

  static async obtenerTodosRegistroUsuario() {
    return this.roles.filter((rol) => rol.RolID !== 1);
  }

  static async obtenerTodosRegistroAdministrativo() {
    return this.roles;
  }

  static async obtenerPorIDRegistroUsuario(RolID) {
    return this.roles.find((rol) => rol.RolID === RolID && rol.RolID !== 1) || null;
  }

  static async obtenerPorIDRegistroAdministrativo(RolID) {
    return this.roles.find((rol) => rol.RolID === RolID) || null;
  }

  static async crear({ NombreRol }) {
    const nuevoRol = {
      RolID: this.roles.length + 1,
      NombreRol,
    };
    this.roles.push(nuevoRol);
    return nuevoRol;
  }
}
