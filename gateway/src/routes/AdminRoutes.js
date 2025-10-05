import express from "express";
import { ProxyFactory } from "../middleware/BodyProxy.js";

const router = express.Router();
const adminProxy = ProxyFactory.create(
    process.env.ADMIN_SERVICE || "http://localhost:5123",
    { "^/admin": "" }
)
router.use("/admin", adminProxy);

export default router;