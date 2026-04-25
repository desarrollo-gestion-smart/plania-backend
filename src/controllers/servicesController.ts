import { uploadImageToFirebase } from "../services/firebaseService.js";
import { createService, updateService, deleteService, getServicesByBusiness, getGeneralServicesByBusiness, getServiceTypesByBusiness, getAllPromotions } from "../services/firestoreService.js";

export const createServiceController = async (req, res) => {
  try {
    const { businessId, name, type, duration, price, category, description, promotionTerms, promotionValidUntil, promotionValidIndefinite } = req.body || {};
    if (!businessId || !name || !type || duration === undefined || price === undefined || !category) {
      return res.status(400).json({ error: "Campos requeridos: businessId, name, type, duration, price, category" });
    }

    let image = undefined;
    if (req.file) {
      console.log("[createServiceController] Uploading service image:", { name: req.file.originalname, size: req.file.size, mimetype: req.file.mimetype });
      image = await uploadImageToFirebase(req.file, businessId);
      console.log("[createServiceController] Image uploaded:", image);
    }

    const service = await createService(businessId, name, type, duration, price, category, description, promotionTerms, promotionValidUntil, promotionValidIndefinite, image);
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
    const { businessId, name, type, duration, price, category, description, archived, promotionTerms, promotionValidUntil, promotionValidIndefinite, staffDuration, staffcommission, staffprice, staffId } = req.body || {};
    if (!serviceId || !businessId) {
      return res.status(400).json({ error: "serviceId y businessId son requeridos" });
    }
    const service = await updateService(businessId, serviceId, { name, type, duration, price, category, description, archived, promotionTerms, promotionValidUntil, promotionValidIndefinite, staffDuration, staffcommission, staffprice, staffId });
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
    const { category, staffId } = req.query || {};
    if (!businessId) {
      return res.status(400).json({ error: "businessId es requerido" });
    }
    const catStr = category !== undefined ? String(category).toLowerCase() : undefined;
    if (catStr && !["service", "promotion"].includes(catStr)) {
      return res.status(400).json({ error: "category inválido. Valores permitidos: service, promotion" });
    }
    const services = await getServicesByBusiness(businessId, catStr, staffId !== undefined ? String(staffId) : undefined);
    return res.status(200).json({ services, total: services.length });
  } catch (error) {
    const msg = error?.message || "Error listando servicios";
    return res.status(500).json({ error: msg });
  }
};

export const listServiceTypesController = async (req, res) => {
  try {
    const { businessId } = req.params;
    if (!businessId) {
      return res.status(400).json({ error: "businessId es requerido" });
    }
    const types = await getServiceTypesByBusiness(businessId);
    return res.status(200).json({ types, total: types.length });
  } catch (error) {
    const msg = error?.message || "Error listando tipos de servicio";
    return res.status(500).json({ error: msg });
  }
};

export const listGeneralServicesController = async (req, res) => {
  try {
    const { page, limit } = req.query || {};
    const payload = await getGeneralServicesByBusiness({
      page: page !== undefined ? Number(page) : 1,
      limit: limit !== undefined ? Number(limit) : 10,
    });
    return res.status(200).json(payload);
  } catch (error) {
    const msg = error?.message || "Error listando servicios en general";
    return res.status(500).json({ error: msg });
  }
};

export const listAllPromotionsController = async (req, res) => {
  try {
    const promotions = await getAllPromotions();
    return res.status(200).json({ promotions, total: promotions.length });
  } catch (error) {
    const msg = error?.message || "Error listando promociones";
    return res.status(500).json({ error: msg });
  }
};
