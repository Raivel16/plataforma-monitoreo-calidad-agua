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

        -- 1) Tabla para estado de sensores (consecutivas anomalias)
    IF OBJECT_ID('SensorEstados') IS NULL
    BEGIN
    CREATE TABLE SensorEstados (
    SensorID INT NOT NULL,
    ParametroID INT NOT NULL,
    ConsecutivasAnomalias INT NOT NULL DEFAULT 0,
    UltimaAnomalia DATETIME2 NULL,
    EstadoSensor VARCHAR(20) NOT NULL DEFAULT 'NORMAL', -- NORMAL, POSIBLE_DANADO, DANADO
    CONSTRAINT PK_SensorEstados PRIMARY KEY (SensorID, ParametroID)
    );
    END
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

    -- 4.2. TABLA REGISTROALERTAS (HU010, HU014 - Trazabilidad de Alertas)
    CREATE TABLE RegistroAlertas (
        RegistroAlertaID BIGINT PRIMARY KEY IDENTITY(1,1),
        UmbralID INT NULL FOREIGN KEY REFERENCES UmbralesAlerta(UmbralID),
        DatoID BIGINT NOT NULL FOREIGN KEY REFERENCES DatosSensores(DatoID), -- Dato que causó la alerta
        FechaHoraAlerta DATETIME2 NOT NULL,
        EstadoNotificacion VARCHAR(50) NOT NULL -- Ej: 'Pendiente', 'Enviado', 'Error'
    );

    CREATE TABLE AlertasUsuarios (
        AlertaUsuarioID BIGINT PRIMARY KEY IDENTITY(1,1),
        RegistroAlertaID BIGINT NOT NULL FOREIGN KEY REFERENCES RegistroAlertas(RegistroAlertaID),
        UsuarioID INT NOT NULL FOREIGN KEY REFERENCES Usuarios(UsuarioID),
        FechaEnvio DATETIME2 NOT NULL,
        FechaRevisión DATETIME2 NULL,
        EstadoAlerta VARCHAR(50) NOT NULL -- Ej: 'Pendiente', 'Revisada', 'Atendida'
    );

     CREATE TABLE Anomalias(
        AnomaliaID BIGINT PRIMARY KEY IDENTITY(1,1),
        DatoID BIGINT NOT NULL FOREIGN KEY REFERENCES DatosSensores(DatoID),
        Tipo VARCHAR(50) NOT NULL,
        Descripcion VARCHAR(255),
        Fecha_Detectada DATETIME2 NOT NULL,
        Estado BIT NOT NULL DEFAULT 1
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



