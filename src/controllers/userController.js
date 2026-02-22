import admin from "firebase-admin";
import { createUser, verifyUserCode, resendVerificationCode, createBusinessUser, findBusinessUser, getBusinessUserByNumero, getAppUserByNumero, loginBusinessUser, updateBusinessAvatar, updateBusinessBanner, verifyBusinessCode, resendBusinessVerificationCode, addStaff, getAllUsers, deleteBusinessUser } from "../services/firestoreService.js";
import { uploadImageToFirebase, uploadBase64ToFirebase, uploadFromUrlToFirebase } from "../services/firebaseService.js";
import { sendSMS } from "../services/smsService.js";
import { sendBusinessSMS } from "../services/businessSmsService.js";
import { getBusinessById, updateBusinessPolicies, getBusinessPolicies } from "../services/firestoreService.js";
import { generateToken, generateRefreshToken, verifyRefreshToken } from "../utils/jwt.js";

const db = admin.firestore();

export const registerUser = async (req, res) => {
  try {
    const { nombre, numero } = req.body;

    // Validation
    if (!nombre || !numero) {
      return res.status(400).json({ error: "Nombre y numero son requeridos" });
    }

    // Additional validation for phone number (basic)
    if (!/^\d+$/.test(numero)) {
      return res.status(400).json({ error: "Numero debe contener solo digitos" });
    }

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Create user with code
    const user = await createUser(nombre, numero, verificationCode);

    // Send SMS
    const message = `Tu código de verificación es: ${verificationCode}`;
    await sendSMS(numero, message);

    res.status(200).json({
      message: "Usuario registrado exitosamente. Revisa tu SMS para el código de verificación.",
      userId: user.id,
      user: { id: user.id, nombre: user.nombre, numero: user.numero, status: user.status }
    });
  } catch (error) {
    console.error("Error registrando usuario:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const verifyUser = async (req, res) => {
  try {
    const { userId, code } = req.body;

    if (!userId || !code) {
      return res.status(400).json({ error: "userId y code son requeridos" });
    }

    const result = await verifyUserCode(userId, code);
    res.status(200).json({ message: "Usuario verificado exitosamente", user: result });
  } catch (error) {
    console.error("Error verificando usuario:", error);
    res.status(400).json({ error: error.message });
  }
};

export const loginBusiness = async (req, res) => {
  console.log("[LOGIN] ✅ Backend recibió petición POST /api/login", new Date().toISOString(), "body:", JSON.stringify(req.body));
  try {
    const rawNumero = req.body?.numero;
    if (rawNumero === undefined || rawNumero === null || rawNumero === "") {
      return res.status(400).json({ error: "Numero es requerido" });
    }
    const numero = String(rawNumero).trim();
    if (!/^\d+$/.test(numero)) {
      return res.status(400).json({ error: "Numero debe contener solo digitos" });
    }

    console.log('Login request:', { numero });

    // Primero intentar como usuario de la app (colección users)
    try {
      const user = await getAppUserByNumero(numero);
      const tokens = generateToken({ id: user.id, role: "user" });
      const refresh = generateRefreshToken({ id: user.id, role: "user" });
      const decodedR = verifyRefreshToken(refresh.refreshToken);
      await admin.firestore().collection("refreshTokens").doc(decodedR.jti).set({
        userId: user.id,
        role: "user",
        expiresAt: admin.firestore.Timestamp.fromMillis(decodedR.exp * 1000),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        revoked: false,
      });
      const secure = process.env.NODE_ENV === "production";
      res.cookie("refreshToken", refresh.refreshToken, {
        httpOnly: true,
        secure,
        sameSite: secure ? "none" : "lax",
        expires: new Date(decodedR.exp * 1000),
      });
      return res.status(200).json({
        message: "Login exitoso",
        user: { id: user.id, nombre: user.nombre, numero: user.numero, status: user.status },
        type: "user",
        ...tokens,
        refreshToken: refresh.refreshToken,
      });
    } catch (e) {
      if (e.message !== "Credenciales incorrectas") throw e;
    }

    // Si no está en users, intentar como negocio (user-business)
    const business = await getBusinessUserByNumero(numero);
    const normalizeSetupFlag = (val) => typeof val === 'string' ? val.toLowerCase() === 'true' : Boolean(val);
    const tokens = generateToken({ id: business.id, role: "business" });
    const refresh = generateRefreshToken({ id: business.id, role: "business" });
    const decodedR = verifyRefreshToken(refresh.refreshToken);
    await admin.firestore().collection("refreshTokens").doc(decodedR.jti).set({
      userId: business.id,
      role: "business",
      expiresAt: admin.firestore.Timestamp.fromMillis(decodedR.exp * 1000),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      revoked: false,
    });
    const secure = process.env.NODE_ENV === "production";
    res.cookie("refreshToken", refresh.refreshToken, {
      httpOnly: true,
      secure,
      sameSite: secure ? "none" : "lax",
      expires: new Date(decodedR.exp * 1000),
    });
    return res.status(200).json({
      message: "Login exitoso",
      business: {
        id: business.id,
        nombre: business.nombre,
        correo: business.correo,
        numero: business.numero,
        avatar: business.avatar ?? null,
        banner: business.banner ?? null,
        isInitialSetupComplete: normalizeSetupFlag(business.isInitialSetupComplete),
      },
      type: "business",
      ...tokens,
      refreshToken: refresh.refreshToken,
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(400).json({ error: error.message });
  }
};

/** Login de negocio: requiere numero y password. POST /api/login-business */
export const loginBusinessWithPassword = async (req, res) => {
  try {
    const body = req.body || {};
    const numero = body.numero ?? body.phone ?? body.telefono;
    const password = body.password ?? body.contraseña ?? body.contrasena ?? body.pass;

    console.log("[LOGIN-BUSINESS] body recibido:", { keys: Object.keys(body), hasNumero: !!numero, hasPassword: !!password });

    if (!numero || String(numero).trim() === "") {
      return res.status(400).json({ error: "Numero es requerido" });
    }
    if (!password || (typeof password === "string" && password.trim() === "")) {
      return res.status(400).json({ error: "Password es requerido" });
    }

    const numeroStr = String(numero).trim();
    if (!/^\d+$/.test(numeroStr)) {
      return res.status(400).json({ error: "Numero debe contener solo digitos" });
    }

    const business = await loginBusinessUser(numeroStr, password);

    const normalizeSetupFlag = (val) => typeof val === "string" ? val.toLowerCase() === "true" : Boolean(val);
    const tokens = generateToken({ id: business.id, role: "business" });
    const refresh = generateRefreshToken({ id: business.id, role: "business" });
    const decodedR = verifyRefreshToken(refresh.refreshToken);
    await admin.firestore().collection("refreshTokens").doc(decodedR.jti).set({
      userId: business.id,
      role: "business",
      expiresAt: admin.firestore.Timestamp.fromMillis(decodedR.exp * 1000),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      revoked: false,
    });
    const secure = process.env.NODE_ENV === "production";
    res.cookie("refreshToken", refresh.refreshToken, {
      httpOnly: true,
      secure,
      sameSite: secure ? "none" : "lax",
      expires: new Date(decodedR.exp * 1000),
    });
    res.status(200).json({
      message: "Login exitoso",
      business: {
        id: business.id,
        nombre: business.nombre,
        correo: business.correo,
        numero: business.numero,
        avatar: business.avatar ?? null,
        banner: business.banner ?? null,
        isInitialSetupComplete: normalizeSetupFlag(business.isInitialSetupComplete),
      },
      ...tokens,
      refreshToken: refresh.refreshToken,
    });
  } catch (error) {
    console.error("Error en login business:", error);
    res.status(400).json({ error: error.message });
  }
};

export const resendBusiness = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ error: "id es requerido" });
    }

    const result = await resendBusinessVerificationCode(id);
    const message = `Tu código de verificación es: ${result.verificationCode}`;
    try {
      await sendBusinessSMS(result.numero, message);
    } catch (smsError) {
      console.error('Failed to send business SMS:', smsError);
      // Continue
    }

    res.status(200).json({ message: "Código reenviado exitosamente" });
  } catch (error) {
    console.error("Error reenviando código para negocio:", error);
    res.status(400).json({ error: error.message });
  }
};

