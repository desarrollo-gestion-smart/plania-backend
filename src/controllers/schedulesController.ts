import { createBusinessSchedule, updateBusinessSchedule, deleteBusinessSchedule, getBusinessSchedules } from "../services/firestoreService.js";

export const createScheduleController = async (req, res) => {
  try {
    const { businessId, days, holidays } = req.body || {};
    if (!businessId || !days) {
      return res.status(400).json({ error: "businessId y days requeridos" });
    }
    const schedule = await createBusinessSchedule(businessId, { days, holidays });
    return res.status(201).json({ schedule });
  } catch (error) {
    const msg = error?.message || "Error creando horario";
    const code = /requerido|inválido|menor|fuera|not found|pertenece/i.test(msg) ? 400 : 500;
    return res.status(code).json({ error: msg });
  }
};

export const updateScheduleController = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const { businessId, days, holidays } = req.body || {};
    if (!scheduleId || !businessId) {
      return res.status(400).json({ error: "scheduleId y businessId requeridos" });
    }
    const schedule = await updateBusinessSchedule(businessId, scheduleId, { days, holidays });
    return res.status(200).json({ schedule });
  } catch (error) {
    const msg = error?.message || "Error actualizando horario";
    const code = /requerido|inválido|menor|fuera|not found|pertenece/i.test(msg) ? 400 : 500;
    return res.status(code).json({ error: msg });
  }
};

export const deleteScheduleController = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const { businessId } = req.body || {};
    if (!scheduleId || !businessId) {
      return res.status(400).json({ error: "scheduleId y businessId requeridos" });
    }
    const result = await deleteBusinessSchedule(businessId, scheduleId);
    return res.status(200).json(result);
  } catch (error) {
    const msg = error?.message || "Error eliminando horario";
    const code = /not found|pertenece/i.test(msg) ? 400 : 500;
    return res.status(code).json({ error: msg });
  }
};

export const listSchedulesController = async (req, res) => {
  try {
    const { businessId } = req.params;
    if (!businessId) {
      return res.status(400).json({ error: "businessId requerido" });
    }
    const schedules = await getBusinessSchedules(businessId);
    return res.status(200).json({ schedules, total: schedules.length });
  } catch (error) {
    const msg = error?.message || "Error listando horarios";
    return res.status(500).json({ error: msg });
  }
};
