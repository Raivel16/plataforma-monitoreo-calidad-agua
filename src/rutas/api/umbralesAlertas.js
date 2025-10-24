import { Router } from "express";

export const umbralesAlertasRouter = Router();

// Definir las rutas para umbrales de alertas

umbralesAlertasRouter.get("/", (req, res) => {
  res.send("Listar todos los umbrales de alertas configurados");
});

umbralesAlertasRouter.get("/:id", (req, res) => {
  res.send(`Obtener detalle del umbral de alerta con ID ${req.params.id}`);
});

umbralesAlertasRouter.post("/", (req, res) => {
  res.send("Crear nuevo umbral de alerta");
});

umbralesAlertasRouter.patch("/:id", (req, res) => {
  res.send(`Actualizar umbral de alerta con ID ${req.params.id}`);
});

umbralesAlertasRouter.delete("/:id", (req, res) => {
  res.send(`Eliminar umbral de alerta con ID ${req.params.id}`);
});
