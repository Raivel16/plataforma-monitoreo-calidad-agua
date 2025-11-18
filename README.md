# Plataforma de Monitoreo de Calidad de Agua
Proyecto del curso de Diseño de Software.



- [x] Seccion de usuarios
- [x] Implementar de usuarios
  - [x] Listar usuarios
  - [x] Crear usuario
  - [x] Modificar usuario (ver si hay algun campo de desabilitar)
  
- [x] Implementar de Roles 
- [x] (verificar en vista si aparecen los usuarios segun el rol unicamente debe aparecer cierto tipo de rol corregir de alguna forma los procedimientos almacenados que validan o responden eso)
  - [x] añadir roles  
  - [x] Modificar roles
  - [x] Listar roles
  - [x] Implementar de alguna forma el nivel de permisos y que el backend verifique por el nivel y no el rol
  -  [x] Nivel de permisos
     -  muy bajo: solo visualizacion y prediccion
     -  bajo: solo visualizacion, prediccion acceso a notificaciones
     -  medio: solo visualizacion, prediccion, notificaciones, Datos Sensores (solo filtro (renombrar por Datos), poner de primero filtro ingesta de segundo)
     -  alto: TODOS LOS PERMISOS

- [ ] Seccion de datos
- poner para configurar umbrales en los parametros
- implementar que se detecten anomalias

- [ ] Seccion de visualizacion
- Cambiar que se mida la calidad del agua con ultimos 5 datos no solo 1.


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


  ME QUEDË PROBANDO LO ULTIMO QUE DIO CHATGPT solo puse hasta el controlador AlertaUsuario
  3) Controlador + ruta Express — controllers/AlertasController.js y ruta