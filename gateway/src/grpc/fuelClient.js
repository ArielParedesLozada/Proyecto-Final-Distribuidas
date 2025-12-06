import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class FuelClient {
  constructor(serviceDiscovery, protoPath) {
    this.serviceDiscovery = serviceDiscovery;
    this.protoPath = protoPath;
  }

  async start() {
    // Obtener dirección gRPC (usa grpcPort de metadata si está disponible)
    console.log('[FuelClient] Intentando obtener dirección gRPC para FUEL-SERVICE...');
    const grpcAddress = await this.serviceDiscovery.getGrpcAddress("FUEL-SERVICE");
    if (!grpcAddress) {
      console.log(`[FuelClient] ⚠️ FUEL-SERVICE not found or no gRPC port available`);
      this.client = null;
      return;
    }
    console.log(`[FuelClient] ✅ Dirección gRPC obtenida: ${grpcAddress}`);
    
    // Resolver rutas absolutas para los protos
    // __dirname es gateway/src/grpc, el protoPath es relativo desde gateway/
    // Necesitamos ir al directorio raíz del proyecto
    const projectRoot = path.resolve(__dirname, '../../');
    const resolvedProtoPath = path.resolve(projectRoot, this.protoPath);
    const protoRoot = path.dirname(resolvedProtoPath); // services/Protos
    
    const packageDefinition = protoLoader.loadSync(resolvedProtoPath, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
      includeDirs: [protoRoot],
    });

    const grpcObj = grpc.loadPackageDefinition(packageDefinition);
    this.client = new grpcObj.fuel.v1.FuelService(
      grpcAddress,
      grpc.credentials.createInsecure()
    );
    console.log(`[FuelClient] ✅ Cliente gRPC inicializado para ${grpcAddress}`);
  }

  getClient() {
    if (!this.client)
      throw new Error("FuelClient no inicializado. Llama a start() antes de usarlo.");
    return this.client;
  }

  async retryClient() {
    // Obtener dirección gRPC (usa grpcPort de metadata si está disponible)
    console.log('[FuelClient] Reintentando obtener dirección gRPC para FUEL-SERVICE...');
    const grpcAddress = await this.serviceDiscovery.getGrpcAddress("FUEL-SERVICE");
    if (!grpcAddress) {
      console.log(`[FuelClient] ⚠️ FUEL-SERVICE not found or no gRPC port available`);
      this.client = null;
      return;
    }
    console.log(`[FuelClient] ✅ Dirección gRPC obtenida en retry: ${grpcAddress}`);
    
    // Resolver rutas absolutas para los protos
    // __dirname es gateway/src/grpc, el protoPath es relativo desde gateway/
    // Necesitamos ir al directorio raíz del proyecto
    const projectRoot = path.resolve(__dirname, '../../');
    const resolvedProtoPath = path.resolve(projectRoot, this.protoPath);
    const protoRoot = path.dirname(resolvedProtoPath); // services/Protos
    
    const packageDefinition = protoLoader.loadSync(resolvedProtoPath, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
      includeDirs: [protoRoot],
    });

    const grpcObj = grpc.loadPackageDefinition(packageDefinition);
    this.client = new grpcObj.fuel.v1.FuelService(
      grpcAddress,
      grpc.credentials.createInsecure()
    );
    console.log(`[FuelClient] ✅ Cliente gRPC inicializado en retry para ${grpcAddress}`);
  }
}

