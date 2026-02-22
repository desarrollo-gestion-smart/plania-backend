import { createIncome, getIncomesByBusiness, updateIncome, deleteIncome, getBusinessResults, deleteExpense, getIncomeCategories } from "../services/firestoreService.js";

export const createIncomeController = async (req, res) => {
  try {
    const { businessId, name, categoryId, receivedAt, amount } = req.body || {};
    if (!businessId || !name || !categoryId || !receivedAt || amount === undefined) {
      return res.status(400).json({ error: "Campos requeridos: businessId, name, categoryId (1=Productos, 2=Servicios), receivedAt, amount" });
    }
    const income = await createIncome({ businessId, name, categoryId, receivedAt, amount });
    return res.status(201).json({ income });
  } catch (error) {
    const msg = error?.message || "Error creando ingreso";
    const code = /inválido|not found|requeridos|amount|receivedAt|categoryId/i.test(msg) ? 400 : 500;
    return res.status(code).json({ error: msg });
  }
};

export const listIncomesController = async (req, res) => {
  try {
    const { businessId } = req.params;
    const { year, week, categoryId } = req.query || {};
    if (!businessId) {
      return res.status(400).json({ error: "businessId es requerido" });
    }
    const y = year !== undefined ? Number(year) : undefined;
    const w = week !== undefined ? Number(week) : undefined;
    const catId = categoryId !== undefined ? Number(categoryId) : undefined;
    
    let incomes = await getIncomesByBusiness(businessId, { year: y, week: w });
    
    if (catId !== undefined) {
      incomes = incomes.filter(income => income.categoryId === catId);
    }
    
    return res.status(200).json({ incomes, total: incomes.length });
  } catch (error) {
    const msg = error?.message || "Error listando ingresos";
    return res.status(500).json({ error: msg });
  }
};

export const updateIncomeController = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, categoryId, receivedAt, amount } = req.body || {};
    if (!id) {
      return res.status(400).json({ error: "ID es requerido" });
    }
    const income = await updateIncome(id, { name, category, categoryId, receivedAt, amount });
    return res.status(200).json({ income });
  } catch (error) {
    const msg = error?.message || "Error actualizando ingreso";
    const code = /inválido|not found|requeridos|amount|receivedAt|category/i.test(msg) ? 400 : 500;
    return res.status(code).json({ error: msg });
  }
};

export const deleteIncomeController = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "ID es requerido" });
    }
    const result = await deleteIncome(id);
    return res.status(200).json(result);
  } catch (error) {
    const msg = error?.message || "Error eliminando ingreso";
    const code = /inválido|not found/i.test(msg) ? 400 : 500;
    return res.status(code).json({ error: msg });
  }
};

export const deleteExpenseController = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "ID es requerido" });
    }
    const result = await deleteExpense(id);
    return res.status(200).json(result);
  } catch (error) {
    const msg = error?.message || "Error eliminando gasto";
    const code = /inválido|not found/i.test(msg) ? 400 : 500;
    return res.status(code).json({ error: msg });
  }
};

export const getResultsController = async (req, res) => {
  try {
    const { businessId } = req.params;
    const { startDate, endDate, year, week } = req.query || {};
    if (!businessId) {
      return res.status(400).json({ error: "businessId es requerido" });
    }
    const y = year !== undefined ? Number(year) : undefined;
    const w = week !== undefined ? Number(week) : undefined;
    const results = await getBusinessResults(businessId, { startDate, endDate, year: y, week: w });
    return res.status(200).json(results);
  } catch (error) {
    const msg = error?.message || "Error obteniendo resultados";
    const code = /inválido|requerido/i.test(msg) ? 400 : 500;
    return res.status(code).json({ error: msg });
  }
};

export const listIncomeCategoriesController = async (req, res) => {
  try {
    const categories = getIncomeCategories();
    return res.status(200).json({ categories, total: categories.length });
  } catch (error) {
    const msg = error?.message || "Error obteniendo categorías de ingresos";
    return res.status(500).json({ error: msg });
  }
};
