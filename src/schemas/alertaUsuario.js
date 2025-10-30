import { z } from "zod";

export const alertaUsuarioSchema = z.object({
  RegistroAlertaID: z
    .number({ required_error: "El ID de la alerta es obligatorio" })
    .int()
    .positive(),
  UsuarioID: z
    .number({ required_error: "El ID de usuario es obligatorio" })
    .int()
    .positive(),
  FechaRevision: z.coerce.date().optional(),
  EstadoRevision: z.enum(["Pendiente", "Revisada", "Atendida"]).optional(),
});

export const validarDatosAlertaUsuario = (input) => {
  return alertaUsuarioSchema.safeParse(input);
};

export const validarParcialDatosAlertaUsuario = (input) => {
  return alertaUsuarioSchema.partial().safeParse(input);
};
