# ===========================
# 1. Build stage
# ===========================
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copiar csproj y restaurar dependencias
COPY AdminService/AdminService.csproj AdminService/
COPY Protos/ Protos/
RUN dotnet restore AdminService/AdminService.csproj

# Copiar todo el código
COPY . .

# Publicar
RUN dotnet publish AdminService/AdminService.csproj -c Release -o /app/publish

# ===========================
# 2. Runtime stage
# ===========================
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Copiar los artefactos publicados
COPY --from=build /app/publish .

# Variables de entorno obligatorias
ENV ASPNETCORE_URLS=http://0.0.0.0:5123
ENV DOTNET_ENVIRONMENT=Production

# -------------------------
# PUERTOS COMUNICADOS POR TUS ENV VARIABLES
# Pero deben exponerse para Docker
# -------------------------
EXPOSE 5123 
EXPOSE 7039  

# ===========================
# ENTRYPOINT
# ===========================
ENTRYPOINT ["dotnet", "AdminService.dll"]
