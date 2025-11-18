USE MonitoreoAguaJunin;
GO




--PREDICCIONES y ANOMALIAS

-- 8. Procedimiento para obtener todas las predicciones con filtro
CREATE OR ALTER  PROCEDURE sp_ObtenerPredicciones
    @SensorID_Filtro INT = NULL,
    @FechaInicio DATETIME2 = NULL,
    @FechaFin DATETIME2 = NULL
AS
BEGIN
    SELECT
        p.PrediccionID, s.Nombre AS Sensor, p.FechaHoraPrediccion, p.ModeloUsado, p.ValorPredicho, p.ProbabilidadRiesgo
    FROM
        Predicciones p
    INNER JOIN Sensores s ON p.SensorID = s.SensorID
    WHERE
        (@SensorID_Filtro IS NULL OR p.SensorID = @SensorID_Filtro)
        AND (@FechaInicio IS NULL OR p.FechaHoraPrediccion >= @FechaInicio)
        AND (@FechaFin IS NULL OR p.FechaHoraPrediccion <= @FechaFin);
END
GO

-- 9. Procedimiento para obtener una predicción en específico por id
CREATE OR ALTER  PROCEDURE sp_ObtenerPrediccionPorID
    @PrediccionID BIGINT
AS
BEGIN
    SELECT
        p.PrediccionID, s.Nombre AS Sensor, p.FechaHoraPrediccion, p.ModeloUsado, p.ValorPredicho, p.ProbabilidadRiesgo
    FROM
        Predicciones p
    INNER JOIN Sensores s ON p.SensorID = s.SensorID
    WHERE
        p.PrediccionID = @PrediccionID;
END
GO

-- 10. Procedimiento para obtener ultimas predicciones (una por sensor)
CREATE OR ALTER  PROCEDURE sp_ObtenerUltimasPredicciones
AS
BEGIN
    -- Utiliza una CTE para encontrar el ID de la última predicción de cada sensor
    WITH UltimasPredicciones AS (
        SELECT
            PrediccionID,
            ROW_NUMBER() OVER(PARTITION BY SensorID ORDER BY FechaHoraPrediccion DESC) as rn
        FROM
            Predicciones
    )
    SELECT
        p.PrediccionID, s.Nombre AS Sensor, p.FechaHoraPrediccion, p.ModeloUsado, p.ValorPredicho, p.ProbabilidadRiesgo
    FROM
        Predicciones p
    INNER JOIN Sensores s ON p.SensorID = s.SensorID
    INNER JOIN UltimasPredicciones up ON p.PrediccionID = up.PrediccionID
    WHERE
        up.rn = 1;
END
GO

-- 11. Procedimiento para insertar predicción
CREATE OR ALTER  PROCEDURE sp_InsertarPrediccion
    @SensorID INT,
    @FechaHoraPrediccion DATETIME2,
    @ModeloUsado VARCHAR(50) = NULL,
    @ValorPredicho VARCHAR(50),
    @ProbabilidadRiesgo DECIMAL(5,2)
AS
BEGIN
    INSERT INTO Predicciones (
        SensorID, FechaHoraPrediccion, ModeloUsado, ValorPredicho, ProbabilidadRiesgo
    )
    VALUES (
        @SensorID, @FechaHoraPrediccion, @ModeloUsado, @ValorPredicho, @ProbabilidadRiesgo
    );
END
GO





--DATOS SENSORES
GO
CREATE VIEW vw_DatosSensores_Detalle AS
SELECT 
    d.DatoID,
    d.SensorID,
    s.Nombre,
    s.Descripcion,
    d.ParametroID,
    p.NombreParametro,
    p.UnidadMedida,
    d.TimestampRegistro,
    d.TimestampEnvio,
    d.Valor_original,
    d.Valor_procesado,
    d.Valor_normalizado,
    d.Estado
FROM DatosSensores d
JOIN Sensores s ON s.SensorID = d.SensorID
JOIN Parametros p ON p.ParametroID = d.ParametroID;
GO

