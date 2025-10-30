
USE MonitoreoAguaJunin;
GO

-- Procedimiento de prueba de conexión
CREATE PROCEDURE sp_TestConexion
AS
BEGIN
  PRINT 'Conexión exitosa';
END;


--1 Procedimiento para insertar una nueva lectura en DatosSensores (HU001, HU002, HU003)
CREATE PROCEDURE usp_InsertarDatosSensor
    @SensorID INT,
    @TimestampRegistro DATETIME2,
    @TimestampEnvio DATETIME2,
    @Valor_original DECIMAL(10,4),
    @Valor_procesado DECIMAL(10,4) = NULL, -- Permite NULL si el procesamiento es asíncrono
    @Valor_normalizado DECIMAL(10,4) = NULL,
    @Estado VARCHAR(20) = 'procesado' -- Asumiendo que el dato es procesado al insertarse
AS
BEGIN
    -- Verifica que el Estado sea válido según el CHECK constraint
    IF @Estado NOT IN ('crudo', 'procesado', 'descartado')
    BEGIN
        RAISERROR('Estado de dato inválido. Debe ser ''crudo'', ''procesado'' o ''descartado''.', 16, 1);
        RETURN;
    END
    -- Inserta usando ParametroID asociado al sensor (cada sensor mide un parámetro)
    INSERT INTO DatosSensores (
        SensorID,
        TimestampRegistro,
        TimestampEnvio,
        Valor_original,
        Valor_procesado,
        Valor_normalizado,
        Estado
    )
    VALUES (
        @SensorID,
        @TimestampRegistro,
        @TimestampEnvio,
        @Valor_original,
        @Valor_procesado,
        @Valor_normalizado,
        @Estado
    );

    -- Retornar el ID del nuevo dato insertado
    SELECT SCOPE_IDENTITY() AS NuevoDatoID;
END
GO

--2 Procedimiento para obtener y filtrar datos de DatosSensores (HU008)
CREATE PROCEDURE usp_ObtenerDatosSensores
    @SensorID_Filtro INT = NULL,
    @ParametroID_Filtro INT = NULL,
    @FechaInicio DATETIME2 = NULL,
    @FechaFin DATETIME2 = NULL
AS
BEGIN
    SELECT
        ds.DatoID,
        ds.SensorID,
        s.Nombre AS NombreSensor,
        s.ParametroID,
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
    INNER JOIN
        Sensores s ON ds.SensorID = s.SensorID
    INNER JOIN
        Parametros p ON s.ParametroID = p.ParametroID
    WHERE
        (@SensorID_Filtro IS NULL OR ds.SensorID = @SensorID_Filtro)
        AND (@ParametroID_Filtro IS NULL OR s.ParametroID = @ParametroID_Filtro)
        -- Filtro de fecha: Si @FechaInicio no es NULL, Timestamp debe ser mayor o igual
        AND (@FechaInicio IS NULL OR ds.TimestampRegistro >= @FechaInicio)
        -- Filtro de fecha: Si @FechaFin no es NULL, Timestamp debe ser menor o igual (incluye el final del día)
        AND (@FechaFin IS NULL OR ds.TimestampRegistro <= @FechaFin);
END
GO

--3 Procedimiento para obtener información de todos los sensores (HU007)
CREATE PROCEDURE usp_ObtenerTodosSensores
    @EstadoOperativo BIT = NULL -- NULL para todos, 1 para activos, 0 para inactivos
AS
BEGIN
    SELECT
        s.SensorID,
        s.Nombre,
        s.ParametroID,
        p.NombreParametro AS Parametro,
        s.Modelo,
        s.Fabricante,
        s.Latitud,
        s.Longitud,
        s.Descripcion,
        s.EstadoOperativo
    FROM
        Sensores s
    LEFT JOIN
        Parametros p ON s.ParametroID = p.ParametroID
    WHERE
        (@EstadoOperativo IS NULL OR s.EstadoOperativo = @EstadoOperativo);
