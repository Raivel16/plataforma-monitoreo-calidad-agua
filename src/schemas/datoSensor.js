import { z } from "zod";

export const datoSensorSchema = z.object({
  SensorID: z
    .number({ required_error: "El ID del sensor es obligatorio" })
    .int()
    .positive(),
  ParametroID: z
    .number({ required_error: "El ID del parámetro es obligatorio" })
    .int()
    .positive(),
  TimestampEnvio: z.coerce.date({
    required_error: "El timestamp de envío es obligatorio",
  }),
  Valor_original: z.number(),
  Valor_procesado: z.number(),
  Valor_normalizado: z.number().min(0).max(1),
  Estado: z.enum(["crudo", "procesado", "descartado"]).default("crudo"),
});

export const validarDatosDatoSensor = (input) => {
  return datoSensorSchema.safeParse(input);
};

export const validarParcialDatosDatoSensor = (input) => {
  return datoSensorSchema.partial().safeParse(input);
};
