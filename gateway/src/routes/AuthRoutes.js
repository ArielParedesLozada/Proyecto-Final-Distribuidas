import express from "express";
import { ProxyFactory } from "../middleware/BodyProxy.js";

const router = express.Router();

// Usa AUTH_SERVICE (HTTP) o fallback local y quita barra final
const AUTH_TARGET = (process.env.AUTH_SERVICE || "http://localhost:5121").replace(/\/+$/, "");

// Proxy al AuthService, reescribiendo /auth -> /
const authProxy = ProxyFactory.create(AUTH_TARGET, { "^/auth": "" });

// Asegura que el header Authorization llegue como "authorization" (minúsculas)
router.use(
  "/auth",
  (req, _res, next) => {
    // En Node normalmente ya está en minúsculas, pero por si acaso:
    const upper = req.headers.Authorization;
    const lower = req.headers.authorization;

    const authHeader =
      (typeof lower === "string" && lower) ||
      (typeof upper === "string" && upper) ||
      undefined;

    if (authHeader) {
      req.headers.authorization = authHeader; // fuerza minúsculas
      if (req.headers.Authorization) {
        // elimina posible duplicado en mayúsculas
        delete req.headers.Authorization;
      }
    }
    next();
  },
  authProxy
);

export default router;
