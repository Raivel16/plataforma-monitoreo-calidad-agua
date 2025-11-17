import { Router } from "express";
import { DatosSensoresControlador } from "../../controladores/DatosSensores.js";
import { verificarPermiso } from "../../middlewares/auth.js";

export const datosSensoresRouter = (io) => {
  const datosSensoresRouter = Router();
  // Definir las rutas para datos de sensores
  datosSensoresRouter.get("/",verificarPermiso(3), DatosSensoresControlador.obtenerTodos);
  datosSensoresRouter.get("/ultimos",verificarPermiso(3), DatosSensoresControlador.obtenerUltimosRegistros)
  datosSensoresRouter.get("/:id",verificarPermiso(3), DatosSensoresControlador.obtenerPorId);
  datosSensoresRouter.post("/", (req, res) =>
    DatosSensoresControlador.registrar(req, res, io)
  );
  datosSensoresRouter.get(
    "/sensor/:sensorId",verificarPermiso(3),
    DatosSensoresControlador.obtenerPorSensor
  );
  datosSensoresRouter.delete("/:id",verificarPermiso(3), DatosSensoresControlador.eliminar);

  return datosSensoresRouter;
};
