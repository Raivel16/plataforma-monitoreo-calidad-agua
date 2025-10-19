import { Router } from "express";
import { dataRouter } from "./api/data.js";
import { sensoresRouter } from "./api/sensores.js";

export const apiRouter = (io) => {
  const router = Router();

  router.get("/estado", (req, res) => {
    res.json({ estado: "API funcionando correctamente" });
  });

  // Montar el sub-router de sensores en /sensores
  router.use("/data", dataRouter(io));

  router.use("/sensores", sensoresRouter);

  return router;
};
