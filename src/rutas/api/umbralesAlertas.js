import { Router } from "express";
import { UmbralesAlertasController } from "../../controladores/UmbralesAlertas.js";
import { verificarPermiso } from "../../middlewares/auth.js";

export const umbralesAlertasRouter = Router();

// Solo usuarios con permiso nivel 2 o superior pueden ver los umbrales
umbralesAlertasRouter.get(
  "/",
  verificarPermiso(2),
  UmbralesAlertasController.obtenerUmbrales
);
