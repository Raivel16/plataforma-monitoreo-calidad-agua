/**
 * Función genérica para manejar el flujo de registro con validación Zod,
 * verificación de rol y registro en la base de datos.
 * 
 * @param {Object} req - Objeto Request de Express
 * @param {Object} res - Objeto Response de Express
 * @param {Function} validador - Función de validación (usa safeParse)
 * @param {Function} obtenerRol - Función que valida si el RolID es permitido
 * @param {Function} registrar - Función que ejecuta el registro (modelo)
 */
export const procesarRegistroUsuario = async (
  req,
  res,
  validador,
  obtenerRol,
  registrar
) => {
  // 1️⃣ Validar los datos
  const datosRegistro = validador(req.body);
  if (!datosRegistro.success) {
    const zodError = datosRegistro.error;
    const issues = zodError.issues || zodError.errors || [];
    const errores = issues.map((it) => ({
      message: it.message,
      path: it.path || [],
    }));

    return res.status(400).json({ error: { errors: errores } });
  }

  const { RolID, NombreUsuario, Contrasena, Correo, Activo } =
    datosRegistro.data;

  // 2️⃣ Verificar si el rol es válido
  const esRolValido = await obtenerRol({ RolID });
  if (!esRolValido) {
    return res
      .status(400)
      .json({ mensaje: "El RolID no pertenece a los permitidos" });
  }

  // 3️⃣ Intentar registrar
  try {
    const nuevoUsuario = await registrar({
      RolID,
      NombreUsuario,
      Contrasena,
      Correo,
      Activo,
    });
    return res.status(201).json(nuevoUsuario);
  } catch (error) {
    // Duplicado de nombre de usuario
    if (
      error &&
      typeof error.message === "string" &&
      error.message.toLowerCase().includes("nombre de usuario")
    ) {
      return res.status(409).json({ mensaje: error.message });
    }

    // Error genérico
    return res
      .status(500)
      .json({ mensaje: error.message || "Error del servidor" });
  }
};
