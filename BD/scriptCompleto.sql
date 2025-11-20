    -- ==============================================================================
    -- SCRIPT DE CREACIÓN DE BASE DE DATOS PARA EL PROYECTO ANA - JUNÍN
    -- Base de Datos: MonitoreoAguaJunin
    -- Motor: Microsoft SQL Server
    -- ==============================================================================
USE master;
GO

IF EXISTS (SELECT name FROM sys.databases WHERE name = N'MonitoreoAguaJunin')
BEGIN
    ALTER DATABASE [MonitoreoAguaJunin] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE [MonitoreoAguaJunin];
    PRINT '✅ Base de datos "MonitoreoAguaJunin" eliminada correctamente.';
END
ELSE
BEGIN
    PRINT 'ℹ️ La base de datos "MonitoreoAguaJunin" no existe.';
END

GO

    -- 1. Crear la Base de Datos (Si no existe)
    IF NOT EXISTS (SELECT name FROM master.dbo.sysdatabases WHERE name = N'MonitoreoAguaJunin')
    BEGIN
        CREATE DATABASE MonitoreoAguaJunin;
    END
    GO

    USE MonitoreoAguaJunin;
    GO

    -- ==============================================================================
    -- 2. CREACIÓN DE TABLAS DE SEGURIDAD Y METADATOS
    -- ==============================================================================

    -- 2.1. TABLA ROLES
    CREATE TABLE Roles (
        RolID INT PRIMARY KEY IDENTITY(1,1),
        NombreRol VARCHAR(50) NOT NULL UNIQUE,
        EsInterno BIT NOT NULL DEFAULT 0, -- TRUE=Interno, FALSE=Externo
        NivelPermiso INT NOT NULL DEFAULT 1 -- (1,2,3,4)
    );


    -- 2.2. TABLA USUARIOS (HU011 - Acceso Seguro)
    CREATE TABLE Usuarios (
        UsuarioID INT PRIMARY KEY IDENTITY(1,1),
        RolID INT NOT NULL FOREIGN KEY REFERENCES Roles(RolID),
        NombreUsuario VARCHAR(100) NOT NULL UNIQUE,
        Correo VARCHAR(150) NOT NULL UNIQUE, -- Nuevo campo: correo electrónico único
        ContrasenaHash VARCHAR(255) NOT NULL, -- Almacenamiento hasheado (HU023)
        Activo BIT NOT NULL DEFAULT 1 -- 1=Activo, 0=Inactivo
    );

    -- 2.3. TABLA PARAMETROS
    -- para que es esto?
    --ponme un ejemplo de datos


    CREATE TABLE Parametros (
        ParametroID INT PRIMARY KEY IDENTITY(1,1),
        NombreParametro VARCHAR(50) NOT NULL UNIQUE,
        UnidadMedida VARCHAR(10) NOT NULL
    );

    -- ==============================================================================
    -- 3. CREACIÓN DE TABLAS DE MONITOREO Y DATOS
    -- ==============================================================================

    -- 3.1. TABLA SENSORES (Modificada)
    CREATE TABLE Sensores (
        SensorID INT PRIMARY KEY IDENTITY(1,1),
        Nombre VARCHAR(100) NOT NULL,
        Modelo VARCHAR(50) NOT NULL,
        Fabricante VARCHAR(100) NOT NULL,
        Latitud DECIMAL(9,6) NOT NULL,
        Longitud DECIMAL(9,6) NOT NULL,
        Descripcion VARCHAR(255),
        EstadoOperativo BIT NOT NULL DEFAULT 1 -- 1=Activo, 0=Inactivo/Error (Booleano)
    );

    GO

    -- 3.2. TABLA DATOSSENSORES (Modificada de Lecturas - HU003, HU002)
    CREATE TABLE DatosSensores (
        DatoID BIGINT PRIMARY KEY IDENTITY(1,1),
        SensorID INT NOT NULL FOREIGN KEY REFERENCES Sensores(SensorID),
        ParametroID INT NOT NULL FOREIGN KEY REFERENCES Parametros(ParametroID),
        TimestampRegistro DATETIME2 NOT NULL, -- Momento en que se tomó o recibió (Metadato Crítico)
        TimestampEnvio DATETIME2 NOT NULL, -- Momento en que se envió el dato

        Valor_original DECIMAL(10,4),
        Valor_procesado DECIMAL(10,4),
        Valor_normalizado DECIMAL(10,4), -- Para el Motor de IA
        
        -- Simulación de ENUM con VARCHAR y restricción CHECK
        Estado VARCHAR(20) NOT NULL DEFAULT 'crudo' 
            CHECK (Estado IN ('crudo', 'procesado', 'descartado')),
        
    );


    -- ==============================================================================
    -- 4. CREACIÓN DE TABLAS DE ALERTA Y PREDICCIÓN
    -- ==============================================================================

    -- 4.1. TABLA UMBRALESALERTA (HU010 - Configuración de Alertas)
    CREATE TABLE UmbralesAlerta (
        UmbralID INT PRIMARY KEY IDENTITY(1,1),
        ParametroID INT NOT NULL FOREIGN KEY REFERENCES Parametros(ParametroID),
        ValorCritico DECIMAL(10,4) NOT NULL, -- Valor que dispara la alerta
        TipoUmbral VARCHAR(10) NOT NULL CHECK (TipoUmbral IN ('MAXIMO', 'MINIMO')), -- Tipo de umbral
        MensajeAlerta VARCHAR(255)
    );

 CREATE TABLE Anomalias(
        AnomaliaID BIGINT PRIMARY KEY IDENTITY(1,1),
        DatoID BIGINT NOT NULL FOREIGN KEY REFERENCES DatosSensores(DatoID),
        Tipo VARCHAR(50) NOT NULL,
        Descripcion VARCHAR(255),
        Fecha_Detectada DATETIME2 NOT NULL,
        Estado BIT NOT NULL DEFAULT 1
    );
    -- 4.2. TABLA REGISTROALERTAS (HU010, HU014 - Trazabilidad de Alertas)
    CREATE TABLE RegistroAlertas (
        RegistroAlertaID BIGINT PRIMARY KEY IDENTITY(1,1),
        UmbralID INT NULL FOREIGN KEY REFERENCES UmbralesAlerta(UmbralID),
        AnomaliaID BIGINT NULL FOREIGN KEY REFERENCES Anomalias(AnomaliaID),
        DatoID BIGINT NOT NULL FOREIGN KEY REFERENCES DatosSensores(DatoID), -- Dato que causó la alerta
        FechaHoraAlerta DATETIME2 NOT NULL,
        EstadoNotificacion VARCHAR(50) NOT NULL, -- Ej: 'Pendiente', 'Enviado', 'Error'
        Tipo VARCHAR(20) NULL, -- UMBRAL, ANOMALIA, CONTAMINACION_CRITICA
        Contexto VARCHAR(500) NULL -- Información contextual sobre la alerta
    );

    CREATE TABLE AlertasUsuarios (
        AlertaUsuarioID BIGINT PRIMARY KEY IDENTITY(1,1),
        RegistroAlertaID BIGINT NOT NULL FOREIGN KEY REFERENCES RegistroAlertas(RegistroAlertaID),
        UsuarioID INT NOT NULL FOREIGN KEY REFERENCES Usuarios(UsuarioID),
        FechaEnvio DATETIME2 NOT NULL,
        FechaRevisión DATETIME2 NULL,
        EstadoAlerta VARCHAR(50) NOT NULL -- Ej: 'Pendiente', 'Revisada', 'Atendida'
    );

    


    -- 4.3. TABLA PREDICCIONES (HU004, HU006 - Resultados de IA)
    CREATE TABLE Predicciones (
        PrediccionID BIGINT PRIMARY KEY IDENTITY(1,1),
        SensorID INT NOT NULL FOREIGN KEY REFERENCES Sensores(SensorID),
        FechaHoraPrediccion DATETIME2 NOT NULL, -- Momento futuro de la predicción
        ValorPredicho VARCHAR(50), -- Ej: 'BUENO', 'MALO'
        ProbabilidadRiesgo DECIMAL(5,2) -- Probabilidad asociada al riesgo (0.00 a 100.00)
    );

   
    -- ==============================================================================
    -- 5. INSERCIÓN DE DATOS INICIALES (Mínimo para roles y parámetros)
    -- ==============================================================================

    -- Roles (HU011)
    INSERT INTO Roles (NombreRol, EsInterno, NivelPermiso) VALUES ('Gestor ANA', 1, 4);
    INSERT INTO Roles (NombreRol, EsInterno, NivelPermiso) VALUES ('Investigador', 0, 3);
    INSERT INTO Roles (NombreRol, EsInterno, NivelPermiso) VALUES ('Público General', 0, 2);
    -- Parámetros (RF1.1)
    INSERT INTO Parametros (NombreParametro, UnidadMedida) VALUES ('pH', 'Unidad');
    INSERT INTO Parametros (NombreParametro, UnidadMedida) VALUES ('Turbidez', 'NTU');
    INSERT INTO Parametros (NombreParametro, UnidadMedida) VALUES ('Oxígeno Disuelto', 'mg/L');
    INSERT INTO Parametros (NombreParametro, UnidadMedida) VALUES ('Conductividad', 'µS/cm');
    INSERT INTO Parametros (NombreParametro, UnidadMedida) VALUES ('Temperatura', '°C');

    -- Ejemplos de sensores (cada sensor está asociado a un ParametroID)
    -- Nota: ParametroID: 1=pH, 2=Turbidez, 3=Oxígeno Disuelto, 4=Conductividad, 5=Temperatura
    INSERT INTO Sensores (Nombre, Modelo, Fabricante, Latitud, Longitud, Descripcion, EstadoOperativo)
    VALUES
    ('Sensor 1 - Río Mantaro',  'SEN-PH-100', 'Acme Sensors', -12.055690, -75.239195, 'Sensor en Puente Los Angeles', 1),
    ('Sensor 2 - Río Mantaro', 'SEN-TMP-200', 'Acme Sensors', -12.081649, -75.235253, 'Sensor en Puente Max Hongler (Comuneros)', 1),
    ('Sensor 1 - Río Shullcas', 'SEN-TURB-10', 'WaterTech', -12.047401, -75.200818, 'Sensor en puente en la Avenida San Agustin', 1);

    GO


