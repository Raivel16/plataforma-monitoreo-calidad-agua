import express from "express";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import { corsMiddleware } from "./middlewares/cors.js"; // ✅ importa aquí

// Routers...
import { apiRouter } from "./rutas/index.js";

// 🧭 Configurar __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 🧩 Middleware base
app.use(corsMiddleware()); // ✅ usa tu middleware personalizado
app.use(express.json());
app.use(morgan("dev"));

// 📂 Rutas estáticas
app.use("/", express.static(path.join(__dirname, "vistas")));

// ⚙️ Configuración de rutas
export function configurarRutas(io) {
  app.use("/api", apiRouter(io));

  // 🚨 404
  app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, "vistas", "404.html"));
  });

  // 💥 Error handler global
  app.use((err, req, res) => {
    console.error("Error interno:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  });

  return app;
}

export default app;
