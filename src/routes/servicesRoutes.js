import express from "express";
import { createServiceController, updateServiceController, deleteServiceController, listServicesController } from "../controllers/servicesController.js";
import { authenticateToken, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

router.post("/services", authenticateToken, authorizeRoles("business"), createServiceController);
router.patch("/services/:serviceId", authenticateToken, authorizeRoles("business"), updateServiceController);
router.delete("/services/:serviceId", authenticateToken, authorizeRoles("business"), deleteServiceController);
router.get("/services/:businessId", authenticateToken, listServicesController);

export default router;
