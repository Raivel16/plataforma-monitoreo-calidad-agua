import { Router } from "express";
import { SensoresControlador } from "../../controladores/sensores.js";

export const sensoresRouter = (io) => {
  const sensoresRouter = Router();

  sensoresRouter.post("/", (req, res) =>
    SensoresControlador.recibirDatos(req, res, io)
  );

  return sensoresRouter;
};
