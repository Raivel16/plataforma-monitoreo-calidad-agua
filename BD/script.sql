-- ==============================================================================
-- SCRIPT DE CREACIÓN DE BASE DE DATOS: MonitoreoAguaJunin
-- BASADO EN EL DIAGRAMA ENTIDAD-RELACIÓN FINAL
-- ==============================================================================

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
    NombreRol VARCHAR(50) NOT NULL UNIQUE
);

-- 2.2. TABLA USUARIOS (Incluye campo Correo)
CREATE TABLE Usuarios (
    UsuarioID INT PRIMARY KEY IDENTITY(1,1),
    RolID INT NOT NULL FOREIGN KEY REFERENCES Roles(RolID),
    NombreUsuario VARCHAR(100) NOT NULL UNIQUE,
    ContrasenaHash VARCHAR(255) NOT NULL,
    Correo VARCHAR(150) NOT NULL UNIQUE, -- Nuevo atributo del DER
    Activo BIT NOT NULL DEFAULT 1
);

-- 2.3. TABLA PARAMETROS
CREATE TABLE Parametros (
    ParametroID INT PRIMARY KEY IDENTITY(1,1),
    NombreParametro VARCHAR(50) NOT NULL UNIQUE,
    UnidadMedida VARCHAR(10) NOT NULL
);

-- ==============================================================================
-- 3. CREACIÓN DE TABLAS DE MONITOREO Y DATOS
-- ==============================================================================

-- 3.1. TABLA SENSORES
CREATE TABLE Sensores (
    SensorID INT PRIMARY KEY IDENTITY(1,1),
    Nombre VARCHAR(100) NOT NULL,
    Tipo VARCHAR(50) NOT NULL,
    Modelo VARCHAR(50) NOT NULL,
    Fabricante VARCHAR(100) NOT NULL,
    Latitud DECIMAL(9,6) NOT NULL,
    Longitud DECIMAL(9,6) NOT NULL,
    Descripcion VARCHAR(255),
    EstadoOperativo BIT NOT NULL DEFAULT 1
);

-- 3.2. TABLA DATOSSENSORES (Tabla de Hechos)
CREATE TABLE DatosSensores (
    DatoID BIGINT PRIMARY KEY IDENTITY(1,1),
    SensorID INT NOT NULL FOREIGN KEY REFERENCES Sensores(SensorID),
    ParametroID INT NOT NULL FOREIGN KEY REFERENCES Parametros(ParametroID),
    Timestamp DATETIME2 NOT NULL, -- Momento en que se tomó o recibió
    TimestampEnvio DATETIME2, -- Momento en que se envió el dato (Nuevo del DER)
    
    Valor_original DECIMAL(10,4),
    Valor_procesado DECIMAL(10,4),
    Valor_normalizado DECIMAL(10,4),
    EsAtipico BIT NOT NULL DEFAULT 0,
    
    Estado VARCHAR(20) NOT NULL DEFAULT 'crudo' 
        CHECK (Estado IN ('crudo', 'procesado', 'descartado')),
    
    INDEX IX_SensorParamTime NONCLUSTERED (SensorID, ParametroID, Timestamp)
);

-- ==============================================================================
-- 4. CREACIÓN DE TABLAS DE ALERTA Y PREDICCIÓN
-- ==============================================================================

-- 4.1. TABLA UMBRALESALERTA
CREATE TABLE UmbralesAlerta (
    UmbralID INT PRIMARY KEY IDENTITY(1,1),
    ParametroID INT NOT NULL FOREIGN KEY REFERENCES Parametros(ParametroID),
    ValorCritico DECIMAL(10,4) NOT NULL,
    TipoUmbral VARCHAR(10) NOT NULL CHECK (TipoUmbral IN ('MAXIMO', 'MINIMO')),
    MensajeAlerta VARCHAR(255),
    Activo BIT NOT NULL DEFAULT 1 -- Nuevo atributo del DER
);

-- 4.2. TABLA REGISTROALERTAS
CREATE TABLE RegistroAlertas (
    RegistroAlertaID BIGINT PRIMARY KEY IDENTITY(1,1),
    UmbralID INT NOT NULL FOREIGN KEY REFERENCES UmbralesAlerta(UmbralID),
    LecturaID BIGINT NOT NULL FOREIGN KEY REFERENCES DatosSensores(DatoID), -- Dato que causó la alerta
    FechaHoraAlerta DATETIME2 NOT NULL,
    EstadoNotificacion VARCHAR(50) NOT NULL 
);

-- 4.3. TABLA ANOMALIAS
CREATE TABLE Anomalias(
    AnomaliaID BIGINT PRIMARY KEY IDENTITY(1,1),
    DatoID BIGINT NOT NULL FOREIGN KEY REFERENCES DatosSensores(DatoID),
    Tipo VARCHAR(50) NOT NULL,
    Descripcion VARCHAR(255),
    Fecha_Detectada DATETIME2 NOT NULL,
    Estado BIT NOT NULL DEFAULT 1
);

-- 4.4. TABLA PREDICCIONES
CREATE TABLE Predicciones (
    PrediccionID BIGINT PRIMARY KEY IDENTITY(1,1),
    SensorID INT NOT NULL FOREIGN KEY REFERENCES Sensores(SensorID),
    FechaHoraPrediccion DATETIME2 NOT NULL,
    ModeloUsado VARCHAR(50),
    ValorPredicho VARCHAR(50),
    ProbabilidadRiesgo DECIMAL(5,2)
);

-- 4.5. TABLA ALERTASUSUARIOS (Nueva tabla de relación Muchos a Muchos: Alertas y Usuarios)
CREATE TABLE AlertasUsuarios (
    AlertaUsuarioID BIGINT PRIMARY KEY IDENTITY(1,1),
    RegistroAlertaID BIGINT NOT NULL FOREIGN KEY REFERENCES RegistroAlertas(RegistroAlertaID),
    UsuarioID INT NOT NULL FOREIGN KEY REFERENCES Usuarios(UsuarioID),
    FechaRevision DATETIME2, -- Momento en que el usuario revisó la alerta
    EstadoRevision VARCHAR(50) NOT NULL DEFAULT 'PENDIENTE' 
);

-- ==============================================================================
-- 5. INSERCIÓN DE DATOS INICIALES (Mínimo para el funcionamiento)
-- ==============================================================================

-- Roles
INSERT INTO Roles (NombreRol) VALUES ('Gestor ANA'); 
INSERT INTO Roles (NombreRol) VALUES ('Investigador'); 
INSERT INTO Roles (NombreRol) VALUES ('Público General');

-- Parámetros
INSERT INTO Parametros (NombreParametro, UnidadMedida) VALUES ('pH', 'Unidad');
INSERT INTO Parametros (NombreParametro, UnidadMedida) VALUES ('Turbidez', 'NTU');
INSERT INTO Parametros (NombreParametro, UnidadMedida) VALUES ('Oxígeno Disuelto', 'mg/L');
INSERT INTO Parametros (NombreParametro, UnidadMedida) VALUES ('Conductividad', 'µS/cm');
INSERT INTO Parametros (NombreParametro, UnidadMedida) VALUES ('Temperatura', '°C');

GO