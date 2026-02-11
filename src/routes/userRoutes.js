import express from "express";
import multer from "multer";
import { registerUser, verifyUser, resendCode, registerBusiness, loginBusiness, loginBusinessWithPassword, verifyBusiness, resendBusiness, uploadBusinessAvatar, uploadBusinessBanner, configureBusiness, getBusinessInfo, getUsers, deleteBusiness } from "../controllers/userController.js";
import { authenticateToken, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// ─── Rutas públicas (no requieren autenticación) ───────────────────────
// POST /api/register
router.post("/register", registerUser);

// POST /api/verify
router.post("/verify", verifyUser);

// POST /api/resend-code
router.post("/resend-code", resendCode);

// POST /api/register-business
router.post("/register-business", registerBusiness);

// POST /api/login
router.post("/login", loginBusiness);

// POST /api/login-business (numero + password). Acepta JSON o multipart/form-data
router.post("/login-business", upload.none(), loginBusinessWithPassword);

// POST /api/verify-business
router.post("/verify-business", verifyBusiness);

// POST /api/resend-business
router.post("/resend-business", resendBusiness);

// ─── Rutas protegidas (requieren autenticación) ────────────────────────
// POST /api/upload-business-avatar
router.post("/upload-business-avatar", authenticateToken, authorizeRoles("business"), upload.single("image"), uploadBusinessAvatar);

// POST /api/upload-business-banner
router.post("/upload-business-banner", authenticateToken, authorizeRoles("business"), upload.single("image"), uploadBusinessBanner);

// POST /api/configure-business
router.post(
  "/configure-business",
  authenticateToken,
  authorizeRoles("business"),
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "image", maxCount: 1 }, // alias para avatar
    { name: "banner", maxCount: 1 },
    { name: "staffAvatars" }
  ]),
  configureBusiness
);

// GET /api/get-business/:businessId
router.get("/get-business/:businessId", authenticateToken, getBusinessInfo);

// GET /api/users - Lista de usuarios registrados
router.get("/users", authenticateToken, getUsers);

// DELETE /api/delete-business/:businessId - Elimina usuario de negocio y datos relacionados
router.delete("/delete-business/:businessId", authenticateToken, authorizeRoles("business"), deleteBusiness);

export default router;