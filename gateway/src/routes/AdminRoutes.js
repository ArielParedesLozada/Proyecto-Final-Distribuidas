import express from "express";
import { ProxyFactory } from "../middleware/BodyProxy.js";

export class AdminRoutes {
    constructor(serviceDiscovery) {
        this.serviceDiscovery = serviceDiscovery
    }
    
    async start(){        
        const { host, port } = await this.serviceDiscovery.getInstance("ADMIN-SERVICE")
        this.router = express.Router();
        const adminProxy = ProxyFactory.create(
            `http://${host}:${port}`,
            { "^/admin": "" }
        )
        this.router.use("/admin", adminProxy);
    }
}