-- 1. Procedimiento para insertar una nueva lectura en DatosSensores
CREATE PROCEDURE sp_InsertarDatosSensor
    @SensorID INT,
    @ParametroID INT,
    @TimestampRegistro DATETIME2,
    @TimestampEnvio DATETIME2 = NULL,
    @Valor_original DECIMAL(10,4),
    @Valor_procesado DECIMAL(10,4) = NULL,
    @Valor_normalizado DECIMAL(10,4) = NULL,
    @Estado VARCHAR(20) = 'crudo'
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @NuevoID INT;

    INSERT INTO DatosSensores (
        SensorID, ParametroID, TimestampRegistro, TimestampEnvio, 
        Valor_original, Valor_procesado, Valor_normalizado, Estado
    )
    VALUES (
        @SensorID, @ParametroID, @TimestampRegistro, @TimestampEnvio, 
        @Valor_original, @Valor_procesado, @Valor_normalizado, @Estado
    );

    SET @NuevoID = SCOPE_IDENTITY();

    SELECT * 
    FROM vw_DatosSensores_Detalle
    WHERE DatoID = @NuevoID;
END;
GO



GO
CREATE PROCEDURE sp_ObtenerDatosSensores
    @SensorID_Filtro INT = NULL,
    @ParametroID_Filtro INT = NULL,
    @FechaInicio DATETIME2 = NULL,
    @FechaFin DATETIME2 = NULL,
    @UltimosDiez BIT = 0
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP (CASE WHEN @UltimosDiez = 1 THEN 10 ELSE 1000000 END)
        ds.DatoID,
        s.SensorID,
        s.Nombre,
        s.Descripcion,
        p.ParametroID,
        p.NombreParametro,
        p.UnidadMedida,
        ds.TimestampRegistro,
        ds.TimestampEnvio,
        ds.Valor_original,
        ds.Valor_procesado,
        ds.Valor_normalizado,
        ds.Estado
    FROM
        DatosSensores ds
    INNER JOIN Sensores s ON ds.SensorID = s.SensorID
    INNER JOIN Parametros p ON ds.ParametroID = p.ParametroID
    WHERE
        (@SensorID_Filtro IS NULL OR ds.SensorID = @SensorID_Filtro)
        AND (@ParametroID_Filtro IS NULL OR ds.ParametroID = @ParametroID_Filtro)
        AND (@FechaInicio IS NULL OR ds.TimestampRegistro >= @FechaInicio)
        AND (@FechaFin IS NULL OR ds.TimestampRegistro <= @FechaFin)
    ORDER BY ds.TimestampRegistro DESC;
END
GO


CREATE PROCEDURE sp_ObtenerUltimoDatoSensores
AS
BEGIN
    SELECT 
        ds.SensorID,
        ds.ParametroID,
        ds.Valor_procesado,
        ds.TimestampRegistro
    FROM DatosSensores ds
    INNER JOIN (
        SELECT 
            SensorID, 
            ParametroID, 
            MAX(TimestampRegistro) AS UltimoRegistro
        FROM DatosSensores
        GROUP BY SensorID, ParametroID
    ) ult
        ON ds.SensorID = ult.SensorID
        AND ds.ParametroID = ult.ParametroID
        AND ds.TimestampRegistro = ult.UltimoRegistro;
END
GO

--PARAMETROS

CREATE PROCEDURE sp_ObtenerParametros
AS
BEGIN
    SELECT
        p.ParametroID, p.NombreParametro, p.UnidadMedida
    FROM
        Parametros p;
END
GO


--USUARIOS
-- 15. Procedimiento para buscar usuario por su nombre (para gestión)
CREATE PROCEDURE sp_BuscarUsuarioPorNombre
    @NombreUsuario_Filtro VARCHAR(100)
