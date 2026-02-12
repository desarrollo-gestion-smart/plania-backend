import express from "express";
import { createAppointmentController, listAppointmentsByBusiness, updateAppointmentStateController } from "../controllers/appointmentsController.js";
import { authenticateToken, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

// ─── Rutas protegidas ──────────────────────────────────────────────────
// Crear una cita (cualquier usuario autenticado)
router.post("/appointments", authenticateToken, createAppointmentController);

// Listar citas por businessId (cualquier usuario autenticado)
router.get("/appointments/:businessId", authenticateToken, listAppointmentsByBusiness);

// Actualizar estado de una cita (business o staff)
router.patch("/appointments/:appointmentId/state", authenticateToken, authorizeRoles("business", "staff"), updateAppointmentStateController);

export default router;