import { Router } from "express";

export const anomaliasRouter = Router();

// Definir las rutas para anomalías
anomaliasRouter.get("/", (req, res) => {
  res.send("Listar todas las anomalías detectadas");
});

anomaliasRouter.get("/:id", (req, res) => {
  res.send(`Obtener detalle de la anomalía con ID ${req.params.id}`);
});
anomaliasRouter.post("/", (req, res) => {
  res.send("Registrar nueva anomalía detectada");
});
anomaliasRouter.patch("/:id/confirmar", (req, res) => {
  res.send(`Confirmar anomalía con ID ${req.params.id} como real`);
});
anomaliasRouter.patch("/:id/descartar", (req, res) => {
  res.send(`Marcar anomalía con ID ${req.params.id} como falsa`);
});
anomaliasRouter.delete("/:id", (req, res) => {
  res.send(`Eliminar anomalía con ID ${req.params.id}`);
});
