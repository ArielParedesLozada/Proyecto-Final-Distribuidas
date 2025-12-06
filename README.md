# PROYECTO FINAL DE APLICACIONES DISTRIBUIDAS

Pues eso, no es un manual de cocina peruana

## Instalacion de dependecias

- Dependencias de frontend
```
cd frontend && npm i
```
- Dependencias de gateway
```
cd gateway &&  npm i
```
-Dependencias de servicios
```
cd services
cd AuthService
dotnet restore
cd ..
cd ChoferService
dotnet restore
```

## Hacer que la cosa corra

**📖 Para una guía completa de inicio, consulta [INICIO_SERVICIOS.md](./INICIO_SERVICIOS.md)**

### Orden de Inicio:

1. **Infraestructura:** Eureka, PostgreSQL, Seq (opcional)
2. **Servicios .NET:** AuthService, ChoferService, VehicleService, RouteService, AdminService, **FuelService**
3. **Gateway:** API Gateway (Node.js)
4. **Frontend:** React (Vite)

### Comandos Rápidos:

- **AuthService:**
```
cd services/AuthService
dotnet run
```

- **ChoferService:**
```
cd services/ChoferService
dotnet run
```

- **VehicleService:**
```
cd services/VehicleService
dotnet run
```

- **RouteService:**
```
cd services/RouteService
dotnet run
```

- **AdminService:**
```
cd services/AdminService
dotnet run
```

- **FuelService** ⛽:
```
cd services/FuelService
dotnet run
# La base de datos se crea y migra automáticamente
```

- **Gateway:**
```
cd gateway && npm run dev
```

- **Frontend:**
```
cd frontend && npm run dev
```

**Nota:** Cada servicio debe ejecutarse en una terminal separada. Usa `dotnet watch run` para desarrollo con hot reload.