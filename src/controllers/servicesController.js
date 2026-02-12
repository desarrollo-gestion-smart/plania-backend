import { createService, updateService, deleteService, getServicesByBusiness } from "../services/firestoreService.js";

export const createServiceController = async (req, res) => {
  try {
    const { businessId, name, type, duration, price } = req.body || {};
    if (!businessId || !name || !type || duration === undefined || price === undefined) {
      return res.status(400).json({ error: "Campos requeridos: businessId, name, type, duration, price" });
    }
    const service = await createService(businessId, name, type, duration, price);
    return res.status(201).json({ service });
  } catch (error) {
    const msg = error?.message || "Error creando servicio";
    const code = /inválido|not found|pertenece|duration|price/i.test(msg) ? 400 : 500;
    return res.status(code).json({ error: msg });
  }
};

export const updateServiceController = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { businessId, name, type, duration, price } = req.body || {};
    if (!serviceId || !businessId) {
      return res.status(400).json({ error: "serviceId y businessId son requeridos" });
    }
    const service = await updateService(businessId, serviceId, { name, type, duration, price });
    return res.status(200).json({ service });
  } catch (error) {
    const msg = error?.message || "Error actualizando servicio";
    const code = /not found|pertenece|duration|price/i.test(msg) ? 400 : 500;
    return res.status(code).json({ error: msg });
  }
};

export const deleteServiceController = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { businessId } = req.body || {};
    if (!serviceId || !businessId) {
      return res.status(400).json({ error: "serviceId y businessId son requeridos" });
    }
    const result = await deleteService(businessId, serviceId);
    return res.status(200).json(result);
  } catch (error) {
    const msg = error?.message || "Error eliminando servicio";
    const code = /not found|pertenece/i.test(msg) ? 400 : 500;
    return res.status(code).json({ error: msg });
  }
};

export const listServicesController = async (req, res) => {
  try {
    const { businessId } = req.params;
    if (!businessId) {
      return res.status(400).json({ error: "businessId es requerido" });
    }
    const services = await getServicesByBusiness(businessId);
    return res.status(200).json({ services, total: services.length });
  } catch (error) {
    const msg = error?.message || "Error listando servicios";
    return res.status(500).json({ error: msg });
  }
};
