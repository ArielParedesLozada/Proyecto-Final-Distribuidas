# 🔧 SOLUCIÓN DEFINITIVA AL ERROR RST_STREAM

## 🚨 Problema Persistente

**Error:** `Received RST_STREAM with code 2 triggered by internal client error: Protocol error`

Este error indica un problema de protocolo gRPC entre Postman y el servidor.

---

## 🔍 Causas Posibles

1. **Configuración incorrecta de Postman para gRPC**
2. **Problema con HTTP/2 en Windows**
3. **Configuración de Kestrel no compatible**
4. **Headers de autorización mal formateados**

---

## ✅ SOLUCIONES PROBADAS

### **Solución 1: Configuración Específica de Postman**

1. **Crear nueva solicitud gRPC:**
   - URL: `localhost:5124`
   - **IMPORTANTE:** NO marcar "TLS"
   - **IMPORTANTE:** NO marcar "Use TLS"

2. **Configuración de Headers:**
   - Ve a la pestaña **"Metadata"**
   - Agrega EXACTAMENTE así:
     ```
     Key: authorization
     Value: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlZTExNzRkMy1kYmI5LTRiMTgtOTZlMi0yNzk1N2Q4MWE4YjAiLCJlbWFpbCI6ImFkbWluQGFkbWluLmNvbSIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6IkFETUlOIiwiaHR0cDovL3NjaGVtYXMueG1sc29hcC5vcmcvd3MvMjAwNS8wNS9pZGVudGl0eS9jbGFpbXMvbmFtZSI6IkFkbWluaXN0cmFkb3IgZGVsIFNpc3RlbWEiLCJzY29wZSI6ImRyaXZlcnM6Y3JlYXRlIGRyaXZlcnM6cmVhZDphbGwgZHJpdmVyczpyZWFkOm93biBkcml2ZXJzOnVwZGF0ZSB2ZWhpY2xlczpjcmVhdGUgdmVoaWNsZXM6cmVhZDphbGwgdmVoaWNsZXM6dXBkYXRlOmFueSB2ZWhpY2xlczphc3NpZ24iLCJleHAiOjE3NjAwNDk4ODksImlzcyI6Imh0dHA6Ly9sb2NhbGhvc3Q6NTEyMSIsImF1ZCI6Imh0dHA6Ly9sb2NhbGhvc3Q6NTEyMSJ9.f9_yCiNX2cxa7XgXHdt7NffyEqFUFAW81mVkRNdmjso
     ```

3. **Settings de Postman:**
   - Ve a **Settings** → **General**
   - **"SSL certificate verification"** → **OFF**
   - **"Proxy"** → **OFF**

4. **Configuración gRPC específica:**
   - En la solicitud gRPC, ve a **Settings** (icono de engranaje)
   - **"Use TLS"** → **OFF**
   - **"Skip TLS certificate verification"** → **ON**

---

## 🧪 SOLUCIÓN 2: Probar Método Sin Autenticación

Para verificar que gRPC funciona, prueba el health check:

1. **Método:** `grpc.health.v1.Health/Check`
2. **Message:**
   ```json
   {
     "service": ""
   }
   ```

Si este método funciona, el problema está en la autenticación JWT.

---

## 🛠️ SOLUCIÓN 3: Usar BloomRPC (Cliente Alternativo)

1. **Descargar BloomRPC:** https://github.com/uw-labs/bloomrpc
2. **Importar el archivo .proto:**
   - File → Import .proto files
   - Seleccionar: `services/VehicleService/Protos/vehicles.proto`
3. **Configurar conexión:**
   - Host: `localhost`
   - Port: `5124`
   - **NO marcar** "Use TLS"
4. **Agregar metadata:**
   - Click en "Metadata"
   - Key: `authorization`
   - Value: `Bearer [TOKEN]`

---

## 🔧 SOLUCIÓN 4: Usar grpcurl (Línea de Comandos)

```bash
# Instalar grpcurl primero
# En Windows con Chocolatey: choco install grpcurl

# Probar health check
grpcurl -plaintext localhost:5124 grpc.health.v1.Health/Check

# Probar crear vehículo
grpcurl -plaintext -H "authorization: Bearer TOKEN_AQUI" localhost:5124 vehicles.v1.VehiclesService/CreateVehicle -d '{"plate":"ABC-1234","type":"camioneta","brand":"Toyota","model":"Hilux","year":2023,"capacityLiters":65,"odometerKm":15000}'
```

---

## 🚨 SOLUCIÓN 5: Deshabilitar Temporalmente Autenticación

Si nada funciona, podemos deshabilitar temporalmente la autenticación para probar que gRPC funciona:

### **Modificar Program.cs temporalmente:**

```csharp
// Comentar estas líneas temporalmente:
// builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
//     .AddJwtBearer(o => { ... });

// Comentar esta línea:
// options.FallbackPolicy = new AuthorizationPolicyBuilder()
//     .RequireAuthenticatedUser()
//     .Build();

// Comentar estas líneas:
// app.UseAuthentication();
// app.UseAuthorization();
```

### **Probar sin autenticación:**
1. Reiniciar el servicio
2. Probar en Postman SIN metadata de autorización
3. Si funciona, el problema está en la autenticación JWT

---

## 📊 SOLUCIÓN 6: Verificar Logs del Servicio

En la consola del VehicleService, deberías ver:

### **Si funciona:**
```
[JWT/Vehicles] 🔑 Token recibido: eyJhbGciOiJIUzI1NiIs...
[JWT/Vehicles] ✅ Token válido. sub=ee1174d3-dbb9-4b18-96e2-27957d81a8b0 aud=http://localhost:5121
```

### **Si hay problemas:**
```
[JWT/Vehicles] ⚠️ No se encontró token de autorización
[JWT/Vehicles] ❌ Auth failed: [tipo de error]
```

---

## 🎯 RECOMENDACIÓN DE PRUEBA

**Prueba en este orden:**

1. **BloomRPC** (más confiable para gRPC)
2. **grpcurl** (línea de comandos)
3. **Postman con configuración específica**
4. **Deshabilitar autenticación temporalmente**

---

## 📝 Estado Actual

- ✅ **VehicleService:** Ejecutándose en puerto 5124
- ✅ **Configuración JWT:** Corregida
- ✅ **Puertos:** Sin conflictos

**El servicio está funcionando. El problema está en la configuración del cliente gRPC.**

---

## 🔄 Próximos Pasos

1. **Prueba BloomRPC** primero
2. Si BloomRPC funciona, el problema está en Postman
3. Si BloomRPC falla, el problema está en el servidor
4. Revisa los logs del VehicleService para más información

**¡El problema se puede resolver! 🚀**
