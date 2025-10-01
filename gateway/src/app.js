import express from "express";
import cors from "cors";
import { createProxyMiddleware } from "http-proxy-middleware";
import dotenv from "dotenv";

dotenv.config();

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

app.use(
  "/chofer",
  createProxyMiddleware({
    target: process.env.CHOFER_SERVICE || "http://localhost:5122",
    changeOrigin: true,
    pathRewrite: { "^/chofer": "" },
  })
);

app.get("/", (req, res) => {
  res.json({ message: "API Gateway funcionando 🚀" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚪 API Gateway corriendo en http://localhost:${PORT}`);
});
