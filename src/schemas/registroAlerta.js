import { z } from "zod";

export const registroAlertaSchema = z.object({
  UmbralID: z
    .number({ required_error: "El ID de umbral es obligatorio" })
    .int()
    .positive(),
  DatoID: z
    .number({ required_error: "El ID de dato es obligatorio" })
    .int()
    .positive(),
  FechaHoraAlerta: z.coerce.date({
    required_error: "La fecha y hora de la alerta son obligatorias",
  }),
  EstadoNotificacion: z
    .enum(["Pendiente", "Enviado", "Error"])
    .default("Pendiente"),
});

export const validarDatosRegistroAlerta = (input) => {
  return registroAlertaSchema.safeParse(input);
};

export const validarParcialDatosRegistroAlerta = (input) => {
  return registroAlertaSchema.partial().safeParse(input);
};
