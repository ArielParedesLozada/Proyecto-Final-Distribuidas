import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import driversRouter from './routes/drivers.js';
import vehiclesRouter from './routes/vehicles.js';
import AdminRoutes from "./routes/AdminRoutes.js";
import AuthRoutes from "./routes/AuthRoutes.js";
import { EurekaClient } from "./eureka/EurekaClient.js";

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

app.use(AuthRoutes)
app.use(AdminRoutes)

// 2) Body parser solo para tus rutas propias
app.use(express.json());

// Rutas propias
app.use('/', driversRouter);
app.use('/', vehiclesRouter);

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

eurekaClient.start()

app.listen(PORT, () => {
  console.log(`🚪 API Gateway corriendo en http://localhost:${PORT}`);
});
