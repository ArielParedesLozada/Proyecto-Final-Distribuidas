import { Router } from "express";
import { ProxyFactory } from "../middleware/BodyProxy.js";

export class CommonRoutes {
    constructor(serviceName, routeDef, serviceDiscovery) {
        this.serviceDiscovery = serviceDiscovery
        this.serviceName = serviceName
        this.routeDef = routeDef
        this.proxy = null
    }

    async start() {
        this.router = Router()
        this.router.use(
            this.routeDef,
            async (req, res, next) => {
                const { host, port } = await this.serviceDiscovery.getInstance(this.serviceName)
                if (!host) {
                    return res.status(503).json({
                        error: `${this.serviceName} unavailable`,
                        message: "The service is down or unreachable"
                    });
                }
                const upper = req.headers.Authorization;
                const lower = req.headers.authorization;
                this.proxy = ProxyFactory.create(
                    `http://${host}:${port}`,
                    { [`^${this.routeDef}`]: "" }
                )
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
                return this.proxy(req, res, next)
            }
        )
    }
}