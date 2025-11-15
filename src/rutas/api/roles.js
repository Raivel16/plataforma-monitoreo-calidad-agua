import { Router } from "express";
import { RolesControlador } from "../../controladores/Roles.js";

export const rolesRouter = Router();

// Definir las rutas para roles
rolesRouter.get("/", RolesControlador.obtenerTodosDesdeUsuario);
rolesRouter.get("/admin", RolesControlador.obtenerTodosRegistroAdministrativo);
rolesRouter.get("/:id", (req, res) => {
  res.send(`Obtener rol con ID ${req.params.id} desde el usuario`);
});
rolesRouter.get("/admin/:id", (req, res) => {
  res.send(`Obtener rol con ID ${req.params.id} desde el admin`);
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
