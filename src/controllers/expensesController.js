import { createExpense, getExpensesByBusiness, createExpenseCategory, getExpenseCategoriesByBusiness } from "../services/firestoreService.js";

export const createExpenseController = async (req, res) => {
  try {
    const { businessId, name, category, categoryId, paidAt, amount } = req.body || {};
    if (!businessId || !name || (!category && !categoryId) || !paidAt || amount === undefined) {
      return res.status(400).json({ error: "Campos requeridos: businessId, name, category o categoryId, paidAt, amount" });
    }
    const expense = await createExpense({ businessId, name, category, categoryId, paidAt, amount });
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
    return res.status(200).json({ expenses, total: expenses.length });
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
