import { Router } from "express";
import { DatosSensoresControlador } from "../../controladores/DatosSensores.js";

export const datosSensoresRouter = (io) => {
  const datosSensoresRouter = Router();
  // Definir las rutas para datos de sensores
  datosSensoresRouter.get("/", DatosSensoresControlador.obtenerTodos);
  datosSensoresRouter.get("/ultimos", DatosSensoresControlador.obtenerUltimosRegistros)
  datosSensoresRouter.get("/:id", DatosSensoresControlador.obtenerPorId);
  datosSensoresRouter.post("/", (req, res) =>
    DatosSensoresControlador.registrar(req, res, io)
  );
  datosSensoresRouter.get(
    "/sensor/:sensorId",
    DatosSensoresControlador.obtenerPorSensor
  );
  datosSensoresRouter.delete("/:id", DatosSensoresControlador.eliminar);

  return datosSensoresRouter;
};
