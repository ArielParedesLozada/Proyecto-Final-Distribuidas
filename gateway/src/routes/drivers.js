// src/routes/drivers.js
import { Router } from "express";
import { driversClient } from "../grpc/driversClient.js";
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

/** POST /drivers - Crear conductor */
router.post("/drivers", auth, requireScopes("drivers:create"), (req, res) => {
  const { user_id, full_name, license_number, capabilities, availability } = req.body;

  const request = {
    user_id,
    full_name,
    license_number,
    capabilities: toInt(capabilities, 1),
    availability: toInt(availability, 1),
  };

  driversClient.CreateDriver(request, mdFromHttp(req), (err, response) => {
    if (err) return mapGrpcError(err, res);
    res.json(response);
  });
});

/** GET /drivers - Listar conductores */
router.get("/drivers", auth, requireScopes("drivers:read:all"), (req, res) => {
  const { availability, page, page_size } = req.query;

  const request = {
    availability: availability ? toInt(availability, 0) : 0,
    page: toInt(page, 1),
    pageSize: toInt(page_size, 20),
  };

  driversClient.ListDrivers(request, mdFromHttp(req), (err, response) => {
    if (err) return mapGrpcError(err, res);
    res.json(response);
  });
});

/** GET /drivers/:id - Obtener conductor por ID */
router.get("/drivers/:id", auth, requireScopes("drivers:read:all"), (req, res) => {
  const { id } = req.params;

  driversClient.GetDriver({ id }, mdFromHttp(req), (err, response) => {
    if (err) return mapGrpcError(err, res);
    res.json(response);
  });
});

/** GET /me/driver - Obtener mi conductor */
router.get("/me/driver", auth, requireScopes("drivers:read:own"), (req, res) => {
  driversClient.GetMyDriver({}, mdFromHttp(req), (err, response) => {
    if (err) return mapGrpcError(err, res);
    res.json(response);
  });
});

/** PATCH /drivers/:id/availability - Actualizar disponibilidad */
router.patch("/drivers/:id/availability", auth, (req, res) => {
  const { id } = req.params;
  const { availability } = req.body;

  const request = { id, availability: toInt(availability, NaN) };

  driversClient.UpdateAvailability(request, mdFromHttp(req), (err, response) => {
    if (err) return mapGrpcError(err, res);
    res.json(response);
  });
});

/** PATCH /drivers/:id - Actualizar conductor completo */
router.patch("/drivers/:id", auth, requireScopes("drivers:update"), (req, res) => {
  const { id } = req.params;
  const { full_name, license_number, capabilities, availability } = req.body;

  const request = {
    id,
    full_name,
    license_number,
    capabilities: toInt(capabilities, 1),
    availability: toInt(availability, 1),
  };

  driversClient.UpdateDriver(request, mdFromHttp(req), (err, response) => {
    if (err) return mapGrpcError(err, res);
    res.json(response);
  });
});

/** DELETE /drivers/:id - Eliminar conductor */
router.delete("/drivers/:id", auth, requireScopes("drivers:update"), (req, res) => {
  const { id } = req.params;

  const request = { id };

  driversClient.DeleteDriver(request, mdFromHttp(req), (err, response) => {
    if (err) return mapGrpcError(err, res);
    res.status(204).send(); // No Content
  });
});

export default router;
