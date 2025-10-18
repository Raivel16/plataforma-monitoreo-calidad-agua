import { Router } from "express";

export const apiRoutes = Router();

apiRoutes.get("/estado", (req, res) => {
  res.json({ estado: "API funcionando correctamente" });
});
