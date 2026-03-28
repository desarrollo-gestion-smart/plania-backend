import express from "express";
import { createAppointmentController, listAppointmentsByBusiness, listClientsByBusinessController, listAppointmentsByClientIdController, updateAppointmentStateController, updateAppointmentCalificacionController, rescheduleAppointmentController, appointmentTimerStreamController, deleteAppointmentController } from "../controllers/appointmentsController.js";
import { authenticateToken, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

// ─── Rutas protegidas ──────────────────────────────────────────────────
// Crear una cita (cualquier usuario autenticado)
router.post("/appointments", authenticateToken, createAppointmentController);

// Listar citas por businessId (solo business o staff)
router.get("/appointments/:businessId", authenticateToken, authorizeRoles("business", "staff", "user"), listAppointmentsByBusiness);

// Listar clientes segmentados (todos, mejores, noTeVisitan, noHanVuelto) por businessId
router.get("/appointments/:businessId/list-client", authenticateToken, authorizeRoles("business", "staff"), listClientsByBusinessController);

// Listar citas por clientId (userId del cliente)
router.get("/appoiments/:clientId", authenticateToken, authorizeRoles("user", "business", "staff"), listAppointmentsByClientIdController);

// Actualizar estado de una cita (business o staff)
router.patch("/appointments/:appointmentId/state", authenticateToken, authorizeRoles("business", "staff"), updateAppointmentStateController);

// Actualizar calificación y descripción de una cita
router.patch("/appointments/:appointmentsId/calificacion", authenticateToken, authorizeRoles("user", "business", "staff"), updateAppointmentCalificacionController);

// Reprogramar cita por fecha y horario
router.patch("/appointments/:appointmentId/reschedule", authenticateToken, authorizeRoles("business", "staff"), rescheduleAppointmentController);

// Cronómetro SSE para una cita (business o staff)
router.get("/appointments/:appointmentId/timer", authenticateToken, authorizeRoles("business", "staff"), appointmentTimerStreamController);

// Eliminar una cita (business o staff)
router.delete("/appointments/:appointmentId", authenticateToken, authorizeRoles("business", "staff"), deleteAppointmentController);

export default router;
