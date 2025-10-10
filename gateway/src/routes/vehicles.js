// src/routes/vehicles.js
import { Router } from "express";
import { vehiclesClient } from "../grpc/vehiclesClient.js";
import { mapGrpcError } from "../utils/mapGrpcError.js";
import { auth, requireScopes } from "../middleware/auth.js";
import { Metadata } from "@grpc/grpc-js";

const router = Router();

/**
 * Construye Metadata para gRPC copiando el header HTTP Authorization (en minúsculas).
 */
function mdFromHttp(req) {
  const md = new Metadata();
  const authz = req.headers.authorization || req.headers.Authorization;
  if (authz) {
    const val = Array.isArray(authz) ? authz[0] : authz;
    md.add("authorization", val); // 👈 MUY IMPORTANTE: minúsculas
    console.log("🔍 gRPC metadata - authorization:", String(val).slice(0, 24) + "...");
  } else {
    console.warn("⚠️ Sin Authorization en la request HTTP hacia gRPC");
  }
  return md;
}

function toInt(v, def) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : def;
}

function toDouble(v, def) {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : def;
}

// ----- CRUD Vehículos (Solo ADMIN) -----

/** POST /vehicles - Crear vehículo */
router.post("/vehicles", auth, requireScopes("vehicles:create"), (req, res) => {
  const { plate, type, brand, model, year, capacity_liters, odometer_km } = req.body;

  const request = {
    plate,
    type,
    brand,
    model,
    year: toInt(year, 0),
    capacity_liters: toDouble(capacity_liters, 0),
    odometer_km: toInt(odometer_km, 0),
  };

  vehiclesClient.CreateVehicle(request, mdFromHttp(req), (err, response) => {
    if (err) return mapGrpcError(err, res);
    res.status(201).json(response);
  });
});

/** GET /vehicles - Listar vehículos */
router.get("/vehicles", auth, requireScopes("vehicles:read:all"), (req, res) => {
  const { plate, type, status, page, page_size } = req.query;

  const request = {
    plate: plate || "",
    type: type || "",
    status: status ? toInt(status, 0) : 0,
    page: toInt(page, 1),
    page_size: toInt(page_size, 20),
  };

  vehiclesClient.ListVehicles(request, mdFromHttp(req), (err, response) => {
    if (err) return mapGrpcError(err, res);
    res.json(response);
  });
});

/** GET /vehicles/active-assignments - Obtener asignaciones activas */
router.get("/vehicles/active-assignments", auth, requireScopes("vehicles:read:all"), (req, res) => {
  console.log('🔄 Gateway: Llamando a ListActiveAssignments...');
  
  // ListActiveAssignments no requiere parámetros (recibe google.protobuf.Empty)
  vehiclesClient.ListActiveAssignments({}, mdFromHttp(req), (err, response) => {
    if (err) return mapGrpcError(err, res);
    console.log('✅ Gateway: Asignaciones activas recibidas:', response.active_assignments?.length || 0);
    res.json(response);
  });
});

/** GET /vehicles/:id - Obtener vehículo por ID */
router.get("/vehicles/:id", auth, requireScopes("vehicles:read:all"), (req, res) => {
  const { id } = req.params;

  vehiclesClient.GetVehicle({ id }, mdFromHttp(req), (err, response) => {
    if (err) return mapGrpcError(err, res);
    res.json(response);
  });
});

/** PUT /vehicles/:id - Actualizar vehículo */
router.put("/vehicles/:id", auth, requireScopes("vehicles:update:any"), (req, res) => {
  const { id } = req.params;
  const { type, brand, model, year, capacity_liters, odometer_km } = req.body;

  const request = {
    id,
    type,
    brand,
    model,
    year: toInt(year, 0),
    capacity_liters: toDouble(capacity_liters, 0),
    odometer_km: toInt(odometer_km, 0),
  };

  vehiclesClient.UpdateVehicle(request, mdFromHttp(req), (err, response) => {
    if (err) return mapGrpcError(err, res);
    res.json(response);
  });
});

/** PATCH /vehicles/:id/status - Cambiar estado del vehículo */
router.patch("/vehicles/:id/status", auth, requireScopes("vehicles:update:any"), (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const request = {
    id,
    status: toInt(status, 1),
  };

  vehiclesClient.SetStatus(request, mdFromHttp(req), (err, response) => {
    if (err) return mapGrpcError(err, res);
    res.json(response);
  });
});

// ----- Asignaciones (Admin + Supervisor) -----

/** POST /vehicles/assign - Asignar vehículo a conductor */
router.post("/vehicles/assign", auth, requireScopes("vehicles:assign"), (req, res) => {
  const { vehicle_id, driver_id } = req.body;

  const request = {
    vehicle_id,
    driver_id,
  };

  vehiclesClient.AssignVehicle(request, mdFromHttp(req), (err, response) => {
    if (err) return mapGrpcError(err, res);
    res.status(201).json(response);
  });
});

/** DELETE /vehicles/:vehicle_id/assign - Desasignar vehículo */
router.delete("/vehicles/:vehicle_id/assign", auth, requireScopes("vehicles:assign"), (req, res) => {
  const { vehicle_id } = req.params;

  vehiclesClient.UnassignVehicle({ vehicle_id }, mdFromHttp(req), (err, response) => {
    if (err) return mapGrpcError(err, res);
    res.json(response);
  });
});

// ----- Consultas por Conductor (Admin + Supervisor) -----

/** GET /drivers/:driver_id/vehicles - Listar vehículos activos de un conductor */
router.get("/drivers/:driver_id/vehicles", auth, requireScopes("vehicles:read:all"), (req, res) => {
  const { driver_id } = req.params;

  vehiclesClient.ListVehiclesByDriver({ driver_id }, mdFromHttp(req), (err, response) => {
    if (err) return mapGrpcError(err, res);
    res.json(response);
  });
});

/** GET /drivers/:driver_id/assignments - Historial de asignaciones de un conductor */
router.get("/drivers/:driver_id/assignments", auth, requireScopes("vehicles:read:all"), (req, res) => {
  const { driver_id } = req.params;

  vehiclesClient.ListAssignmentsByDriver({ driver_id }, mdFromHttp(req), (err, response) => {
    if (err) return mapGrpcError(err, res);
    res.json(response);
  });
});

// ----- Consultas del Propio Conductor -----

/** GET /me/vehicles - Listar mis vehículos activos */
router.get("/me/vehicles", auth, requireScopes("vehicles:read:own"), (req, res) => {
  vehiclesClient.ListMyVehicles({}, mdFromHttp(req), (err, response) => {
    if (err) return mapGrpcError(err, res);
    res.json(response);
  });
});

export default router;
