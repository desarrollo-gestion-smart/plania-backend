import express from "express";
import multer from "multer";
import { registerUser, verifyUser, resendCode, registerBusiness, loginBusiness, verifyBusiness, resendBusiness, uploadBusinessAvatar, uploadBusinessBanner, configureBusiness, getBusinessInfo } from "../controllers/userController.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/register
router.post("/register", registerUser);

// POST /api/verify
router.post("/verify", verifyUser);

// POST /api/resend-code
router.post("/resend-code", resendCode);

// POST /api/register-business
router.post("/register-business", registerBusiness);

// POST /api/login-business
router.post("/login-business", loginBusiness);

// POST /api/verify-business
router.post("/verify-business", verifyBusiness);

// POST /api/resend-business
router.post("/resend-business", resendBusiness);

// POST /api/upload-business-avatar
router.post("/upload-business-avatar", upload.single("image"), uploadBusinessAvatar);

// POST /api/upload-business-banner
router.post("/upload-business-banner", upload.single("image"), uploadBusinessBanner);

// POST /api/configure-business
router.post(
  "/configure-business",
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "image", maxCount: 1 }, // alias para avatar
    { name: "banner", maxCount: 1 },
    { name: "staffAvatars" }
  ]),
  configureBusiness
);

// GET /api/get-business/:businessId
router.get("/get-business/:businessId", getBusinessInfo);

export default router;