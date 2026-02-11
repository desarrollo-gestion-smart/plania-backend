import express from "express";
import multer from "multer";
import { addStaffMember, getStaff, getStaffIds, loginStaffMember, uploadStaffAvatar, updateStaffMember, getStaffName } from "../controllers/staffController.js";
import { authenticateToken, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// ─── Ruta pública ──────────────────────────────────────────────────────
// POST /api/login-staff
router.post("/login-staff", loginStaffMember);

// ─── Rutas protegidas ──────────────────────────────────────────────────
// POST /api/add-staff (solo business puede agregar staff)
router.post("/add-staff", authenticateToken, authorizeRoles("business"), addStaffMember);

// GET /api/get-staff/:businessId
router.get("/get-staff/:businessId", authenticateToken, getStaff);

// GET /api/get-staff-ids/:businessId
router.get("/get-staff-ids/:businessId", authenticateToken, getStaffIds);

// POST /api/upload-staff-avatar
router.post("/upload-staff-avatar", authenticateToken, authorizeRoles("business", "staff"), upload.single("image"), uploadStaffAvatar);

// PUT /api/update-staff
router.put("/update-staff", authenticateToken, authorizeRoles("business", "staff"), updateStaffMember);

// GET /api/get-staff-name/:id
router.get("/get-staff-name/:id", authenticateToken, getStaffName);

export default router;