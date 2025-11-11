import express from "express";
import { ProxyFactory } from "../middleware/BodyProxy.js";

export class RoutesRoutes {
  constructor(serviceDiscovery) {
    this.serviceDiscovery = serviceDiscovery
  }

  async start() {
    const { host, port } = await this.serviceDiscovery.getInstance("ROUTES-SERVICE")
    this.router = express.Router();
    const routesProxy = ProxyFactory.create(
      `http://${host}:${port}`,
      { "^/routes": "" }
    )

    this.router.use(
      "/routes",
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
      routesProxy
    );
  }
}