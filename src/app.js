import express from "express";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import { corsMiddleware } from "./middlewares/cors.js"; // ✅ importa aquí
import { verificarSesion, verificarPermiso } from "./middlewares/auth.js";
import cookieParser from "cookie-parser";
import fs from "node:fs";

// Routers...
import { apiRouter } from "./rutas/index.js";

// 🧭 Configurar __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 🧩 Middleware base
app.use(corsMiddleware()); // ✅ usa tu middleware personalizado
app.use(express.json());
app.use(cookieParser());
app.use(verificarSesion);
app.use(morgan("dev"));

app.get("/datos-sensores/sensores.html", verificarPermiso(4), (req, res) => {
  res.sendFile(
    path.join(__dirname, "vistas", "datos-sensores", "sensores.html")
  );
});

app.get("/datos-sensores/parametros.html", verificarPermiso(4), (req, res) => {
  res.sendFile(
    path.join(__dirname, "vistas", "datos-sensores", "parametros.html")
  );
});

app.get("/datos-sensores/umbrales.html", verificarPermiso(4), (req, res) => {
  res.sendFile(
    path.join(__dirname, "vistas", "datos-sensores", "umbrales.html")
  );
});

app.get("/datos-sensores/ingesta.html", verificarPermiso(4), (req, res) => {
  res.sendFile(
    path.join(__dirname, "vistas", "datos-sensores", "ingesta.html")
  );
});

// 📂 Rutas protegidas (deben montarse antes de servir archivos estáticos)
// 📂 Rutas protegidas (deben montarse antes de servir archivos estáticos)
app.use("/datos-sensores", verificarPermiso(2), (req, res, next) => {
  // Nivel base 2 para entrar a la sección

  // 🔹 Redirigir si falta la barra final
  if (req.originalUrl === "/datos-sensores") {
    return res.redirect(req.originalUrl + "/");
  }

  // Normalizamos la ruta
  let requestedPath = req.path === "/" ? "/index.html" : req.path;
  const archivo = requestedPath.replace(/^\//, "");
  const rutaArchivo = path.join(__dirname, "vistas", "datos-sensores", archivo);

  if (!fs.existsSync(rutaArchivo)) {
    return res.status(404).sendFile(path.join(__dirname, "vistas", "404.html"));
  }

  res.sendFile(rutaArchivo);
});

// 📂 Rutas estáticas públicas (montar después de rutas protegidas para evitar bypass)
app.use("/", express.static(path.join(__dirname, "vistas")));

// ⚙️ Configuración de rutas
export function configurarRutas(io) {
  app.use("/api", apiRouter(io));

  // 🚨 404
  app.use((req, res) => {
    // Si la petición es a la API, devolver JSON para facilitar debugging
    if (req.path && req.path.startsWith("/api")) {
      return res.status(404).json({ error: "Endpoint no encontrado" });
    }

    res.status(404).sendFile(path.join(__dirname, "vistas", "404.html"));
  });

  // 💥 Error handler global
  app.use((err, req, res, _next) => {
    void _next;
    console.error("Error interno:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  });

  return app;
}

export default app;
