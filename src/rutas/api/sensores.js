import { Router } from "express";
import { SensoresControlador } from "../../controladores/Sensores.js";
import { verificarPermiso } from "../../middlewares/auth.js";

export const sensoresRouter = Router();

// Definir las rutas para sensores
sensoresRouter.get(
  "/visualizacion",
  SensoresControlador.obtenerTodosVisualizacion
);
sensoresRouter.get("/", SensoresControlador.obtenerTodos);
sensoresRouter.get("/:id", SensoresControlador.obtenerPorId);
sensoresRouter.post("/", verificarPermiso(4), SensoresControlador.crear);
sensoresRouter.patch(
  "/:id",
  verificarPermiso(4),
  SensoresControlador.actualizar
);
sensoresRouter.patch(
  "/:id/desactivar",
  verificarPermiso(4),
  SensoresControlador.desactivar
);
