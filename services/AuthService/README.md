# SERVICIO DE AUTENTICACION Y AUTORIZACION

Es el servicio que permite comunicarse con la base de datos de los usuarios.

Encargado de generar los tokens de JWT y de mandar informacion de los usuarios

Permite realizar operaciones CRUD sobre los usuarios con un servicio secreto

## VARIABLES DE ENTORNO

- **JWT_SECRET**: Clave secreta para generar los JWT
- **JWT_ISSUER**: IP + Puerto de donde se emiten los tokens
- **JWT_TIME**: Cuanto tiempo duran los tokens, en horas
- **HTTP1_PORT**: Puerto para que funcione HTTP1
- **HTTP2_PORT**: Puerto para que funcione HTTP2
- **CONNECTION_STRING**: String de conexion para la base de datos. Usa Base de PostgreSQL por defecto

## EJECUCION

1. Crea un archivo .env basado en .env.example
1. Ejecutar las migraciones con `dotnet ef database update`
1. Crear un usuario ADMIN en la base de datos con contraseña hasheada (no creo uno por defecto por inseguro)
1. Correr el servicio con `dotnet run`