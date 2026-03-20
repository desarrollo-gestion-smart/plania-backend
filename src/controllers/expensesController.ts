import { createExpense, getExpensesByBusiness, createExpenseCategory, getExpenseCategoriesByBusiness, getExpenseCategories } from "../services/firestoreService.js";

export const createExpenseController = async (req, res) => {
  try {
    const { businessId, name, categoryId, paidAt, amount } = req.body || {};
    if (!businessId || !name || categoryId === undefined || categoryId === null || !paidAt || amount === undefined) {
      return res.status(400).json({ error: "Campos requeridos: businessId, name, categoryId, paidAt, amount" });
    }
    const expense = await createExpense({ businessId, name, categoryId, paidAt, amount });
    return res.status(201).json({ expense });
  } catch (error) {
    const msg = error?.message || "Error creando gasto";
    const code = /inválido|not found|requeridos|amount|paidAt|category/i.test(msg) ? 400 : 500;
    return res.status(code).json({ error: msg });
  }
};

export const listExpensesController = async (req, res) => {
  try {
    const { businessId } = req.params;
    const { year, week } = req.query || {};
    if (!businessId) {
      return res.status(400).json({ error: "businessId es requerido" });
    }
    const y = year !== undefined ? Number(year) : undefined;
    const w = week !== undefined ? Number(week) : undefined;
    const expenses = await getExpensesByBusiness(businessId, { year: y, week: w });
    const totalAmount = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const totalCat1 = expenses.filter((e) => e.categoryId === 1).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const totalCat2 = expenses.filter((e) => e.categoryId === 2).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const totalCat3 = expenses.filter((e) => e.categoryId === 3).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const totalCat4 = expenses.filter((e) => e.categoryId === 4).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const totalCat5 = expenses.filter((e) => e.categoryId === 5).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const totalCat6 = expenses.filter((e) => e.categoryId === 6).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const totalCat7 = expenses.filter((e) => e.categoryId === 7).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    return res.status(200).json({
      expenses: {
        items: expenses,
        count: expenses.length,
        total: totalAmount,
        totalCat1,
        totalCat2,
        totalCat3,
        totalCat4,
        totalCat5,
        totalCat6,
        totalCat7,
      },
    });
  } catch (error) {
    const msg = error?.message || "Error listando gastos";
    return res.status(500).json({ error: msg });
  }
};

export const createExpenseCategoryController = async (req, res) => {
  try {
    const { businessId, name } = req.body || {};
    if (!businessId || !name) {
      return res.status(400).json({ error: "Campos requeridos: businessId, name" });
    }
    const category = await createExpenseCategory(businessId, name);
    return res.status(201).json({ category });
  } catch (error) {
    const msg = error?.message || "Error creando categoría de gasto";
    const code = /inválido|not found|requeridos|name/i.test(msg) ? 400 : 500;
    return res.status(code).json({ error: msg });
  }
};

export const listPredefinedExpenseCategoriesController = async (req, res) => {
  try {
    const categories = getExpenseCategories();
    return res.status(200).json({ categories, total: categories.length });
  } catch (error) {
    const msg = error?.message || "Error obteniendo categorías de gastos";
    return res.status(500).json({ error: msg });
  }
};

export const listExpenseCategoriesController = async (req, res) => {
  try {
    const { businessId } = req.params;
    if (!businessId) {
      return res.status(400).json({ error: "businessId es requerido" });
    }
    const categories = await getExpenseCategoriesByBusiness(businessId);
    return res.status(200).json({ categories, total: categories.length });
  } catch (error) {
    const msg = error?.message || "Error listando categorías de gasto";
    return res.status(500).json({ error: msg });
  }
};