export const uploadBusinessAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No se ha enviado ningún archivo" });
    }

    const { businessId } = req.body;
    if (!businessId) {
      return res.status(400).json({ error: "businessId es requerido" });
    }

    const imageUrl = await uploadImageToFirebase(req.file, businessId);
    await updateBusinessAvatar(businessId, imageUrl);

    res.status(200).json({ url: imageUrl, message: "Avatar de negocio subido y actualizado" });
  } catch (error) {
    console.error("Error subiendo avatar de negocio:", error);
    res.status(500).json({ error: "Error subiendo avatar" });
  }
};

export const uploadBusinessBanner = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No se ha enviado ningún archivo" });
    }

    const { businessId } = req.body;
    if (!businessId) {
      return res.status(400).json({ error: "businessId es requerido" });
    }

    const imageUrl = await uploadImageToFirebase(req.file, businessId);
    await updateBusinessBanner(businessId, imageUrl);

    res.status(200).json({ url: imageUrl, message: "Banner de negocio subido y actualizado" });
  } catch (error) {
    console.error("Error subiendo banner de negocio:", error);
    res.status(500).json({ error: "Error subiendo banner" });
  }
};


export const verifyBusiness = async (req, res) => {
  try {
    const { id, code } = req.body;

    if (!id || !code) {
      return res.status(400).json({ error: "id y code son requeridos" });
    }

    const result = await verifyBusinessCode(id, code);
    res.status(200).json({ message: "Usuario de negocio verificado exitosamente", user: result });
  } catch (error) {
    console.error("Error verificando usuario de negocio:", error);
    res.status(400).json({ error: error.message });
  }
};

