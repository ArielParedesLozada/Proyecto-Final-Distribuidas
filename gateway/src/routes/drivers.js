import { Router } from "express";
import { mapGrpcError } from "../utils/mapGrpcError.js";
import { auth, requireScopes } from "../middleware/auth.js";
import { Metadata } from "@grpc/grpc-js";

export class DriverRoutes {
  constructor(driverClient) {
    this.driversClient = driverClient.client
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
    this.router = Router()
    this.router.post("/drivers", auth, requireScopes("drivers:create"), (req, res) => {
      const { user_id, full_name, license_number, capabilities, availability } = req.body;

      const request = {
        user_id,
        full_name,
        license_number,
        capabilities: this.toInt(capabilities, 1),
        availability: this.toInt(availability, 1),
      };

      this.driversClient.CreateDriver(request, this.mdFromHttp(req), (err, response) => {
        if (err) return mapGrpcError(err, res);
        res.json(response);
      });
    });

    /** GET /drivers - Listar conductores */
    this.router.get("/drivers", auth, requireScopes("drivers:read:all"), (req, res) => {
      const { availability, page, page_size } = req.query;

      const request = {
        availability: availability ? this.toInt(availability, 0) : 0,
        page: this.toInt(page, 1),
        pageSize: this.toInt(page_size, 20),
      };

      this.driversClient.ListDrivers(request, this.mdFromHttp(req), (err, response) => {
        if (err) return mapGrpcError(err, res);
        res.json(response);
      });
    });

    /** GET /drivers/:id - Obtener conductor por ID */
    this.router.get("/drivers/:id", auth, requireScopes("drivers:read:all"), (req, res) => {
      const { id } = req.params;

      this.driversClient.GetDriver({ id }, this.mdFromHttp(req), (err, response) => {
        if (err) return mapGrpcError(err, res);
        res.json(response);
      });
    });

    /** GET /me/profile-status - Verificar estado del perfil (siempre 200 OK) */
    this.router.get("/me/profile-status", auth, requireScopes("drivers:read:own"), (req, res) => {
      this.driversClient.GetMyDriver({}, this.mdFromHttp(req), (err, response) => {
        if (err) {
          // Si el perfil no existe (NOT_FOUND), no es un error - es estado esperado
          if (err.code === 5 && (err.message?.includes("DRIVER_NOT_FOUND") || err.message?.includes("NOT_FOUND"))) {
            return res.status(200).json({
              driver: {
                exists: false,
                isComplete: false
              }
            });
          }
          // Otros errores también se reportan como perfil no disponible
          console.warn("⚠️ Error verificando perfil de conductor:", err.message);
          return res.status(200).json({
            driver: {
              exists: false,
              isComplete: false,
              error: err.message
            }
          });
        }
        // Si existe y tiene datos, considerarlo completo
        const isComplete = !!(response.driver?.full_name && response.driver?.license_number);
        res.status(200).json({
          driver: {
            exists: true,
            isComplete
          }
        });
      });
    });

    /** GET /me/driver - Obtener mi conductor */
    this.router.get("/me/driver", auth, requireScopes("drivers:read:own"), (req, res) => {
      this.driversClient.GetMyDriver({}, this.mdFromHttp(req), (err, response) => {
        if (err) {
          // Caso especial: perfil de conductor no encontrado (estado esperado, no es error del sistema)
          if (err.code === 5 && (err.message?.includes("DRIVER_NOT_FOUND") || err.message?.includes("NOT_FOUND"))) {
            return res.status(404).json({
              code: "DRIVER_PROFILE_INCOMPLETE",
              message: "El conductor no ha completado su perfil"
            });
          }
          // Para otros errores, usar el mapeo estándar
          return mapGrpcError(err, res);
        }
        res.json(response);
      });
    });

    /** PATCH /drivers/:id/availability - Actualizar disponibilidad */
    this.router.patch("/drivers/:id/availability", auth, (req, res) => {
      const { id } = req.params;
      const { availability } = req.body;

      const request = { id, availability: this.toInt(availability, NaN) };

      this.driversClient.UpdateAvailability(request, this.mdFromHttp(req), (err, response) => {
        if (err) return mapGrpcError(err, res);
        res.json(response);
      });
    });

    /** PATCH /drivers/:id - Actualizar conductor completo */
    this.router.patch("/drivers/:id", auth, requireScopes("drivers:update"), (req, res) => {
      const { id } = req.params;
      const { full_name, license_number, capabilities, availability } = req.body;

      const request = {
        id,
        full_name,
        license_number,
        capabilities: this.toInt(capabilities, 1),
        availability: this.toInt(availability, 1),
      };

      this.driversClient.UpdateDriver(request, this.mdFromHttp(req), (err, response) => {
        if (err) return mapGrpcError(err, res);
        res.json(response);
      });
    });

    /** DELETE /drivers/:id - Eliminar conductor */
    this.router.delete("/drivers/:id", auth, requireScopes("drivers:update"), (req, res) => {
      const { id } = req.params;

      const request = { id };

      this.driversClient.DeleteDriver(request, this.mdFromHttp(req), (err, response) => {
        if (err) return mapGrpcError(err, res);
        res.status(204).send(); // No Content
      });
    });
  }
}