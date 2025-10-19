import { Router } from "express";
import { dataRouter } from "./api/data.js";
import { sensoresRouter } from "./api/sensores.js";
import { prediccionesRouter } from "./api/predicciones.js";
import { anomaliasRouter } from "./api/anomalias.js";

export const apiRouter = (io) => {
  const router = Router();

  router.get("/estado", (req, res) => {
    res.json({ estado: "API funcionando correctamente" });
  });

  // Montar el sub-router de sensores en /sensores
  router.use("/data", dataRouter(io));

  router.use("/sensores", sensoresRouter);
  router.use("/predicciones", prediccionesRouter);
  router.use("/anomalias", anomaliasRouter);

  return router;
};
