import { Router } from 'express';
import { AuthControlador } from '../../controladores/Auth.js';
import { UsuarioControlador } from '../../controladores/Usuarios.js';


export const authRouter = Router();

// Definir las rutas para autenticación
authRouter.post('/login', AuthControlador.login);

authRouter.post('/register', UsuarioControlador.registroUsuario);

authRouter.post('/logout', AuthControlador.logout);

authRouter.get('/session', AuthControlador.session)