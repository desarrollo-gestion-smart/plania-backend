import { createAppointment, getAppointmentsByBusiness, updateAppointmentState, APPOINTMENT_STATES } from "../services/firestoreService.js";

export const createAppointmentController = async (req, res) => {
  try {
    const { businessId, staffId, serviceType, serviceDuration, date, horario, calificacion } = req.body || {};

    if (!businessId || !staffId || !serviceType || !date || !horario) {
      return res.status(400).json({ error: "Faltan campos requeridos: businessId, staffId, serviceType, date, horario" });
    }

    const appointment = await createAppointment({
      businessId: Number(businessId),
      staffId: String(staffId),
      serviceType,
      serviceDuration: typeof serviceDuration === 'number' ? serviceDuration : undefined,
      date: String(date),
      horario,
      calificacion: typeof calificacion === 'number' ? calificacion : undefined,
    });

    return res.status(201).json({ appointment });
  } catch (error) {
    const msg = error?.message || "Error creando cita";
    const code = /not found|no pertenece|fecha inválida|serviceDuration/i.test(msg) ? 400 : 500;
    return res.status(code).json({ error: msg });
  }
};

export const updateAppointmentStateController = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { state } = req.body || {};

    if (!appointmentId) {
      return res.status(400).json({ error: "Parámetro appointmentId es requerido" });
    }

    if (!state) {
      return res.status(400).json({ error: `state es requerido. Valores permitidos: ${APPOINTMENT_STATES.join(", ")}` });
    }

    const result = await updateAppointmentState(appointmentId, state);
    return res.status(200).json({ message: "Estado actualizado exitosamente", ...result });
  } catch (error) {
    const msg = error?.message || "Error actualizando estado";
    if (/no encontrada/i.test(msg)) {
      return res.status(404).json({ error: msg });
    }
    if (/inválido/i.test(msg)) {
      return res.status(400).json({ error: msg });
    }
    return res.status(500).json({ error: msg });
  }
};

export const listAppointmentsByBusiness = async (req, res) => {
  try {
    const { businessId } = req.params;
    if (!businessId) {
      return res.status(400).json({ error: "Parámetro businessId es requerido" });
    }

    const results = await getAppointmentsByBusiness(Number(businessId));
    return res.status(200).json({ appointments: results });
  } catch (error) {
    const msg = error?.message || "Error obteniendo citas";
    return res.status(500).json({ error: msg });
  }
};