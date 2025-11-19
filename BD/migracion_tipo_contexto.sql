-- ============================================================================
-- SCRIPT DE MIGRACIÓN: Agregar Tipo y Contexto a RegistroAlertas
-- Ejecutar en: MonitoreoAguaJunin
-- ============================================================================

USE MonitoreoAguaJunin;
GO

-- Verificar que la tabla existe
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'RegistroAlertas')
BEGIN
    PRINT '✅ Tabla RegistroAlertas encontrada';
    
    -- Agregar columna Tipo si no existe
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('RegistroAlertas') AND name = 'Tipo')
    BEGIN
        ALTER TABLE RegistroAlertas 
        ADD Tipo VARCHAR(20) NULL;
        PRINT '✅ Columna Tipo agregada a RegistroAlertas';
    END
    ELSE
    BEGIN
        PRINT 'ℹ️  Columna Tipo ya existe en RegistroAlertas';
    END
    
    -- Agregar columna Contexto si no existe
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('RegistroAlertas') AND name = 'Contexto')
    BEGIN
        ALTER TABLE RegistroAlertas 
        ADD Contexto VARCHAR(500) NULL;
        PRINT '✅ Columna Contexto agregada a RegistroAlertas';
    END
    ELSE
    BEGIN
        PRINT 'ℹ️  Columna Contexto ya existe en RegistroAlertas';
    END
END
ELSE
BEGIN
    PRINT '❌ ERROR: Tabla RegistroAlertas no encontrada';
END
GO

PRINT '';
PRINT '============================================================================';
PRINT 'Migración completada exitosamente';
PRINT '============================================================================';
PRINT 'NOTA: Las alertas antiguas tendrán Tipo y Contexto como NULL.';
PRINT 'Las nuevas alertas se guardarán con su tipo correcto (UMBRAL, ANOMALIA, CONTAMINACION_CRITICA).';
GO
