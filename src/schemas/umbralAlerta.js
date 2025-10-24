import { z } from "zod";

export const umbralAlertaSchema = z.object({
  ParametroID: z
    .number({ required_error: "El ID de parámetro es obligatorio" })
    .int()
    .positive(),
  ValorCritico: z.number({ required_error: "El valor crítico es obligatorio" }),
  TipoUmbral: z.enum(["MAXIMO", "MINIMO"]),
  MensajeAlerta: z.string().max(255).optional(),
  Activo: z.boolean().default(true),
});

export const validarDatosUmbral = (input) => {
  return umbralAlertaSchema.safeParse(input);
};

export const validarParcialDatosUmbral = (input) => {
  return umbralAlertaSchema.partial().safeParse(input);
};