AS
BEGIN
    SELECT
        u.UsuarioID, u.NombreUsuario, u.Correo, r.NombreRol, u.Activo
    FROM
        Usuarios u
    INNER JOIN Roles r ON u.RolID = r.RolID
    WHERE
        u.NombreUsuario LIKE '%' + @NombreUsuario_Filtro + '%';
END
GO

CREATE PROCEDURE sp_VerificarUsuarioOCorreo
  @NombreUsuario VARCHAR(100),
  @Correo VARCHAR(150)
AS
BEGIN
  SET NOCOUNT ON;

  SELECT
    CASE
      WHEN EXISTS (SELECT 1 FROM Usuarios WHERE NombreUsuario = @NombreUsuario) THEN 'usuario'
      WHEN EXISTS (SELECT 1 FROM Usuarios WHERE Correo = @Correo) THEN 'correo'
      ELSE NULL
    END AS Conflicto;
END;



CREATE PROCEDURE sp_ObtenerUsuarios
    @UsuarioID INT = NULL,
    @NombreUsuario VARCHAR(100) = NULL,
    @RolID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        u.UsuarioID,
        u.NombreUsuario,
        u.Correo,
        u.Activo,
        -- Convertimos BIT → texto
        CASE 
            WHEN u.Activo = 1 THEN 'Activo'
            ELSE 'Inactivo'
        END AS EstadoUsuario,

        r.RolID,
        r.NombreRol
    FROM Usuarios u
    INNER JOIN Roles r ON u.RolID = r.RolID
    WHERE 
        (@UsuarioID IS NULL OR u.UsuarioID = @UsuarioID)
        AND (@NombreUsuario IS NULL OR u.NombreUsuario LIKE '%' + @NombreUsuario + '%')
        AND (@RolID IS NULL OR r.RolID = @RolID)
    ORDER BY u.UsuarioID;
END;
GO


CREATE PROCEDURE sp_ActualizarUsuario
    @UsuarioID INT,
    @RolID INT,
    @ContrasenaHash VARCHAR(255) = NULL, -- Puede venir NULL si no se actualiza
    @Activo BIT
AS
BEGIN
    SET NOCOUNT ON;

    -- Validar que el usuario exista
    IF NOT EXISTS (SELECT 1 FROM Usuarios WHERE UsuarioID = @UsuarioID)
    BEGIN
        RAISERROR('El usuario no existe.', 16, 1);
        RETURN;
    END

    -- Actualizar datos
    UPDATE Usuarios
    SET 
        RolID = @RolID,
        Activo = @Activo,
        ContrasenaHash = COALESCE(@ContrasenaHash, ContrasenaHash) -- Solo si viene
    WHERE UsuarioID = @UsuarioID;

    SELECT * FROM Usuarios WHERE UsuarioID = @UsuarioID;
END
GO



-- 16. Procedimiento para insertar un Usuario (solo para administradores)
CREATE PROCEDURE sp_InsertarUsuario
    @RolID INT,
    @NombreUsuario VARCHAR(100),
    @ContrasenaHash VARCHAR(255),
    @Correo VARCHAR(150),
    @Activo BIT = 1
AS
BEGIN
    INSERT INTO Usuarios (RolID, NombreUsuario, ContrasenaHash, Correo, Activo)
    VALUES (@RolID, @NombreUsuario, @ContrasenaHash, @Correo, @Activo);
    SELECT SCOPE_IDENTITY() AS NuevoUsuarioID;
END
GO

-- 17. Procedimiento para buscar un usuario para autenticación (devuelve hash y nombre)
CREATE PROCEDURE sp_AutenticarUsuario
    @NombreUsuario VARCHAR(100)
AS
BEGIN
    SELECT 
        U.UsuarioID,
        U.NombreUsuario,
        U.Correo,
        U.ContrasenaHash,
        U.Activo,

        R.RolID,
        R.NombreRol,
        R.NivelPermiso   -- ⬅️ Nuevo campo para seguridad basada en permisos

    FROM Usuarios U
    INNER JOIN Roles R ON U.RolID = R.RolID
    WHERE U.NombreUsuario = @NombreUsuario;