-- Insertando Usuarios
INSERT INTO Usuarios (RolID, NombreUsuario, Correo, ContrasenaHash, Activo) VALUES(1, 'admin', 'raivellorenzo.valiente@gmail.com', '$2a$10$veZ8cibHpGfDLgmEAinXcu6gQDOg.5iU3B4C/DFfx4jm8dnuxsLEC', 1)

GO

-- Insertar umbrales por defecto (ejecuta una sola vez)
INSERT INTO UmbralesAlerta (ParametroID, ValorCritico, TipoUmbral, MensajeAlerta)
VALUES 
    (1, 6.5, 'MINIMO', 'pH por debajo del límite seguro'),
    (1, 8.5, 'MAXIMO', 'pH por encima del límite seguro'),
    (2, 5.0, 'MAXIMO', 'Turbidez elevada detectada'),
    (3, 5.0, 'MINIMO', 'Oxígeno disuelto bajo'),
    (4, 2000, 'MAXIMO', 'Conductividad alta'),
    (5, 30, 'MAXIMO', 'Temperatura elevada');
GO


USE master;
GO

-- 🔹 1. Eliminar el login si ya existe
IF EXISTS (SELECT 1 FROM sys.server_principals WHERE name = N'app_backend_user')
BEGIN
    DROP LOGIN app_backend_user;
    PRINT 'Login existente eliminado.';
