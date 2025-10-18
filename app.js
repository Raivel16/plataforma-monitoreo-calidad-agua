import express from "express";
import { corsMiddleware } from "./src/middlewares/cors.js";

export const app = express();

//middlewares
app.use(express.json());
app.use(corsMiddleware());

// desabilitando cabecera X-Powered-By
app.disable("x-powered-by");