END
GO

--SENSORES

-- 3. Procedimiento para obtener información de todos los sensores con filtro

CREATE PROCEDURE sp_ObtenerSensores
    @EstadoOperativo_Filtro BIT = NULL, -- NULL para todos
    @SensorID INT = NULL               -- NULL para todos
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        SensorID,
        Nombre,
        Modelo,
        Fabricante,
        Latitud,
        Longitud,
        Descripcion,
        EstadoOperativo,
        CASE 
            WHEN EstadoOperativo = 1 THEN 'Activo'
            ELSE 'Inactivo'
        END AS EstadoOperativoTexto
    FROM Sensores
    WHERE
        (@EstadoOperativo_Filtro IS NULL OR EstadoOperativo = @EstadoOperativo_Filtro)
        AND (@SensorID IS NULL OR SensorID = @SensorID);
END;
GO


-- 5. Procedimiento para obtener info de un sensor por el ID
CREATE PROCEDURE sp_ObtenerSensorPorID
    @SensorID INT
AS
BEGIN
    SELECT
        SensorID, Nombre, Modelo, Fabricante, Latitud, Longitud, Descripcion, EstadoOperativo
    FROM
        Sensores
    WHERE
        SensorID = @SensorID;
END
GO

-- 4. Procedimiento para insertar un nuevo sensor
CREATE OR ALTER  PROCEDURE sp_InsertarSensor
    @Nombre VARCHAR(100),
    @Modelo VARCHAR(50),
    @Fabricante VARCHAR(100),
    @Latitud DECIMAL(9,6),
    @Longitud DECIMAL(9,6),
    @Descripcion VARCHAR(255) = NULL
AS
BEGIN
    INSERT INTO Sensores (Nombre, Modelo, Fabricante, Latitud, Longitud, Descripcion, EstadoOperativo)
    VALUES (@Nombre, @Modelo, @Fabricante, @Latitud, @Longitud, @Descripcion, 1);
    SELECT SCOPE_IDENTITY() AS NuevoSensorID;
END
GO



-- 6. Procedimiento para actualizar info de un sensor existente a través del ID
CREATE PROCEDURE sp_ActualizarSensor
    @SensorID INT,

    @Nombre VARCHAR(100) = NULL,
    @Modelo VARCHAR(50) = NULL,
    @Fabricante VARCHAR(100) = NULL,
    @Latitud DECIMAL(9,6) = NULL,
    @Longitud DECIMAL(9,6) = NULL,
    @Descripcion VARCHAR(255) = NULL,
    @EstadoOperativo BIT = NULL
AS
BEGIN
    UPDATE Sensores
    SET
        Nombre = COALESCE(@Nombre, Nombre),
        Modelo = COALESCE(@Modelo, Modelo),
        Fabricante = COALESCE(@Fabricante, Fabricante),
        Latitud = COALESCE(@Latitud, Latitud),
        Longitud = COALESCE(@Longitud, Longitud),
        Descripcion = COALESCE(@Descripcion, Descripcion),
        EstadoOperativo = COALESCE(@EstadoOperativo, EstadoOperativo)
    WHERE SensorID = @SensorID;
END
GO


