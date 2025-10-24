import { Router } from "express";

export const registrosAlertasRouter = Router();

// Definir las rutas para registros de alertas
registrosAlertasRouter.get("/", (req, res) => {
  res.send("Listar registros de alertas generadas");
});

registrosAlertasRouter.get("/:id", (req, res) => {
  res.send(`Obtener registro de alerta con ID ${req.params.id}`);
});

registrosAlertasRouter.post("/", (req, res) => {
  res.send("Crear nuevo registro de alerta");
});

registrosAlertasRouter.patch("/:id/notificar", (req, res) => {
  res.send(`Marcar registro de alerta con ID ${req.params.id} como notificada`);
});

registrosAlertasRouter.patch("/:id/error", (req, res) => {
  res.send(`Marcar registro de alerta con ID ${req.params.id} como con error`);
});

registrosAlertasRouter.delete("/:id", (req, res) => {
  res.send(`Eliminar registro de alerta con ID ${req.params.id}`);
});
