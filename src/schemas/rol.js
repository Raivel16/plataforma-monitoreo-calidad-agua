import { z } from "zod";

export const rolSchema = z.object({
  NombreRol: z
    .string({ required_error: "El nombre del rol es obligatorio" })
    .min(1)
    .max(50),
  EsInterno: z.boolean().default(false),
  NivelPermiso: z.number().min(1).max(4).default(1),
});

export const validarDatosRol = (input) => {
  return rolSchema.safeParse(input);
};

export const validarParcialDatosRol = (input) => {
  return rolSchema.partial().safeParse(input);
};
