
----
USE master;
GO
-- 1️ Crear el login (nivel servidor)
EXEC sp_addlogin 'app_backend_user', 'back3nd*user'
-- 2️ Crear el usuario dentro de la base de datos
USE MonitoreoAguaJunin;
GO
EXEC sp_grantdbaccess 'app_backend_user';
GO
-- 3️ Dar permiso solo para ejecutar procedimientos almacenados
GRANT EXECUTE TO app_backend_user;
GO