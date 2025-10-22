// eureka/ServiceDiscovery.js
export class ServiceDiscovery {
    constructor(eurekaClient) {
        this.eurekaClient = eurekaClient.client;
    }

    /**
     * Obtiene una instancia de servicio registrada en Eureka
     * @param {string} serviceName - nombre del servicio (por ejemplo, "AUTH-SERVICE")
     * @returns {object|null} instancia con { host, port }
     */
    async getInstance(serviceName) {        
        const appInfo = await this.eurekaClient.getInstancesByAppId(serviceName.toUpperCase());
        if (!appInfo || appInfo.length === 0) {
            console.error(`⚠️ Servicio ${serviceName} no encontrado en Eureka`);
            return null;
        }

        // Selección simple (podrías usar round-robin o aleatoria)
        const instance = appInfo[Math.floor(Math.random() * appInfo.length)];
        const host = instance.hostName || instance.ipAddr;
        const port = instance.port.$;
        return { host, port };
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
     */
    getGrpcAddress(serviceName) {
        const instance = this.getInstance(serviceName);
        if (!instance) return null;
        return `${instance.host}:${instance.port}`;
    }
}
