import { Router } from "express";
import { AnomaliasControlador } from "../../controladores/anomalias.js";

export const anomaliasRouter = Router();

anomaliasRouter.get("/", AnomaliasControlador.obtenerAnomalias);
