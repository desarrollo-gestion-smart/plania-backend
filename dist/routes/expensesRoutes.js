import express from "express";
import { authenticateToken, authorizeRoles } from "../middleware/auth.js";
import { createExpenseController, listExpensesController, createExpenseCategoryController, listExpenseCategoriesController, listPredefinedExpenseCategoriesController } from "../controllers/expensesController.js";
const router = express.Router();
router.post("/expenses", authenticateToken, authorizeRoles("business"), createExpenseController);
router.get("/expenses/:businessId", authenticateToken, listExpensesController);
router.get("/expense-categories", authenticateToken, listPredefinedExpenseCategoriesController);
router.post("/expense-categories", authenticateToken, authorizeRoles("business"), createExpenseCategoryController);
router.get("/expense-categories/:businessId", authenticateToken, listExpenseCategoriesController);
export default router;
//# sourceMappingURL=expensesRoutes.js.map