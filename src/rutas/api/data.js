import { Router } from "express";
import { DataControlador } from "../../controladores/data.js";

export const dataRouter = (io) => {
  const dataRouter = Router();

  dataRouter.post("/", (req, res) =>
    DataControlador.recibirDatos(req, res, io)
  );

  dataRouter.get("/", DataControlador.obtenerDatos);

  return dataRouter;
};
