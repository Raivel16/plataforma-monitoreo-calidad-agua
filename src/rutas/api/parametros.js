import { Router } from "express";
import { ParametrosControlador } from "../../controladores/Parametros.js";

export const parametrosRouter = Router();

// Definir las rutas para parámetros

parametrosRouter.get("/", ParametrosControlador.obtenerTodos);

parametrosRouter.get("/:id", (req, res) => {
  res.send(`Obtener parámetro con ID ${req.params.id}`);
});
parametrosRouter.post("/", (req, res) => {
  res.send("Crear nuevo parámetro");
});
parametrosRouter.patch("/:id", (req, res) => {
  res.send(`Actualizar parámetro con ID ${req.params.id}`);
});
parametrosRouter.delete("/:id", (req, res) => {
  res.send(`Eliminar parámetro con ID ${req.params.id}`);
});