END
GO

-- 🔹 2. Crear el login
CREATE LOGIN app_backend_user WITH PASSWORD = 'back3nd*user';
PRINT 'Login creado correctamente.';
GO

-- 🔹 3. Cambiar a la base de datos destino
USE MonitoreoAguaJunin;
GO

-- 🔹 4. Eliminar el usuario si ya existe
IF EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'app_backend_user')
BEGIN
    DROP USER app_backend_user;
    PRINT 'Usuario existente eliminado.';
END
GO

-- 🔹 5. Crear el usuario en la base de datos
CREATE USER app_backend_user FOR LOGIN app_backend_user;
PRINT 'Usuario creado correctamente.';
GO

-- 🔹 6. Dar permiso de ejecución de procedimientos almacenados
GRANT EXECUTE TO app_backend_user;
PRINT 'Permisos de ejecución otorgados.';
GO


DROP PROCEDURE IF EXISTS dbo.sp_TestConexion;
GO
-- Procedimiento de prueba de conexión
CREATE PROCEDURE sp_TestConexion
AS
BEGIN
  PRINT 'Conexión exitosa';
END;
GO


USE MonitoreoAguaJunin;
GO

-- Procedimientos
DROP PROCEDURE IF EXISTS dbo.sp_ObtenerPredicciones;
DROP PROCEDURE IF EXISTS dbo.sp_ObtenerPrediccionPorID;
DROP PROCEDURE IF EXISTS dbo.sp_ObtenerUltimasPredicciones;
DROP PROCEDURE IF EXISTS dbo.sp_InsertarPrediccion;
DROP PROCEDURE IF EXISTS dbo.sp_InsertarDatosSensor;
DROP PROCEDURE IF EXISTS dbo.sp_ObtenerDatosSensores;
DROP PROCEDURE IF EXISTS dbo.sp_ObtenerUltimoDatoSensores;
DROP PROCEDURE IF EXISTS dbo.sp_ObtenerParametros;
DROP PROCEDURE IF EXISTS dbo.sp_BuscarUsuarioPorNombre;
DROP PROCEDURE IF EXISTS dbo.sp_VerificarUsuarioOCorreo;
DROP PROCEDURE IF EXISTS dbo.sp_ObtenerUsuarios;
DROP PROCEDURE IF EXISTS dbo.sp_ActualizarUsuario;
DROP PROCEDURE IF EXISTS dbo.sp_InsertarUsuario;
DROP PROCEDURE IF EXISTS dbo.sp_AutenticarUsuario;
DROP PROCEDURE IF EXISTS dbo.sp_ObtenerSensores;
DROP PROCEDURE IF EXISTS dbo.sp_ObtenerSensorPorID;
DROP PROCEDURE IF EXISTS dbo.sp_InsertarSensor;
DROP PROCEDURE IF EXISTS dbo.sp_ActualizarSensor;
DROP PROCEDURE IF EXISTS dbo.sp_EliminarSensor;
DROP PROCEDURE IF EXISTS dbo.sp_ObtenerRolesRegistroAdministrativo;
DROP PROCEDURE IF EXISTS dbo.sp_ObtenerRolesRegistroUsuario;
DROP PROCEDURE IF EXISTS dbo.sp_InsertarRol;
DROP PROCEDURE IF EXISTS dbo.sp_ModificarRol;
GO

