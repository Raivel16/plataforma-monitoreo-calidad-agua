import { Router } from "express";
import { SensoresControlador } from "../../controladores/Sensores.js";

export const sensoresRouter = Router();

// Definir las rutas para sensores
sensoresRouter.get("/", SensoresControlador.obtenerTodos);
sensoresRouter.get("/:id", SensoresControlador.obtenerPorId);
sensoresRouter.post("/", SensoresControlador.crear);
sensoresRouter.patch("/:id", SensoresControlador.actualizar);
sensoresRouter.patch("/:id/desactivar", SensoresControlador.desactivar);
sensoresRouter.delete("/:id", SensoresControlador.eliminar);
