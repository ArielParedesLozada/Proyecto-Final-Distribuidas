import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar el archivo proto
const protoPath = process.env.VEHICLES_PROTO || '../services/VehicleService/Protos/vehicles.proto';
const packageDefinition = protoLoader.loadSync(protoPath, {
  keepCase: true,
  defaults: true,
  oneofs: true
});

const grpcObj = grpc.loadPackageDefinition(packageDefinition);

// Crear el cliente gRPC
export const vehiclesClient = new grpcObj.vehicles.v1.VehiclesService(
  process.env.VEHICLES_GRPC_ADDR || "localhost:5124",
  grpc.credentials.createInsecure()
);

// Función para crear metadata desde la request HTTP
export const metaFromReq = (req) => {
  const metadata = new grpc.Metadata();

  const raw = req.headers.authorization || req.headers.Authorization;
  if (raw) {
    metadata.add('authorization', raw); // minúsculas
  }

  return metadata;
};

// Exportar grpc para uso en otros archivos
export { grpc };