-- Vistas
DROP VIEW IF EXISTS dbo.vw_DatosSensores_Detalle;
GO

-- --PREDICCIONES y ANOMALIAS

-- -- 8. Procedimiento para obtener todas las predicciones con filtro
-- CREATE PROCEDURE sp_ObtenerPredicciones
--     @SensorID_Filtro INT = NULL,
--     @FechaInicio DATETIME2 = NULL,
--     @FechaFin DATETIME2 = NULL
-- AS
-- BEGIN
--     SELECT
--         p.PrediccionID, s.Nombre AS Sensor, p.FechaHoraPrediccion, p.ModeloUsado, p.ValorPredicho, p.ProbabilidadRiesgo
--     FROM
--         Predicciones p
--     INNER JOIN Sensores s ON p.SensorID = s.SensorID
--     WHERE
--         (@SensorID_Filtro IS NULL OR p.SensorID = @SensorID_Filtro)
--         AND (@FechaInicio IS NULL OR p.FechaHoraPrediccion >= @FechaInicio)
--         AND (@FechaFin IS NULL OR p.FechaHoraPrediccion <= @FechaFin);
-- END
-- GO

-- -- 9. Procedimiento para obtener una predicción en específico por id
-- CREATE PROCEDURE sp_ObtenerPrediccionPorID
--     @PrediccionID BIGINT
-- AS
-- BEGIN
--     SELECT
--         p.PrediccionID, s.Nombre AS Sensor, p.FechaHoraPrediccion, p.ModeloUsado, p.ValorPredicho, p.ProbabilidadRiesgo
--     FROM
--         Predicciones p
--     INNER JOIN Sensores s ON p.SensorID = s.SensorID
--     WHERE
--         p.PrediccionID = @PrediccionID;
-- END
-- GO

