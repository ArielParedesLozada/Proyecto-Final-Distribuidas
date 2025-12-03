import { CircuitBreaker } from "../utils/CircuitBreaker.js";

export class ServiceDiscovery {
    constructor(eurekaClient) {
        this.eurekaClient = eurekaClient.client;
        this.circuitBreaker = new CircuitBreaker()
    }

    /**
     * Obtiene una instancia de servicio registrada en Eureka
     * @param {string} serviceName - nombre del servicio (por ejemplo, "AUTH-SERVICE")
     * @returns {object|null} instancia con { host, port }
     */
    async getInstance(serviceName) {
        const name = serviceName.toUpperCase();
        const cached = this.circuitBreaker.getCache(name);
        if (cached) return cached;
        if (!this.circuitBreaker.canRequest(name)) {
            return { host: null, port: null };
        }

        try {
            const instances = await this.eurekaClient.getInstancesByAppId(name);

            if (!instances || instances.length === 0) {
                throw new Error(`No instances for ${name}`);
            }

            const instance = instances[Math.floor(Math.random() * instances.length)];

            const host = instance.hostName || instance.ipAddr;
            // Usar httpPort de metadata si está disponible, sino usar el puerto principal
            let port = instance.port.$;
            if (instance.metadata && instance.metadata.httpPort) {
                port = parseInt(instance.metadata.httpPort, 10);
                console.log(`[ServiceDiscovery] ${name} usando httpPort de metadata: ${port} (puerto principal: ${instance.port.$})`);
            } else {
                console.log(`[ServiceDiscovery] ${name} usando puerto principal: ${port} (metadata:`, instance.metadata, ')');
            }

            const result = { host, port };
            this.circuitBreaker.registerSuccess(name);
            this.circuitBreaker.saveCache(name, result);

            return result;

        } catch (err) {
            console.error(`⚠️ Error descubriendo ${name}:`, err.message);
            this.circuitBreaker.registerFailure(name);

            return { host: null, port: null };
        }
    }

    /**
     * Construye una URL base completa para servicios HTTP
     */
    getBaseUrl(serviceName) {
        const instance = this.getInstance(serviceName);
        if (!instance) return null;
        return `http://${instance.host}:${instance.port}`;
    }

    /**
     * Construye una dirección gRPC (host:port)
     * Usa grpcPort de metadata si está disponible
     */
    async getGrpcAddress(serviceName) {
        const name = serviceName.toUpperCase();
        try {
            const instances = await this.eurekaClient.getInstancesByAppId(name);
            if (!instances || instances.length === 0) {
                return null;
            }
            const instance = instances[Math.floor(Math.random() * instances.length)];
            const host = instance.hostName || instance.ipAddr;
            // Usar grpcPort de metadata si está disponible, sino usar el puerto principal
            let port = instance.port.$;
            if (instance.metadata && instance.metadata.grpcPort) {
                port = parseInt(instance.metadata.grpcPort, 10);
            }
            return `${host}:${port}`;
        } catch (err) {
            console.error(`⚠️ Error obteniendo dirección gRPC para ${name}:`, err.message);
            return null;
        }
    }
}
