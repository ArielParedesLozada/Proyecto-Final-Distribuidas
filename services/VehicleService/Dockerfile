# ===========================
# 1. Build stage
# ===========================
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copiar csproj y restaurar dependencias
COPY VehicleService/VehicleService.csproj VehicleService/
COPY Protos/ Protos/
RUN dotnet restore VehicleService/VehicleService.csproj

# Copiar el resto del código
COPY . .

# Publicar
RUN dotnet publish VehicleService/VehicleService.csproj -c Release -o /app/publish

# ===========================
# 2. Runtime stage
# ===========================
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Copiar artefactos publicados
COPY --from=build /app/publish .

# Variables obligatorias
ENV ASPNETCORE_URLS=http://0.0.0.0:5124
ENV DOTNET_ENVIRONMENT=Production

# ===========================
# EXPONER PUERTOS
# ===========================
# Puerto gRPC
EXPOSE 5124

# Healthcheck opcional
EXPOSE 8080

# ===========================
# ENTRYPOINT
# ===========================
ENTRYPOINT ["dotnet", "VehicleService.dll"]