-- 7. Procedimiento para eliminar un sensor a través del ID (Incluye eliminación en cascada de datos dependientes)
CREATE PROCEDURE sp_EliminarSensor
    @SensorID INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    
    -- Eliminación de registros dependientes para mantener la integridad referencial
    
    -- 1. Eliminar registros de AlertasUsuarios, RegistroAlertas y Anomalias que dependen de DatosSensores
    -- (Es un proceso complejo que requeriría múltiples DELETEs o CASCADEs configurados a nivel de tabla. 
    -- Para este script, asumiremos la eliminación manual de los dependientes directos e indirectos, comenzando por el nivel más bajo).

    DELETE au 
    FROM AlertasUsuarios au 
    JOIN RegistroAlertas ra ON au.RegistroAlertaID = ra.RegistroAlertaID
    JOIN DatosSensores ds ON ra.LecturaID = ds.DatoID
    WHERE ds.SensorID = @SensorID;

    DELETE ra FROM RegistroAlertas ra JOIN DatosSensores ds ON ra.LecturaID = ds.DatoID WHERE ds.SensorID = @SensorID;
    DELETE FROM Anomalias WHERE DatoID IN (SELECT DatoID FROM DatosSensores WHERE SensorID = @SensorID);

    -- 2. Eliminar Predicciones y DatosSensores
    DELETE FROM Predicciones WHERE SensorID = @SensorID;
    DELETE FROM DatosSensores WHERE SensorID = @SensorID;

    -- 3. Eliminar el Sensor
    DELETE FROM Sensores WHERE SensorID = @SensorID;
    
    IF @@ERROR = 0
        COMMIT TRANSACTION;
    ELSE
    BEGIN
        ROLLBACK TRANSACTION;
        RAISERROR('Error al eliminar el sensor o sus datos dependientes.', 16, 1);
    END
END
GO






--ROLES


CREATE PROCEDURE sp_ObtenerRolesRegistroAdministrativo
    @RolID INT = NULL
AS
BEGIN
    IF @RolID IS NULL
        SELECT RolID, NombreRol, EsInterno, NivelPermiso
        FROM Roles;
    ELSE
        SELECT RolID, NombreRol, EsInterno, NivelPermiso
        FROM Roles
        WHERE RolID = @RolID;
END
GO




CREATE PROCEDURE sp_ObtenerRolesRegistroUsuario
    @RolID INT = NULL
AS
BEGIN
    IF @RolID IS NULL
        SELECT RolID, NombreRol, EsInterno, NivelPermiso
        FROM Roles
        WHERE EsInterno = 0;
    ELSE
        SELECT RolID, NombreRol, EsInterno, NivelPermiso
        FROM Roles
        WHERE RolID = @RolID AND EsInterno = 0;
END


GO

CREATE PROCEDURE sp_InsertarRol
    @NombreRol      VARCHAR(50),
    @EsInterno      BIT       = 0,
    @NivelPermiso   INT       = 1
AS
BEGIN
    SET NOCOUNT ON;

    -- Validar nombre repetido
    IF EXISTS (SELECT 1 FROM Roles WHERE NombreRol = @NombreRol)
    BEGIN
        RAISERROR('El nombre del rol ya existe.', 16, 1);
        RETURN;
    END

    INSERT INTO Roles (NombreRol, EsInterno, NivelPermiso)
    VALUES (@NombreRol, @EsInterno, @NivelPermiso);

    SELECT SCOPE_IDENTITY() AS NuevoRolID;
END
GO

CREATE PROCEDURE sp_ModificarRol
    @RolID          INT,
    @NombreRol      VARCHAR(50) = NULL,
    @EsInterno      BIT         = NULL,
    @NivelPermiso   INT         = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- Validar que el rol exista
    IF NOT EXISTS (SELECT 1 FROM Roles WHERE RolID = @RolID)
    BEGIN
        RAISERROR('El RolID no existe.', 16, 1);
        RETURN;
    END

    -- Validar nombre repetido (si se desea actualizar)
    IF @NombreRol IS NOT NULL AND EXISTS (
        SELECT 1
        FROM Roles
        WHERE NombreRol = @NombreRol AND RolID <> @RolID
    )
    BEGIN
        RAISERROR('El nombre del rol ya está en uso.', 16, 1);
        RETURN;
    END

    UPDATE Roles
    SET 
        NombreRol    = ISNULL(@NombreRol, NombreRol),
        EsInterno    = ISNULL(@EsInterno, EsInterno),
        NivelPermiso = ISNULL(@NivelPermiso, NivelPermiso)
    WHERE RolID = @RolID;

    SELECT 'OK' AS Resultado;
