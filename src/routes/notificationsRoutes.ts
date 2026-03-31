import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import { savePushToken, saveBusinessPushToken, sendChatNotification, sendAppointmentNotification } from "../controllers/notificationsController.js";

const router = express.Router();

// POST /api/users/:userId/push-token
router.post("/users/:userId/push-token", authenticateToken, savePushToken);

// POST /api/businesses/:businessId/push-token
router.post("/businesses/:businessId/push-token", authenticateToken, saveBusinessPushToken);

// POST /api/notifications/chat
router.post("/notifications/chat", authenticateToken, sendChatNotification);

// POST /api/notifications/appointment
router.post("/notifications/appointment", authenticateToken, sendAppointmentNotification);

export default router;