-- -- 10. Procedimiento para obtener ultimas predicciones (una por sensor)
-- CREATE PROCEDURE sp_ObtenerUltimasPredicciones
-- AS
-- BEGIN
--     -- Utiliza una CTE para encontrar el ID de la última predicción de cada sensor
--     WITH UltimasPredicciones AS (
--         SELECT
--             PrediccionID,
--             ROW_NUMBER() OVER(PARTITION BY SensorID ORDER BY FechaHoraPrediccion DESC) as rn
--         FROM
--             Predicciones
--     )
--     SELECT
--         p.PrediccionID, s.Nombre AS Sensor, p.FechaHoraPrediccion, p.ModeloUsado, p.ValorPredicho, p.ProbabilidadRiesgo
--     FROM
--         Predicciones p
--     INNER JOIN Sensores s ON p.SensorID = s.SensorID
--     INNER JOIN UltimasPredicciones up ON p.PrediccionID = up.PrediccionID
--     WHERE
--         up.rn = 1;
-- END
-- GO

-- -- 11. Procedimiento para insertar predicción
-- CREATE PROCEDURE sp_InsertarPrediccion
--     @SensorID INT,
--     @FechaHoraPrediccion DATETIME2,
--     @ModeloUsado VARCHAR(50) = NULL,
--     @ValorPredicho VARCHAR(50),
--     @ProbabilidadRiesgo DECIMAL(5,2)
-- AS
-- BEGIN
--     INSERT INTO Predicciones (
--         SensorID, FechaHoraPrediccion, ModeloUsado, ValorPredicho, ProbabilidadRiesgo
--     )
--     VALUES (
--         @SensorID, @FechaHoraPrediccion, @ModeloUsado, @ValorPredicho, @ProbabilidadRiesgo
--     );
-- END
-- GO





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
GO


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
CREATE PROCEDURE sp_InsertarSensor
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
    JOIN DatosSensores ds ON ra.DatoID = ds.DatoID
    WHERE ds.SensorID = @SensorID;

    DELETE ra FROM RegistroAlertas ra JOIN DatosSensores ds ON ra.DatoID = ds.DatoID WHERE ds.SensorID = @SensorID;
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



--ALERTAS UMBRALES


CREATE PROCEDURE sp_InsertarAnomalia
    @DatoID BIGINT,
    @Tipo VARCHAR(50),
    @Descripcion VARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO Anomalias (DatoID, Tipo, Descripcion, Fecha_Detectada, Estado)
    VALUES (@DatoID, @Tipo, @Descripcion, GETDATE(), 1);
    
    SELECT SCOPE_IDENTITY() AS AnomaliaID;
END;
GO

