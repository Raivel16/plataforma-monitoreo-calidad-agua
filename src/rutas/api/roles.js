import { Router } from "express";

export const rolesRouter = Router();

// Definir las rutas para roles
rolesRouter.get("/", (req, res) => {
  res.send("Obtener todos los roles");
});
rolesRouter.get("/:id", (req, res) => {
  res.send(`Obtener rol con ID ${req.params.id}`);
});
rolesRouter.post("/", (req, res) => {
  res.send("Crear nuevo rol");
});
rolesRouter.patch("/:id", (req, res) => {
  res.send(`Actualizar rol con ID ${req.params.id}`);
});
rolesRouter.delete("/:id", (req, res) => {
  res.send(`Eliminar rol con ID ${req.params.id}`);
});