export const resendCode = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId es requerido" });
    }

    const result = await resendVerificationCode(userId);
    const message = `Tu código de verificación es: ${result.verificationCode}`;
    await sendSMS(result.numero, message);

    res.status(200).json({ message: "Código reenviado exitosamente" });
  } catch (error) {
    console.error("Error reenviando código:", error);
    res.status(400).json({ error: error.message });
  }
};

export const registerBusiness = async (req, res) => {
  try {
    const { nombre, correo, numero, password, terms, avatar } = req.body;

    // Validation (avatar no es obligatorio)
    if (!nombre || !correo || !numero || !password) {
      return res.status(400).json({ error: "Nombre, correo, numero y password son requeridos" });
    }

    if (terms !== true) {
      return res.status(400).json({ error: "Debes aceptar los términos y condiciones" });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
      return res.status(400).json({ error: "Correo electrónico inválido" });
    }

    // Basic phone validation
    if (!/^\d+$/.test(numero)) {
      return res.status(400).json({ error: "Numero debe contener solo digitos" });
    }

    // Password validation (at least 6 characters, one uppercase, one number)
    if (password.length < 6) {
      return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });
    }
    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({ error: "La contraseña debe incluir al menos una mayúscula" });
    }
    if (!/\d/.test(password)) {
      return res.status(400).json({ error: "La contraseña debe incluir al menos un número" });
    }

    // Create business user (avatar opcional)
    const business = await createBusinessUser(nombre, correo, numero, password, avatar ?? null);

    // Send SMS (don't fail registration if SMS fails)
    const message = `Tu código de verificación es: ${business.verificationCode}`;
    console.log('About to send business SMS to:', business.numero, 'with code:', business.verificationCode);
    try {
      await sendBusinessSMS(business.numero, message);
    } catch (smsError) {
      console.error('Failed to send business SMS:', smsError);
      // Continue with registration success
    }

    res.status(201).json({ message: "Cuenta de negocio registrada exitosamente. Revisa tu SMS para el código de verificación.", business: { id: business.id, nombre: business.nombre, correo: business.correo, numero: business.numero, status: 'pending_verification' } });
  } catch (error) {
    console.error("Error registrando cuenta de negocio:", error);
    res.status(400).json({ error: error.message });
  }
};

