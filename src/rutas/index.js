import { Router } from "express";

// Importar los sub-routers
import { alertasUsuariosRouter } from "./api/alertasUsuarios.js";
import { anomaliasRouter } from "./api/anomalias.js";
import { datosSensoresRouter } from "./api/datosSensores.js";
import { parametrosRouter } from "./api/parametros.js";
import { prediccionesRouter } from "./api/predicciones.js";
import { registrosAlertasRouter } from "./api/registrosAlertas.js";
import { rolesRouter } from "./api/roles.js";
import { sensoresRouter } from "./api/sensores.js";
import { umbralesAlertasRouter } from "./api/umbralesAlertas.js";
import { usuariosRouter } from "./api/usuarios.js";

export const apiRouter = (io) => {
  const router = Router();

  router.get("/estado", (req, res) => {
    res.json({ estado: "API funcionando correctamente" });
  });

  // Montar el sub-router de sensores en /sensores
  router.use("/alertas", alertasUsuariosRouter);
  router.use("/anomalias", anomaliasRouter);
  router.use("/datos", datosSensoresRouter(io));
  router.use("/parametros", parametrosRouter);
  router.use("/predicciones", prediccionesRouter);
  router.use("/registrosAlertas", registrosAlertasRouter);
  router.use("/roles", rolesRouter);
  router.use("/sensores", sensoresRouter);
  router.use("/umbrales", umbralesAlertasRouter);
  router.use("/usuarios", usuariosRouter);

  return router;
};
