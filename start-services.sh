#!/bin/bash

echo "Iniciando servicios del proyecto Fuel Manager..."

echo ""
echo "1. Iniciando AuthService (Puerto 5121)..."
gnome-terminal -- bash -c "cd services/AuthService && dotnet run; exec bash" 2>/dev/null || \
xterm -e "cd services/AuthService && dotnet run" 2>/dev/null || \
osascript -e 'tell app "Terminal" to do script "cd '$(pwd)'/services/AuthService && dotnet run"' 2>/dev/null &

echo ""
echo "2. Iniciando Gateway (Puerto 4000)..."
gnome-terminal -- bash -c "cd gateway && npm run dev; exec bash" 2>/dev/null || \
xterm -e "cd gateway && npm run dev" 2>/dev/null || \
osascript -e 'tell app "Terminal" to do script "cd '$(pwd)'/gateway && npm run dev"' 2>/dev/null &

echo ""
echo "3. Iniciando Frontend (Puerto 5173)..."
gnome-terminal -- bash -c "cd frontend && npm run dev; exec bash" 2>/dev/null || \
xterm -e "cd frontend && npm run dev" 2>/dev/null || \
osascript -e 'tell app "Terminal" to do script "cd '$(pwd)'/frontend && npm run dev"' 2>/dev/null &

echo ""
echo "Todos los servicios iniciados!"
echo "- AuthService: http://localhost:5121"
echo "- Gateway: http://localhost:4000"
echo "- Frontend: http://localhost:5173"
echo ""
