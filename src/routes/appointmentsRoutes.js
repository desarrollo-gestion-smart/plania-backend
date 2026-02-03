import express from "express";
import { createAppointmentController, listAppointmentsByBusiness } from "../controllers/appointmentsController.js";

const router = express.Router();

// Crear una cita
router.post("/appointments", createAppointmentController);

// Listar citas por businessId
router.get("/appointments/:businessId", listAppointmentsByBusiness);

export default router;