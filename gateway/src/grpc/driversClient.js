import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';

export class DriverClient {
  constructor(serviceDiscovery, protoPath) {
    this.serviceDiscovery = serviceDiscovery
    this.protoPath = protoPath
  }

  async start() {
    const { host, port } = await this.serviceDiscovery.getInstance("DRIVER-SERVICE")
    if (!host || !port) {
      throw new Error("❌ No se encontró DRIVER-SERVICE en Eureka");
    }
    const packageDefinition = protoLoader.loadSync(this.protoPath, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true
    });
    const grpcObj = grpc.loadPackageDefinition(packageDefinition)
    this.client = new grpcObj.drivers.v1.DriversService(
      `${host}:${port}`,
      grpc.credentials.createInsecure()
    )
  }
  static metaFromReq(req) {
    const metadata = new grpc.Metadata();
    const authz = req.headers.authorization || req.headers.Authorization;
    if (authz) {
      metadata.add("authorization", Array.isArray(authz) ? authz[0] : authz);
    }
    return metadata;
  }
  getClient() {
    if (!this.client)
      throw new Error("DriverClient no inicializado. Llama a start() antes de usarlo.");
    return this.client;
  }
}