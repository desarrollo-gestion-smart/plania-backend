import express from "express";
import { createAppointmentController, listAppointmentsByBusiness } from "../controllers/appointmentsController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// ─── Rutas protegidas ──────────────────────────────────────────────────
// Crear una cita (cualquier usuario autenticado)
router.post("/appointments", authenticateToken, createAppointmentController);

// Listar citas por businessId (cualquier usuario autenticado)
router.get("/appointments/:businessId", authenticateToken, listAppointmentsByBusiness);

export default router;