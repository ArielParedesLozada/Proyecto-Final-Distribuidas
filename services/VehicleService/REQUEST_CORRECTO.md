# 🚀 REQUEST CORRECTO PARA POSTMAN

## ❌ Request INCORRECTO (actual):
```json
{
  "plate": "ABC-1234",
  "type": "camioneta",
  "brand": "Toyota",
  "model": "Hilux",
  "year": 2023,
  "capacityLiters": 65,    ← PROBLEMA: debería ser capacity_liters
  "odometerKm": 15000      ← PROBLEMA: debería ser odometer_km
}
```

## ✅ Request CORRECTO:
```json
{
  "plate": "ABC-1234",
  "type": "camioneta",
  "brand": "Toyota",
  "model": "Hilux",
  "year": 2023,
  "capacity_liters": 65,
  "odometer_km": 15000
}
```

## 🎯 Campos que necesitan guión bajo:
- `capacityLiters` → `capacity_liters`
- `odometerKm` → `odometer_km`

## 📝 Explicación:
El protobuf usa `snake_case` (capacity_liters) pero algunos clientes gRPC esperan `camelCase` (capacityLiters). En este caso, el servicio está esperando el formato exacto del protobuf.
