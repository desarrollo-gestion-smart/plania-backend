import express from "express";
import { createServiceController, updateServiceController, deleteServiceController, listServicesController, listGeneralServicesController, listServiceTypesController } from "../controllers/servicesController.js";
import { authenticateToken, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

router.post("/services", authenticateToken, authorizeRoles("business"), createServiceController);
router.patch("/services/:serviceId", authenticateToken, authorizeRoles("business"), updateServiceController);
router.delete("/services/:serviceId", authenticateToken, authorizeRoles("business"), deleteServiceController);
router.get("/services-general", authenticateToken, listGeneralServicesController);
router.get("/services/:businessId", authenticateToken, listServicesController);
router.get("/service-types/:businessId", authenticateToken, listServiceTypesController);

export default router;
