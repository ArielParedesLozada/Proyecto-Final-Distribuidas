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

- Corre Servicios
```
cd services
cd AuthService
dotnet run
cd ..
cd ChoferService
dotnet run
```
- Corre frontend
```
cd frontend && npm run dev
```
- Corre gateway
```
cd gateway &&  npm run dev
```