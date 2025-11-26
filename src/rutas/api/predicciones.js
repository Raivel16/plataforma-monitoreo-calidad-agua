import { Router } from "express";
import { PrediccionesControlador } from "../../controladores/Predicciones.js";

export const prediccionesRouter = Router();

// Definir las rutas para predicciones
prediccionesRouter.get("/", PrediccionesControlador.listarPredicciones);
prediccionesRouter.get(
  "/mapa",
  PrediccionesControlador.obtenerSensoresConPrediccion
);
prediccionesRouter.get("/:id", PrediccionesControlador.obtenerPrediccion);
prediccionesRouter.post("/generar", PrediccionesControlador.generarPrediccion);
prediccionesRouter.get("/precision", PrediccionesControlador.calcularPrecision);