-- Procedimiento para insertar registro de alerta
-- Agregar parámetro @AnomaliaID
CREATE OR ALTER PROCEDURE sp_InsertarRegistroAlerta
    @UmbralID INT = NULL,
    @AnomaliaID BIGINT = NULL,  -- 🆕 NUEVO
    @DatoID BIGINT,
    @FechaHoraAlerta DATETIME2,
    @EstadoNotificacion VARCHAR(50),
    @Tipo VARCHAR(20) = NULL,
    @Contexto VARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO RegistroAlertas (
        UmbralID, 
        AnomaliaID,  -- 🆕 NUEVO
        DatoID, 
        FechaHoraAlerta, 
        EstadoNotificacion, 
        Tipo, 
        Contexto
    )
    VALUES (
        @UmbralID, 
        @AnomaliaID,  -- 🆕 NUEVO
        @DatoID, 
        @FechaHoraAlerta, 
        @EstadoNotificacion, 
        @Tipo, 
        @Contexto
    );
    
    SELECT SCOPE_IDENTITY() AS RegistroAlertaID;
END;
GO

-- Procedimiento para insertar alerta a usuario
CREATE OR ALTER PROCEDURE sp_InsertarAlertaUsuario
    @RegistroAlertaID BIGINT,
    @UsuarioID INT,
    @FechaEnvio DATETIME2,
    @EstadoAlerta VARCHAR(50) = 'Pendiente'
AS
BEGIN
    INSERT INTO AlertasUsuarios (RegistroAlertaID, UsuarioID, FechaEnvio, EstadoAlerta)
    VALUES (@RegistroAlertaID, @UsuarioID, @FechaEnvio, @EstadoAlerta);
    
    SELECT SCOPE_IDENTITY() AS AlertaUsuarioID;
END
GO

-- Procedimiento para obtener usuarios por nivel de permiso mínimo
CREATE OR ALTER PROCEDURE sp_ObtenerUsuariosPorNivel
    @NivelMinimo INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        U.UsuarioID, 
        U.NombreUsuario, 
        U.Correo, 
        R.NivelPermiso
    FROM Usuarios U
    INNER JOIN Roles R ON U.RolID = R.RolID
    WHERE U.Activo = 1 
        AND R.NivelPermiso >= @NivelMinimo;
END
GO

-- Procedimiento para obtener alertas pendientes de un usuario
CREATE OR ALTER PROCEDURE sp_ObtenerAlertasPendientesUsuario
    @UsuarioID INT
AS
BEGIN
    SELECT 
        AU.AlertaUsuarioID,
        AU.RegistroAlertaID,
        AU.UsuarioID,
        AU.FechaEnvio,
        AU.EstadoAlerta,
        RA.DatoID,
        RA.FechaHoraAlerta,
        RA.Tipo,
        RA.Contexto,
        DS.SensorID,
        S.Nombre AS SensorNombre,
        DS.ParametroID,
        P.NombreParametro,
        DS.Valor_procesado,
        P.UnidadMedida
    FROM AlertasUsuarios AU
    INNER JOIN RegistroAlertas RA ON AU.RegistroAlertaID = RA.RegistroAlertaID
    INNER JOIN DatosSensores DS ON RA.DatoID = DS.DatoID
    INNER JOIN Sensores S ON DS.SensorID = S.SensorID
    INNER JOIN Parametros P ON DS.ParametroID = P.ParametroID
    WHERE AU.UsuarioID = @UsuarioID 
      AND AU.EstadoAlerta = 'Pendiente'
    ORDER BY AU.FechaEnvio DESC;
END
GO

-- Procedimiento para marcar alerta como leída
CREATE OR ALTER PROCEDURE sp_MarcarAlertaLeida
    @AlertaUsuarioID BIGINT
AS
BEGIN
    UPDATE AlertasUsuarios
    SET EstadoAlerta = 'Leida',
        FechaRevisión = GETDATE()
    WHERE AlertaUsuarioID = @AlertaUsuarioID;
END
GO

-- Procedimiento para obtener umbrales
CREATE OR ALTER PROCEDURE sp_ObtenerUmbrales
AS
BEGIN
    SELECT UmbralID, ParametroID, ValorCritico, TipoUmbral, MensajeAlerta
    FROM UmbralesAlerta;
END
GO

