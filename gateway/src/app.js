import 'dotenv/config';
import express from "express";
import cors from "cors";
import { createProxyMiddleware } from "http-proxy-middleware";
import driversRouter from "./routes/drivers.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use(
  "/auth",
  createProxyMiddleware({
    target: process.env.AUTH_SERVICE || "http://localhost:5121",
    changeOrigin: true,
    pathRewrite: { "^/auth": "" },
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
