import express from "express";
import { createAppointmentController, listAppointmentsByBusiness, updateAppointmentStateController, appointmentTimerStreamController } from "../controllers/appointmentsController.js";
import { authenticateToken, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

// ─── Rutas protegidas ──────────────────────────────────────────────────
// Crear una cita (cualquier usuario autenticado)
router.post("/appointments", authenticateToken, createAppointmentController);

// Listar citas por businessId (solo business o staff)
router.get("/appointments/:businessId", authenticateToken, authorizeRoles("business", "staff"), listAppointmentsByBusiness);

// Actualizar estado de una cita (business o staff)
router.patch("/appointments/:appointmentId/state", authenticateToken, authorizeRoles("business", "staff"), updateAppointmentStateController);

// Cronómetro SSE para una cita (business o staff)
router.get("/appointments/:appointmentId/timer", authenticateToken, authorizeRoles("business", "staff"), appointmentTimerStreamController);

export default router;
