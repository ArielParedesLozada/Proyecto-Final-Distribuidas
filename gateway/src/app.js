import 'dotenv/config';
import express from "express";
import cors from "cors";
import { createProxyMiddleware } from "http-proxy-middleware";
import driversRouter from "./routes/drivers.js";

const app = express();
app.use(cors());

// 1) PROXY /auth SIN body parser antes
app.use('/auth', createProxyMiddleware({
  target: process.env.AUTH_SERVICE || "http://localhost:5121",
  changeOrigin: true,
  // ❗ Normalmente NO necesitas pathRewrite; deja que pase /auth/login tal cual.
  // Si tu servicio ASP.NET ya mapea [Route("auth")] + [HttpPost("login")],
  // quita pathRewrite por completo.
  // pathRewrite: { '^/auth': '' }, // <-- Usa esto SOLO si el backend espera /login (sin /auth).
  proxyTimeout: 15000,
  timeout: 15000,
}));

// 2) Body parser solo para tus rutas propias
app.use(express.json());
app.use('/', driversRouter);

app.get("/", (req, res) => res.json({ message: "API Gateway funcionando 🚀" }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚪 API Gateway corriendo en http://localhost:${PORT}`));
