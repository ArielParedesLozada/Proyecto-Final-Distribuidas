import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import AdminRoutes from "./routes/AdminRoutes.js";
import AuthRoutes from "./routes/AuthRoutes.js";
import ChoferRoutes from "./routes/ChoferRoutes.js";


dotenv.config();

const app = express();
app.use(cors());
// 👀 NO uses express.json() globalmente porque rompe el streaming hacia el proxy

app.use(ChoferRoutes)
app.use(AuthRoutes)
app.use(AdminRoutes)

// Ruta propia de prueba
app.get("/", (req, res) => {
  res.json({ message: "API Gateway funcionando 🚀" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚪 API Gateway corriendo en http://localhost:${PORT}`);
});
