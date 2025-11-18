import { Router } from "express";
import { AlertasUsuariosControlador } from "../../controladores/AlertasUsuarios.js";

export const alertasUsuariosRouter = Router();

// Definir las rutas para alertas de usuario

alertasUsuariosRouter.get("/", (req, res) => {
  res.send("Listar todas las alertas de usuarios");
});

alertasUsuariosRouter.get("/mis", AlertasUsuariosControlador.getMisAlertas);




alertasUsuariosRouter.get("/:id", (req, res) => {
  res.send(`Obtener detalle de la alerta de usuario con ID ${req.params.id}`);
});
alertasUsuariosRouter.post("/", (req, res) => {
  res.send("Crear relación alerta-usuario (asignar alerta)");
});

alertasUsuariosRouter.post("/enviarCorreo", (req, res) => {
  res.send("Enviar correo de alerta a usuario");
});

alertasUsuariosRouter.patch("/:id/revisar", (req, res) => {
  res.send(
    `Marcar como “Revisada” la alerta de usuario con ID ${req.params.id}`
  );
});
alertasUsuariosRouter.patch("/:id/atender", (req, res) => {
  res.send(
    `Marcar como “Atendida” la alerta de usuario con ID ${req.params.id}`
  );
});
alertasUsuariosRouter.delete("/:id", (req, res) => {
  res.send(`Eliminar relación usuario-alerta con ID ${req.params.id}`);
});
