import { z } from "zod";

export const usuarioSchema = z.object({
  RolID: z
    .number({ required_error: "El RolID es obligatorio" })
    .int()
    .positive(),
  NombreUsuario: z
    .string({ required_error: "El nombre de usuario es obligatorio" })
    .min(1)
    .max(100),
  ContrasenaHash: z
    .string({ required_error: "La contraseña en hash es obligatoria" })
    .min(1)
    .max(255),
  Correo: z
    .string({ required_error: "El correo es obligatorio" })
    .email("Formato de correo inválido")
    .max(150),
  Activo: z.boolean().default(true),
});

export const validarDatosUsuario = (input) => {
  return usuarioSchema.safeParse(input);
};

export const validarParcialDatosUsuario = (input) => {
  return usuarioSchema.partial().safeParse(input);
};
