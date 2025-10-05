# SERVICIO DE ADMIN

Es un servicio que actúa como proxy para manejar los usuarios. **DEPENDE DE AUTHSERVICE**

Permite realizar operaciones CRUD sobre los usuarios mediante la comunicacion gRPC con el AuthService

Expone endpoints para manejar los usuarios

## VARIABLES DE ENTORNO

- **IP_USER_SERVICE**: IP + Puerto del servicio de AuthService
- **AUTH_AUTHORITY**: La IP + Puerto del servicio que manda los certificados de JWT (el servicio de AuthService)
- **HTTP1_PORT**: Puerto para que funcione HTTP1
- **HTTP2_PORT**: Puerto para que funcione HTTP2

## EJECUCION

1. Corre el servicio de AuthService
1. Crea un archivo .env basado en .env.example
1. Correr el servicio con `dotnet run`