END
GO


-- ALERTAS UMBRALES 


-- DROP y CREATE: sp_InsertarDatoCrudo_ConContexto (ahora devuelve la fila completa desde la view)
IF OBJECT_ID('sp_InsertarDatoCrudo_ConContexto') IS NOT NULL
  DROP PROCEDURE sp_InsertarDatoCrudo_ConContexto;
GO

CREATE PROCEDURE sp_InsertarDatoCrudo_ConContexto
  @SensorID INT,
  @ParametroID INT,
  @TimestampEnvio DATETIME2 = NULL,
  @Valor_original DECIMAL(10,4),
  @HistCount INT = 10
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRAN;

  INSERT INTO DatosSensores (SensorID, ParametroID, TimestampRegistro, TimestampEnvio, Valor_original, Estado)
  VALUES (@SensorID, @ParametroID, SYSDATETIME(), ISNULL(@TimestampEnvio, SYSDATETIME()), @Valor_original, 'crudo');

  DECLARE @datoId BIGINT = SCOPE_IDENTITY();

  -- 1) Devuelve la fila completa desde la vista (igual que sp_InsertarDatosSensor)
  SELECT *
  FROM vw_DatosSensores_Detalle
  WHERE DatoID = @datoId;

  -- 2) Umbrales del parámetro (segundo recordset)
  SELECT UmbralID, ParametroID, ValorCritico, TipoUmbral, MensajeAlerta
  FROM UmbralesAlerta
  WHERE ParametroID = @ParametroID;

  -- 3) Historial reciente procesado del mismo sensor+parametro (tercer recordset)
  SELECT TOP (@HistCount) DatoID, Valor_procesado
  FROM DatosSensores
  WHERE SensorID = @SensorID AND ParametroID = @ParametroID AND Estado = 'procesado'
  ORDER BY DatoID DESC;

  COMMIT TRAN;
END
GO

-- DROP y CREATE: sp_ActualizarDatoProcesado (ahora devuelve la fila completa desde la view actualizada)
IF OBJECT_ID('sp_ActualizarDatoProcesado') IS NOT NULL
  DROP PROCEDURE sp_ActualizarDatoProcesado;
GO

CREATE PROCEDURE sp_ActualizarDatoProcesado
  @DatoID BIGINT,
  @Valor_procesado DECIMAL(10,4),
  @Valor_normalizado DECIMAL(10,4),
  @Estado VARCHAR(20) -- 'procesado' o 'descartado'
AS
BEGIN
  SET NOCOUNT ON;

  UPDATE DatosSensores
  SET Valor_procesado = @Valor_procesado,
      Valor_normalizado = @Valor_normalizado,
      Estado = @Estado
  WHERE DatoID = @DatoID;

  -- Devuelve la fila actualizada completa desde la vista
  SELECT *
  FROM vw_DatosSensores_Detalle
  WHERE DatoID = @DatoID;
END
GO



-- SP: obtener alertas pendientes para un usuario (pendientes en AlertasUsuarios)
IF OBJECT_ID('sp_ObtenerAlertasPendientesPorUsuario') IS NOT NULL
  DROP PROCEDURE sp_ObtenerAlertasPendientesPorUsuario;
GO

CREATE PROCEDURE sp_ObtenerAlertasPendientesPorUsuario
  @UsuarioID INT
