import jwt from "jsonwebtoken";

import { AuthModelo } from "../modelos/Auth.js";
import { RolModelo } from "../modelos/Rol.js";

import { validarDatosLogin } from "../schemas/auth.js";
import { validarDatosUsuario } from "../schemas/usuario.js";

import { formatZodError } from "../utils/formatZodError.js";
import { procesarRegistroUsuario } from "../utils/procesarRegistroUsuario.js";


import dotenv from "dotenv";

dotenv.config();


export class AuthControlador {
  static async login(req, res) {
    const datosLogin = validarDatosLogin(req.body);
    if (!datosLogin.success) {
      const normalized = formatZodError(datosLogin.error);
      return res.status(400).json({ error: normalized });
    }

    const { NombreUsuario, Contrasena } = datosLogin.data;

    // Aquí iría la lógica para autenticar al usuario con NombreUsuario y Contrasena
    try {
      const user = await AuthModelo.login({ NombreUsuario, Contrasena });
      if (!user) {
        return res.status(401).json({ mensaje: "Credenciales inválidas" });
      }

      const token = jwt.sign(
        {
          UsuarioID: user.UsuarioID,
          RolID: user.RolID,
          NombreUsuario: user.NombreUsuario,
        },
        process.env.SECRET_JWT_KEY,
        { expiresIn: "1h" }
      );

      res
        .cookie("access_token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 1000 * 60 * 60,
        })
        .json(user);
    } catch (error) {
      console.log(error.message)
      return res
        .status(500)
        .json({ mensaje: "Error del servidor", error: error.message });
    }
  }

  static async register(req, res) {
    await procesarRegistroUsuario(
      req,
      res,
      validarDatosUsuario,
      RolModelo.obtenerPorIDRegistroUsuario.bind(RolModelo),
      AuthModelo.register.bind(AuthModelo)
    );
  }

  static logout(req, res) {
    res.clearCookie("access_token");
    res.json({ mensaje: "Sesión cerrada" });
  }

  static session(req, res) {
    if (!req.session.usuario) return res.status(401).json({ logeado: false });
    res.json({
      logeado: true,
      NombreUsuario: req.session.usuario.NombreUsuario,
      UsuarioID: req.session.usuario.UsuarioID,
      RolID: req.session.usuario.RolID,
    });
  }
}
