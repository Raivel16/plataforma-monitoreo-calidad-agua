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