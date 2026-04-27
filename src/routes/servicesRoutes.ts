import express from "express";
import multer from "multer";
import { createServiceController, updateServiceController, deleteServiceController, listServicesController, listGeneralServicesController, listServiceTypesController, listAllPromotionsController, getPromotionByIdController } from "../controllers/servicesController.js";
import { authenticateToken, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/services", authenticateToken, authorizeRoles("business"), upload.single("image"), createServiceController);
router.patch("/services/:serviceId", authenticateToken, authorizeRoles("business"), updateServiceController);
router.delete("/services/:serviceId", authenticateToken, authorizeRoles("business"), deleteServiceController);
router.get("/services-general", authenticateToken, listGeneralServicesController);
router.get("/promotions", authenticateToken, listAllPromotionsController);
router.get("/promotions/:promotionId", authenticateToken, getPromotionByIdController);
router.get("/services/:businessId", authenticateToken, listServicesController);
router.get("/service-types/:businessId", authenticateToken, listServiceTypesController);

export default router;
