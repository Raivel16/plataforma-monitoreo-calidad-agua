import { z } from "zod";

export const parametroSchema = z.object({
  NombreParametro: z
    .string({ required_error: "El nombre del parámetro es obligatorio" })
    .min(1)
    .max(50),
  UnidadMedida: z
    .string({ required_error: "La unidad de medida es obligatoria" })
    .min(1)
    .max(10),
});

export const validarDatosParametro = (input) => {
  return parametroSchema.safeParse(input);
};

export const validarParcialDatosParametro = (input) => {
  return parametroSchema.partial().safeParse(input);
};
