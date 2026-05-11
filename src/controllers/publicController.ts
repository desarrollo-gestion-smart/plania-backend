import { getBusinessById, getServicesByBusiness, getStaffByBusiness, getBusinessSchedules } from "../services/firestoreService.js";
import admin from "firebase-admin";

export const getPublicBusinessInfo = async (req, res) => {
  try {
    const { businessId } = req.params;
    if (!businessId) {
      return res.status(400).json({ error: "businessId es requerido" });
    }
    const business = await getBusinessById(businessId);
    // Return only public business information
    return res.status(200).json({
      id: business.id,
      nombre: business.nombre,
      correo: business.correo,
      numero: business.numero,
      direccion: business.direccion || null,
      latitude: business.latitude || null,
      longitude: business.longitude || null,
      avatar: business.avatar || null,
      banner: business.banner || null,
      description: business.description || null,
    });
  } catch (error) {
    if (error.message === "Business not found") {
      return res.status(404).json({ error: "Negocio no encontrado" });
    }
    console.error("Error en getPublicBusinessInfo:", error);
    return res.status(500).json({ error: "Error al obtener la información del negocio" });
  }
};

export const getPublicServices = async (req, res) => {
  try {
    const { businessId } = req.params;
    const { category } = req.query || {};
    if (!businessId) {
      return res.status(400).json({ error: "businessId es requerido" });
    }
    const catStr = category !== undefined ? String(category).toLowerCase() : undefined;
    if (catStr && !["service", "promotion"].includes(catStr)) {
      return res.status(400).json({ error: "category inválido. Valores permitidos: service, promotion" });
    }
    const services = await getServicesByBusiness(businessId, catStr, undefined);
    return res.status(200).json({ services, total: services.length });
  } catch (error) {
    const msg = error?.message || "Error listando servicios";
    return res.status(500).json({ error: msg });
  }
};

export const getPublicStaff = async (req, res) => {
  try {
    const { businessId } = req.params;
    if (!businessId) {
      return res.status(400).json({ error: "businessId es requerido" });
    }
    const rawStaff = await getStaffByBusiness(Number(businessId));
    const staff = rawStaff.map((s) => ({
      id: s.id,
      businessId: s.businessId,
      nombre: s.nombre ?? "",
      apellido: s.apellido ?? "",
      avatar: s.avatar ?? null,
      staffServices: Array.isArray(s.staffServices) ? s.staffServices : [],
    }));
    res.status(200).json({ staff });
  } catch (error) {
    console.error("Error obteniendo personal:", error);
    res.status(500).json({ error: "Error obteniendo personal" });
  }
};

export const getPublicSchedules = async (req, res) => {
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

export const getPublicBookings = async (req, res) => {
  try {
    const { businessId } = req.params;
    if (!businessId) {
      return res.status(400).json({ error: "businessId es requerido" });
    }
    const bizIdNum = Number(businessId);
    if (!Number.isFinite(bizIdNum)) {
      return res.status(400).json({ error: "businessId debe ser numérico" });
    }
    // Get available appointments/bookings from Firestore
    const appointmentsRef = admin
      .firestore()
      .collection("appointments")
      .where("businessId", "==", bizIdNum);
    const snapshot = await appointmentsRef.get();
    const appointments = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        businessId: data.businessId,
        clientId: data.clientId,
        staffId: data.staffId,
        serviceId: data.serviceId,
        date: data.date,
        horario: data.horario,
        estado: data.estado,
        createdAt: data.createdAt?.toDate?.().toISOString?.() ?? null,
      };
    });
    return res.status(200).json({ appointments, total: appointments.length });
  } catch (error) {
    const msg = error?.message || "Error listando citas";
    return res.status(500).json({ error: msg });
  }
};
