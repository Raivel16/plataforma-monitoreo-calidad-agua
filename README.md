# Plataforma de Monitoreo de Calidad de Agua
Proyecto del curso de Diseño de Software.



- [ ] Seccion de usuarios
- Implementar de usuarios
  - Listar usuarios
  - Crear usuario (verificar en vista si aparecen los usuarios segun el rol unicamente debe aparecer cierto tipo de rol corregir de alguna forma los procedimientos almacenados que validan o responden eso)
  - Modificar usuario (ver si hay algun campo de desabilitar)
  
- Implementar de Roles 
  - añadir roles 
  - Modificar roles
  - Listar roles
  - Implementar de alguna forma el nivel de permisos y que el backend verifique por el nivel y no el rol
  -  Nivel de permisos
     -  muy bajo: solo visualizacion y prediccion
     -  bajo: solo visualizacion, prediccion acceso a notificaciones
     -  medio: solo visualizacion, prediccion, notificaciones, Datos Sensores (solo filtro (renombrar por Datos), poner de primero filtro ingesta de segundo)
     -  alto: TODOS LOS PERMISOS

- [ ] Seccion de datos
- poner para configurar umbrales en los parametros
- implementar que se detecten anomalias

- [ ] Seccion de visualizacion
- Cambiar que se mida la calidad del agua con ultimos 5 datos no solo 1.
- 

- [ ] Seccion de notificaciones
- Implementar de notificaciones
- Usuarios:
  - Listar notificaciones
  - Marcar notificacion como leida
- Administradores:
  - Listar notificaciones
  - Enviar notificacion manual
  - Marcar notificacion como leida
  - Suscribir todas las páginas a un evento notificaciones para recibir notificaciones en tiempo real



- [ ] Seccion de Predicciones
- Usuarios:
  - Listar predicciones
  - Crear prediccion
- Administradores:
  - Listar predicciones
  - Crear prediccion
  - Medir precision de predicciones