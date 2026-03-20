import admin from "firebase-admin";
import { createStaffSchedule, updateStaffSchedule, deleteStaffSchedule, getStaffSchedules } from "../services/firestoreService.js";

export const createStaffScheduleController = async (req, res) => {
  try {
    const { staffId } = req.params;
    const { businessId, days, holidays } = req.body || {};
    if (!staffId || !businessId || !days) {
      return res.status(400).json({ error: "staffId, businessId y days requeridos" });
    }

    const bizIdNum = Number(businessId);
    if (!Number.isFinite(bizIdNum)) {
      return res.status(400).json({ error: "businessId debe ser numérico" });
    }

    const requester = req.user || {};
    const requesterRole = requester.role;
    const requesterId = requester.id;

    if (requesterRole === "business") {
      if (!requesterId || Number(requesterId) !== bizIdNum) {
        return res.status(403).json({ error: "No puedes crear horarios para otro negocio" });
      }
    } else if (requesterRole === "staff") {
      if (!requesterId || String(requesterId) !== String(staffId)) {
        return res.status(403).json({ error: "No puedes crear horarios para otro miembro del staff" });
      }
      const staffSnap = await admin.firestore().collection("staff").doc(String(requesterId)).get();
      if (!staffSnap.exists) {
        return res.status(403).json({ error: "Staff no encontrado para el usuario autenticado" });
      }
      const staffData = staffSnap.data() || {};
      if (Number(staffData.businessId) !== bizIdNum) {
        return res.status(403).json({ error: "No puedes crear horarios en otro negocio" });
      }
      const perms = staffData.permissions || {};
      const canManualBlocks = Boolean(perms.manualBlocks);
      if (!canManualBlocks) {
        return res.status(403).json({ error: "No tienes permisos para bloquear rangos horarios manualmente" });
      }
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

    const bizIdNum = Number(businessId);
    if (!Number.isFinite(bizIdNum)) {
      return res.status(400).json({ error: "businessId debe ser numérico" });
    }

    const requester = req.user || {};
    const requesterRole = requester.role;
    const requesterId = requester.id;

    if (requesterRole === "business") {
      if (!requesterId || Number(requesterId) !== bizIdNum) {
        return res.status(403).json({ error: "No puedes actualizar horarios de otro negocio" });
      }
    } else if (requesterRole === "staff") {
      if (!requesterId || String(requesterId) !== String(staffId)) {
        return res.status(403).json({ error: "No puedes actualizar horarios de otro miembro del staff" });
      }
      const staffSnap = await admin.firestore().collection("staff").doc(String(requesterId)).get();
      if (!staffSnap.exists) {
        return res.status(403).json({ error: "Staff no encontrado para el usuario autenticado" });
      }
      const staffData = staffSnap.data() || {};
      if (Number(staffData.businessId) !== bizIdNum) {
        return res.status(403).json({ error: "No puedes actualizar horarios de otro negocio" });
      }
      const perms = staffData.permissions || {};
      const canManualBlocks = Boolean(perms.manualBlocks);
      if (!canManualBlocks) {
        return res.status(403).json({ error: "No tienes permisos para bloquear rangos horarios manualmente" });
      }
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

    const bizIdNum = Number(businessId);
    if (!Number.isFinite(bizIdNum)) {
      return res.status(400).json({ error: "businessId debe ser numérico" });
    }

    const requester = req.user || {};
    const requesterRole = requester.role;
    const requesterId = requester.id;

    if (requesterRole === "business") {
      if (!requesterId || Number(requesterId) !== bizIdNum) {
        return res.status(403).json({ error: "No puedes eliminar horarios de otro negocio" });
      }
    } else if (requesterRole === "staff") {
      if (!requesterId || String(requesterId) !== String(staffId)) {
        return res.status(403).json({ error: "No puedes eliminar horarios de otro miembro del staff" });
      }
      const staffSnap = await admin.firestore().collection("staff").doc(String(requesterId)).get();
      if (!staffSnap.exists) {
        return res.status(403).json({ error: "Staff no encontrado para el usuario autenticado" });
      }
      const staffData = staffSnap.data() || {};
      if (Number(staffData.businessId) !== bizIdNum) {
        return res.status(403).json({ error: "No puedes eliminar horarios de otro negocio" });
      }
      const perms = staffData.permissions || {};
      const canManualBlocks = Boolean(perms.manualBlocks);
      if (!canManualBlocks) {
        return res.status(403).json({ error: "No tienes permisos para bloquear rangos horarios manualmente" });
      }
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
