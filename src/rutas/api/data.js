import { Router } from "express";
import { dataControlador } from "../../controladores/data.js";

export const dataRouter = (io) => {
  const dataRouter = Router();

  dataRouter.post("/", (req, res) =>
    dataControlador.recibirDatos(req, res, io)
  );

  return dataRouter;
};
