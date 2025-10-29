import { Router } from 'express';
import { AuthControlador } from '../../controladores/Auth.js';


export const authRouter = Router();

// Definir las rutas para autenticación
authRouter.post('/login', AuthControlador.login);

authRouter.post('/register', AuthControlador.register);

authRouter.post('/logout', AuthControlador.logout);

authRouter.get('/session', AuthControlador.session)