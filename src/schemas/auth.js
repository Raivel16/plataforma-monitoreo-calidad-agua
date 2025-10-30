import { z } from "zod";

export const authSchema = z.object({
  NombreUsuario: z
    .string({ required_error: "El nombre de usuario es obligatorio" })
    .min(1)
    .max(100),
  Contrasena: z
    .string({ required_error: "La contraseña es obligatoria" })
    .min(1)
    .max(255),
});

export const validarDatosLogin = (input) => {
  return authSchema.safeParse(input);
};
