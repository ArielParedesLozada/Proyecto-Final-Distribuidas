import { Router } from "express";
import { driversClient, metaFromReq } from "../grpc/driversClient.js";
import { mapGrpcError } from "../utils/mapGrpcError.js";
import { auth, requireScopes } from "../middleware/auth.js";

const router = Router();

// POST /drivers - Crear conductor
router.post("/drivers", auth, requireScopes("drivers:create"), (req, res) => {
  const { user_id, full_name, license_number, capabilities, availability } = req.body;
  
  const request = {
    user_id,
    full_name,
    license_number,
    capabilities: parseInt(capabilities) || 1,
    availability: parseInt(availability) || 1
  };
  
  driversClient.CreateDriver(request, metaFromReq(req), (err, response) => {
    if (err) return mapGrpcError(err, res);
    res.json(response);
  });
});

// GET /drivers - Listar conductores
router.get("/drivers", auth, requireScopes("drivers:read:all"), (req, res) => {
  const { availability, page, page_size } = req.query;
  
  const request = {
    availability: availability ? parseInt(availability) : 0,
    page: page ? parseInt(page) : 1,
    pageSize: page_size ? parseInt(page_size) : 20
  };
  
  driversClient.ListDrivers(request, metaFromReq(req), (err, response) => {
    if (err) return mapGrpcError(err, res);
    res.json(response);
  });
});

// GET /drivers/:id - Obtener conductor por ID
router.get("/drivers/:id", auth, requireScopes("drivers:read:all"), (req, res) => {
  const { id } = req.params;
  
  const request = { id };
  
  driversClient.GetDriver(request, metaFromReq(req), (err, response) => {
    if (err) return mapGrpcError(err, res);
    res.json(response);
  });
});

// GET /me/driver - Obtener mi conductor
router.get("/me/driver", auth, requireScopes("drivers:read:own"), (req, res) => {
  const request = {};
  
  driversClient.GetMyDriver(request, metaFromReq(req), (err, response) => {
    if (err) return mapGrpcError(err, res);
    res.json(response);
  });
});

// PATCH /drivers/:id/availability - Actualizar disponibilidad
router.patch("/drivers/:id/availability", auth, (req, res) => {
  const { id } = req.params;
  const { availability } = req.body;
  
  const request = {
    id,
    availability: parseInt(availability)
  };
  
  driversClient.UpdateAvailability(request, metaFromReq(req), (err, response) => {
    if (err) return mapGrpcError(err, res);
    res.json(response);
  });
});

export default router;
