import { Router } from "express";
import { SensoresControlador } from "../../controladores/sensores.js";

export const sensoresRouter = Router();

sensoresRouter.get("/", SensoresControlador.obtenerSensores);

sensoresRouter.post("/", SensoresControlador.crearSensor);

sensoresRouter.get("/:id", SensoresControlador.obtenerSensorPorId);

sensoresRouter.patch("/:id", SensoresControlador.actualizarSensor);

sensoresRouter.delete("/:id", SensoresControlador.eliminarSensor);
