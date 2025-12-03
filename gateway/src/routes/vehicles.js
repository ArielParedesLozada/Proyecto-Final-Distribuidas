// src/routes/vehicles.js
import { Router } from "express";
import { mapGrpcError } from "../utils/mapGrpcError.js";
import { auth, requireScopes, requireAnyScope } from "../middleware/auth.js";
import { Metadata } from "@grpc/grpc-js";
import { GrpcRoutesBase } from "./GrpcRoutesBase.js";

export class VehicleRoutes extends GrpcRoutesBase {
  constructor(vehicleClient) {
    super(vehicleClient, "VEHICLE-CLIENT")
    this.vehicleClient = vehicleClient
  }
  async start() {
    this.router = Router();
    this.router.post("/vehicles", auth, requireScopes("vehicles:create"), async (req, res) => {
      const grpc = await this.grpc(res);
      if (!grpc) return;
      const { plate, type, machinery, brand, model, year, capacity_liters, odometer_km } = req.body;

      const request = {
        plate,
        machinery,
        type,
        brand,
        model,
        year: this.toInt(year, 0),
        capacity_liters: this.toDouble(capacity_liters, 0),
        odometer_km: this.toInt(odometer_km, 0),
      };
      console.log(request);
      
      const caller = this.vehicleClient.client
      caller.CreateVehicle(request, this.mdFromHttp(req), (err, response) => {
        if (err) return mapGrpcError(err, res);
        res.status(201).json(response);
      });
    });

    /** GET /vehicles - Listar vehículos */
    this.router.get("/vehicles", auth, requireScopes("vehicles:read:all"), async (req, res) => {
      const grpc = await this.grpc(res);
      if (!grpc) return;
      const { plate, type, status, page, page_size } = req.query;

      const request = {
        plate: plate || "",
        type: type || "",
        status: status ? this.toInt(status, 0) : 0,
        page: this.toInt(page, 1),
        page_size: this.toInt(page_size, 20),
      };
      const caller = this.vehicleClient.client
      caller.ListVehicles(request, this.mdFromHttp(req), (err, response) => {
        if (err) return mapGrpcError(err, res);
        res.json(response);
      });
    });

    /** GET /vehicles/active-assignments - Obtener asignaciones activas */
    this.router.get("/vehicles/active-assignments", auth, requireScopes("vehicles:read:all"), async (req, res) => {
      const grpc = await this.grpc(res);
      if (!grpc) return;
      console.log('🔄 Gateway: Llamando a ListActiveAssignments...');
      const caller = this.vehicleClient.client
      // ListActiveAssignments no requiere parámetros (recibe google.protobuf.Empty)
      caller.ListActiveAssignments({}, this.mdFromHttp(req), (err, response) => {
        if (err) return mapGrpcError(err, res);
        console.log('✅ Gateway: Asignaciones activas recibidas:', response.active_assignments?.length || 0);
        res.json(response);
      });
    });

    /** GET /vehicles/:id - Obtener vehículo por ID */
    this.router.get("/vehicles/:id", auth, requireScopes("vehicles:read:all"), async (req, res) => {
      const grpc = await this.grpc(res);
      if (!grpc) return;
      const { id } = req.params;
      const caller = this.vehicleClient.client
      caller.GetVehicle({ id }, this.mdFromHttp(req), (err, response) => {
        if (err) return mapGrpcError(err, res);
        res.json(response);
      });
    });

    /** PUT /vehicles/:id - Actualizar vehículo */
    this.router.put("/vehicles/:id", auth, requireScopes("vehicles:update:any"), async (req, res) => {
      const grpc = await this.grpc(res);
      if (!grpc) return;
      const { id } = req.params;
      const { type, brand, machinery, model, year, capacity_liters, odometer_km } = req.body;

      const request = {
        id,
        machinery,
        type,
        brand,
        model,
        year: this.toInt(year, 0),
        capacity_liters: this.toDouble(capacity_liters, 0),
        odometer_km: this.toInt(odometer_km, 0),
      };
      const caller = this.vehicleClient.client
      caller.UpdateVehicle(request, this.mdFromHttp(req), (err, response) => {
        if (err) return mapGrpcError(err, res);
        res.json(response);
      });
    });

    /** PATCH /vehicles/:id/status - Cambiar estado del vehículo */
    this.router.patch("/vehicles/:id/status", auth, requireScopes("vehicles:update:any"), async (req, res) => {
      const grpc = await this.grpc(res);
      if (!grpc) return;
      const { id } = req.params;
      const { status } = req.body;

      const request = {
        id,
        status: this.toInt(status, 1),
      };
      const caller = this.vehicleClient.client
      caller.SetStatus(request, this.mdFromHttp(req), (err, response) => {
        if (err) return mapGrpcError(err, res);
        res.json(response);
      });
    });

    // ----- Asignaciones (Admin + Supervisor) -----

    /** POST /vehicles/assign - Asignar vehículo a conductor */
    this.router.post("/vehicles/assign", auth, requireAnyScope("vehicles:assign", "vehicles:read:all"), async (req, res) => {
      const grpc = await this.grpc(res);
      if (!grpc) return;
      const { vehicle_id, driver_id } = req.body;

      const request = {
        vehicle_id,
        driver_id,
      };
      const caller = this.vehicleClient.client
      caller.AssignVehicle(request, this.mdFromHttp(req), (err, response) => {
        if (err) return mapGrpcError(err, res);
        res.status(201).json(response);
      });
    });

    /** DELETE /vehicles/:vehicle_id/assign - Desasignar vehículo */
    this.router.delete("/vehicles/:vehicle_id/assign", auth, requireAnyScope("vehicles:assign", "vehicles:read:all"), async (req, res) => {
      const grpc = await this.grpc(res);
      if (!grpc) return;
      const { vehicle_id } = req.params;
      const caller = this.vehicleClient.client
      caller.UnassignVehicle({ vehicle_id }, this.mdFromHttp(req), (err, response) => {
        if (err) return mapGrpcError(err, res);
        res.json(response);
      });
    });

    // ----- Consultas por Conductor (Admin + Supervisor) -----

    /** GET /drivers/:driver_id/vehicles - Listar vehículos activos de un conductor */
    this.router.get("/drivers/:driver_id/vehicles", auth, requireAnyScope("vehicles:read:all", "vehicles:assign"), async (req, res) => {
      const grpc = await this.grpc(res);
      if (!grpc) return;
      const { driver_id } = req.params;
      const caller = this.vehicleClient.client
      caller.ListVehiclesByDriver({ driver_id }, this.mdFromHttp(req), (err, response) => {
        if (err) return mapGrpcError(err, res);
        res.json(response);
      });
    });

    /** GET /drivers/:driver_id/assignments - Historial de asignaciones de un conductor */
    this.router.get("/drivers/:driver_id/assignments", auth, requireAnyScope("vehicles:read:all", "vehicles:assign"), async (req, res) => {
      const grpc = await this.grpc(res);
      if (!grpc) return;
      const { driver_id } = req.params;
      const caller = this.vehicleClient.client
      caller.ListAssignmentsByDriver({ driver_id }, this.mdFromHttp(req), (err, response) => {
        if (err) return mapGrpcError(err, res);
        res.json(response);
      });
    });

    // ----- Consultas del Propio Conductor -----

    /** GET /me/vehicles - Listar mis vehículos activos */
    this.router.get("/me/vehicles", auth, requireScopes("vehicles:read:own"), async (req, res) => {
      const grpc = await this.grpc(res);
      if (!grpc) return;
      const caller = this.vehicleClient.client
      caller.ListMyVehicles({}, this.mdFromHttp(req), (err, response) => {
        if (err) return mapGrpcError(err, res);
        res.json(response);
      });
    });
  }
}

/** POST /vehicles - Crear vehículo */
