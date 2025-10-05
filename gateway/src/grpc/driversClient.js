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

  const raw = req.headers.authorization || req.headers.Authorization;
  if (raw) {
    // Reenviar tal cual (o asegurar Bearer)
    const hasBearer = /^Bearer\s+/i.test(raw);
    const headerToSend = hasBearer ? raw : `Bearer ${raw.trim()}`;
    metadata.add('authorization', headerToSend);
    console.log('🔍 gRPC metadata - Authorization:', headerToSend.substring(0, 27) + '...');
  }

  return metadata;
};


// Exportar grpc para uso en otros archivos
export { grpc };
