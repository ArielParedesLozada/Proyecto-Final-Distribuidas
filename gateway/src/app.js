import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import { DriverRoutes } from './routes/drivers.js';
import { VehicleRoutes } from './routes/vehicles.js';
import { GeocodingRoutes } from './routes/geocoding.js';
import { EurekaClient } from "./eureka/EurekaClient.js";
import { ServiceDiscovery } from './eureka/ServiceDiscovery.js';
import { VehicleClient } from './grpc/vehiclesClient.js';
import { DriverClient } from './grpc/driversClient.js';
import { CommonRoutes } from './routes/CommonRoutes.js';

// 📦 Cargar SOLO config.env (override cualquier otra fuente)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env'), override: true });

const app = express();
// ✅ CORS explícito (incluye Authorization)
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// 👀 Log rápido para ver si llega Authorization
app.use((req, _res, next) => {
  console.log(`[${req.method}] ${req.path} auth=${req.headers.authorization ? 'yes' : 'no'}`);
  next();
});

//Usa Eureka
const eurekaClient = new EurekaClient({
  name: process.env.APP_NAME || 'api-gateway',
  host: process.env.HOST || 'localhost',
  ipAddr: process.env.IP || '127.0.0.1',
  port: process.env.PORT || 4000,
  eurekaHost: process.env.EUREKA_HOST || 'localhost',
  eurekaPort: process.env.EUREKA_PORT || 8761
})
eurekaClient.start()
await new Promise((resolve, reject) => {
  eurekaClient.client.on('started', () => {
    console.log("✅ Eureka client fully started");
    resolve();
  });
  eurekaClient.client.on('error', reject);
});
const serviceDiscovery = new ServiceDiscovery(eurekaClient)
const authRoutes = new CommonRoutes("AUTH-SERVICE","/auth",serviceDiscovery)
const adminRoutes = new CommonRoutes("ADMIN-SERVICE","/admin",serviceDiscovery)
const routeRoutes = new CommonRoutes("ROUTES-SERVICE","/routes",serviceDiscovery)
const vehicleClient = new VehicleClient(serviceDiscovery, process.env.VEHICLE_PROTO_PATH || "../services/Protos/vehicles.proto")
await vehicleClient.start()
const vehicleRoutes = new VehicleRoutes(vehicleClient)
const driverClient = new DriverClient(serviceDiscovery, process.env.DRIVER_PROTO_PATH || "../services/Protos/drivers.proto")
await driverClient.start()
const driverRoutes = new DriverRoutes(driverClient)
const geocodingRoutes = new GeocodingRoutes()
await adminRoutes.start()
await authRoutes.start()
await vehicleRoutes.start()
await driverRoutes.start()
await routeRoutes.start()
await geocodingRoutes.start()


app.use(adminRoutes.router)
app.use(authRoutes.router)
app.use(routeRoutes.router)
app.use(express.json());
app.use('/', geocodingRoutes.router);
app.use('/', vehicleRoutes.router);
app.use('/', driverRoutes.router);

// Manejador de errores de JWT (express-jwt)
app.use((err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    console.warn('[JWT ERROR]', err.code, err.message);
    return res.status(401).json({ error: 'Unauthorized', code: err.code, message: err.message });
  }
  next(err);
});

app.get('/', (_req, res) => res.json({ message: 'API Gateway funcionando 🚀' }));

const PORT = process.env.PORT || 4000;

// Huella del secreto para verificar que cargó el correcto
const fp = crypto.createHash('sha256')
  .update(process.env.JWT_SECRET || '', 'utf8')
  .digest('hex')
  .slice(0, 16);
console.log('[GATEWAY] JWT_SECRET fp:', fp, 'len:', (process.env.JWT_SECRET || '').length);


app.listen(PORT, () => {
  console.log(`🚪 API Gateway corriendo en http://localhost:${PORT}`);
});
