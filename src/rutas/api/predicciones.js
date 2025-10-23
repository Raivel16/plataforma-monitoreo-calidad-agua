import { Router } from "express";
import { PrediccionesControlador } from "../../controladores/predicciones.js";

export const prediccionesRouter = Router();

prediccionesRouter.post("/", PrediccionesControlador.crearPrediccion);

prediccionesRouter.get("/historial", PrediccionesControlador.obtenerHistorialPredicciones);

prediccionesRouter.get("/precision", PrediccionesControlador.obtenerPrecisionPredicciones);