export const configureBusiness = async (req, res) => {
  try {
    console.log('➡️ [configure-business] request received', {
      method: req.method,
      url: req.originalUrl,
      contentType: req.headers['content-type'],
      hasFiles: !!req.files,
      files: {
        avatar: req.files?.avatar ? req.files.avatar.map(f => ({ name: f.originalname, size: f.size, type: f.mimetype })) : [],
        image: req.files?.image ? req.files.image.map(f => ({ name: f.originalname, size: f.size, type: f.mimetype })) : [],
        banner: req.files?.banner ? req.files.banner.map(f => ({ name: f.originalname, size: f.size, type: f.mimetype })) : [],
        staffAvatars: req.files?.staffAvatars ? req.files.staffAvatars.map(f => ({ name: f.originalname, size: f.size, type: f.mimetype })) : [],
      },
      bodyKeys: Object.keys(req.body || {}),
    });

    const id = req.body.id ?? req.body.businessId;
    const name = req.body.name;
    const description = req.body.description;
    let staff = [];
    try {
      staff = req.body.staff ? JSON.parse(req.body.staff) : [];
    } catch (e) {
      staff = req.body.staff || [];
    }

    console.log('ℹ️ [configure-business] parsed summary', {
      id,
      name,
      hasAvatarBase64: !!req.body?.avatarBase64,
      hasBannerBase64: !!req.body?.bannerBase64,
      hasAvatarUrl: !!req.body?.avatarUrl,
      hasBannerUrl: !!req.body?.bannerUrl,
      staffCount: Array.isArray(staff) ? staff.length : 0,
    });

    if (!id) {
      return res.status(400).json({ error: "id es requerido" });
    }

    let avatarUrl = null;
    let bannerUrl = null;

    // Avatar: archivo, base64 o URL
    if (req.files?.avatar && req.files.avatar[0]) {
      avatarUrl = await uploadImageToFirebase(req.files.avatar[0], id);
    } else if (req.files?.image && req.files.image[0]) {
      // alias: algunos clientes envían 'image' en lugar de 'avatar'
      avatarUrl = await uploadImageToFirebase(req.files.image[0], id);
    } else if (req.body?.avatarBase64) {
      avatarUrl = await uploadBase64ToFirebase(req.body.avatarBase64, id);
    } else if (req.body?.avatarUrl) {
      try {
        avatarUrl = await uploadFromUrlToFirebase(req.body.avatarUrl, id);
      } catch (e) {
        console.error("Error subiendo avatar desde URL:", e);
      }
    }

    // Banner: archivo, base64 o URL
    if (req.files?.banner && req.files.banner[0]) {
      bannerUrl = await uploadImageToFirebase(req.files.banner[0], id);
    } else if (req.body?.bannerBase64) {
      bannerUrl = await uploadBase64ToFirebase(req.body.bannerBase64, id);
    } else if (req.body?.bannerUrl) {
      try {
        bannerUrl = await uploadFromUrlToFirebase(req.body.bannerUrl, id);
      } catch (e) {
        console.error("Error subiendo banner desde URL:", e);
      }
    }

    const updateData = { isInitialSetupComplete: true };
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (avatarUrl) updateData.avatar = avatarUrl;
    if (bannerUrl) updateData.banner = bannerUrl;

    const userQuery = await db.collection("user-business").where("id", "==", Number(id)).get();
    if (userQuery.empty) {
      return res.status(404).json({ error: "Business not found" });
    }
    const userDoc = userQuery.docs[0];
    await userDoc.ref.update(updateData);

    const staffCreated = [];

    // Staff: opcionalmente subir avatar por índice o dentro del objeto
    if (Array.isArray(staff) && staff.length > 0) {
      for (let i = 0; i < staff.length; i++) {
        const s = staff[i];
        let staffAvatarUrl = "";

        if (s.avatarBase64) {
          staffAvatarUrl = await uploadBase64ToFirebase(s.avatarBase64, id);
        } else if (req.files?.staffAvatars && req.files.staffAvatars[i]) {
          staffAvatarUrl = await uploadImageToFirebase(req.files.staffAvatars[i], id);
        } else if (s.avatarUrl) {
          try {
            staffAvatarUrl = await uploadFromUrlToFirebase(s.avatarUrl, id);
          } catch (e) {
            console.error("Error subiendo staff avatar desde URL:", e);
          }
        }

        const created = await addStaff(Number(id), s.nombre ?? '', s.numero ?? '', s.password ?? '', staffAvatarUrl || s.avatar || "", s.apellido ?? '', s.id ?? null);
        staffCreated.push({ id: created.id, nombre: created.nombre, apellido: created.apellido || '', numero: created.numero, avatar: created.avatar || '' });
      }
    }

    return res.status(200).json({ message: "Business configured successfully", avatarUrl, bannerUrl, staff: staffCreated });
  } catch (error) {
    console.error("Error configuring business:", error);
    return res.status(500).json({ error: "Error configuring business" });
  }
};


