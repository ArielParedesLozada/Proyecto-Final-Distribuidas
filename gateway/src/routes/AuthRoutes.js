import express from "express";
import { ProxyFactory } from "../middleware/BodyProxy.js";

const router = express.Router();
const authProxy = ProxyFactory.create(
    process.env.AUTH_SERVICE || "http://localhost:5121",
    { "^/auth": "" }
)
router.use("/auth", authProxy);

export default router;