AS
BEGIN
  SET NOCOUNT ON;

  SELECT 
    AU.AlertaUsuarioID,
    AU.RegistroAlertaID,
    AU.UsuarioID,
    AU.FechaEnvio,
    AU.FechaRevisión,
    AU.EstadoAlerta,

    RA.UmbralID,
    RA.DatoID AS Registro_DatoID,
    RA.FechaHoraAlerta,
    RA.EstadoNotificacion,

    DS.DatoID,
    DS.SensorID,
    DS.ParametroID,
    DS.TimestampRegistro,
    DS.TimestampEnvio,
    DS.Valor_original,
    DS.Valor_procesado,
    DS.Valor_normalizado,

    S.Nombre AS NombreSensor,
    S.Descripcion AS SensorDescripcion,
    P.NombreParametro,
    P.UnidadMedida

  FROM AlertasUsuarios AU
  INNER JOIN RegistroAlertas RA ON AU.RegistroAlertaID = RA.RegistroAlertaID
  LEFT JOIN DatosSensores DS ON RA.DatoID = DS.DatoID
  LEFT JOIN Sensores S ON DS.SensorID = S.SensorID
  LEFT JOIN Parametros P ON DS.ParametroID = P.ParametroID
  WHERE AU.UsuarioID = @UsuarioID
    AND AU.EstadoAlerta = 'Pendiente'
  ORDER BY AU.FechaEnvio DESC;
END
GO





-- 4) sp_InsertarRegistroAlerta
IF OBJECT_ID('sp_InsertarRegistroAlerta') IS NOT NULL DROP PROCEDURE sp_InsertarRegistroAlerta;
GO
CREATE PROCEDURE sp_InsertarRegistroAlerta
  @UmbralID INT = NULL,
  @DatoID BIGINT,
  @EstadoNotificacion VARCHAR(50) = 'Pendiente'
AS
BEGIN
  SET NOCOUNT ON;
  INSERT INTO RegistroAlertas (UmbralID, DatoID, FechaHoraAlerta, EstadoNotificacion)
  VALUES (@UmbralID, @DatoID, SYSDATETIME(), @EstadoNotificacion);

  SELECT SCOPE_IDENTITY() AS RegistroAlertaID;
END
GO

-- 5) sp_InsertarAnomalia
IF OBJECT_ID('sp_InsertarAnomalia') IS NOT NULL DROP PROCEDURE sp_InsertarAnomalia;
GO
CREATE PROCEDURE sp_InsertarAnomalia
  @DatoID BIGINT,
  @Tipo VARCHAR(50),
  @Descripcion VARCHAR(255)
AS
BEGIN
  SET NOCOUNT ON;
  INSERT INTO Anomalias (DatoID, Tipo, Descripcion, Fecha_Detectada, Estado)
  VALUES (@DatoID, @Tipo, @Descripcion, SYSDATETIME(), 1);

  SELECT SCOPE_IDENTITY() AS AnomaliaID;
END
GO

-- 6) sp_CrearAlertasUsuariosParaNiveles (inserta en batch y OUTPUTs AlertaUsuarioID+UsuarioID)
IF OBJECT_ID('sp_CrearAlertasUsuariosParaNiveles') IS NOT NULL DROP PROCEDURE sp_CrearAlertasUsuariosParaNiveles;
GO
CREATE PROCEDURE sp_CrearAlertasUsuariosParaNiveles
  @RegistroAlertaID BIGINT,
  @NivelesCSV VARCHAR(100) -- ejemplo '2,3,4'
AS
BEGIN
  SET NOCOUNT ON;

  ;WITH Niveles AS (
    SELECT TRY_CAST(value AS INT) as Nivel
    FROM STRING_SPLIT(@NivelesCSV, ',')
    WHERE TRY_CAST(value AS INT) IS NOT NULL
  )
  INSERT INTO AlertasUsuarios (RegistroAlertaID, UsuarioID, FechaEnvio, EstadoAlerta)
  OUTPUT inserted.AlertaUsuarioID, inserted.UsuarioID
  SELECT @RegistroAlertaID, U.UsuarioID, SYSDATETIME(), 'Pendiente'
  FROM Usuarios U
  INNER JOIN Roles R ON U.RolID = R.RolID
  INNER JOIN Niveles N ON N.Nivel = R.NivelPermiso
  WHERE U.Activo = 1;
END
GO

