import express from "express";
import { processChat } from "../controllers/aiController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.post("/chat", requireAuth, processChat);

export default router;
