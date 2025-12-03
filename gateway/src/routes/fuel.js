// src/routes/fuel.js
import { Router } from "express";
import { mapGrpcError } from "../utils/mapGrpcError.js";
import { auth, requireScopes, requireAnyScope } from "../middleware/auth.js";
import { GrpcRoutesBase } from "./GrpcRoutesBase.js";

export class FuelRoutes extends GrpcRoutesBase {
  constructor(fuelClient) {
    super(fuelClient, "FUEL-CLIENT");
    this.fuelClient = fuelClient;
  }

  async start() {
    this.router = Router();

    /** GET /fuel/reports/machinery-type - Reporte por tipo de maquinaria */
    this.router.get("/fuel/reports/machinery-type", auth, (req, res, next) => {
      // Permitir ADMIN o SUPERVISOR basado en roles
      // El claim de roles puede estar en diferentes ubicaciones en el JWT
      const roleClaim = req.auth?.["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] 
        || req.auth?.role 
        || req.auth?.roles 
        || "";
      const rolesStr = Array.isArray(roleClaim) ? roleClaim.join(",") : String(roleClaim);
      const userRoles = rolesStr.split(/[,\s]+/).filter(Boolean).map(r => r.toUpperCase());
      if (userRoles.includes("ADMIN") || userRoles.includes("SUPERVISOR")) {
        return next();
      }
      return res.status(403).json({ error: "Forbidden (requires ADMIN or SUPERVISOR role)" });
    }, async (req, res) => {
      const { machinery_type, start_date, end_date } = req.query;
      
      const request = {
        machineryType: machinery_type ? parseInt(machinery_type) : null,
        startDate: start_date || "",
        endDate: end_date || "",
      };

      const caller = await this.grpc(res);
      if (!caller) return;
      caller.GetReportByMachineryType(request, this.mdFromHttp(req), (err, response) => {
        if (err) return mapGrpcError(err, res);
        res.json(response);
      });
    });

    /** GET /fuel/reports/consumption-comparison - Comparación estimado vs real */
    this.router.get("/fuel/reports/consumption-comparison", auth, (req, res, next) => {
      const roleClaim = req.auth?.["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] 
        || req.auth?.role 
        || req.auth?.roles 
        || "";
      const rolesStr = Array.isArray(roleClaim) ? roleClaim.join(",") : String(roleClaim);
      const userRoles = rolesStr.split(/[,\s]+/).filter(Boolean).map(r => r.toUpperCase());
      if (userRoles.includes("ADMIN") || userRoles.includes("SUPERVISOR")) {
        return next();
      }
      return res.status(403).json({ error: "Forbidden (requires ADMIN or SUPERVISOR role)" });
    }, async (req, res) => {
      const { machinery_type, start_date, end_date } = req.query;
      
      const request = {
        machineryType: machinery_type ? parseInt(machinery_type) : null,
        startDate: start_date || "",
        endDate: end_date || "",
      };

      const caller = await this.grpc(res);
      if (!caller) return;
      caller.GetConsumptionComparison(request, this.mdFromHttp(req), (err, response) => {
        if (err) return mapGrpcError(err, res);
        res.json(response);
      });
    });

    /** GET /fuel/reports/general - Reporte general de consumo */
    this.router.get("/fuel/reports/general", auth, (req, res, next) => {
      const roleClaim = req.auth?.["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] 
        || req.auth?.role 
        || req.auth?.roles 
        || "";
      const rolesStr = Array.isArray(roleClaim) ? roleClaim.join(",") : String(roleClaim);
      const userRoles = rolesStr.split(/[,\s]+/).filter(Boolean).map(r => r.toUpperCase());
      if (userRoles.includes("ADMIN") || userRoles.includes("SUPERVISOR")) {
        return next();
      }
      return res.status(403).json({ error: "Forbidden (requires ADMIN or SUPERVISOR role)" });
    }, async (req, res) => {
      const { start_date, end_date } = req.query;
      
      const request = {
        startDate: start_date || "",
        endDate: end_date || "",
      };

      const caller = await this.grpc(res);
      if (!caller) return;
      caller.GetGeneralConsumptionReport(request, this.mdFromHttp(req), (err, response) => {
        if (err) return mapGrpcError(err, res);
        res.json(response);
      });
    });
  }
}

