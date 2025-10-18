import { Router } from "express";
import { dataRouter } from "./api/data.js";

export const apiRouter = (io) => {
  const router = Router();

  router.get("/estado", (req, res) => {
    res.json({ estado: "API funcionando correctamente" });
  });

  // Montar el sub-router de sensores en /sensores
  router.use("/data", dataRouter(io));

  return router;
};
