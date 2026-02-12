import { addStaff, getStaffByBusiness, loginStaff, updateStaffAvatar, updateStaffFields, getStaffNameById } from "../services/firestoreService.js";
import { uploadImageToFirebase } from "../services/firebaseService.js";
import { generateToken } from "../utils/jwt.js";

export const addStaffMember = async (req, res) => {
  try {
    const { businessId, id: staffId = null, nombre, apellido = '', numero, password } = req.body;

    if (!businessId || !nombre || !numero || !password) {
      return res.status(400).json({ error: "businessId, nombre, numero y password son requeridos" });
    }

    // Basic phone validation
    if (!/^\d+$/.test(numero)) {
      return res.status(400).json({ error: "Numero debe contener solo digitos" });
    }

    // Password validation
    if (password.length < 6) {
      return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });
    }

    const staff = await addStaff(Number(businessId), nombre, numero, password, null, apellido, staffId);

    res.status(201).json({ message: "Miembro del personal agregado exitosamente", staff: { id: staff.id, businessId: staff.businessId, nombre: staff.nombre, apellido: staff.apellido || '', numero: staff.numero } });
  } catch (error) {
    console.error("Error agregando miembro del personal:", error);
    res.status(400).json({ error: error.message });
  }
};

export const getStaff = async (req, res) => {
  try {
    const { businessId } = req.params;

    if (!businessId) {
      return res.status(400).json({ error: "businessId es requerido" });
    }

    const staff = await getStaffByBusiness(Number(businessId));

    res.status(200).json({ staff });
  } catch (error) {
    console.error("Error obteniendo personal:", error);
    res.status(500).json({ error: "Error obteniendo personal" });
  }
};

export const getStaffIds = async (req, res) => {
  try {
    const { businessId } = req.params;
    if (!businessId) {
      return res.status(400).json({ error: "businessId es requerido" });
    }
    const staff = await getStaffByBusiness(Number(businessId));
    const staffIds = staff.map((s) => ({ id: Number(s.id), nombre: s.nombre, apellido: s.apellido || '' }));
    res.status(200).json({ staffIds });
  } catch (error) {
    console.error("Error obteniendo IDs de personal:", error);
    res.status(500).json({ error: "Error obteniendo IDs de personal" });
  }
};

export const loginStaffMember = async (req, res) => {
  try {
    const { numero, password } = req.body;

    if (!numero || !password) {
      return res.status(400).json({ error: "numero y password son requeridos" });
    }

    const staff = await loginStaff(numero, password);
    const tokens = generateToken({ id: staff.id, role: "staff" });

    res.status(200).json({ message: "Login exitoso", staff, ...tokens });
  } catch (error) {
    console.error("Error logueando miembro del personal:", error);
    res.status(400).json({ error: error.message });
  }
};

export const updateStaffMember = async (req, res) => {
  try {
    const { id, nombre, apellido, numero, password } = req.body;

    if (!id) {
      return res.status(400).json({ error: "id es requerido" });
    }

    // Validate numero if provided
    if (numero !== undefined) {
      if (typeof numero === 'string' && numero.trim() !== '' && !/^\d+$/.test(numero)) {
        return res.status(400).json({ error: "Numero debe contener solo digitos" });
      }
    }

    const updated = await updateStaffFields(id, { nombre, apellido, numero, password });

    return res.status(200).json({ message: "Staff actualizado exitosamente", staff: updated });
  } catch (error) {
    console.error("Error actualizando miembro del personal:", error);
    const msg = String(error?.message || "");
    if (msg.includes("No document to update") || msg.includes("NOT_FOUND")) {
      return res.status(404).json({ error: "Staff no encontrado" });
    }
    return res.status(400).json({ error: msg });
  }
};

export const getStaffName = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "id es requerido" });
    }
    const result = await getStaffNameById(String(id));
    return res.status(200).json({ id: result.id, nombre: result.nombre });
  } catch (error) {
    const msg = String(error?.message || "");
    if (/not found/i.test(msg)) {
      return res.status(404).json({ error: "Staff no encontrado" });
    }
    return res.status(500).json({ error: "Error obteniendo nombre de staff" });
  }
};

export const uploadStaffAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No se ha enviado ningún archivo" });
    }

    const { staffId } = req.body;
    if (!staffId) {
      return res.status(400).json({ error: "staffId es requerido" });
    }

    const imageUrl = await uploadImageToFirebase(req.file, staffId);
    await updateStaffAvatar(staffId, imageUrl);

    res.status(200).json({ url: imageUrl, message: "Avatar de personal subido y actualizado" });
  } catch (error) {
    console.error("Error subiendo avatar de personal:", error);
    res.status(500).json({ error: "Error subiendo avatar" });
  }
};