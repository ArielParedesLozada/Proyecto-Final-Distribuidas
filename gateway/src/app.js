// api-gateway.js
import express from "express";
import cors from "cors";
import { createProxyMiddleware } from "http-proxy-middleware";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
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

app.use(
  "/chofer",
  proxyWithBody(process.env.CHOFER_SERVICE || "http://localhost:5122", {
    "^/chofer": "",
  })
);

// Ruta propia de prueba
app.get("/", (req, res) => {
  res.json({ message: "API Gateway funcionando 🚀" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚪 API Gateway corriendo en http://localhost:${PORT}`);
});
