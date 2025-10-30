import jwt from "jsonwebtoken";

import { validarDatosLogin } from "../schemas/auth.js";
import { AuthModelo } from "../modelos/Auth.js";
import { validarDatosUsuario } from "../schemas/usuario.js";
import { formatZodError } from "../utils/formatZodError.js";

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
      return res
        .status(500)
        .json({ mensaje: "Error del servidor", error: error.message });
    }
  }

  static async register(req, res) {
    const datosRegistro = validarDatosUsuario(req.body);
    if (!datosRegistro.success) {
      // Normalizar el error de Zod para devolver una estructura predecible
      const zodError = datosRegistro.error;
      // ZodError tiene `issues` (array) con { message, path, code }
      const issues = zodError.issues || zodError.errors || [];
      const errores = issues.map((it) => ({
        message: it.message,
        path: it.path || [],
      }));
      return res.status(400).json({ error: { errors: errores } });
    }

    const { RolID, NombreUsuario, Contrasena, Correo, Activo } =
      datosRegistro.data;

    // Aquí iría la lógica para registrar al nuevo usuario
    try {
      const nuevoUsuario = await AuthModelo.register({
        RolID,
        NombreUsuario,
        Contrasena,
        Correo,
        Activo,
      });
      res.status(201).json(nuevoUsuario);
    } catch (error) {
      // Si el modelo lanzó error por nombre de usuario duplicado, devolver conflicto con mensaje claro
      if (
        error &&
        typeof error.message === "string" &&
        error.message.toLowerCase().includes("nombre de usuario")
      ) {
        return res.status(409).json({ mensaje: error.message });
      }

      // Fallback: devolver mensaje de error para que el frontend lo muestre
      return res
        .status(500)
        .json({ mensaje: error.message || "Error del servidor" });
    }
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
