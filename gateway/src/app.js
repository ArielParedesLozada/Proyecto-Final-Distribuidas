// gateway/src/app.js
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';
import driversRouter from './routes/drivers.js';
import crypto from 'crypto';

// 📦 Cargar SOLO config.env (override cualquier otra fuente)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../config.env'), override: true });

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

// 1) PROXY /auth SIN body parser antes
app.use('/auth', createProxyMiddleware({
  target: process.env.AUTH_SERVICE || 'http://localhost:5121',
  changeOrigin: true,
  // ⚠️ Desactiva pathRewrite por defecto. Actívalo SOLO si tu AuthService espera /login (sin /auth).
  // pathRewrite: { '^/auth': '' },
  proxyTimeout: 15000,
  timeout: 15000,
}));

// 2) Body parser solo para tus rutas propias
app.use(express.json());

// Rutas propias
app.use('/', driversRouter);

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
