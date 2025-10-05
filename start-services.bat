@echo off
echo Iniciando servicios del proyecto Fuel Manager...

echo.
echo 1. Iniciando AuthService (Puerto 5121)...
start "AuthService" cmd /k "cd services/AuthService && dotnet run"

echo.
echo 2. Iniciando Gateway (Puerto 4000)...
start "Gateway" cmd /k "cd gateway && npm run dev"

echo.
echo 3. Iniciando Frontend (Puerto 5173)...
start "Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Todos los servicios iniciados!
echo - AuthService: http://localhost:5121
echo - Gateway: http://localhost:4000  
echo - Frontend: http://localhost:5173
echo.
pause
