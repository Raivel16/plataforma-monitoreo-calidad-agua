import express from "express";
import { corsMiddleware } from "./src/middlewares/cors.js";
import path from "path";
import { fileURLToPath } from "url";

import { apiRoutes } from "./src/rutas/index.js";

export const app = express();

//middlewares
app.use(express.json());
app.use(corsMiddleware());

// desabilitando cabecera X-Powered-By
app.disable("x-powered-by");

// resolver __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// rutas estaticas
app.use("/", express.static(path.join(__dirname, "src", "vistas")));

// rutas api
app.use("/api", apiRoutes);

// manejador de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ mensaje: "Recurso no encontrado" });
});
