import { createAppointment, getAppointmentsByBusiness, updateAppointmentState, APPOINTMENT_STATES } from "../services/firestoreService.js";

export const createAppointmentController = async (req, res) => {
  try {
    const { businessId, staffId, date, horario, calificacion } = req.body || {};
    const serviceId = req.body?.serviceId ?? req.body?.service;

    if (!businessId || !staffId || !date || !horario) {
      return res.status(400).json({ error: "Faltan campos requeridos: businessId, staffId, date, horario" });
    }

    const appointment = await createAppointment({
      businessId: Number(businessId),
      staffId: String(staffId),
      serviceId: serviceId !== undefined ? Number(serviceId) : undefined,
      date: String(date),
      horario,
      calificacion: typeof calificacion === 'number' ? calificacion : undefined,
    });

    let serviceObj = null;
    if (appointment.serviceId != null) {
      // Map services by business to avoid extra queries? For single create, fetch directly.
      const svcDoc = await (await import("firebase-admin")).default.firestore().collection("services").doc(String(appointment.serviceId)).get();
      if (svcDoc.exists) {
        const s = svcDoc.data();
        serviceObj = {
          id: s.id ?? appointment.serviceId,
          name: s.name ?? "",
          type: s.type ?? "",
          duration: s.duration ?? null,
          price: s.price ?? null,
        };
      }
    }

    return res.status(201).json({
      appointment: {
        businessId: appointment.businessId,
        staffId: String(appointment.staffAppoinments),
        date: String(appointment.staffdates),
        horario: String(appointment.staffAppointmentsHour),
        calificacion: typeof calificacion === 'number' ? calificacion : null,
        service: serviceObj,
        idappointment: appointment.idappointment,
        state: appointment.state,
      }
    });
  } catch (error) {
    const msg = error?.message || "Error creando cita";
    const code = /not found|no pertenece|fecha inválida|serviceDuration|Service/i.test(msg) ? 400 : 500;
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