-- 7) sp_ObtenerDatoPorID
IF OBJECT_ID('sp_ObtenerDatoPorID') IS NOT NULL DROP PROCEDURE sp_ObtenerDatoPorID;
GO
CREATE PROCEDURE sp_ObtenerDatoPorID
  @DatoID BIGINT
AS
BEGIN
  SET NOCOUNT ON;
  SELECT DS.DatoID, DS.SensorID, DS.ParametroID, DS.TimestampRegistro, DS.TimestampEnvio,
         DS.Valor_original, DS.Valor_procesado, DS.Valor_normalizado, DS.Estado,
         P.NombreParametro, P.UnidadMedida, S.Nombre as NombreSensor
  FROM DatosSensores DS
  LEFT JOIN Parametros P ON DS.ParametroID = P.ParametroID
  LEFT JOIN Sensores S ON DS.SensorID = S.SensorID
  WHERE DS.DatoID = @DatoID;
END
GO

-- 8) sp_IncrementarEstadoSensor (incrementa contador de anomalias y devuelve estado)
IF OBJECT_ID('sp_IncrementarEstadoSensor') IS NOT NULL DROP PROCEDURE sp_IncrementarEstadoSensor;
GO
CREATE PROCEDURE sp_IncrementarEstadoSensor
  @SensorID INT,
  @ParametroID INT,
  @Threshold INT = 3
AS
BEGIN
  SET NOCOUNT ON;
  DECLARE @now DATETIME2 = SYSDATETIME();

  IF EXISTS (SELECT 1 FROM SensorEstados WHERE SensorID = @SensorID AND ParametroID = @ParametroID)
  BEGIN
    UPDATE SensorEstados
    SET ConsecutivasAnomalias = ConsecutivasAnomalias + 1,
        UltimaAnomalia = @now,
        EstadoSensor = CASE WHEN ConsecutivasAnomalias + 1 >= @Threshold THEN 'DANADO' ELSE 'POSIBLE_DANADO' END
    WHERE SensorID = @SensorID AND ParametroID = @ParametroID;
  END
  ELSE
  BEGIN
    INSERT INTO SensorEstados (SensorID, ParametroID, ConsecutivasAnomalias, UltimaAnomalia, EstadoSensor)
    VALUES (@SensorID, @ParametroID, 1, @now, CASE WHEN 1 >= @Threshold THEN 'DANADO' ELSE 'POSIBLE_DANADO' END);
  END

  SELECT SensorID, ParametroID, ConsecutivasAnomalias, UltimaAnomalia, EstadoSensor
  FROM SensorEstados
  WHERE SensorID = @SensorID AND ParametroID = @ParametroID;
END
GO

-- 9) sp_ResetEstadoSensor (cuando llega lectura normal)
IF OBJECT_ID('sp_ResetEstadoSensor') IS NOT NULL DROP PROCEDURE sp_ResetEstadoSensor;
GO
CREATE PROCEDURE sp_ResetEstadoSensor
  @SensorID INT,
  @ParametroID INT
AS
BEGIN
  SET NOCOUNT ON;
  IF EXISTS (SELECT 1 FROM SensorEstados WHERE SensorID = @SensorID AND ParametroID = @ParametroID)
  BEGIN
    UPDATE SensorEstados
    SET ConsecutivasAnomalias = 0, EstadoSensor = 'NORMAL', UltimaAnomalia = NULL
    WHERE SensorID = @SensorID AND ParametroID = @ParametroID;
  END
  ELSE
  BEGIN
    INSERT INTO SensorEstados (SensorID, ParametroID, ConsecutivasAnomalias, EstadoSensor)
    VALUES (@SensorID, @ParametroID, 0, 'NORMAL');
  END

  SELECT SensorID, ParametroID, ConsecutivasAnomalias, UltimaAnomalia, EstadoSensor
  FROM SensorEstados
  WHERE SensorID = @SensorID AND ParametroID = @ParametroID;
END
GO
