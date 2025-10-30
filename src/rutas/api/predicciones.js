import { Router } from "express";
import { PrediccionesControlador } from "../../controladores/Predicciones.js";

export const prediccionesRouter = Router();

// Definir las rutas para predicciones
prediccionesRouter.get("/", PrediccionesControlador.listarPredicciones);
prediccionesRouter.get("/:id", PrediccionesControlador.obtenerPrediccion);
prediccionesRouter.post("/", PrediccionesControlador.generarPrediccion);
prediccionesRouter.delete("/:id", PrediccionesControlador.eliminarPrediccion);
prediccionesRouter.delete("/precision", PrediccionesControlador.calcularPrecision);
