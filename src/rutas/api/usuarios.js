import { Router } from "express";
import { UsuarioControlador } from "../../controladores/Usuarios.js";

export const usuariosRouter = Router();

// Definir las rutas para usuarios
usuariosRouter.get("/", UsuarioControlador.obtenerTodos);
usuariosRouter.get("/:id", UsuarioControlador.obtenerPorId);
usuariosRouter.post("/", UsuarioControlador.crearEnRegistroAdministrativo);
usuariosRouter.patch("/:id", UsuarioControlador.actualizar);
