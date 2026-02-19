import admin from "firebase-admin";
import { createAppointment, getAppointmentsByBusiness, updateAppointmentState, APPOINTMENT_STATES } from "../services/firestoreService.js";

export const createAppointmentController = async (req, res) => {
  try {
    const { businessId, staffId, date, horario, calificacion } = req.body || {};
    const bodyUserId = req.body?.userId ?? req.body?.user;
    const serviceId = req.body?.serviceId ?? req.body?.service;

    if (!businessId || !staffId || !date || !horario || !bodyUserId) {
      return res.status(400).json({ error: "Faltan campos requeridos: businessId, staffId, userId, date, horario" });
    }

    const requester = req.user || {};
    const requesterRole = requester.role;
    const requesterId = requester.id;

    // Si es staff, solo puede crear citas para su propio staffId
    // y debe tener permiso de agendamiento manual.
    if (requesterRole === "staff") {
      if (!requesterId) {
        return res.status(403).json({ error: "No tienes permisos para gestionar citas" });
      }
      if (String(staffId) !== String(requesterId)) {
        return res.status(403).json({ error: "No puedes crear citas para otro miembro del staff" });
      }

      const staffSnap = await admin.firestore().collection("staff").doc(String(requesterId)).get();
      if (!staffSnap.exists) {
        return res.status(403).json({ error: "Staff no encontrado para el usuario autenticado" });
      }
      const staffData = staffSnap.data() || {};
      const perms = staffData.permissions || {};
      const canManualAppointments = Boolean(perms.manualAppointments);
      if (!canManualAppointments) {
        return res.status(403).json({ error: "No tienes permisos para crear, editar o eliminar citas" });
      }
      if (Number(staffData.businessId) !== Number(businessId)) {
        return res.status(403).json({ error: "No puedes gestionar citas de otro negocio" });
      }
    }

    const appointment = await createAppointment({
      businessId: Number(businessId),
      staffId: String(staffId),
      userId: Number(bodyUserId),
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
          category: s.category ?? "service",
        };
      }
    }

    // Controlar visibilidad del número de teléfono del cliente
    let showUserPhone = true;
    if (requesterRole === "staff" && requesterId) {
      const staffSnap = await admin.firestore().collection("staff").doc(String(requesterId)).get();
      if (staffSnap.exists) {
        const staffData = staffSnap.data() || {};
        const perms = staffData.permissions || {};
        const canViewClientPhone = Boolean(perms.viewClientPhone);
        if (!canViewClientPhone) {
          showUserPhone = false;
        }
      } else {
        showUserPhone = false;
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
        user: {
          id: appointment.userId,
          nombre: appointment.userNombre ?? "",
          numero: showUserPhone ? (appointment.userNumero ?? "") : null,
        },
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

    const requester = req.user || {};
    const requesterRole = requester.role;
    const requesterId = requester.id;

    if (requesterRole === "staff") {
      if (!requesterId) {
        return res.status(403).json({ error: "No tienes permisos para actualizar esta cita" });
      }

      const apptRef = admin.firestore().collection("appointments").doc(String(appointmentId));
      const apptSnap = await apptRef.get();
      if (!apptSnap.exists) {
        return res.status(404).json({ error: "Cita no encontrada" });
      }
      const apptData = apptSnap.data() || {};
      const ownerStaffId = String(apptData.staffAppoinments ?? apptData.staffId ?? "");
      if (ownerStaffId !== String(requesterId)) {
        return res.status(403).json({ error: "No puedes modificar citas de otro miembro del staff" });
      }

      const staffSnap = await admin.firestore().collection("staff").doc(String(requesterId)).get();
      if (!staffSnap.exists) {
        return res.status(403).json({ error: "Staff no encontrado para el usuario autenticado" });
      }
      const staffData = staffSnap.data() || {};
      const perms = staffData.permissions || {};
      const canManualAppointments = Boolean(perms.manualAppointments);
      if (!canManualAppointments) {
        return res.status(403).json({ error: "No tienes permisos para crear, editar o eliminar citas" });
      }
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
    const bizIdNum = Number(businessId);
    const requester = req.user || {};
    const requesterRole = requester.role;
    const requesterId = requester.id;

    if (!Number.isFinite(bizIdNum)) {
      return res.status(400).json({ error: "businessId debe ser numérico" });
    }

    // Asegurar que solo ve citas del negocio al que pertenece
    if (requesterRole === "business") {
      if (!requesterId || Number(requesterId) !== bizIdNum) {
        return res.status(403).json({ error: "No puedes ver citas de otro negocio" });
      }
    } else if (requesterRole === "staff") {
      if (!requesterId) {
        return res.status(403).json({ error: "No tienes permisos para ver estas citas" });
      }
      const staffSnap = await admin.firestore().collection("staff").doc(String(requesterId)).get();
      if (!staffSnap.exists) {
        return res.status(403).json({ error: "Staff no encontrado para el usuario autenticado" });
      }
      const staffData = staffSnap.data() || {};
      if (Number(staffData.businessId) !== bizIdNum) {
        return res.status(403).json({ error: "No puedes ver citas de otro negocio" });
      }
    }

    const results = await getAppointmentsByBusiness(bizIdNum);

    // Controlar visibilidad del número de teléfono del cliente para staff
    let finalResults = results;
    if (requesterRole === "staff" && requesterId) {
      const staffSnap = await admin.firestore().collection("staff").doc(String(requesterId)).get();
      let canViewClientPhone = false;
      if (staffSnap.exists) {
        const staffData = staffSnap.data() || {};
        const perms = staffData.permissions || {};
        canViewClientPhone = Boolean(perms.viewClientPhone);
      }
      if (!canViewClientPhone) {
        finalResults = results.map((appt) => ({
          ...appt,
          userNumero: null,
        }));
      }
    }

    return res.status(200).json({ appointments: finalResults });
  } catch (error) {
    const msg = error?.message || "Error obteniendo citas";
    return res.status(500).json({ error: msg });
  }
};

export const appointmentTimerStreamController = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    if (!appointmentId) {
      return res.status(400).json({ error: "Parámetro appointmentId es requerido" });
    }
    const docRef = admin.firestore().collection("appointments").doc(String(appointmentId));
    const snap = await docRef.get();
    if (!snap.exists) {
      return res.status(404).json({ error: "Cita no encontrada" });
    }
    const data = snap.data();
    let endMs = typeof data.endAtEpoch === "number" ? data.endAtEpoch : null;
    if (!endMs) {
      const dateStr = String(data.staffdates ?? data.date ?? "");
      const hourStr = String(data.staffAppointmentsHour ?? data.horario ?? "");
      const m = /^([0-9]{2})\/([0-9]{2})\/([0-9]{4})$/.exec(dateStr);
      const hm = /^([0-9]{2}):([0-9]{2})$/.exec(hourStr);
      let durationMin = typeof data.serviceDuration === "number" ? data.serviceDuration : null;
      if (!durationMin || durationMin <= 0) {
        const svcId = data.serviceId ?? null;
        if (svcId != null) {
          const svcDoc = await admin.firestore().collection("services").doc(String(svcId)).get();
          if (svcDoc.exists) {
            const svc = svcDoc.data();
            if (typeof svc.duration === "number" && svc.duration > 0) {
              durationMin = Number(svc.duration);
            }
          }
        }
      }
      if (m && hm && durationMin && durationMin > 0) {
        const d = Number(m[1]);
        const mo = Number(m[2]);
        const y = Number(m[3]);
        const hh = Number(hm[1]);
        const mm = Number(hm[2]);
        const start = new Date(y, mo - 1, d, hh, mm, 0, 0);
        endMs = start.getTime() + durationMin * 60000;
      }
    }
    if (!endMs) {
      return res.status(400).json({ error: "No se puede calcular el final del servicio" });
    }
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    const now = Date.now();
    const initPayload = { appointmentId: Number(appointmentId), endAtEpoch: endMs, now, timeLeftMs: Math.max(endMs - now, 0) };
    res.write(`event: init\ndata: ${JSON.stringify(initPayload)}\n\n`);
    let interval = null;
    const sendTick = () => {
      const t = Date.now();
      const left = endMs - t;
      if (left <= 0) {
        res.write(`event: finished\ndata: ${JSON.stringify({ appointmentId: Number(appointmentId), finishedAtEpoch: t })}\n\n`);
        clearInterval(interval);
        res.end();
      } else {
        res.write(`event: tick\ndata: ${JSON.stringify({ timeLeftMs: left })}\n\n`);
      }
    };
    sendTick();
    interval = setInterval(sendTick, 1000);
    req.on("close", () => {
      clearInterval(interval);
    });
  } catch (error) {
    const msg = error?.message || "Error iniciando cronómetro";
    return res.status(500).json({ error: msg });
  }
};
