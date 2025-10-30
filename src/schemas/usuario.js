import { z } from "zod";

export const usuarioSchema = z
  .object({
    RolID: z
      .number({ required_error: "El RolID es obligatorio" })
      .int()
      .positive(),
    NombreUsuario: z
      .string({ required_error: "El nombre de usuario es obligatorio" })
      .min(1)
      .max(100),
    Contrasena: z
      .string({ required_error: "La contraseña es obligatoria" })
      .min(1)
      .max(255),
    RepetirContrasena: z
      .string({
        required_error: "La repetición de la contraseña es obligatoria",
      })
      .min(1)
      .max(255),
    Correo: z
      .string({ required_error: "El correo es obligatorio" })
      .email("Formato de correo inválido")
      .max(150),
    Activo: z.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    if (data.Contrasena !== data.RepetirContrasena) {
      ctx.addIssue({
        code: "custom",
        message: "Las contraseñas no coinciden",
        path: ["RepetirContrasena"],
      });
    }
  });

export const validarDatosUsuario = (input) => {
  const resultado = usuarioSchema.safeParse(input);

  if (!resultado.success) {
    const zodError = resultado.error;
    const issues = zodError.issues || zodError.errors || [];

    // Normalizamos el formato del error
    const errores = issues.map((it) => ({
      message: it.message,
      path: it.path || [],
    }));

    return {
      success: false,
      error: { errors: errores },
    };
  }

  return {
    success: true,
    data: resultado.data,
  };
};

export const validarParcialDatosUsuario = (input) => {
  const resultado = usuarioSchema.partial().safeParse(input);

  if (!resultado.success) {
    const zodError = resultado.error;
    const issues = zodError.issues || zodError.errors || [];

    // Normalizamos el formato del error
    const errores = issues.map((it) => ({
      message: it.message,
      path: it.path || [],
    }));

    return {
      success: false,
      error: { errors: errores },
    };
  }

  return {
    success: true,
    data: resultado.data,
  };
};
