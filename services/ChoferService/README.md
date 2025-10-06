# SERVICIO DE CHOFERES

Es el servicio que permite comunicarse con la base de datos de los choferes.

Permite realizar operaciones CRUD sobre los choferes

## VARIABLES DE ENTORNO

- **JWT_SECRET**: Clave secreta para generar los JWT
- **JWT_ISSUER**: IP + Puerto de donde se emiten los tokens
- **JWT_AUDIENCE**: IP + Puerto de para quien van los tokens, osea, IP + Puerto de este servicio
- **CONNECTION_STRING**: String de conexion para la base de datos. Usa Base de PostgreSQL por defecto

## EJECUCION

1. Correr el servicio de AuthService
1. Crea un archivo .env basado en .env.example
1. Ejecutar las migraciones con `dotnet ef database update`
1. Correr el servicio con `dotnet run`