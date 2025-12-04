import { Router } from "express";
import express from "express";
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
        // No parsear body aquí - el proxy manejará el stream original
        // Usar un middleware que preserve el stream pero permita leer el body si es necesario
        this.router.use(this.routeDef, (req, res, next) => {
            // Guardar el stream original si no ha sido consumido
            if (!req._readableState || !req._readableState.ended) {
                // El stream está disponible para el proxy
                console.log(`[CommonRoutes] Stream disponible para ${req.method} ${req.path}`);
            }
            next();
        });
        
        this.router.use(
            this.routeDef,
            async (req, res, next) => {
                console.log(`[CommonRoutes] ${this.serviceName} - ${req.method} ${req.path}`);
                
                const { host, port } = await this.serviceDiscovery.getInstance(this.serviceName)
                if (!host) {
                    console.error(`[CommonRoutes] ${this.serviceName} no disponible`);
                    return res.status(503).json({
                        error: `${this.serviceName} unavailable`,
                        message: "The service is down or unreachable"
                    });
                }
                console.log(`[CommonRoutes] Proxying a ${this.serviceName} en http://${host}:${port}`);
                
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