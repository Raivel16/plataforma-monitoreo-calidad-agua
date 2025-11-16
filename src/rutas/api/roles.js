import { Router } from "express";
import { RolesControlador } from "../../controladores/Roles.js";
import { verificarPermiso } from "../../middlewares/auth.js";

export const rolesRouter = Router();

// Definir las rutas para roles
rolesRouter.get("/", RolesControlador.obtenerTodosDesdeUsuario);
rolesRouter.get(
  "/admin",
  verificarPermiso(4),
  RolesControlador.obtenerTodosRegistroAdministrativo
);
rolesRouter.get(
  "/admin/:id",
  RolesControlador.obtenerPorIDRegistroAdministrativo
);
rolesRouter.post("/", RolesControlador.crear);
rolesRouter.patch("/:id", RolesControlador.actualizar);