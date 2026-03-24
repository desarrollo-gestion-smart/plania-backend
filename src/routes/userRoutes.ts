import express from "express";
import multer from "multer";
import { registerUser, verifyUser, resendCode, registerBusiness, loginBusiness, loginBusinessWithPassword, verifyBusiness, resendBusiness, uploadBusinessAvatar, uploadBusinessBanner, configureBusiness, getBusinessInfo, getBusinessIds, getUsers, getClient, updateClient, deleteClient, deleteBusiness, getBusinessPoliciesController, updateBusinessPoliciesController } from "../controllers/userController.js";
import { authenticateToken, authorizeRoles } from "../middleware/auth.js";
import admin from "firebase-admin";
import { verifyRefreshToken, generateToken, generateRefreshToken } from "../utils/jwt.js";

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

// POST /api/logout
router.post("/logout", authenticateToken, async (req, res) => {
  try {
    const decoded = req.user;
    if (decoded && decoded.jti) {
      await admin.firestore()
        .collection("revokedTokens")
        .doc(decoded.jti)
        .set({
          userId: decoded.userId ?? null,
          role: decoded.role ?? null,
          expiresAt: admin.firestore.Timestamp.fromMillis((decoded.exp ?? 0) * 1000),
          revokedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    }
    const rt = req.cookies?.refreshToken || req.body?.refreshToken || null;
    if (rt) {
      try {
        const rDecoded = verifyRefreshToken(rt);
        await admin.firestore().collection("refreshTokens").doc(rDecoded.jti!).update({
          revoked: true,
          revokedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } catch (_) {}
    }
    res.clearCookie("refreshToken");
    res.status(200).json({ message: "Logout exitoso" });
  } catch (_e) {
    res.status(200).json({ message: "Logout exitoso" });
  }
});

// POST /api/login-business (numero + password). Acepta JSON o multipart/form-data
router.post("/login-business", upload.none(), loginBusinessWithPassword);

// POST /api/refresh-token
router.post("/refresh-token", async (req, res) => {
  try {
    const rt = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!rt) {
      return res.status(401).json({ error: "Refresh token requerido", code: "REFRESH_REQUIRED" });
    }
    const decoded = verifyRefreshToken(rt);
    if (decoded.type !== "refresh") {
      return res.status(403).json({ error: "Token inválido", code: "REFRESH_INVALID" });
    }
    const doc = await admin.firestore().collection("refreshTokens").doc(decoded.jti!).get();
    if (!doc.exists || doc.data()?.revoked === true) {
      return res.status(401).json({ error: "Refresh token revocado", code: "REFRESH_REVOKED" });
    }
    const tokens = generateToken({ id: decoded.userId, role: decoded.role });
    const newRefresh = generateRefreshToken({ id: decoded.userId, role: decoded.role });
    const newDecoded = verifyRefreshToken(newRefresh.refreshToken);
    await admin.firestore().collection("refreshTokens").doc(decoded.jti!).update({
      revoked: true,
      rotatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    await admin.firestore().collection("refreshTokens").doc(newDecoded.jti!).set({
      userId: decoded.userId,
      role: decoded.role,
      expiresAt: admin.firestore.Timestamp.fromMillis((newDecoded.exp ?? 0) * 1000),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      revoked: false,
    });
    const secure = process.env.NODE_ENV === "production";
    res.cookie("refreshToken", newRefresh.refreshToken, {
      httpOnly: true,
      secure,
      sameSite: secure ? "none" : "lax",
      expires: new Date((newDecoded.exp ?? 0) * 1000),
    });
    return res.status(200).json({ ...tokens, refreshToken: newRefresh.refreshToken });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Refresh expirado", code: "REFRESH_EXPIRED" });
    }
    return res.status(403).json({ error: "Refresh inválido", code: "REFRESH_INVALID" });
  }
});

// POST /api/verify-business
router.post("/verify-business", verifyBusiness);

// POST /api/resend-business
router.post("/resend-business", resendBusiness);

// ─── Rutas protegidas (requieren autenticación) ────────────────────────
// Clients
router.get("/get-client/:clientId", authenticateToken, getClient);
router.patch(
  "/clients/:clientId",
  authenticateToken,
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "image", maxCount: 1 },
  ]),
  updateClient,
);
router.delete("/clients/:clientId", authenticateToken, deleteClient);

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
    { name: "staffAvatars" },
    { name: "images" },
  ]),
  configureBusiness
);

router.patch(
  "/configure-business",
  authenticateToken,
  authorizeRoles("business"),
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "image", maxCount: 1 },
    { name: "banner", maxCount: 1 },
    { name: "staffAvatars" },
    { name: "images" },
  ]),
  configureBusiness
);

// GET /api/get-business/:businessId
router.get("/get-business/:businessId", authenticateToken, getBusinessInfo);
router.get("/get-business-id", authenticateToken, getBusinessIds);

// Policies
router.get("/business/:businessId/policies", authenticateToken, getBusinessPoliciesController);
router.patch("/business/:businessId/policies", authenticateToken, authorizeRoles("business"), updateBusinessPoliciesController);

// GET /api/users - Lista de usuarios registrados
router.get("/users", authenticateToken, getUsers);

// DELETE /api/delete-business/:businessId - Elimina usuario de negocio y datos relacionados
router.delete("/delete-business/:businessId", authenticateToken, authorizeRoles("business"), deleteBusiness);

export default router;
