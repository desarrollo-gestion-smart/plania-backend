import express from "express";
import { createScheduleController, updateScheduleController, deleteScheduleController, listSchedulesController } from "../controllers/schedulesController.js";
import { authenticateToken, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

router.post("/schedules", authenticateToken, authorizeRoles("business"), createScheduleController);
router.patch("/schedules/:scheduleId", authenticateToken, authorizeRoles("business"), updateScheduleController);
router.delete("/schedules/:scheduleId", authenticateToken, authorizeRoles("business"), deleteScheduleController);
router.get("/schedules/:businessId", authenticateToken, listSchedulesController);

export default router;
