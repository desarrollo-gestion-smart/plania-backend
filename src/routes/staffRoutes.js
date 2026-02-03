import express from "express";
import multer from "multer";
import { addStaffMember, getStaff, getStaffIds, loginStaffMember, uploadStaffAvatar, updateStaffMember, getStaffName } from "../controllers/staffController.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/add-staff
router.post("/add-staff", addStaffMember);

// GET /api/get-staff/:businessId
router.get("/get-staff/:businessId", getStaff);

// GET /api/get-staff-ids/:businessId
router.get("/get-staff-ids/:businessId", getStaffIds);

// POST /api/login-staff
router.post("/login-staff", loginStaffMember);

// POST /api/upload-staff-avatar
router.post("/upload-staff-avatar", upload.single("image"), uploadStaffAvatar);
// PUT /api/update-staff
router.put("/update-staff", updateStaffMember);
router.get("/get-staff-name/:id", getStaffName);

export default router;