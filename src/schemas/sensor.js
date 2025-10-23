import z from "zod";

const sensorSchema = z.object({
  tipo: z.string(z.enum(["ph", "temperatura", "turbidez", "oxigeno"]), {
    required_error: "El tipo es requerido",
    invalid_type_error:
      "El tipo debe ser uno de: ph, temperatura, turbidez, oxigeno",
  }),
  unidad: z.string(
    z.enum(["ph", "°C", "NTU", "%"], {
      required_error: "La unidad es requerida",
      invalid_type_error: "La unidad debe ser uno de: ph, °C, NTU, %",
    })
  ),
  ubicacion: z.string({
    required_error: "La ubicación es requerida",
    invalid_type_error: "La ubicación debe ser una cadena",
  }),
  latitud: z
    .number({
      required_error: "La latitud es requerida",
      invalid_type_error: "La latitud debe ser un número",
    })
    .min(-90)
    .max(90),
  longitud: z
    .number({
      required_error: "La longitud es requerida",
      invalid_type_error: "La longitud debe ser un número",
    })
    .min(-180)
    .max(180),
  modelo: z.string({
    required_error: "El modelo es requerido",
    invalid_type_error: "El modelo debe ser una cadena",
  }),
  fabricante: z.string({
    required_error: "El fabricante es requerido",
    invalid_type_error: "El fabricante debe ser una cadena",
  }),
  descripcion: z.string().default(""),
  activo: z.boolean().default(true),
});

export const validarDatosSensor = (input) => {
  return sensorSchema.safeParse(input);
};

export const validarPartialDatosSensor = (input) => {
  return sensorSchema.partial().safeParse(input);
};
