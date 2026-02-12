import { createStaffSchedule, updateStaffSchedule, deleteStaffSchedule, getStaffSchedules } from "../services/firestoreService.js";

export const createStaffScheduleController = async (req, res) => {
  try {
    const { staffId } = req.params;
    const { businessId, days, holidays } = req.body || {};
    if (!staffId || !businessId || !days) {
      return res.status(400).json({ error: "staffId, businessId y days requeridos" });
    }
    const schedule = await createStaffSchedule(businessId, staffId, { days, holidays });
    return res.status(201).json({ schedule });
  } catch (error) {
    const msg = error?.message || "Error creando horario de staff";
    const code = /requerido|inválido|menor|fuera|not found|pertenece/i.test(msg) ? 400 : 500;
    return res.status(code).json({ error: msg });
  }
};

export const updateStaffScheduleController = async (req, res) => {
  try {
    const { staffId, scheduleId } = req.params;
    const { businessId, days, holidays } = req.body || {};
    if (!scheduleId || !staffId || !businessId) {
      return res.status(400).json({ error: "scheduleId, staffId y businessId requeridos" });
    }
    const schedule = await updateStaffSchedule(businessId, staffId, scheduleId, { days, holidays });
    return res.status(200).json({ schedule });
  } catch (error) {
    const msg = error?.message || "Error actualizando horario de staff";
    const code = /requerido|inválido|menor|fuera|not found|pertenece/i.test(msg) ? 400 : 500;
    return res.status(code).json({ error: msg });
  }
};

export const deleteStaffScheduleController = async (req, res) => {
  try {
    const { staffId, scheduleId } = req.params;
    const { businessId } = req.body || {};
    if (!scheduleId || !staffId || !businessId) {
      return res.status(400).json({ error: "scheduleId, staffId y businessId requeridos" });
    }
    const result = await deleteStaffSchedule(businessId, staffId, scheduleId);
    return res.status(200).json(result);
  } catch (error) {
    const msg = error?.message || "Error eliminando horario de staff";
    const code = /not found|pertenece/i.test(msg) ? 400 : 500;
    return res.status(code).json({ error: msg });
  }
};

export const listStaffSchedulesController = async (req, res) => {
  try {
    const { staffId } = req.params;
    if (!staffId) {
      return res.status(400).json({ error: "staffId requerido" });
    }
    const schedules = await getStaffSchedules(staffId);
    return res.status(200).json({ schedules, total: schedules.length });
  } catch (error) {
    const msg = error?.message || "Error listando horarios de staff";
    return res.status(500).json({ error: msg });
  }
};
