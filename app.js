import express from "express";
import { corsMiddleware } from "./src/middlewares/cors.js";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";
import { Server } from "socket.io";
import bodyParser from "body-parser";

import { apiRouter } from "./src/rutas/index.js";

const app = express();
export const server = http.createServer(app);
const io = new Server(server);

//middlewares
app.use(bodyParser.json());
app.use(corsMiddleware());

// desabilitando cabecera X-Powered-By
app.disable("x-powered-by");

// resolver __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// rutas estaticas
app.use("/", express.static(path.join(__dirname, "src", "vistas")));

// rutas api
app.use("/api", apiRouter(io));

// manejador de rutas no encontradas
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, "src", "vistas", "404.html"));
});
