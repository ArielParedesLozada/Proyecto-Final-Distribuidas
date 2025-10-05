# Configuración de Autenticación - Fuel Manager

## 🚀 Pasos para conectar el Login con el Backend

### 1. Configurar Variables de Entorno

#### Gateway (gateway/config.env):
```
PORT=4000
AUTH_SERVICE=http://localhost:5121
CHOFER_SERVICE=http://localhost:5122
```

#### AuthService (services/AuthService/config.env):
```
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
JWT_TIME=24
CONNECTION_STRING=Host=localhost;Database=authdb;Username=postgres;Password=password
LOCAL_IP=http://localhost:5121
```

#### Frontend (frontend/config.env):
```
VITE_API_URL=http://localhost:4000
```

### 2. Renombrar archivos de configuración
```bash
# En Windows
move gateway/config.env gateway/.env
move services/AuthService/config.env services/AuthService/.env
move frontend/config.env frontend/.env

# En Linux/Mac
mv gateway/config.env gateway/.env
mv services/AuthService/config.env services/AuthService/.env
mv frontend/config.env frontend/.env
```

### 3. Configurar Base de Datos
1. Instalar PostgreSQL
2. Crear base de datos `authdb`
3. Actualizar `CONNECTION_STRING` en el .env del AuthService
4. Ejecutar migraciones:
```bash
cd services/AuthService
dotnet ef database update
```

### 4. Instalar Dependencias
```bash
# Gateway
cd gateway
npm install

# Frontend
cd frontend
npm install

# AuthService (ya debería estar instalado)
cd services/AuthService
dotnet restore
```

### 5. Iniciar Servicios

#### Opción 1: Scripts automáticos
```bash
# Windows
start-services.bat

# Linux/Mac
./start-services.sh
```

#### Opción 2: Manual
```bash
# Terminal 1 - AuthService
cd services/AuthService
dotnet run

# Terminal 2 - Gateway
cd gateway
npm run dev

# Terminal 3 - Frontend
cd frontend
npm run dev
```

### 6. Verificar Conexión

1. **Gateway**: http://localhost:4000
2. **AuthService**: http://localhost:5121
3. **Frontend**: http://localhost:5173

### 7. Probar Login

El frontend ahora se conecta al backend real a través del gateway:
- **Login**: `POST /auth/login` → Gateway → AuthService
- **Me**: `GET /auth/me` → Gateway → AuthService

### 🔧 Cambios Realizados

1. **useAuth.tsx**: Actualizado para usar API real en lugar de mock
2. **API.ts**: Ya configurado para usar el gateway
3. **Gateway**: Configurado para proxy hacia AuthService
4. **AuthService**: Servicio gRPC con endpoints HTTP

### 🐛 Troubleshooting

- **Error de conexión**: Verificar que todos los servicios estén corriendo
- **Error de CORS**: El gateway ya tiene CORS habilitado
- **Error de base de datos**: Verificar conexión a PostgreSQL
- **Token inválido**: Verificar JWT_SECRET en AuthService

### 📝 Notas

- El AuthService usa gRPC con transcodificación HTTP
- El Gateway hace proxy de `/auth/*` hacia el AuthService
- Los tokens JWT se almacenan en localStorage
- La autenticación se valida en cada carga de la app