END
GO

--4 Procedimiento para insertar un nuevo sensor
CREATE PROCEDURE usp_InsertarSensor
    @Nombre VARCHAR(100),
    @ParametroID INT,
    @Modelo VARCHAR(50),
    @Fabricante VARCHAR(100),
    @Latitud DECIMAL(9,6),
    @Longitud DECIMAL(9,6),
    @Descripcion VARCHAR(255) = NULL,
    @EstadoOperativo BIT = 1 -- Nuevo sensor se asume Activo por defecto
AS
BEGIN
    INSERT INTO Sensores (
        Nombre,
        ParametroID,
        Modelo,
        Fabricante,
        Latitud,
        Longitud,
        Descripcion,
        EstadoOperativo
    )
    VALUES (
        @Nombre,
        @ParametroID,
        @Modelo,
        @Fabricante,
        @Latitud,
        @Longitud,
        @Descripcion,
        @EstadoOperativo
    );
    -- Devuelve el ID del sensor recién insertado
    SELECT SCOPE_IDENTITY() AS NuevoSensorID;
END
GO

--5 Procedimiento para obtener información de un sensor por su ID
CREATE PROCEDURE usp_ObtenerSensorPorID
    @SensorID INT
AS
BEGIN
    SELECT
        s.SensorID,
        s.Nombre,
        s.ParametroID,
        p.NombreParametro AS Parametro,
        s.Modelo,
        s.Fabricante,
        s.Latitud,
        s.Longitud,
        s.Descripcion,
        s.EstadoOperativo
    FROM Sensores s
    LEFT JOIN Parametros p ON s.ParametroID = p.ParametroID
    WHERE
        s.SensorID = @SensorID;
END
GO

--6 Procedimiento para actualizar información de un sensor existente (HU018, RNF4.2)
CREATE PROCEDURE usp_ActualizarSensor
    @SensorID INT,
    @Nombre VARCHAR(100),
    @ParametroID INT,
    @Modelo VARCHAR(50),
    @Fabricante VARCHAR(100),
    @Latitud DECIMAL(9,6),
    @Longitud DECIMAL(9,6),
    @Descripcion VARCHAR(255),
    @EstadoOperativo BIT
AS
BEGIN
    UPDATE Sensores
    SET
        Nombre = @Nombre,
        ParametroID = @ParametroID,
        Modelo = @Modelo,
        Fabricante = @Fabricante,
        Latitud = @Latitud,
        Longitud = @Longitud,
        Descripcion = @Descripcion,
        EstadoOperativo = @EstadoOperativo
    WHERE
        SensorID = @SensorID;
    
    -- Devuelve el número de filas afectadas (0 si no existe el ID)
    SELECT @@ROWCOUNT AS FilasAfectadas;
END
GO

--7 Procedimiento para eliminar un sensor a través de su ID
CREATE PROCEDURE usp_EliminarSensor
    @SensorID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRANSACTION;
    
    -- 1. Eliminar registros de ALERTA relacionados con datos de este sensor
    DELETE ra
    FROM RegistroAlertas ra
    INNER JOIN DatosSensores ds ON ra.LecturaID = ds.DatoID
    WHERE ds.SensorID = @SensorID;
    
    -- 2. Eliminar los Datos/Lecturas del sensor
    DELETE FROM DatosSensores
    WHERE SensorID = @SensorID;
    
    -- 3. Eliminar el registro del Sensor
    DELETE FROM Sensores
    WHERE SensorID = @SensorID;
    
    IF @@ROWCOUNT > 0
    BEGIN
        COMMIT TRANSACTION;
        SELECT 'Sensor eliminado exitosamente junto con sus datos y registros de alerta.' AS Resultado;
    END
    ELSE
    BEGIN
        ROLLBACK TRANSACTION;
        SELECT 'Error: El SensorID no existe o no se pudo eliminar.' AS Resultado;
    END
END
GO