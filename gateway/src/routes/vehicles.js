// src/routes/vehicles.js
import { Router } from "express";
import { mapGrpcError } from "../utils/mapGrpcError.js";
import { auth, requireScopes, requireAnyScope } from "../middleware/auth.js";
import { Metadata } from "@grpc/grpc-js";

export class VehicleRoutes {
  constructor(vehicleClient) {
    this.vehicleClient = vehicleClient.client
  }
  mdFromHttp(req) {
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
  toInt(v, def) {
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : def;
  }
  toDouble(v, def) {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : def;
  }
  async start() {
    this.router = Router();
    this.router.post("/vehicles", auth, requireScopes("vehicles:create"), (req, res) => {
      const { plate, type, brand, model, year, capacity_liters, odometer_km } = req.body;

      const request = {
        plate,
        type,
        brand,
        model,
        year: this.toInt(year, 0),
        capacity_liters: this.toDouble(capacity_liters, 0),
        odometer_km: this.toInt(odometer_km, 0),
      };

      this.vehicleClient.CreateVehicle(request, this.mdFromHttp(req), (err, response) => {
        if (err) return mapGrpcError(err, res);
        res.status(201).json(response);
      });
    });

    /** GET /vehicles - Listar vehículos */
    this.router.get("/vehicles", auth, requireScopes("vehicles:read:all"), (req, res) => {
      const { plate, type, status, page, page_size } = req.query;

      const request = {
        plate: plate || "",
        type: type || "",
        status: status ? this.toInt(status, 0) : 0,
        page: this.toInt(page, 1),
        page_size: this.toInt(page_size, 20),
      };

      this.vehicleClient.ListVehicles(request, this.mdFromHttp(req), (err, response) => {
        if (err) return mapGrpcError(err, res);
        res.json(response);
      });
    });

    /** GET /vehicles/active-assignments - Obtener asignaciones activas */
    this.router.get("/vehicles/active-assignments", auth, requireScopes("vehicles:read:all"), (req, res) => {
      console.log('🔄 Gateway: Llamando a ListActiveAssignments...');

      // ListActiveAssignments no requiere parámetros (recibe google.protobuf.Empty)
      this.vehicleClient.ListActiveAssignments({}, this.mdFromHttp(req), (err, response) => {
        if (err) return mapGrpcError(err, res);
        console.log('✅ Gateway: Asignaciones activas recibidas:', response.active_assignments?.length || 0);
        res.json(response);
      });
    });

    /** GET /vehicles/:id - Obtener vehículo por ID */
    this.router.get("/vehicles/:id", auth, requireScopes("vehicles:read:all"), (req, res) => {
      const { id } = req.params;

      this.vehicleClient.GetVehicle({ id }, this.mdFromHttp(req), (err, response) => {
        if (err) return mapGrpcError(err, res);
        res.json(response);
      });
    });

    /** PUT /vehicles/:id - Actualizar vehículo */
    this.router.put("/vehicles/:id", auth, requireScopes("vehicles:update:any"), (req, res) => {
      const { id } = req.params;
      const { type, brand, model, year, capacity_liters, odometer_km } = req.body;

      const request = {
        id,
        type,
        brand,
        model,
        year: this.toInt(year, 0),
        capacity_liters: this.toDouble(capacity_liters, 0),
        odometer_km: this.toInt(odometer_km, 0),
      };

      this.vehicleClient.UpdateVehicle(request, this.mdFromHttp(req), (err, response) => {
        if (err) return mapGrpcError(err, res);
        res.json(response);
      });
    });

    /** PATCH /vehicles/:id/status - Cambiar estado del vehículo */
    this.router.patch("/vehicles/:id/status", auth, requireScopes("vehicles:update:any"), (req, res) => {
      const { id } = req.params;
      const { status } = req.body;

      const request = {
        id,
        status: this.toInt(status, 1),
      };

      this.vehicleClient.SetStatus(request, this.mdFromHttp(req), (err, response) => {
        if (err) return mapGrpcError(err, res);
        res.json(response);
      });
    });

    // ----- Asignaciones (Admin + Supervisor) -----

    /** POST /vehicles/assign - Asignar vehículo a conductor */
    this.router.post("/vehicles/assign", auth, requireAnyScope("vehicles:assign", "vehicles:read:all"), (req, res) => {
      const { vehicle_id, driver_id } = req.body;

      const request = {
        vehicle_id,
        driver_id,
      };

      this.vehicleClient.AssignVehicle(request, this.mdFromHttp(req), (err, response) => {
        if (err) return mapGrpcError(err, res);
        res.status(201).json(response);
      });
    });

    /** DELETE /vehicles/:vehicle_id/assign - Desasignar vehículo */
    this.router.delete("/vehicles/:vehicle_id/assign", auth, requireAnyScope("vehicles:assign", "vehicles:read:all"), (req, res) => {
      const { vehicle_id } = req.params;

      this.vehicleClient.UnassignVehicle({ vehicle_id }, this.mdFromHttp(req), (err, response) => {
        if (err) return mapGrpcError(err, res);
        res.json(response);
      });
    });

    // ----- Consultas por Conductor (Admin + Supervisor) -----

    /** GET /drivers/:driver_id/vehicles - Listar vehículos activos de un conductor */
    this.router.get("/drivers/:driver_id/vehicles", auth, requireAnyScope("vehicles:read:all", "vehicles:assign"), (req, res) => {
      const { driver_id } = req.params;

      this.vehicleClient.ListVehiclesByDriver({ driver_id }, this.mdFromHttp(req), (err, response) => {
        if (err) return mapGrpcError(err, res);
        res.json(response);
      });
    });

    /** GET /drivers/:driver_id/assignments - Historial de asignaciones de un conductor */
    this.router.get("/drivers/:driver_id/assignments", auth, requireAnyScope("vehicles:read:all", "vehicles:assign"), (req, res) => {
      const { driver_id } = req.params;

      this.vehicleClient.ListAssignmentsByDriver({ driver_id }, this.mdFromHttp(req), (err, response) => {
        if (err) return mapGrpcError(err, res);
        res.json(response);
      });
    });

    // ----- Consultas del Propio Conductor -----

    /** GET /me/vehicles - Listar mis vehículos activos */
    this.router.get("/me/vehicles", auth, requireScopes("vehicles:read:own"), (req, res) => {
      this.vehicleClient.ListMyVehicles({}, this.mdFromHttp(req), (err, response) => {
        if (err) return mapGrpcError(err, res);
        res.json(response);
      });
    });
  }
}

/** POST /vehicles - Crear vehículo */
