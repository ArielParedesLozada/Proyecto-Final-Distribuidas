import express from "express";
import { ProxyFactory } from "../middleware/BodyProxy.js";

const router = express.Router();
const choferProxy = ProxyFactory.create(
    process.env.CHOFER_SERVICE || "http://localhost:5122",
    { "^/chofer": "" }
)
router.use("/chofer", choferProxy);

export default router;