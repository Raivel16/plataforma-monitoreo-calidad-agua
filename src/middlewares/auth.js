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

// arreglar
export function verificarRol(rolesPermitidos = []) {
  return (req, res, next) => {
    // Si la petición es a la API (ruta que comienza con /api) devolvemos JSON
    const isApi = req.path && req.path.startsWith("/api");

    if (!req.session.usuario) {
      if (
        isApi ||
        req.xhr ||
        req.headers.accept?.includes("application/json")
      ) {
        return res.status(401).json({ error: "No autenticado" });
      }
      return res.redirect("/");
    }

    if (!rolesPermitidos.includes(req.session.usuario.RolID)) {
      if (
        isApi ||
        req.xhr ||
        req.headers.accept?.includes("application/json")
      ) {
        return res.status(403).json({
          error: `Acceso denegado. Se requiere uno de los roles: ${rolesPermitidos.join(
            ", "
          )}`,
        });
      }
      // Si es una petición de navegador HTML, redirigir a la vista pública
      return res.redirect("/visualizacion");
    }

    next();
  };
}
