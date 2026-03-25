import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import { savePushToken, sendChatNotification } from "../controllers/notificationsController.js";

const router = express.Router();

// POST /api/users/:userId/push-token
router.post("/users/:userId/push-token", authenticateToken, savePushToken);

// POST /api/notifications/chat
router.post("/notifications/chat", authenticateToken, sendChatNotification);

export default router;
