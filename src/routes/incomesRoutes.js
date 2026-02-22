import express from "express";
import { authenticateToken, authorizeRoles } from "../middleware/auth.js";
import {
  createIncomeController,
  listIncomesController,
  updateIncomeController,
  deleteIncomeController,
  deleteExpenseController,
  getResultsController,
  listIncomeCategoriesController,
} from "../controllers/incomesController.js";

const router = express.Router();

router.post("/incomes", authenticateToken, authorizeRoles("business"), createIncomeController);
router.get("/incomes/:businessId", authenticateToken, listIncomesController);
router.put("/incomes/:id", authenticateToken, authorizeRoles("business"), updateIncomeController);
router.delete("/incomes/:id", authenticateToken, authorizeRoles("business"), deleteIncomeController);
router.delete("/expenses/:id", authenticateToken, authorizeRoles("business"), deleteExpenseController);
router.get("/results/:businessId", authenticateToken, getResultsController);
router.get("/income-categories", authenticateToken, listIncomeCategoriesController);

export default router;
