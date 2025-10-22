import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";

export class VehicleClient {
  constructor(serviceDiscovery, protoPath) {
    this.serviceDiscovery = serviceDiscovery;
    this.protoPath = protoPath
  }

  async start() {
    // Esperar instancia registrada en Eureka
    const { host, port } = await this.serviceDiscovery.getInstance("VEHICLE-SERVICE");
    if (!host || !port) {
      throw new Error("❌ No se encontró VEHICLE-SERVICE en Eureka");
    }

    const packageDefinition = protoLoader.loadSync(this.protoPath, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });

    const grpcObj = grpc.loadPackageDefinition(packageDefinition);
    this.client = new grpcObj.vehicles.v1.VehiclesService(
      `${host}:${port}`,
      grpc.credentials.createInsecure()
    );

    console.log("✅ VehicleService gRPC client inicializado");
  }

  getClient() {
    if (!this.client)
      throw new Error("VehicleClient no inicializado. Llama a start() antes de usarlo.");
    return this.client;
  }

  static metaFromReq(req) {
    const metadata = new grpc.Metadata();
    const authz = req.headers.authorization || req.headers.Authorization;
    if (authz) {
      metadata.add("authorization", Array.isArray(authz) ? authz[0] : authz);
    }
    return metadata;
  }
}
