import { Router } from "express";

export const usuariosRouter = Router();

// Definir las rutas para usuarios
usuariosRouter.get("/", (req, res) => {
  res.send("Obtener todos los usuarios");
});

usuariosRouter.get("/:id", (req, res) => {
  res.send(`Obtener usuario con ID ${req.params.id}`);
});
usuariosRouter.post("/", (req, res) => {
  res.send("Crear nuevo usuario");
});
usuariosRouter.patch("/:id", (req, res) => {
  res.send(`Actualizar usuario con ID ${req.params.id}`);
});
usuariosRouter.delete("/:id", (req, res) => {
  res.send(`Eliminar usuario con ID ${req.params.id}`);
});
usuariosRouter.post("/login", (req, res) => {
  res.send("Autenticar usuario");
});
usuariosRouter.get("/:id/alertas", (req, res) => {
  res.send(`Obtener alertas para el usuario con ID ${req.params.id}`);
});