export const getBusinessInfo = async (req, res) => {
  try {
    const { businessId } = req.params;
    if (!businessId) {
      return res.status(400).json({ error: "businessId es requerido" });
    }
    const business = await getBusinessById(businessId);
    return res.status(200).json(business);
  } catch (error) {
    if (error.message === "Business not found") {
      return res.status(404).json({ error: "Negocio no encontrado" });
    }
    console.error("Error en getBusinessInfo:", error);
    return res.status(500).json({ error: "Error al obtener la información del negocio" });
  }
};

export const getBusinessPoliciesController = async (req, res) => {
  try {
    const { businessId } = req.params;
    if (!businessId) {
      return res.status(400).json({ error: "businessId es requerido" });
    }
    const policies = await getBusinessPolicies(businessId);
    return res.status(200).json({ policies });
  } catch (error) {
    if (error.message === "Business not found") {
      return res.status(404).json({ error: "Negocio no encontrado" });
    }
    console.error("Error en getBusinessPolicies:", error);
    return res.status(500).json({ error: "Error al obtener políticas del negocio" });
  }
};

export const updateBusinessPoliciesController = async (req, res) => {
  try {
    const { businessId } = req.params;
    if (!businessId) {
      return res.status(400).json({ error: "businessId es requerido" });
    }
    const requester = req.user || {};
    const requesterRole = requester;
    const requesterId = requester.userId;
    const bizIdNum = Number(businessId);
    if (!Number.isFinite(bizIdNum)) {
      return res.status(400).json({ error: "businessId debe ser numérico" });
    }
    console.log({
  requesterRole,
  requesterId: requesterId,
  requesterIdType: typeof requesterId,
  businessIdEnUrl: businessId,
  bizIdNum,
  sonIguales: Number(requesterId) === bizIdNum
});
    if (requesterRole === "business") {
      if (!requesterId || Number(requesterId) !== bizIdNum) {
        return res.status(403).json({ error: "No puedes actualizar políticas de otro negocio" });
      }
    }
    const { cancellationAdvanceMinutes, minAdvanceBookingMinutes, reminderMinutes } = req.body || {};
    const policies = await updateBusinessPolicies(businessId, { cancellationAdvanceMinutes, minAdvanceBookingMinutes, reminderMinutes });
    return res.status(200).json({ message: "Políticas actualizadas", policies });
  } catch (error) {
    const msg = error?.message || "Error actualizando políticas del negocio";
    const code = /inválido|debe ser|not found/i.test(msg) ? 400 : 500;
    return res.status(code).json({ error: msg });
  }
};

export const getUsers = async (req, res) => {
  try {
    const users = await getAllUsers();
    return res.status(200).json({ users, total: users.length });
  } catch (error) {
    console.error("Error obteniendo usuarios:", error);
    return res.status(500).json({ error: "Error al obtener los usuarios registrados" });
  }
};

/** DELETE /api/delete-business - Elimina un usuario de negocio y sus datos relacionados. */
export const deleteBusiness = async (req, res) => {
  try {
    const businessId = req.params.businessId ?? req.body?.businessId;
    if (!businessId) {
      return res.status(400).json({ error: "businessId es requerido" });
    }
    const result = await deleteBusinessUser(businessId);
    return res.status(200).json(result);
  } catch (error) {
    if (error.message === "Business not found") {
      return res.status(404).json({ error: "Negocio no encontrado" });
    }
    if (error.message === "businessId inválido") {
      return res.status(400).json({ error: error.message });
    }
    console.error("Error eliminando usuario de negocio:", error);
    return res.status(500).json({ error: "Error al eliminar el negocio" });
  }
};
