import z from "zod";

export const sensorSchema = z.object({
  Nombre: z
    .string({ required_error: "El nombre del sensor es obligatorio" })
    .min(1)
    .max(100),
  Modelo: z
    .string({ required_error: "El modelo es obligatorio" })
    .min(1)
    .max(50),
  Fabricante: z
    .string({ required_error: "El fabricante es obligatorio" })
    .min(1)
    .max(100),
  Latitud: z
    .number({ required_error: "La latitud es obligatoria" })
    .min(-90)
    .max(90),
  Longitud: z
    .number({ required_error: "La longitud es obligatoria" })
    .min(-180)
    .max(180),
  Descripcion: z.string().max(255).optional(),
  EstadoOperativo: z.boolean().default(true),
});

export const validarDatosSensor = (input) => {
  return sensorSchema.safeParse(input);
};

export const validarParcialDatosSensor = (input) => {
  return sensorSchema.partial().safeParse(input);
};
