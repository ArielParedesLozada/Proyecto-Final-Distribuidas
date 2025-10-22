import express from "express";
import { ProxyFactory } from "../middleware/BodyProxy.js";

export class AuthRoutes {
  constructor(serviceDiscovery) {
    this.serviceDiscovery = serviceDiscovery
  }

  async start() {
    const { host, port } = await this.serviceDiscovery.getInstance("AUTH-SERVICE")
    this.router = express.Router();
    const authProxy = ProxyFactory.create(
      `http://${host}:${port}`,
      { "^/auth": "" }
    )

    this.router.use(
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
  }
}