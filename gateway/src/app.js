import 'dotenv/config';
import express from "express";
import cors from "cors";
import { createProxyMiddleware } from "http-proxy-middleware";
import driversRouter from "./routes/drivers.js";

const app = express();
app.use(cors());
app.use(express.json()); // Necesario para las rutas de drivers
// 👀 NO uses express.json() globalmente porque rompe el streaming hacia el proxy

// 🔥 Middleware para reinyectar el body en el proxy
const proxyWithBody = (target, pathRewrite) =>
  createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite,
    selfHandleResponse: false,
    onProxyReq: (proxyReq, req, res) => {
      if (req.body) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader("Content-Type", "application/json");
        proxyReq.write(bodyData);
      }
    },
  });

// Rutas proxys
app.use(
  "/auth",
  proxyWithBody(process.env.AUTH_SERVICE || "http://localhost:5121", {
    "^/auth": "",
  })
);

app.get("/", (req, res) => {
  res.json({ message: "API Gateway funcionando 🚀" });
});

// Usar las rutas de conductores en lugar del proxy
app.use("/", driversRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚪 API Gateway corriendo en http://localhost:${PORT}`);
});
