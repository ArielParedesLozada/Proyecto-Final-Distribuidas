import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar el archivo proto
const protoPath = process.env.DRIVERS_PROTO || '../services/ChoferService/Protos/drivers.proto';
const packageDefinition = protoLoader.loadSync(protoPath, {
  keepCase: true,
  defaults: true,
  oneofs: true
});

const grpcObj = grpc.loadPackageDefinition(packageDefinition);

// Crear el cliente gRPC
export const driversClient = new grpcObj.drivers.v1.DriversService(
  process.env.DRIVERS_GRPC_ADDR || "localhost:5122",
  grpc.credentials.createInsecure()
);

// Función para crear metadata desde la request HTTP
export const metaFromReq = (req) => {
  const metadata = new grpc.Metadata();
  
  if (req.headers.authorization) {
    metadata.add('authorization', req.headers.authorization);
  }
  
  return metadata;
};

// Exportar grpc para uso en otros archivos
export { grpc };
