import { z } from "zod";

export const prediccionSchema = z.object({
  SensorID: z
    .number({ required_error: "El ID del sensor es obligatorio" })
    .int()
    .positive(),
});

export const validarDatosPrediccion = (input) => {
  return prediccionSchema.safeParse(input);
};

