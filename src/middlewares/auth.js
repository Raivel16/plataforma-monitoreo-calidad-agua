// Middleware que verifica si hay sesión activa
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export function verificarSesion(req, res, next) {
  const token = req.cookies.access_token;

  req.session = { usuario: null };

  if (!token) {
    return next(); // sin token, continúa pero sin usuario
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET_JWT_KEY);
    req.session.usuario = decoded;
  } catch {
    console.log("Token inválido o expirado");
  }
  next();
}

export function verificarPermiso(nivelMinimo) {
  return (req, res, next) => {
    const isApi =
      req.path && req.path.startsWith("/api");

    const usuario = req.session.usuario;

    if (!usuario) {
      if (
        isApi ||
        req.xhr ||
        req.headers.accept?.includes("application/json")
      ) {
        return res.status(401).json({ error: "No autenticado" });
      }
      return res.redirect("/");
    }

    const nivel = usuario.NivelPermiso;

    if (nivel < nivelMinimo) {
      if (
        isApi ||
        req.xhr ||
        req.headers.accept?.includes("application/json")
      ) {
        return res.status(403).json({
          error: `Acceso denegado. Se requiere nivel ${nivelMinimo} o superior.`,
        });
      }
      return res.redirect("/visualizacion");
    }

    next();
  };
}
