# FuelService - Servicio de Reportes de Combustible

Servicio de gestión y reportes de consumo de combustible para el sistema de Fuel Manager.

## Configuración

### Variables de Entorno

Crear un archivo `.env` o `config.env` en la raíz del proyecto con las siguientes variables:

```env
CONNECTION_STRING=Host=localhost;Port=5432;Database=fuel_db;Username=postgres;Password=postgres
JWT_SECRET=tu_jwt_secret_aqui
JWT_ISSUER=http://localhost:5121
JWT_TIME=2
HTTP1_PORT=5126
HTTP2_PORT=5127
SERVICE_NAME=FUEL-SERVICE
SEQ_URL=http://localhost:5341
```

### Base de Datos

**La base de datos se crea y migra automáticamente al ejecutar el servicio.**

Al ejecutar `dotnet run`, el servicio:
1. Verifica si la base de datos existe (definida en `CONNECTION_STRING`)
2. Crea la base de datos si no existe (requiere permisos de creación)
3. Aplica todas las migraciones pendientes automáticamente

**Nota:** Asegúrate de que el usuario de PostgreSQL en `CONNECTION_STRING` tenga permisos para crear bases de datos, o crea la base de datos manualmente:

```sql
CREATE DATABASE fuel_db;
```

## Estructura del Proyecto

```
FuelService/
├── Config/              # Configuraciones (Database, JWT, Kestrel)
├── Data/               # Acceso a datos y Entity Framework
│   ├── Databases/      # DbContext
│   └── Repository/     # Repositorios genéricos
├── Domain/             # Entidades de dominio
│   └── Entities/       # FuelRegister
├── Services/            # Servicios gRPC
│   └── FuelReportsService.cs
├── Queue/              # Consumidores de RabbitMQ
├── Protos/             # Archivos proto (en services/Protos/)
└── Program.cs          # Punto de entrada
```

## Endpoints gRPC

### 1. GetReportByMachineryType
Reporte por tipo de maquinaria (Liviano/Pesado)

**Request:**
- `machinery_type` (opcional): 0 = Liviano, 1 = Pesado
- `start_date` (opcional): Fecha inicio (ISO 8601)
- `end_date` (opcional): Fecha fin (ISO 8601)

**Response:**
- Lista de reportes por tipo
- Totales de consumo estimado y real
- Distancia total
- Número de registros

### 2. GetConsumptionComparison
Comparación entre consumo estimado y real

**Request:**
- `machinery_type` (opcional)
- `start_date` (opcional)
- `end_date` (opcional)

**Response:**
- Lista de comparaciones por ruta
- Resumen con estadísticas
- Rutas sobre/bajo estimación

### 3. GetGeneralConsumptionReport
Reporte general de consumo

**Request:**
- `start_date` (opcional)
- `end_date` (opcional)

**Response:**
- Resumen general
- Desglose por tipo de maquinaria
- Consumo diario

## Registro en Eureka

El servicio se registra automáticamente en Eureka con el nombre `FUEL-SERVICE` en el puerto HTTP2 (5127).

## Autenticación

El servicio requiere autenticación JWT y autorización para roles ADMIN o SUPERVISOR.

## Logging

Los logs se envían a:
- Consola
- Seq (configurado en `SEQ_URL`)

## Ejecución

```bash
cd services/FuelService
dotnet run
```

El servicio estará disponible en:
- HTTP1: `http://localhost:5126`
- HTTP2 (gRPC): `http://localhost:5127`

