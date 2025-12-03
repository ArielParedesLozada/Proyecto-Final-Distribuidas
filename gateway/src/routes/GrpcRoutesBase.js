import { Metadata } from "@grpc/grpc-js";

export class GrpcRoutesBase {
    constructor(client, serviceName) {
        this.client = client;
        this.serviceName = serviceName;
    }

    async grpc(res) {
        // Solo hacer retry si el cliente no está disponible
        if (!this.client.client) {
            await this.client.retryClient();
        }
        const client = this.client.client;
        if (!client) {
            res.status(503).json({
                error: `${this.serviceName} unavailable`,
                message: "The service is down or unreachable"
            });
            return null;
        }
        return client;
    }

    /**
     * Helper estándar para metadata (similar a metaFromReq)
     */
    mdFromHttp(req) {
        const metadata = new Metadata();
        const authz = req.headers.authorization || req.headers.Authorization;
        if (authz) {
            metadata.add("authorization", Array.isArray(authz) ? authz[0] : authz);
        }
        return metadata;
    }


    toInt(v, def) {
        const n = parseInt(v, 10);
        return Number.isFinite(n) ? n : def;
    }
    toDouble(v, def) {
        const n = parseFloat(v);
        return Number.isFinite(n) ? n : def;
    }
}
