import { z } from "zod";

export const anomaliaSchema = z.object({
  DatoID: z
    .number({ required_error: "El ID del dato es obligatorio" })
    .int()
    .positive(),
  Tipo: z
    .string({ required_error: "El tipo de anomalía es obligatorio" })
    .min(1)
    .max(50),
  Descripcion: z.string().max(255).optional(),
  Fecha_Detectada: z.coerce.date({
    required_error: "La fecha de detección es obligatoria",
  }),
  Estado: z.enum(["Detectada", "Confirmada", "Falsa"]).default("Detectada"),
});

export const validarDatosAnomalia = (input) => {
  return anomaliaSchema.safeParse(input);
};

export const validarParcialDatosAnomalia = (input) => {
  return anomaliaSchema.partial().safeParse(input);
};
