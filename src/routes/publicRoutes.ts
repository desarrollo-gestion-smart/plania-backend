import express from "express";
import { getPublicBusinessInfo, getPublicServices, getPublicStaff, getPublicSchedules, getPublicBookings } from "../controllers/publicController.js";

const router = express.Router();

// ─── Rutas públicas (sin autenticación) ───────────────────────────────────
// GET /api/business/:businessId/public-info
router.get("/business/:businessId/public-info", getPublicBusinessInfo);

// GET /api/public/services/:businessId
router.get("/public/services/:businessId", getPublicServices);

// GET /api/public/staff/:businessId
router.get("/public/staff/:businessId", getPublicStaff);

// GET /api/public/schedules/:businessId
router.get("/public/schedules/:businessId", getPublicSchedules);

// GET /api/bookings/:businessId
router.get("/bookings/:businessId", getPublicBookings);

export default router;
