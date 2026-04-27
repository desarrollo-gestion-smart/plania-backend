import admin from "firebase-admin";
import crypto from "crypto";
import bcrypt from "bcrypt";

const db = admin.firestore();

const DEFAULT_STAFF_PERMISSIONS = {
  manualAppointments: false,
  manualBlocks: false,
  viewClientPhone: false,
};

const hashCode = (code) => {
  return crypto.createHash("sha256").update(code).digest("hex");
};

const getNextId = async (counterName) => {
  const counterRef = db.collection("counters").doc(counterName);
  return await db.runTransaction(async (transaction) => {
    const counterDoc = await transaction.get(counterRef);
    const currentId = counterDoc.exists ? counterDoc.data().count : 0;
    const newId = currentId + 1;
    transaction.set(counterRef, { count: newId });
    return newId;
  });
};

export const createUser = async (nombre, numero, verificationCode) => {
  try {
    console.log("Attempting to create user:", { nombre, numero });
    const hashedCode = hashCode(verificationCode);
    const newId = await getNextId("userId");
    const userRef = db.collection("users").doc(newId.toString());
    await userRef.set({
      id: newId,
      nombre,
      numero,
      verificationCode: hashedCode,
      status: "pending_verification",
      verificationAttempts: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log("User created successfully");
    return { id: newId, nombre, numero, status: "pending_verification" };
  } catch (error) {
    console.error("Firestore error:", error);
    throw new Error(`Error creating user: ${error.message}`);
  }
};

export const updateUserAvatar = async (userId, avatarUrl) => {
  try {
    console.log("Updating user avatar:", { userId, avatarUrl });
    const userRef = db.collection("users").doc(userId);
    await userRef.update({
      avatar: avatarUrl,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log("User avatar updated successfully");
    return { id: userId, avatar: avatarUrl };
  } catch (error) {
    console.error("Firestore error updating avatar:", error);
    throw new Error(`Error updating user avatar: ${error.message}`);
  }
};

export const updateBusinessAvatar = async (businessId, avatarUrl) => {
  try {
    console.log("Updating business avatar:", { businessId, avatarUrl });
    const userRef = db.collection("user-business").doc(businessId);
    await userRef.update({
      avatar: avatarUrl,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log("Business avatar updated successfully");
    return { id: businessId, avatar: avatarUrl };
  } catch (error) {
    console.error("Firestore error updating business avatar:", error);
    throw new Error(`Error updating business avatar: ${error.message}`);
  }
};

export const updateBusinessBanner = async (businessId, bannerUrl) => {
  try {
    console.log("Updating business banner:", { businessId, bannerUrl });
    const userRef = db.collection("user-business").doc(businessId);
    await userRef.update({
      banner: bannerUrl,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log("Business banner updated successfully");
    return { id: businessId, banner: bannerUrl };
  } catch (error) {
    console.error("Firestore error updating business banner:", error);
    throw new Error(`Error updating business banner: ${error.message}`);
  }
};

export const updateStaffAvatar = async (staffId, avatarUrl) => {
  try {
    console.log("Updating staff avatar:", { staffId, avatarUrl });
    const staffRef = db.collection("staff").doc(staffId);
    await staffRef.update({
      avatar: avatarUrl,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log("Staff avatar updated successfully");
    return { id: staffId, avatar: avatarUrl };
  } catch (error) {
    console.error("Firestore error updating staff avatar:", error);
    throw new Error(`Error updating staff avatar: ${error.message}`);
  }
};

export const verifyUserCode = async (userId, code) => {
  try {
    console.log("Verifying user code:", { userId });
    const hashedCode = hashCode(code);
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      throw new Error("User not found");
    }
    const userData = userDoc.data();
    const now = admin.firestore.Timestamp.now().toMillis();
    const attempts = userData.verificationAttempts || 0;
    const lastAttempt = userData.lastVerificationAttempt
      ? userData.lastVerificationAttempt.toMillis()
      : 0;
    const oneHour = 60 * 60 * 1000;

    if (attempts >= 3 && now - lastAttempt < oneHour) {
      const remainingTime = Math.ceil((oneHour - (now - lastAttempt)) / 60000); // minutes
      throw new Error(`Demasiados intentos. Espera ${remainingTime} minutos.`);
    }

    // Increment attempts
    await userRef.update({
      verificationAttempts: attempts + 1,
      lastVerificationAttempt: admin.firestore.FieldValue.serverTimestamp(),
    });

    if (userData.verificationCode !== hashedCode) {
      throw new Error("Invalid verification code");
    }

    // Success, reset attempts and verify
    await userRef.update({
      status: "verified",
      verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
      verificationAttempts: 0,
      // Optionally remove verificationCode
    });
    console.log("User verified successfully");
    return { id: userId, status: "verified" };
  } catch (error) {
    console.error("Firestore error verifying code:", error);
    throw new Error(error.message);
  }
};

// Generador de IDs numéricos para staff usando transacción
const getNextStaffId = async () => {
  const counterRef = db.collection("counters").doc("staff");
  return await db.runTransaction(async (t) => {
    const snapshot = await t.get(counterRef);
    if (!snapshot.exists) {
      t.set(counterRef, {
        seq: 1,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return 1;
    }
    const current =
      typeof snapshot.data().seq === "number" ? snapshot.data().seq : 0;
    const next = current + 1;
    t.update(counterRef, {
      seq: next,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return next;
  });
};

export const addStaff = async (
  businessId,
  nombre,
  numero,
  password,
  avatar = null,
  apellido = "",
  staffId = null,
  options: any = {},
) => {
  try {
    console.log("Adding staff:", {
      businessId,
      nombre,
      apellido,
      numero,
      staffId,
    });

    // Check if phone already exists in staff (skip if empty)
    if (typeof numero === "string" ? numero.trim() !== "" : !!numero) {
      const existingPhone = await db
        .collection("staff")
        .where("numero", "==", numero)
        .get();
      if (!existingPhone.empty) {
        throw new Error(
          "El número de teléfono ya está registrado para un miembro del personal",
        );
      }
    }

    // Hash password only if provided and non-empty
    let hashedPassword = null;
    const hasPassword =
      typeof password === "string" ? password.trim() !== "" : !!password;
    if (hasPassword) {
      const saltRounds = 10;
      hashedPassword = await bcrypt.hash(password, saltRounds);
    }

    const finalStaffId = staffId
      ? String(staffId)
      : String(await getNextStaffId());
    const staffRef = db.collection("staff").doc(finalStaffId);
    const rawPermissions =
      options &&
      typeof options.permissions === "object" &&
      options.permissions !== null
        ? options.permissions
        : {};
    const permissions = {
      manualAppointments: Boolean(
        rawPermissions.manualAppointments ??
        DEFAULT_STAFF_PERMISSIONS.manualAppointments,
      ),
      manualBlocks: Boolean(
        rawPermissions.manualBlocks ?? DEFAULT_STAFF_PERMISSIONS.manualBlocks,
      ),
      viewClientPhone: Boolean(
        rawPermissions.viewClientPhone ??
        DEFAULT_STAFF_PERMISSIONS.viewClientPhone,
      ),
    };
    await staffRef.set({
      id: staffRef.id,
      businessId,
      nombre,
      apellido: typeof apellido === "string" ? apellido : "",
      numero,
      password: hashedPassword,
      avatar: avatar || null,
      staffServices: [],
      staffdates: [],
      staffAppoinments: [],
      staffAppointmentsHour: [],
      mostSoldServiceType: null,
      permissions,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log("Staff added successfully with id:", staffRef.id);
    return {
      id: staffRef.id,
      businessId,
      nombre,
      apellido: typeof apellido === "string" ? apellido : "",
      numero,
      avatar: avatar || null,
      permissions,
    };
  } catch (error) {
    console.error("Firestore error adding staff:", error);
    throw new Error(`Error adding staff: ${error.message}`);
  }
};

export const getStaffByBusiness = async (businessId) => {
  try {
    console.log("Getting staff for business:", businessId);
    const staffQuery = await db
      .collection("staff")
      .where("businessId", "==", businessId)
      .get();
    const staff = staffQuery.docs.map((doc) => {
      const data = doc.data();
      const rawPermissions = data.permissions || {};
      return {
        apellido: typeof data.apellido === "string" ? data.apellido : "",
        avatar: data.avatar ?? null,
        businessId: data.businessId,
        createdAt: data.createdAt ?? null,
        id: doc.id,
        nombre: data.nombre ?? "",
        numero: data.numero ?? "",
        password: data.password ?? null,
        updatedAt: data.updatedAt ?? null,
        staffServices: Array.isArray(data.staffServices)
          ? data.staffServices
          : [],
        staffdates: Array.isArray(data.staffdates) ? data.staffdates : [],
        staffAppoinments: Array.isArray(data.staffAppoinments)
          ? data.staffAppoinments
          : [],
        staffAppointmentsHour: Array.isArray(data.staffAppointmentsHour)
          ? data.staffAppointmentsHour
          : [],
        permissions: {
          manualAppointments: Boolean(
            rawPermissions.manualAppointments ??
            DEFAULT_STAFF_PERMISSIONS.manualAppointments,
          ),
          manualBlocks: Boolean(
            rawPermissions.manualBlocks ??
            DEFAULT_STAFF_PERMISSIONS.manualBlocks,
          ),
          viewClientPhone: Boolean(
            rawPermissions.viewClientPhone ??
            DEFAULT_STAFF_PERMISSIONS.viewClientPhone,
          ),
        },
      };
    });
    console.log("Staff retrieved successfully");
    return staff;
  } catch (error) {
    console.error("Firestore error getting staff:", error);
    throw new Error(`Error getting staff: ${error.message}`);
  }
};

export const loginStaff = async (numero, password) => {
  try {
    console.log("Logging in staff:", { numero });
    const staffQuery = await db
      .collection("staff")
      .where("numero", "==", numero)
      .get();
    if (staffQuery.empty) {
      throw new Error("Credenciales incorrectas");
    }
    const staffDoc = staffQuery.docs[0];
    const staffData = staffDoc.data();

    // If staff has no password set or it's not a valid bcrypt hash, fail
    if (
      !staffData.password ||
      typeof staffData.password !== "string" ||
      !staffData.password.startsWith("$2")
    ) {
      throw new Error("Credenciales incorrectas");
    }

    const isPasswordValid = await bcrypt.compare(password, staffData.password);
    if (!isPasswordValid) {
      throw new Error("Credenciales incorrectas");
    }

    console.log("Staff logged in successfully");
    return {
      id: staffData.id,
      businessId: staffData.businessId,
      nombre: staffData.nombre,
      apellido: staffData.apellido || "",
      numero: staffData.numero,
      avatar: staffData.avatar,
    };
  } catch (error) {
    console.error("Firestore error logging in staff:", error);
    throw new Error(error.message);
  }
};

export const findBusinessUser = async (nombre, numero) => {
  try {
    console.log("Finding business user:", { nombre, numero });
    const userQuery = await db
      .collection("user-business")
      .where("nombre", "==", nombre)
      .where("numero", "==", numero)
      .get();

    if (userQuery.empty) {
      throw new Error("credenciales incorrectas");
    }

    const userDoc = userQuery.docs[0];
    const userData = userDoc.data();
    console.log("Business user found");
    return {
      id: userData.id,
      nombre: userData.nombre,
      correo: userData.correo,
      numero: userData.numero,
      avatar: userData.avatar,
      banner: userData.banner,
    };
  } catch (error) {
    console.error("Firestore error finding business user:", error);
    throw new Error(error.message);
  }
};

/** Busca un usuario de la app (colección users) por número. Si hay varios, devuelve el más reciente. */
export const getAppUserByNumero = async (numero) => {
  const numStr = String(numero).trim();
  const userQuery = await db
    .collection("users")
    .where("numero", "==", numStr)
    .get();
  if (userQuery.empty) {
    throw new Error("Credenciales incorrectas");
  }
  const docs = userQuery.docs;
  const sorted = docs.sort((a, b) => {
    const tA = a.data().createdAt?.toMillis?.() ?? 0;
    const tB = b.data().createdAt?.toMillis?.() ?? 0;
    return tB - tA;
  });
  const userData = sorted[0].data();
  return {
    id: userData.id,
    nombre: userData.nombre ?? "",
    numero: userData.numero ?? numStr,
    status: userData.status ?? "pending_verification",
    type: "user",
  };
};

export const getBusinessUserByNumero = async (numero) => {
  try {
    const numStr = String(numero).trim();
    const userQuery = await db
      .collection("user-business")
      .where("numero", "==", numStr)
      .get();
    if (userQuery.empty) {
      throw new Error("Credenciales incorrectas");
    }
    const userData = userQuery.docs[0].data();
    const setupFlag =
      typeof userData.isInitialSetupComplete === "string"
        ? userData.isInitialSetupComplete.toLowerCase() === "true"
        : Boolean(userData.isInitialSetupComplete);
    return {
      id: userData.id,
      nombre: userData.nombre,
      correo: userData.correo,
      numero: userData.numero,
      avatar: userData.avatar,
      banner: userData.banner,
      isInitialSetupComplete: setupFlag,
      type: "business",
    };
  } catch (error) {
    console.error("Firestore error getting business user by numero:", error);
    throw new Error(error.message);
  }
};

export const loginBusinessUser = async (numero, password) => {
  try {
    console.log("Logging in business user:", { numero });
    const numStr = String(numero).trim();
    const userQuery = await db
      .collection("user-business")
      .where("numero", "==", numStr)
      .get();
    console.log("User query docs count:", userQuery.docs.length);
    if (userQuery.empty) {
      throw new Error("Este número no está registrado");
    }

    // Check password against all matching users
    for (const userDoc of userQuery.docs) {
      const userData = userDoc.data();
      const isPasswordValid = await bcrypt.compare(password, userData.password);
      if (isPasswordValid) {
        console.log("Business user logged in successfully");
        const setupFlag =
          typeof userData.isInitialSetupComplete === "string"
            ? userData.isInitialSetupComplete.toLowerCase() === "true"
            : Boolean(userData.isInitialSetupComplete);
        return {
          id: userData.id,
          nombre: userData.nombre,
          correo: userData.correo,
          numero: userData.numero,
          avatar: userData.avatar,
          banner: userData.banner,
          isInitialSetupComplete: setupFlag,
        };
      }
    }

    throw new Error("Error en las credenciales");
  } catch (error) {
    console.error("Firestore error logging in business user:", error);
    throw new Error(error.message);
  }
};

export const createBusinessUser = async (
  nombre,
  correo,
  numero,
  password,
  avatar = null,
) => {
  try {
    console.log("Attempting to create business user:", {
      nombre,
      correo,
      numero,
    });

    // Check if email already exists
    const existingUser = await db
      .collection("user-business")
      .where("correo", "==", correo)
      .get();
    if (!existingUser.empty) {
      throw new Error(
        "El correo electrónico ya está registrado. Inicie sesión.",
      );
    }

    // Generate 6-digit verification code
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();

    // Hash password and code
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const hashedCode = hashCode(verificationCode);

    const newId = await getNextId("businessUserId");
    const userRef = db.collection("user-business").doc(newId.toString());
    await userRef.set({
      id: newId,
      nombre,
      correo,
      numero,
      password: hashedPassword,
      verificationCode: hashedCode,
      status: "pending_verification",
      verificationAttempts: 0,
      avatar: avatar || null,
      banner: null,
      isInitialSetupComplete: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log("Business user created successfully");
    return { id: newId, nombre, correo, numero, verificationCode };
  } catch (error) {
    console.error("Firestore error creating business user:", error);
    throw new Error(`Error creando usuario de negocio: ${error.message}`);
  }
};

export const resendVerificationCode = async (userId) => {
  try {
    console.log("Reenvio de codigo por:", userId);

    return await db.runTransaction(async (transaction) => {
      const userRef = db.collection("users").doc(userId);
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists) throw new Error("Usuario no encontrado");

      const userData = userDoc.data();
      const now = Date.now(); // � usamos timestamp numérico local
      const createdAt = userData.createdAt?.toMillis
        ? userData.createdAt.toMillis()
        : now - 2 * 60 * 1000;

      const lastResend =
        typeof userData.lastResendRequest === "number"
          ? userData.lastResendRequest
          : createdAt;

      const diff = now - lastResend;
      const oneMinute = 60 * 1000;

      console.log({
        now,
        lastResend,
        diff,
        hasLastResend: !!userData.lastResendRequest,
        hasCreatedAt: !!userData.createdAt,
      });

      if (diff < oneMinute) {
        const remaining = Math.ceil((oneMinute - diff) / 1000);
        console.log(`⛔ Blocked resend: must wait ${remaining}s`);
        throw new Error(
          `Debes esperar ${remaining} segundos antes de reenviar.`,
        );
      }

      const newCode = Math.floor(100000 + Math.random() * 900000).toString();
      const hashedCode = hashCode(newCode);

      transaction.update(userRef, {
        verificationCode: hashedCode,
        lastResendRequest: now, // � guardamos número, no serverTimestamp()
        verificationAttempts: 0,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`✅ Nuevo codigo generado por ${userId}: ${newCode}`);

      return {
        id: userId,
        numero: userData.numero,
        verificationCode: newCode,
        nextAvailableResendAt: now + oneMinute,
      };
    });
  } catch (error) {
    console.error("� Error en el reenvio de codigo:", error.message);
    throw new Error(error.message);
  }
};

export const verifyBusinessCode = async (id, code) => {
  try {
    if (!id || id.toString().trim() === "") {
      throw new Error("Invalid id");
    }
    console.log("Verifying business user code:", { id });
    const hashedCode = hashCode(code);
    const userQuery = await db
      .collection("user-business")
      .where("id", "==", id)
      .get();
    if (userQuery.empty) {
      throw new Error("Business user not found");
    }
    const userDoc = userQuery.docs[0];
    const userRef = userDoc.ref;
    const userData = userDoc.data();
    const now = admin.firestore.Timestamp.now().toMillis();
    const attempts = userData.verificationAttempts || 0;
    const lastAttempt = userData.lastVerificationAttempt
      ? userData.lastVerificationAttempt.toMillis()
      : 0;
    const oneHour = 60 * 60 * 1000;

    if (attempts >= 3 && now - lastAttempt < oneHour) {
      const remainingTime = Math.ceil((oneHour - (now - lastAttempt)) / 60000); // minutes
      throw new Error(`Demasiados intentos. Espera ${remainingTime} minutos.`);
    }

    // Increment attempts
    await userRef.update({
      verificationAttempts: attempts + 1,
      lastVerificationAttempt: admin.firestore.FieldValue.serverTimestamp(),
    });

    if (userData.verificationCode !== hashedCode) {
      throw new Error("Invalid verification code");
    }

    // Success, reset attempts and verify
    await userRef.update({
      status: "verified",
      verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
      verificationAttempts: 0,
      // Optionally remove verificationCode
    });
    console.log("Business user verified successfully");
    return { id: id, status: "verified" };
  } catch (error) {
    console.error("Firestore error verifying business code:", error);
    throw new Error(error.message);
  }
};

export const resendBusinessVerificationCode = async (id) => {
  try {
    console.log("Reenvio de codigo de negocio por:", id);

    return await db.runTransaction(async (transaction) => {
      const userQuery = await db
        .collection("user-business")
        .where("id", "==", id)
        .get();
      if (userQuery.empty) throw new Error("Usuario de negocio no encontrado");
      const userDoc = userQuery.docs[0];
      const userRef = userDoc.ref;

      const userData = userDoc.data();
      const now = Date.now(); // � usamos timestamp numérico local
      const createdAt = userData.createdAt?.toMillis
        ? userData.createdAt.toMillis()
        : now - 2 * 60 * 1000;

      const lastResend =
        typeof userData.lastResendRequest === "number"
          ? userData.lastResendRequest
          : createdAt;

      const diff = now - lastResend;
      const oneMinute = 60 * 1000;

      console.log({
        now,
        lastResend,
        diff,
        hasLastResend: !!userData.lastResendRequest,
        hasCreatedAt: !!userData.createdAt,
      });

      if (diff < oneMinute) {
        const remaining = Math.ceil((oneMinute - diff) / 1000);
        console.log(`⛔ Blocked resend: must wait ${remaining}s`);
        throw new Error(
          `Debes esperar ${remaining} segundos antes de reenviar.`,
        );
      }

      const newCode = Math.floor(100000 + Math.random() * 900000).toString();
      const hashedCode = hashCode(newCode);

      transaction.update(userRef, {
        verificationCode: hashedCode,
        lastResendRequest: now, // � guardamos número, no serverTimestamp()
        verificationAttempts: 0,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`✅ Nuevo codigo generado por negocio ${id}: ${newCode}`);

      return {
        id: id,
        numero: userData.numero,
        verificationCode: newCode,
        nextAvailableResendAt: now + oneMinute,
      };
    });
  } catch (error) {
    console.error("� Error en el reenvio de codigo de negocio:", error.message);
    throw new Error(error.message);
  }
};

export const updateStaffFields = async (
  staffId,
  { nombre, apellido, numero, password, permissions },
) => {
  try {
    const staffRef = db.collection("staff").doc(String(staffId));
    const docSnap = await staffRef.get();
    if (!docSnap.exists) {
      throw new Error("No document to update");
    }

    const updateData: any = {};

    if (nombre !== undefined) updateData.nombre = nombre;
    if (apellido !== undefined)
      updateData.apellido = typeof apellido === "string" ? apellido : "";

    if (numero !== undefined) {
      // Basic digit-only validation when provided
      if (
        typeof numero === "string" &&
        numero.trim() !== "" &&
        !/^\d+$/.test(numero)
      ) {
        throw new Error("Numero debe contener solo digitos");
      }
      updateData.numero = numero;
      // Uniqueness check when numero is non-empty and changed
      if (typeof numero === "string" ? numero.trim() !== "" : !!numero) {
        const existingPhone = await db
          .collection("staff")
          .where("numero", "==", numero)
          .get();
        const conflict = existingPhone.docs.some(
          (d) => d.id !== String(staffId),
        );
        if (conflict) {
          throw new Error(
            "El número de teléfono ya está registrado para un miembro del personal",
          );
        }
      }
    }

    if (password !== undefined) {
      let hashedPassword = null;
      const hasPassword =
        typeof password === "string" ? password.trim() !== "" : !!password;
      if (hasPassword) {
        const saltRounds = 10;
        hashedPassword = await bcrypt.hash(password, saltRounds);
      }
      updateData.password = hashedPassword; // null if empty string provided
    }

    if (permissions !== undefined) {
      if (permissions && typeof permissions === "object") {
        const current = docSnap.data().permissions || {};
        updateData.permissions = {
          manualAppointments: Boolean(
            permissions.manualAppointments ??
            current.manualAppointments ??
            DEFAULT_STAFF_PERMISSIONS.manualAppointments,
          ),
          manualBlocks: Boolean(
            permissions.manualBlocks ??
            current.manualBlocks ??
            DEFAULT_STAFF_PERMISSIONS.manualBlocks,
          ),
          viewClientPhone: Boolean(
            permissions.viewClientPhone ??
            current.viewClientPhone ??
            DEFAULT_STAFF_PERMISSIONS.viewClientPhone,
          ),
        };
      }
    }

    updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    await staffRef.update(updateData);

    const updatedSnap = await staffRef.get();
    const data = updatedSnap.data();
    return {
      id: updatedSnap.id,
      nombre: data.nombre,
      apellido: data.apellido || "",
      numero: data.numero,
      permissions: data.permissions || {
        manualAppointments: DEFAULT_STAFF_PERMISSIONS.manualAppointments,
        manualBlocks: DEFAULT_STAFF_PERMISSIONS.manualBlocks,
        viewClientPhone: DEFAULT_STAFF_PERMISSIONS.viewClientPhone,
      },
    };
  } catch (error) {
    console.error("Firestore error updating staff fields:", error);
    throw new Error(error.message);
  }
};

export const APPOINTMENT_STATES = [
  "pendiente",
  "confirmado",
  "cancelado",
  "completado",
];

export const createAppointment = async ({
  businessId,
  staffId,
  userId,
  serviceId,
  date,
  horario,
  calificacion,
}) => {
  try {
    if (!businessId || !staffId || !date || !horario || !userId) {
      throw new Error(
        "Campos requeridos: businessId, staffId, userId, date, horario",
      );
    }

    let finalDuration = undefined;
    let finalType = undefined;

    // Validate business exists
    const businessQuery = await db
      .collection("user-business")
      .where("id", "==", Number(businessId))
      .get();
    if (businessQuery.empty) {
      throw new Error("Business not found");
    }
    const businessRef = businessQuery.docs[0].ref;

    const staffDoc = await db.collection("staff").doc(String(staffId)).get();
    if (!staffDoc.exists) {
      throw new Error("Staff not found");
    }
    const staffData = staffDoc.data();
    if (Number(staffData.businessId) !== Number(businessId)) {
      throw new Error("Staff no pertenece al negocio");
    }
    const userDoc = await db.collection("users").doc(String(userId)).get();
    if (!userDoc.exists) {
      throw new Error("User not found");
    }
    const userData = userDoc.data();

    // Validate date format dd/MM/YYYY and actual calendar date
    const match = /^([0-9]{2})\/([0-9]{2})\/([0-9]{4})$/.exec(String(date));
    if (!match) {
      throw new Error("Fecha inválida. Formato requerido dd/MM/YYYY");
    }
    const d = Number(match[1]);
    const m = Number(match[2]);
    const y = Number(match[3]);
    const jsDate = new Date(y, m - 1, d);
    if (
      jsDate.getFullYear() !== y ||
      jsDate.getMonth() !== m - 1 ||
      jsDate.getDate() !== d
    ) {
      throw new Error("Fecha inválida en el calendario");
    }

    if (serviceId !== undefined && serviceId !== null) {
      const svcRef = db.collection("services").doc(String(serviceId));
      const svcDoc = await svcRef.get();
      if (!svcDoc.exists) {
        throw new Error("Service not found");
      }
      const svcData = svcDoc.data();
      if (Number(svcData.businessId) !== Number(businessId)) {
        throw new Error("Service no pertenece al negocio");
      }
      finalType = String(svcData.type ?? finalType ?? "");
      if (
        finalDuration === undefined &&
        typeof svcData.duration === "number" &&
        svcData.duration > 0
      ) {
        finalDuration = svcData.duration;
      }
    }
    if (
      finalDuration !== undefined &&
      (typeof finalDuration !== "number" || finalDuration <= 0)
    ) {
      throw new Error("serviceDuration debe ser un número positivo (minutos)");
    }

    // Generate appointment id
    const newId = await getNextId("appointmentId");
    const appointmentRef = db.collection("appointments").doc(String(newId));

    const appointment = {
      businessId: Number(businessId),
      idappointment: newId,
      staffdates: String(date),
      staffAppoinments: Number(staffId),
      staffAppointmentsHour: String(horario),
      serviceId:
        serviceId !== undefined && serviceId !== null
          ? Number(serviceId)
          : null,
      serviceType: finalType ? String(finalType) : "",
      serviceDuration: typeof finalDuration === "number" ? finalDuration : null,
      state: "pendiente",
      userId: Number(userId),
      userNombre: userData?.nombre ?? "",
      userNumero: userData?.numero ?? "",
      userAvatar: userData?.avatar ?? null,
    };

    await appointmentRef.set(appointment);

    const summary = {
      id: newId,
      staffId: String(staffId),
      serviceId: appointment.serviceId,
      serviceType: appointment.serviceType,
      serviceDuration: typeof finalDuration === "number" ? finalDuration : null,
      date: String(date),
      horario: String(horario),
      calificacion: typeof calificacion === "number" ? calificacion : null,
      state: "pendiente",
      userId: Number(userId),
      userNombre: userData?.nombre ?? "",
      userNumero: userData?.numero ?? "",
    };
    await businessRef.update({
      appointments: admin.firestore.FieldValue.arrayUnion(summary),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Vincular al staff: agregar fecha, id y hora a sus arrays
    await db
      .collection("staff")
      .doc(String(staffId))
      .update({
        staffdates: admin.firestore.FieldValue.arrayUnion(String(date)),
        staffAppoinments: admin.firestore.FieldValue.arrayUnion(Number(newId)),
        staffAppointmentsHour: admin.firestore.FieldValue.arrayUnion(
          String(horario),
        ),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    return appointment;
  } catch (error) {
    console.error("Firestore error creando cita:", error);
    throw new Error(error.message);
  }
};

export const createManualAppointment = async ({
  businessId,
  staffId,
  serviceId,
  date,
  horario,
  name,
}) => {
  try {
    if (!businessId || !staffId || !date || !horario) {
      throw new Error("Campos requeridos: businessId, staffId, date, horario");
    }

    let finalDuration = undefined;
    let finalType = undefined;

    const businessQuery = await db
      .collection("user-business")
      .where("id", "==", Number(businessId))
      .get();
    if (businessQuery.empty) {
      throw new Error("Business not found");
    }
    const businessRef = businessQuery.docs[0].ref;

    const staffDoc = await db.collection("staff").doc(String(staffId)).get();
    if (!staffDoc.exists) {
      throw new Error("Staff not found");
    }
    const staffData = staffDoc.data();
    if (Number(staffData.businessId) !== Number(businessId)) {
      throw new Error("Staff no pertenece al negocio");
    }

    const match = /^([0-9]{2})\/([0-9]{2})\/([0-9]{4})$/.exec(String(date));
    if (!match) {
      throw new Error("Fecha inválida. Formato requerido dd/MM/YYYY");
    }
    const d = Number(match[1]);
    const m = Number(match[2]);
    const y = Number(match[3]);
    const jsDate = new Date(y, m - 1, d);
    if (
      jsDate.getFullYear() !== y ||
      jsDate.getMonth() !== m - 1 ||
      jsDate.getDate() !== d
    ) {
      throw new Error("Fecha inválida en el calendario");
    }

    if (serviceId !== undefined && serviceId !== null) {
      const svcDoc = await db.collection("services").doc(String(serviceId)).get();
      if (!svcDoc.exists) {
        throw new Error("Service not found");
      }
      const svcData = svcDoc.data();
      if (Number(svcData.businessId) !== Number(businessId)) {
        throw new Error("Service no pertenece al negocio");
      }
      finalType = String(svcData.type ?? "");
      if (typeof svcData.duration === "number" && svcData.duration > 0) {
        finalDuration = svcData.duration;
      }
    }

    const newId = await getNextId("appointmentId");
    const appointmentRef = db.collection("appointments").doc(String(newId));

    const appointment = {
      businessId: Number(businessId),
      idappointment: newId,
      staffdates: String(date),
      staffAppoinments: Number(staffId),
      staffAppointmentsHour: String(horario),
      serviceId: serviceId !== undefined && serviceId !== null ? Number(serviceId) : null,
      serviceType: finalType ? String(finalType) : "",
      serviceDuration: typeof finalDuration === "number" ? finalDuration : null,
      state: "pendiente",
      userId: null,
      userNombre: name ? String(name) : "",
      userNumero: "",
      userAvatar: null,
    };

    await appointmentRef.set(appointment);

    const summary = {
      id: newId,
      staffId: String(staffId),
      serviceId: appointment.serviceId,
      serviceType: appointment.serviceType,
      serviceDuration: appointment.serviceDuration,
      date: String(date),
      horario: String(horario),
      state: "pendiente",
      userId: null,
    };
    await businessRef.update({
      appointments: admin.firestore.FieldValue.arrayUnion(summary),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await db
      .collection("staff")
      .doc(String(staffId))
      .update({
        staffdates: admin.firestore.FieldValue.arrayUnion(String(date)),
        staffAppoinments: admin.firestore.FieldValue.arrayUnion(Number(newId)),
        staffAppointmentsHour: admin.firestore.FieldValue.arrayUnion(String(horario)),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    return appointment;
  } catch (error) {
    console.error("Firestore error creando cita manual:", error);
    throw new Error(error.message);
  }
};

export const updateAppointmentState = async (appointmentId, newState) => {
  try {
    if (!APPOINTMENT_STATES.includes(newState)) {
      throw new Error(
        `Estado inválido. Valores permitidos: ${APPOINTMENT_STATES.join(", ")}`,
      );
    }

    const docRef = db.collection("appointments").doc(String(appointmentId));
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new Error("Cita no encontrada");
    }

    const patch: any = {
      state: newState,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (newState === "confirmado") {
      const data = doc.data();
      const dateStr = String(data.staffdates ?? data.date ?? "");
      const hourStr = String(data.staffAppointmentsHour ?? data.horario ?? "");
      const m = /^([0-9]{2})\/([0-9]{2})\/([0-9]{4})$/.exec(dateStr);
      const hm = /^([0-9]{2}):([0-9]{2})$/.exec(hourStr);
      let durationMin =
        typeof data.serviceDuration === "number" ? data.serviceDuration : null;
      if (!durationMin || durationMin <= 0) {
        const svcId = data.serviceId ?? null;
        if (svcId != null) {
          const svcDoc = await db
            .collection("services")
            .doc(String(svcId))
            .get();
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
        const startMs = start.getTime();
        const endMs = startMs + durationMin * 60000;
        const endDt = new Date(endMs);
        const endHH = String(endDt.getHours()).padStart(2, "0");
        const endMM = String(endDt.getMinutes()).padStart(2, "0");
        patch.startAtEpoch = startMs;
        patch.endAtEpoch = endMs;
        patch.endAt = `${endHH}:${endMM}`;
      }
    }

    await docRef.update(patch);

    return { idappointment: Number(appointmentId), state: newState };
  } catch (error) {
    console.error("Firestore error actualizando estado de cita:", error);
    throw new Error(error.message);
  }
};

export const updateAppointmentReschedule = async (appointmentId, date, horario) => {
  try {
    const docRef = db.collection("appointments").doc(String(appointmentId));
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new Error("Cita no encontrada");
    }

    const dateStr = String(date || "").trim();
    const hourStr = String(horario || "").trim();
    const m = /^([0-9]{2})\/([0-9]{2})\/([0-9]{4})$/.exec(dateStr);
    if (!m) {
      throw new Error("Fecha inválida. Formato requerido dd/MM/YYYY");
    }
    const d = Number(m[1]);
    const mo = Number(m[2]);
    const y = Number(m[3]);
    const jsDate = new Date(y, mo - 1, d);
    if (
      jsDate.getFullYear() !== y ||
      jsDate.getMonth() !== mo - 1 ||
      jsDate.getDate() !== d
    ) {
      throw new Error("Fecha inválida en el calendario");
    }

    const hm = /^([0-9]{2}):([0-9]{2})$/.exec(hourStr);
    if (!hm) {
      throw new Error("Horario inválido. Formato requerido HH:mm");
    }
    const hh = Number(hm[1]);
    const mm = Number(hm[2]);
    if (hh < 0 || hh > 23 || mm < 0 || mm > 59) {
      throw new Error("Horario inválido. Usa una hora entre 00:00 y 23:59");
    }

    const patch: any = {
      staffdates: dateStr,
      staffAppointmentsHour: hourStr,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const data = doc.data() || {};
    if (data.state === "confirmado") {
      let durationMin =
        typeof data.serviceDuration === "number" ? data.serviceDuration : null;
      if (!durationMin || durationMin <= 0) {
        const svcId = data.serviceId ?? null;
        if (svcId != null) {
          const svcDoc = await db
            .collection("services")
            .doc(String(svcId))
            .get();
          if (svcDoc.exists) {
            const svc = svcDoc.data();
            if (typeof svc.duration === "number" && svc.duration > 0) {
              durationMin = Number(svc.duration);
            }
          }
        }
      }

      if (durationMin && durationMin > 0) {
        const start = new Date(y, mo - 1, d, hh, mm, 0, 0);
        const startMs = start.getTime();
        const endMs = startMs + durationMin * 60000;
        const endDt = new Date(endMs);
        const endHH = String(endDt.getHours()).padStart(2, "0");
        const endMM = String(endDt.getMinutes()).padStart(2, "0");
        patch.startAtEpoch = startMs;
        patch.endAtEpoch = endMs;
        patch.endAt = `${endHH}:${endMM}`;
      }
    }

    await docRef.update(patch);

    return {
      idappointment: Number(appointmentId),
      date: patch.staffdates,
      horario: patch.staffAppointmentsHour,
    };
  } catch (error) {
    console.error("Firestore error reprogramando cita:", error);
    throw new Error(error.message);
  }
};

export const updateAppointmentCalificacion = async (
  appointmentsId,
  calificacion,
  descripcion,
) => {
  try {
    const docRef = db.collection("appointments").doc(String(appointmentsId));
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new Error("Cita no encontrada");
    }

    const now = new Date();
    const calificacionUpdatedAt = `${String(now.getDate()).padStart(2, "0")}/${String(
      now.getMonth() + 1,
    ).padStart(2, "0")}/${now.getFullYear()}`;
    const patch = {
      calificacion:
        calificacion === null || calificacion === undefined
          ? null
          : Number(calificacion),
      descripcion:
        descripcion === null || descripcion === undefined
          ? null
          : String(descripcion),
      calificacionUpdatedAt,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await docRef.update(patch);

    return {
      idappointment: Number(appointmentsId),
      calificacion: patch.calificacion,
      descripcion: patch.descripcion,
      calificacionUpdatedAt: patch.calificacionUpdatedAt,
    };
  } catch (error) {
    console.error("Firestore error actualizando calificación de cita:", error);
    throw new Error(error.message);
  }
};

export const deleteAppointment = async (appointmentId) => {
  try {
    const id = String(appointmentId || "").trim();
    if (!id) {
      throw new Error("ID de cita inválido");
    }

    const docRef = db.collection("appointments").doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new Error("Cita no encontrada");
    }

    await docRef.delete();
    return { idappointment: Number(id), deleted: true };
  } catch (error) {
    console.error("Firestore error eliminando cita:", error);
    throw new Error(error.message);
  }
};

export const getAppointmentsByBusiness = async (businessId, filterStaffId?: string | number) => {
  try {
    const bizIdNum = Number(businessId);
    const [querySnap, staffSnap, svcSnap, businessSnap] = await Promise.all([
      db.collection("appointments").where("businessId", "==", bizIdNum).get(),
      db.collection("staff").where("businessId", "==", bizIdNum).get(),
      db.collection("services").where("businessId", "==", bizIdNum).get(),
      db.collection("user-business").where("id", "==", bizIdNum).limit(1).get(),
    ]);
    const businessData = !businessSnap.empty ? businessSnap.docs[0].data() || {} : {};
    const direccion = businessData?.direccion && typeof businessData.direccion === "object"
      ? businessData.direccion
      : null;
    const staffMap = new Map();
    staffSnap.docs.forEach((doc) => {
      const data = doc.data();
      staffMap.set(String(doc.id), {
        nombre: data.nombre || "",
        apellido: data.apellido || "",
      });
    });
    const svcMap = new Map();
    svcSnap.docs.forEach((doc) => {
      const data = doc.data();
      svcMap.set(Number(data.id ?? Number(doc.id)), {
        id: Number(data.id ?? Number(doc.id)),
        name: data.name ?? "",
        type: data.type ?? "",
        duration: data.duration ?? null,
        price: data.price ?? null,
        category: data.category ?? "service",
      });
    });

    const results = querySnap.docs.map((d) => {
      const data = d.data();
      const staffId = String(data.staffAppoinments ?? data.staffId ?? "");
      const staffInfo = staffMap.get(staffId) || { nombre: "", apellido: "" };
      const serviceId = data.serviceId ?? null;
      const svcInfo =
        serviceId != null ? svcMap.get(Number(serviceId)) || null : null;
      return {
        businessId: Number(data.businessId ?? businessId),
        idappointment: Number(data.idappointment ?? Number(d.id)),
        staffdates: String(data.staffdates ?? data.date ?? ""),
        staffAppoinments: Number(data.staffAppoinments ?? data.staffId ?? 0),
        staffAppointmentsHour: String(
          data.staffAppointmentsHour ?? data.horario ?? "",
        ),
        serviceType: String(data.serviceType ?? ""),
        serviceDuration: data.serviceDuration ?? null,
        direccion,
        state: data.state ?? "pendiente",
        calificacion:
          data.calificacion === null || data.calificacion === undefined
            ? null
            : Number(data.calificacion),
        staffNombre: staffInfo.nombre,
        staffApellido: staffInfo.apellido,
        service: svcInfo,
        userId:
          typeof data.userId === "number"
            ? data.userId
            : data.userId
              ? Number(data.userId)
              : null,
        userNombre: data.userNombre ?? "",
        userNumero: data.userNumero ?? "",
        userAvatar: data.userAvatar ?? null,
      };
    });

    if (filterStaffId !== undefined && filterStaffId !== null && filterStaffId !== "") {
      const staffIdNum = Number(filterStaffId);
      return results.filter((a) => Number(a.staffAppoinments) === staffIdNum);
    }

    return results;
  } catch (error) {
    console.error("Firestore error obteniendo citas por negocio:", error);
    throw new Error(error.message);
  }
};

export const getAppointmentsByClientId = async (clientId) => {
  try {
    const clientIdNum = Number(clientId);
    const querySnap = await db
      .collection("appointments")
      .where("userId", "==", clientIdNum)
      .get();

    const businessIds = Array.from(
      new Set(
        querySnap.docs
          .map((d) => Number(d.data()?.businessId))
          .filter((id) => Number.isFinite(id)),
      ),
    );
    const businessMap = new Map();
    if (businessIds.length > 0) {
      const chunks = [];
      for (let i = 0; i < businessIds.length; i += 10) {
        chunks.push(businessIds.slice(i, i + 10));
      }
      const snaps = await Promise.all(
        chunks.map((chunk) =>
          db.collection("user-business").where("id", "in", chunk).get(),
        ),
      );
      snaps.forEach((snap) => {
        snap.docs.forEach((doc) => {
          const b = doc.data() || {};
          const id = Number(b.id ?? doc.id);
          businessMap.set(id, {
            direccion: b?.direccion && typeof b.direccion === "object" ? b.direccion : null,
            name: b?.name ?? "",
            avatar: b?.avatar ?? null,
          });
        });
      });
    }

    const serviceIds = Array.from(
      new Set(
        querySnap.docs
          .map((d) => d.data()?.serviceId)
          .filter((id) => id != null)
          .map(Number)
          .filter((id) => Number.isFinite(id)),
      ),
    );
    const svcMap = new Map();
    if (serviceIds.length > 0) {
      const chunks = [];
      for (let i = 0; i < serviceIds.length; i += 10) {
        chunks.push(serviceIds.slice(i, i + 10));
      }
      const snaps = await Promise.all(
        chunks.map((chunk) =>
          db.collection("services").where("id", "in", chunk).get(),
        ),
      );
      snaps.forEach((snap) => {
        snap.docs.forEach((doc) => {
          const s = doc.data() || {};
          const id = Number(s.id ?? doc.id);
          svcMap.set(id, {
            id,
            name: s.name ?? "",
            type: s.type ?? "",
            duration: s.duration ?? null,
            price: s.price ?? null,
            category: s.category ?? "service",
          });
        });
      });
    }

    const results = querySnap.docs.map((d) => {
      const data = d.data();
      const bizId = Number(data.businessId ?? 0);
      const bizInfo = businessMap.get(bizId) ?? { direccion: null, name: "", avatar: null };
      const serviceId = data.serviceId != null ? Number(data.serviceId) : null;
      const svcInfo = serviceId != null ? svcMap.get(serviceId) ?? null : null;
      return {
        businessId: bizId,
        businessName: bizInfo.name,
        businessAvatar: bizInfo.avatar,
        idappointment: Number(data.idappointment ?? Number(d.id)),
        staffdates: String(data.staffdates ?? data.date ?? ""),
        staffAppoinments: Number(data.staffAppoinments ?? data.staffId ?? 0),
        staffAppointmentsHour: String(
          data.staffAppointmentsHour ?? data.horario ?? "",
        ),
        serviceType: String(data.serviceType ?? ""),
        serviceDuration: data.serviceDuration ?? null,
        service: svcInfo,
        direccion: bizInfo.direccion,
        state: data.state ?? "pendiente",
        status: data.state ?? "pendiente",
        calificacion:
          data.calificacion === null || data.calificacion === undefined
            ? null
            : Number(data.calificacion),
        calificacionUpdatedAt: (() => {
          const raw = data.calificacionUpdatedAt;
          if (typeof raw === "string" && raw.trim()) return raw;
          if (typeof raw === "number") {
            const d = new Date(raw);
            return `${String(d.getDate()).padStart(2, "0")}/${String(
              d.getMonth() + 1,
            ).padStart(2, "0")}/${d.getFullYear()}`;
          }
          return null;
        })(),
        userId:
          typeof data.userId === "number"
            ? data.userId
            : data.userId
              ? Number(data.userId)
              : null,
        userNombre: data.userNombre ?? "",
        userNumero: data.userNumero ?? "",
        userAvatar: data.userAvatar ?? null,
      };
    });

    return results;
  } catch (error) {
    console.error("Firestore error obteniendo citas por clientId:", error);
    throw new Error(error.message);
  }
};

/**
 * Agrupa clientes por cantidad de citas en el negocio.
 * - mejores: userId con más de 3 citas (count > 3)
 * - noTeVisitan: userId con exactamente 3 citas
 * - noHanVuelto: userId con 1 o 2 citas
 * - todos: todos los userId únicos con al menos 1 cita
 * Cada item es { userId, userName, userAvatar, staffdates }. userName viene de userNombre en las citas.
 */
export const getListClientsByBusiness = async (businessId) => {
  try {
    const appointments = await getAppointmentsByBusiness(businessId);
    const byUser = new Map();

    const toEpoch = (dateStr) => {
      const raw = String(dateStr || "").trim();
      const m1 = /^([0-9]{2})\/([0-9]{2})\/([0-9]{4})$/.exec(raw);
      if (m1) {
        const dd = Number(m1[1]);
        const mm = Number(m1[2]);
        const yyyy = Number(m1[3]);
        return new Date(yyyy, mm - 1, dd, 0, 0, 0, 0).getTime();
      }
      const m2 = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(raw);
      if (m2) {
        const yyyy = Number(m2[1]);
        const mm = Number(m2[2]);
        const dd = Number(m2[3]);
        return new Date(yyyy, mm - 1, dd, 0, 0, 0, 0).getTime();
      }
      return Number.NEGATIVE_INFINITY;
    };

    // Solo considerar citas hasta hoy (incluye hoy), excluye futuras.
    const now = new Date();
    const todayEndEpoch = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999,
    ).getTime();

    for (const appt of appointments) {
      const uid = appt.userId;
      if (uid == null) continue;
      const apptEpoch = toEpoch(appt.staffdates);
      if (apptEpoch > todayEndEpoch) continue;
      const key = Number(uid);
      if (!byUser.has(key)) {
        byUser.set(key, {
          userId: key,
          userName: appt.userNombre ?? "",
          userAvatar: appt.userAvatar ?? null,
          count: 0,
          staffdates: null,
          latestDateEpoch: Number.NEGATIVE_INFINITY,
        });
      }
      const rec = byUser.get(key);
      rec.count += 1;
      if (appt.userNombre) rec.userName = appt.userNombre;
      if (appt.userAvatar !== undefined && appt.userAvatar !== null) {
        rec.userAvatar = appt.userAvatar;
      }
      if (appt.staffdates) {
        const candidateDate = String(appt.staffdates);
        const candidateEpoch = apptEpoch;
        if (candidateEpoch > rec.latestDateEpoch) {
          rec.latestDateEpoch = candidateEpoch;
          rec.staffdates = candidateDate;
        }
      }
    }
    const todos = [];
    const mejores = [];
    const noTeVisitan = [];
    const noHanVuelto = [];
    for (const rec of byUser.values()) {
      const { userId, userName, userAvatar, staffdates } = rec;
      const item = { userId, userName, userAvatar, staffdates };
      todos.push(item);
      if (rec.count > 3) mejores.push(item);
      else if (rec.count === 3) noTeVisitan.push(item);
      else noHanVuelto.push(item);
    }
    return { todos, mejores, noTeVisitan, noHanVuelto };
  } catch (error) {
    console.error("Firestore error listando clientes por negocio:", error);
    throw new Error(error.message);
  }
};

export const getAppointmentsWithStaffByBusiness = async (businessId) => {
  try {
    const bizIdNum = Number(businessId);
    const [apptSnap, staffSnap] = await Promise.all([
      db.collection("appointments").where("businessId", "==", bizIdNum).get(),
      db.collection("staff").where("businessId", "==", bizIdNum).get(),
    ]);

    const staffMap = new Map();
    staffSnap.docs.forEach((d) => {
      const data = d.data();
      staffMap.set(String(d.id), data?.nombre || "");
    });

    const pad2 = (n) => String(n).padStart(2, "0");

    const results = apptSnap.docs.map((d) => {
      const data = d.data();
      const staffId = String(data.staffId);
      const staffname = staffMap.get(staffId) || "";
      let date = data.date;
      if (
        !date &&
        data.day !== undefined &&
        data.month !== undefined &&
        data.year !== undefined
      ) {
        date = `${pad2(data.day)}/${pad2(data.month)}/${data.year}`;
      }
      return {
        id: Number(d.id),
        staffId,
        staffname,
        serviceType: data.serviceType,
        horario: data.horario,
        calificacion: data.calificacion ?? null,
        date: date || null,
      };
    });

    return results;
  } catch (error) {
    console.error("Firestore error obteniendo citas con staffname:", error);
    throw new Error(error.message);
  }
};

export const getStaffNameById = async (staffId) => {
  try {
    const doc = await db.collection("staff").doc(String(staffId)).get();
    if (!doc.exists) {
      throw new Error("Staff not found");
    }
    const data = doc.data();
    return { id: doc.id, nombre: data.nombre };
  } catch (error) {
    console.error("Firestore error obteniendo nombre de staff:", error);
    throw new Error(error.message);
  }
};

const allowedDays = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];
const isValidTime = (t) => /^([0-9]{2}):([0-9]{2})$/.test(String(t));
const normalizeDays = (input) => {
  const out = {};
  const hasObj = input && typeof input === "object";
  allowedDays.forEach((day) => {
    const v = hasObj ? input[day] : undefined;
    const active = Boolean(v?.active);
    let start = v?.start != null ? String(v.start) : null;
    let until = v?.until != null ? String(v.until) : null;
    let breakStart = v?.breakStart != null ? String(v.breakStart) : null;
    let breakUntil = v?.breakUntil != null ? String(v.breakUntil) : null;
    if (active) {
      if (!isValidTime(start) || !isValidTime(until)) {
        throw new Error("start/until inválidos");
      }
      const [sh, sm] = start.split(":").map(Number);
      const [eh, em] = until.split(":").map(Number);
      if (sh > eh || (sh === eh && sm >= em)) {
        throw new Error("start debe ser menor a until");
      }
      if (
        (breakStart && !isValidTime(breakStart)) ||
        (breakUntil && !isValidTime(breakUntil))
      ) {
        throw new Error("breakStart/breakUntil inválidos");
      }
      if ((breakStart && !breakUntil) || (!breakStart && breakUntil)) {
        throw new Error("breakStart y breakUntil deben enviarse juntos");
      }
      if (breakStart && breakUntil) {
        const [bsH, bsM] = breakStart.split(":").map(Number);
        const [beH, beM] = breakUntil.split(":").map(Number);
        if (bsH > beH || (bsH === beH && bsM >= beM)) {
          throw new Error("breakStart debe ser menor a breakUntil");
        }
        if (
          bsH < sh ||
          (bsH === sh && bsM < sm) ||
          beH > eh ||
          (beH === eh && beM > em)
        ) {
          throw new Error("break fuera del rango [start, until]");
        }
      }
    } else {
      start = null;
      until = null;
      breakStart = null;
      breakUntil = null;
    }
    out[day] = { active, start, until, breakStart, breakUntil };
  });
  return out;
};

export const createBusinessSchedule = async (businessId, payload) => {
  try {
    const bizIdNum = Number(businessId);
    if (!bizIdNum) throw new Error("businessId requerido");
    if (!payload.days || typeof payload.days !== "object")
      throw new Error("days requerido");
    const holidays = Boolean(payload.holidays);
    const daysObj = normalizeDays(payload.days);
    const userQuery = await db
      .collection("user-business")
      .where("id", "==", bizIdNum)
      .get();
    if (userQuery.empty) throw new Error("Business not found");
    const newId = await getNextId("scheduleId");
    const ref = db.collection("schedules").doc(String(newId));
    const doc = {
      id: newId,
      businessId: bizIdNum,
      days: daysObj,
      holidays,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    await ref.set(doc);
    return doc;
  } catch (error) {
    console.error("Firestore error creando horario de negocio:", error);
    throw new Error(error.message);
  }
};

export const updateBusinessSchedule = async (
  businessId,
  scheduleId,
  payload,
) => {
  try {
    const bizIdNum = Number(businessId);
    if (!bizIdNum) throw new Error("businessId requerido");
    const sid = String(scheduleId);
    const ref = db.collection("schedules").doc(sid);
    const snap = await ref.get();
    if (!snap.exists) throw new Error("Schedule not found");
    const data = snap.data();
    if (Number(data.businessId) !== bizIdNum)
      throw new Error("Schedule no pertenece al negocio");
    const patch: any = {};
    if (payload.days !== undefined) {
      if (!payload.days || typeof payload.days !== "object")
        throw new Error("days requerido");
      patch.days = normalizeDays(payload.days);
    }
    if (payload.holidays !== undefined) {
      patch.holidays = Boolean(payload.holidays);
    }
    patch.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    await ref.update(patch);
    const updated = await ref.get();
    return updated.data();
  } catch (error) {
    console.error("Firestore error actualizando horario de negocio:", error);
    throw new Error(error.message);
  }
};

export const deleteBusinessSchedule = async (businessId, scheduleId) => {
  try {
    const bizIdNum = Number(businessId);
    if (!bizIdNum) throw new Error("businessId requerido");
    const sid = String(scheduleId);
    const ref = db.collection("schedules").doc(sid);
    const snap = await ref.get();
    if (!snap.exists) throw new Error("Schedule not found");
    const data = snap.data();
    if (Number(data.businessId) !== bizIdNum)
      throw new Error("Schedule no pertenece al negocio");
    await ref.delete();
    return { id: Number(scheduleId), deleted: true };
  } catch (error) {
    console.error("Firestore error eliminando horario de negocio:", error);
    throw new Error(error.message);
  }
};

export const getBusinessSchedules = async (businessId) => {
  try {
    const bizIdNum = Number(businessId);
    const snap = await db
      .collection("schedules")
      .where("businessId", "==", bizIdNum)
      .get();
    return snap.docs.map((d) => d.data());
  } catch (error) {
    console.error("Firestore error listando horarios de negocio:", error);
    throw new Error(error.message);
  }
};

export const createStaffSchedule = async (businessId, staffId, payload) => {
  try {
    const bizIdNum = Number(businessId);
    const stid = String(staffId);
    if (!bizIdNum || !stid) throw new Error("businessId y staffId requeridos");
    const staffDoc = await db.collection("staff").doc(stid).get();
    if (!staffDoc.exists) throw new Error("Staff not found");
    const sdata = staffDoc.data();
    if (Number(sdata.businessId) !== bizIdNum)
      throw new Error("Staff no pertenece al negocio");
    if (!payload.days || typeof payload.days !== "object")
      throw new Error("days requerido");
    const holidays = Boolean(payload.holidays);
    const daysObj = normalizeDays(payload.days);
    const newId = await getNextId("staffScheduleId");
    const ref = db.collection("staff-schedules").doc(String(newId));
    const doc = {
      id: newId,
      businessId: bizIdNum,
      staffId: stid,
      days: daysObj,
      holidays,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    await ref.set(doc);
    return doc;
  } catch (error) {
    console.error("Firestore error creando horario de staff:", error);
    throw new Error(error.message);
  }
};

export const updateStaffSchedule = async (
  businessId,
  staffId,
  scheduleId,
  payload,
) => {
  try {
    const bizIdNum = Number(businessId);
    const stid = String(staffId);
    const sid = String(scheduleId);
    if (!bizIdNum || !stid) throw new Error("businessId y staffId requeridos");
    const ref = db.collection("staff-schedules").doc(sid);
    const snap = await ref.get();
    if (!snap.exists) throw new Error("Schedule not found");
    const data = snap.data();
    if (Number(data.businessId) !== bizIdNum || String(data.staffId) !== stid)
      throw new Error("Schedule no pertenece al staff o negocio");
    const patch: any = {};
    if (payload.days !== undefined) {
      if (!payload.days || typeof payload.days !== "object")
        throw new Error("days requerido");
      patch.days = normalizeDays(payload.days);
    }
    if (payload.holidays !== undefined) {
      patch.holidays = Boolean(payload.holidays);
    }
    patch.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    await ref.update(patch);
    const updated = await ref.get();
    return updated.data();
  } catch (error) {
    console.error("Firestore error actualizando horario de staff:", error);
    throw new Error(error.message);
  }
};

export const deleteStaffSchedule = async (businessId, staffId, scheduleId) => {
  try {
    const bizIdNum = Number(businessId);
    const stid = String(staffId);
    const sid = String(scheduleId);
    const ref = db.collection("staff-schedules").doc(sid);
    const snap = await ref.get();
    if (!snap.exists) throw new Error("Schedule not found");
    const data = snap.data();
    if (Number(data.businessId) !== bizIdNum || String(data.staffId) !== stid)
      throw new Error("Schedule no pertenece al staff o negocio");
    await ref.delete();
    return { id: Number(scheduleId), deleted: true };
  } catch (error) {
    console.error("Firestore error eliminando horario de staff:", error);
    throw new Error(error.message);
  }
};

export const getStaffSchedules = async (staffId) => {
  try {
    const stid = String(staffId);
    const snap = await db
      .collection("staff-schedules")
      .where("staffId", "==", stid)
      .get();
    return snap.docs.map((d) => d.data());
  } catch (error) {
    console.error("Firestore error listando horarios de staff:", error);
    throw new Error(error.message);
  }
};

/** Elimina un usuario business y sus datos relacionados (staff, appointments). */
export const deleteBusinessUser = async (businessId) => {
  try {
    const id = Number(businessId);
    if (!Number.isFinite(id)) {
      throw new Error("businessId inválido");
    }
    const businessRef = db.collection("user-business").doc(String(id));
    const businessDoc = await businessRef.get();
    if (!businessDoc.exists) {
      throw new Error("Business not found");
    }

    // Borrar staff del negocio
    const staffSnap = await db
      .collection("staff")
      .where("businessId", "==", id)
      .get();
    const batch = db.batch();
    staffSnap.docs.forEach((d) => batch.delete(d.ref));

    // Borrar citas del negocio
    const appointmentsSnap = await db
      .collection("appointments")
      .where("businessId", "==", id)
      .get();
    appointmentsSnap.docs.forEach((d) => batch.delete(d.ref));

    // Borrar el documento del negocio
    batch.delete(businessRef);
    await batch.commit();
    console.log("Business user and related data deleted:", id);
    return { id, message: "Usuario de negocio eliminado" };
  } catch (error) {
    console.error("Firestore error deleting business user:", error);
    throw new Error(error.message);
  }
};

export const getBusinessById = async (businessId) => {
  try {
    const doc = await db
      .collection("user-business")
      .doc(String(businessId))
      .get();
    if (!doc.exists) {
      throw new Error("Business not found");
    }
    const data = doc.data();
    // Return commonly used fields
    return {
      id: data.id ?? Number(doc.id),
      nombre: data.nombre ?? "",
      correo: data.correo ?? "",
      numero: data.numero ?? "",
      avatar: data.avatar ?? null,
      banner: data.banner ?? null,
      images: Array.isArray(data.images) ? data.images : [],
      name: data.name ?? "",
      description: data.description ?? "",
      direccion:
        data?.direccion && typeof data.direccion === "object"
          ? data.direccion
          : null,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      isInitialSetupComplete: !!data.isInitialSetupComplete,
      policies: {
        cancellationAdvanceMinutes:
          data?.policies?.cancellationAdvanceMinutes ?? null,
        minAdvanceBookingMinutes:
          data?.policies?.minAdvanceBookingMinutes ?? null,
        reminderMinutes: data?.policies?.reminderMinutes ?? null,
      },
    };
  } catch (error) {
    console.error("Firestore error obteniendo negocio por id:", error);
    throw new Error(error.message);
  }
};

export const getBusinessByEmail = async (correo) => {
  try {
    const correoLower = String(correo).trim().toLowerCase();
    const snapshot = await db
      .collection("user-business")
      .where("correo", "==", correoLower)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    const data = doc.data();
    return {
      id: data.id ?? Number(doc.id),
      correo: data.correo ?? "",
      ...data,
    };
  } catch (error) {
    console.error("Firestore error obteniendo negocio por email:", error);
    throw new Error(error.message);
  }
};

export const getBusinessByResetToken = async (tokenHash) => {
  try {
    const snapshot = await db
      .collection("user-business")
      .where("resetPasswordToken", "==", tokenHash)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    const data = doc.data();
    return {
      id: data.id ?? Number(doc.id),
      ...data,
    };
  } catch (error) {
    console.error("Firestore error obteniendo negocio por reset token:", error);
    throw new Error(error.message);
  }
};

export const savePasswordResetToken = async (businessId, tokenHash, expiresAt) => {
  try {
    const bizId = String(businessId);
    const ref = db.collection("user-business").doc(bizId);
    await ref.update({
      resetPasswordToken: tokenHash,
      resetPasswordExpiresAt: expiresAt,
    });
    console.log("[savePasswordResetToken] Token guardado para negocio:", businessId);
  } catch (error) {
    console.error("Firestore error guardando reset token:", error);
    throw new Error(error.message);
  }
};

export const resetBusinessPassword = async (businessId, hashedPassword) => {
  try {
    const bizId = String(businessId);
    const ref = db.collection("user-business").doc(bizId);
    await ref.update({
      password: hashedPassword,
      resetPasswordToken: admin.firestore.FieldValue.delete(),
      resetPasswordExpiresAt: admin.firestore.FieldValue.delete(),
      resetPasswordCode: admin.firestore.FieldValue.delete(),
      resetPasswordCodeExpiresAt: admin.firestore.FieldValue.delete(),
      resetPasswordVerifiedAt: admin.firestore.FieldValue.delete(),
    });
    console.log("[resetBusinessPassword] Contraseña actualizada para negocio:", businessId);
  } catch (error) {
    console.error("Firestore error reseteando contraseña:", error);
    throw new Error(error.message);
  }
};

export const savePasswordResetCode = async (businessId, hashedCode, expiresAt) => {
  try {
    const bizId = String(businessId);
    const ref = db.collection("user-business").doc(bizId);
    await ref.update({
      resetPasswordCode: hashedCode,
      resetPasswordCodeExpiresAt: expiresAt,
    });
    console.log("[savePasswordResetCode] Código guardado para negocio:", businessId);
  } catch (error) {
    console.error("Firestore error guardando reset code:", error);
    throw new Error(error.message);
  }
};

export const getBusinessByPasswordResetCode = async (hashedCode) => {
  try {
    const snapshot = await db
      .collection("user-business")
      .where("resetPasswordCode", "==", hashedCode)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    const data = doc.data();
    return {
      id: data.id ?? Number(doc.id),
      ...data,
    };
  } catch (error) {
    console.error("Firestore error obteniendo negocio por reset code:", error);
    throw new Error(error.message);
  }
};

export const clearPasswordResetCode = async (businessId) => {
  try {
    const bizId = String(businessId);
    const ref = db.collection("user-business").doc(bizId);
    await ref.update({
      resetPasswordCode: admin.firestore.FieldValue.delete(),
      resetPasswordCodeExpiresAt: admin.firestore.FieldValue.delete(),
      resetPasswordVerifiedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log("[clearPasswordResetCode] Código limpiado para negocio:", businessId);
  } catch (error) {
    console.error("Firestore error limpiando reset code:", error);
    throw new Error(error.message);
  }
};

export const getAllUsers = async () => {
  try {
    const snapshot = await db
      .collection("users")
      .orderBy("createdAt", "desc")
      .get();
    const users = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: data.id ?? doc.id,
        nombre: data.nombre ?? "",
        numero: data.numero ?? "",
        status: data.status ?? "pending_verification",
        createdAt: data.createdAt?.toDate?.()?.toISOString() ?? null,
        verifiedAt: data.verifiedAt?.toDate?.()?.toISOString() ?? null,
      };
    });
    return users;
  } catch (error) {
    console.error("Firestore error obteniendo usuarios:", error);
    throw new Error(`Error obteniendo usuarios: ${error.message}`);
  }
};

export const getAllClients = async () => {
  try {
    const snapshot = await db.collection("users").orderBy("createdAt", "desc").get();
    return snapshot.docs.map((doc) => {
      const data = doc.data() || {};
      return {
        id: data.id ?? Number(doc.id),
        nombre: data.nombre ?? "",
        apellido: data.apellido ?? "",
        avatar: data.avatar ?? null,
        numero: data.numero ?? "",
      };
    });
  } catch (error) {
    console.error("Firestore error listando clientes:", error);
    throw new Error(error.message);
  }
};

export const getClientById = async (clientId) => {
  try {
    const cid = String(clientId);
    if (!cid) throw new Error("clientId es requerido");
    const doc = await db.collection("users").doc(cid).get();
    if (!doc.exists) {
      throw new Error("Cliente no encontrado");
    }
    const data = doc.data() || {};
    return {
      id: data.id ?? Number(doc.id),
      nombre: data.nombre ?? "",
      apellido: data.apellido ?? "",
      avatar: data.avatar ?? null,
      numero: data.numero ?? "",
    };
  } catch (error) {
    console.error("Firestore error obteniendo cliente:", error);
    throw new Error(error.message);
  }
};

const mapFollowerDoc = (doc) => {
  const data = doc.data() || {};
  return {
    id: data.id ?? Number(doc.id),
    userId: data.userId ?? null,
    businessId: data.businessId ?? null,
    user: data.user ?? null,
    business: data.business ?? null,
    createdAt: data.createdAt?.toDate?.()?.toISOString() ?? null,
  };
};

export const followBusiness = async (userId, businessId) => {
  try {
    const uid = String(userId || "").trim();
    const bid = String(businessId || "").trim();
    if (!uid || !bid) throw new Error("userId y businessId son requeridos");

    const businessRef = db.collection("user-business").doc(bid);
    const businessDoc = await businessRef.get();
    if (!businessDoc.exists) {
      throw new Error("Negocio no encontrado");
    }

    const existingFollow = await db
      .collection("followers")
      .where("userId", "==", uid)
      .where("businessId", "==", bid)
      .limit(1)
      .get();

    if (!existingFollow.empty) {
      return { message: "Ya estás siguiendo este negocio", follower: mapFollowerDoc(existingFollow.docs[0]) };
    }

    const businessData = businessDoc.data() || {};
    const newId = await getNextId("followerId");
    const followerRef = db.collection("followers").doc(String(newId));
    await followerRef.set({
      id: newId,
      userId: uid,
      businessId: bid,
      business: {
        id: businessData.id ?? bid,
        nombre: businessData.nombre ?? "",
        avatar: businessData.avatar ?? null,
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const followerDoc = await followerRef.get();
    return { follower: mapFollowerDoc(followerDoc) };
  } catch (error) {
    console.error("Firestore error siguiendo negocio:", error);
    throw new Error(error.message);
  }
};

export const getFollowersByBusinessId = async (businessId) => {
  try {
    const bid = String(businessId || "").trim();
    if (!bid) throw new Error("businessId es requerido");

    const snapshot = await db
      .collection("followers")
      .where("businessId", "==", bid)
      .orderBy("createdAt", "desc")
      .get();
    return snapshot.docs.map(mapFollowerDoc);
  } catch (error) {
    console.error("Firestore error obteniendo followers:", error);
    throw new Error(error.message);
  }
};

export const getUserFollowings = async (userId) => {
  try {
    const uid = String(userId || "").trim();
    if (!uid) throw new Error("userId es requerido");

    const snapshot = await db
      .collection("followers")
      .where("userId", "==", uid)
      .orderBy("createdAt", "desc")
      .get();
    return snapshot.docs.map(mapFollowerDoc);
  } catch (error) {
    console.error("Firestore error obteniendo followings:", error);
    throw new Error(error.message);
  }
};

export const unfollowBusiness = async (userId, businessId) => {
  try {
    const uid = String(userId || "").trim();
    const bid = String(businessId || "").trim();
    if (!uid || !bid) throw new Error("userId y businessId son requeridos");

    const snapshot = await db
      .collection("followers")
      .where("userId", "==", uid)
      .where("businessId", "==", bid)
      .limit(1)
      .get();

    if (snapshot.empty) {
      throw new Error("No estás siguiendo este negocio");
    }

    const docId = snapshot.docs[0].id;
    await db.collection("followers").doc(docId).delete();
    return { message: "Dejaste de seguir el negocio" };
  } catch (error) {
    console.error("Firestore error dejando de seguir:", error);
    throw new Error(error.message);
  }
};

export const updateClientById = async (clientId, updateData: any = {}) => {
  try {
    const cid = String(clientId);
    if (!cid) throw new Error("clientId es requerido");
    const ref = db.collection("users").doc(cid);
    const doc = await ref.get();
    if (!doc.exists) {
      throw new Error("Cliente no encontrado");
    }

    const patch: any = {};
    if (updateData.nombre !== undefined) patch.nombre = String(updateData.nombre ?? "");
    if (updateData.apellido !== undefined) patch.apellido = String(updateData.apellido ?? "");
    if (updateData.numero !== undefined) patch.numero = String(updateData.numero ?? "");
    if (updateData.avatar !== undefined) patch.avatar = updateData.avatar ?? null;
    patch.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    await ref.update(patch);

    const updated = await ref.get();
    const data = updated.data() || {};
    return {
      id: data.id ?? Number(updated.id),
      nombre: data.nombre ?? "",
      apellido: data.apellido ?? "",
      avatar: data.avatar ?? null,
      numero: data.numero ?? "",
    };
  } catch (error) {
    console.error("Firestore error actualizando cliente:", error);
    throw new Error(error.message);
  }
};

export const deleteClientById = async (clientId) => {
  try {
    const cid = String(clientId);
    if (!cid) throw new Error("clientId es requerido");
    const ref = db.collection("users").doc(cid);
    const doc = await ref.get();
    if (!doc.exists) {
      throw new Error("Cliente no encontrado");
    }
    await ref.delete();
    return { id: Number(clientId), deleted: true };
  } catch (error) {
    console.error("Firestore error eliminando cliente:", error);
    throw new Error(error.message);
  }
};

export const getAllBusinesses = async () => {
  try {
    const snapshot = await db.collection("user-business").get();
    const businesses = snapshot.docs.map((doc) => {
      const data = doc.data() || {};
      return {
        businessId: data.id ?? Number(doc.id),
        nombre: data.nombre ?? "",
        numero: data.numero ?? "",
        avatar: data.avatar ?? null,
        banner: data.banner ?? null,
        name: data.name ?? "",
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
      };
    });
    return businesses;
  } catch (error) {
    console.error("Firestore error obteniendo negocios:", error);
    throw new Error(`Error obteniendo negocios: ${error.message}`);
  }
};

export const createService = async (
  businessId,
  name,
  type,
  duration,
  price,
  category,
  description,
  promotionTerms,
  promotionValidUntil,
  promotionValidIndefinite,
  image = undefined,
) => {
  try {
    const bizIdNum = Number(businessId);
    if (!Number.isFinite(bizIdNum)) {
      throw new Error("businessId inválido");
    }
    const bq = await db
      .collection("user-business")
      .where("id", "==", bizIdNum)
      .get();
    if (bq.empty) {
      throw new Error("Business not found");
    }
    if (!name || !type) {
      throw new Error("Campos requeridos: name, type");
    }
    const durNum = Number(duration);
    const priceNum = Number(price);
    if (!Number.isFinite(durNum) || durNum <= 0) {
      throw new Error("duration debe ser un número positivo");
    }
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      throw new Error("price debe ser un número no negativo");
    }
    const catStr = String(category ?? "").toLowerCase();
    if (!["service", "promotion"].includes(catStr)) {
      throw new Error(
        "category inválido. Valores permitidos: service, promotion",
      );
    }
    let promoTerms = "";
    let promoValidUntilStr = null;
    let promoValidIndef = false;
    if (catStr === "promotion") {
      promoTerms = String(promotionTerms ?? "").trim();
      const indef = promotionValidIndefinite === true;
      const untilStr =
        promotionValidUntil !== undefined && promotionValidUntil !== null
          ? String(promotionValidUntil)
          : "";
      if (!promoTerms) {
        throw new Error("terms requerido para promociones");
      }
      if (indef) {
        promoValidIndef = true;
        promoValidUntilStr = null;
      } else if (untilStr) {
        const m = /^([0-9]{2})\/([0-9]{2})\/([0-9]{4})$/.exec(untilStr);
        if (!m) {
          throw new Error(
            "promotionValidUntil inválido. Formato requerido dd/MM/YYYY",
          );
        }
        const d = Number(m[1]);
        const mo = Number(m[2]);
        const y = Number(m[3]);
        const jsDate = new Date(y, mo - 1, d);
        if (
          jsDate.getFullYear() !== y ||
          jsDate.getMonth() !== mo - 1 ||
          jsDate.getDate() !== d
        ) {
          throw new Error("promotionValidUntil inválido en el calendario");
        }
        promoValidUntilStr = untilStr;
      } else {
        promoValidIndef = true;
        promoValidUntilStr = null;
      }
    }
    const newId = await getNextId("serviceId");
    const ref = db.collection("services").doc(String(newId));
    const doc = {
      id: newId,
      businessId: bizIdNum,
      name: String(name),
      type: String(type),
      duration: durNum,
      price: priceNum,
      category: catStr,
      description: description !== undefined ? String(description) : "",
      promotionTerms: promoTerms,
      promotionValidUntil: promoValidUntilStr,
      promotionValidIndefinite: promoValidIndef,
      image: image ?? null,
      archived: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    await ref.set(doc);
    return doc;
  } catch (error) {
    console.error("Firestore error creando servicio:", error);
    throw new Error(error.message);
  }
};

export const updateService = async (businessId, serviceId, updateData: any) => {
  try {
    const bizIdNum = Number(businessId);
    const sid = String(serviceId);
    const ref = db.collection("services").doc(sid);
    const doc = await ref.get();
    if (!doc.exists) {
      throw new Error("Service not found");
    }
    const data = doc.data();
    if (Number(data.businessId) !== bizIdNum) {
      throw new Error("Service no pertenece al negocio");
    }
    const patch: any = {};
    if (updateData.name !== undefined) patch.name = String(updateData.name);
    if (updateData.type !== undefined) patch.type = String(updateData.type);
    if (updateData.duration !== undefined) {
      const durNum = Number(updateData.duration);
      if (!Number.isFinite(durNum) || durNum <= 0) {
        throw new Error("duration debe ser un número positivo");
      }
      patch.duration = durNum;
    }
    if (updateData.price !== undefined) {
      const priceNum = Number(updateData.price);
      if (!Number.isFinite(priceNum) || priceNum < 0) {
        throw new Error("price debe ser un número no negativo");
      }
      patch.price = priceNum;
    }
    if (
      updateData.staffId === undefined &&
      updateData.staffDuration !== undefined
    ) {
      const val = updateData.staffDuration;
      if (val === null || String(val).toLowerCase() === "null") {
        patch.staffDuration = null;
      } else {
        const sdNum = Number(val);
        if (!Number.isFinite(sdNum) || sdNum <= 0) {
          throw new Error("staffDuration debe ser un número positivo o 'null'");
        }
        patch.staffDuration = sdNum;
      }
    }
    if (
      updateData.staffId === undefined &&
      updateData.staffcommission !== undefined
    ) {
      const val = updateData.staffcommission;
      if (val === null || String(val).toLowerCase() === "null") {
        patch.staffcommission = null;
      } else {
        const scNum = Number(val);
        if (!Number.isFinite(scNum) || scNum < 0) {
          throw new Error(
            "staffcommission debe ser un número no negativo o 'null'",
          );
        }
        patch.staffcommission = scNum;
      }
    }
    if (
      updateData.staffId === undefined &&
      updateData.staffprice !== undefined
    ) {
      const val = updateData.staffprice;
      if (val === null || String(val).toLowerCase() === "null") {
        patch.staffprice = null;
      } else {
        const spNum = Number(val);
        if (!Number.isFinite(spNum) || spNum < 0) {
          throw new Error("staffprice debe ser un número no negativo o 'null'");
        }
        patch.staffprice = spNum;
      }
    }
    let effectiveCategory = data.category;
    if (updateData.category !== undefined) {
      const catStr = String(updateData.category ?? "").toLowerCase();
      if (!["service", "promotion"].includes(catStr)) {
        throw new Error(
          "category inválido. Valores permitidos: service, promotion",
        );
      }
      patch.category = catStr;
      effectiveCategory = catStr;
      if (catStr === "service") {
        patch.promotionTerms = "";
        patch.promotionValidUntil = null;
        patch.promotionValidIndefinite = false;
      }
    }
    if (updateData.description !== undefined) {
      patch.description = String(updateData.description ?? "");
    }
    if (updateData.archived !== undefined) {
      if (typeof updateData.archived !== "boolean") {
        throw new Error("archived debe ser boolean");
      }
      patch.archived = updateData.archived;
    }
    const hasPromoFields =
      updateData.promotionTerms !== undefined ||
      updateData.promotionValidUntil !== undefined ||
      updateData.promotionValidIndefinite !== undefined;
    if (hasPromoFields) {
      if (String(effectiveCategory).toLowerCase() !== "promotion") {
        throw new Error(
          "Campos de promoción solo válidos cuando category=promotion",
        );
      }
      if (updateData.promotionTerms !== undefined) {
        const t = String(updateData.promotionTerms ?? "").trim();
        if (!t) {
          throw new Error("promotionTerms requerido para promociones");
        }
        patch.promotionTerms = t;
      }
      if (updateData.promotionValidIndefinite !== undefined) {
        const indef = Boolean(updateData.promotionValidIndefinite);
        patch.promotionValidIndefinite = indef;
        if (indef) {
          patch.promotionValidUntil = null;
        }
      }
      if (updateData.promotionValidUntil !== undefined) {
        const untilVal = updateData.promotionValidUntil;
        if (untilVal === null) {
          patch.promotionValidUntil = null;
        } else {
          const untilStr = String(untilVal);
          const m = /^([0-9]{2})\/([0-9]{2})\/([0-9]{4})$/.exec(untilStr);
          if (!m) {
            throw new Error(
              "promotionValidUntil inválido. Formato requerido dd/MM/YYYY",
            );
          }
          const d = Number(m[1]);
          const mo = Number(m[2]);
          const y = Number(m[3]);
          const jsDate = new Date(y, mo - 1, d);
          if (
            jsDate.getFullYear() !== y ||
            jsDate.getMonth() !== mo - 1 ||
            jsDate.getDate() !== d
          ) {
            throw new Error("promotionValidUntil inválido en el calendario");
          }
          patch.promotionValidUntil = untilStr;
          if (patch.promotionValidIndefinite === true) {
            patch.promotionValidIndefinite = false;
          }
        }
      }
    }
    patch.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    await ref.update(patch);
    // Opcional: aplicar overrides por staff si se envía staffId
    if (updateData.staffId !== undefined) {
      const stid = String(updateData.staffId);
      const staffRef = db.collection("staff").doc(stid);
      const staffDoc = await staffRef.get();
      if (!staffDoc.exists) {
        throw new Error("Staff not found");
      }
      const sdata = staffDoc.data();
      if (Number(sdata.businessId) !== bizIdNum) {
        throw new Error("Staff no pertenece al negocio");
      }
      const staffPatch: any = {};
      if (updateData.staffDuration !== undefined) {
        const val = updateData.staffDuration;
        if (val === null || String(val).toLowerCase() === "null") {
          staffPatch[`staffServiceConfigs.${sid}.staffDuration`] = null;
        } else {
          const sdNum = Number(val);
          if (!Number.isFinite(sdNum) || sdNum <= 0) {
            throw new Error(
              "staffDuration debe ser un número positivo o 'null'",
            );
          }
          staffPatch[`staffServiceConfigs.${sid}.staffDuration`] = sdNum;
        }
      }
      if (updateData.staffcommission !== undefined) {
        const val = updateData.staffcommission;
        if (val === null || String(val).toLowerCase() === "null") {
          staffPatch[`staffServiceConfigs.${sid}.staffcommission`] = null;
        } else {
          const scNum = Number(val);
          if (!Number.isFinite(scNum) || scNum < 0) {
            throw new Error(
              "staffcommission debe ser un número no negativo o 'null'",
            );
          }
          staffPatch[`staffServiceConfigs.${sid}.staffcommission`] = scNum;
        }
      }
      if (updateData.staffprice !== undefined) {
        const val = updateData.staffprice;
        if (val === null || String(val).toLowerCase() === "null") {
          staffPatch[`staffServiceConfigs.${sid}.staffprice`] = null;
        } else {
          const spNum = Number(val);
          if (!Number.isFinite(spNum) || spNum < 0) {
            throw new Error(
              "staffprice debe ser un número no negativo o 'null'",
            );
          }
          staffPatch[`staffServiceConfigs.${sid}.staffprice`] = spNum;
        }
      }
      staffPatch.staffServices = admin.firestore.FieldValue.arrayUnion(
        Number(sid),
      );
      staffPatch.updatedAt = admin.firestore.FieldValue.serverTimestamp();
      await staffRef.update(staffPatch);
    }
    const updated = await ref.get();
    const updatedData = updated.data();
    // Construir staff[] para este servicio
    const staffList = [];
    const staffSnap = await db
      .collection("staff")
      .where("businessId", "==", bizIdNum)
      .get();
    staffSnap.docs.forEach((sd) => {
      const d = sd.data();
      const ss = Array.isArray(d.staffServices)
        ? d.staffServices.map((x) => Number(x))
        : [];
      const sidNum = Number(updatedData.id ?? Number(sid));
      if (ss.includes(sidNum)) {
        const cfg =
          d.staffServiceConfigs && d.staffServiceConfigs[String(sidNum)]
            ? d.staffServiceConfigs[String(sidNum)]
            : {};
        const staffIdNum = Number(sd.id);
        staffList.push({
          id: Number.isFinite(staffIdNum) ? staffIdNum : sd.id,
          staffDuration: cfg.staffDuration ?? null,
          staffcommission: cfg.staffcommission ?? null,
          staffprice: cfg.staffprice ?? null,
        });
      }
    });
    // No incluir overrides top-level si se envió staffId
    if (updateData.staffId !== undefined) {
      delete updatedData.staffDuration;
      delete updatedData.staffcommission;
      delete updatedData.staffprice;
    }
    return { ...updatedData, staff: staffList };
  } catch (error) {
    console.error("Firestore error actualizando servicio:", error);
    throw new Error(error.message);
  }
};

export const deleteService = async (businessId, serviceId) => {
  try {
    const bizIdNum = Number(businessId);
    const sid = String(serviceId);
    const ref = db.collection("services").doc(sid);
    const doc = await ref.get();
    if (!doc.exists) {
      throw new Error("Service not found");
    }
    const data = doc.data();
    if (Number(data.businessId) !== bizIdNum) {
      throw new Error("Service no pertenece al negocio");
    }
    await ref.delete();
    return { id: Number(serviceId), deleted: true };
  } catch (error) {
    console.error("Firestore error eliminando servicio:", error);
    throw new Error(error.message);
  }
};

export const getServicesByBusiness = async (businessId, category, staffId) => {
  try {
    const bizIdNum = Number(businessId);
    let query = db.collection("services").where("businessId", "==", bizIdNum);
    if (category !== undefined && category !== null) {
      const catStr = String(category).toLowerCase();
      query = query.where("category", "==", catStr);
    }
    const [snap, staffSnap] = await Promise.all([
      query.get(),
      db.collection("staff").where("businessId", "==", bizIdNum).get(),
    ]);
    const staffRecords = staffSnap.docs.map((sd) => {
      const d = sd.data();
      return {
        id: sd.id,
        staffServices: Array.isArray(d.staffServices)
          ? d.staffServices.map((x) => Number(x))
          : [],
        cfg: d.staffServiceConfigs || {},
        nombre: d.nombre || "",
        apellido: d.apellido || "",
      };
    });
    const filterStaffId =
      staffId !== undefined && staffId !== null ? String(staffId) : undefined;
    return snap.docs
      .map((d) => {
        const s = d.data();
        const serviceIdNum = Number(s.id ?? Number(d.id));
        const staffSource = staffRecords.filter((st) =>
          st.staffServices.includes(serviceIdNum),
        );
        const staffFiltered = filterStaffId
          ? staffSource.filter((st) => String(st.id) === filterStaffId)
          : staffSource;
        const staffList = staffFiltered.map((st) => {
          const key = String(serviceIdNum);
          const c = st.cfg && st.cfg[key] ? st.cfg[key] : {};
          const sidNum = Number(st.id);
          return {
            id: Number.isFinite(sidNum) ? sidNum : st.id,
            staffDuration: c.staffDuration ?? null,
            staffcommission: c.staffcommission ?? null,
            staffprice: c.staffprice ?? null,
            nombre: st.nombre,
            apellido: st.apellido,
          };
        });
        if (filterStaffId && staffList.length === 0) {
          return null;
        }
        return {
          id: s.id ?? Number(d.id),
          businessId: bizIdNum,
          name: s.name ?? "",
          type: s.type ?? "",
          duration: s.duration ?? null,
          staffDuration: s.staffDuration ?? null,
          staffcommission: s.staffcommission ?? null,
          staff: staffList,
          price: s.price ?? null,
          category: s.category ?? "service",
          description: s.description ?? "",
          archived: s.archived ?? false,
          promotionTerms: s.promotionTerms ?? "",
          promotionValidUntil: s.promotionValidUntil ?? null,
          promotionValidIndefinite: s.promotionValidIndefinite ?? false,
        };
      })
      .filter(Boolean);
  } catch (error) {
    console.error("Firestore error listando servicios:", error);
    throw new Error(error.message);
  }
};

export const getGeneralServicesByBusiness = async ({ page = 1, limit = 10 }) => {
  try {
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const safePage = Number.isFinite(pageNum) && pageNum > 0 ? pageNum : 1;
    const safeLimit = Number.isFinite(limitNum) && limitNum > 0 ? limitNum : 10;

    const servicesSnap = await db.collection("services").get();
    const grouped = new Map();

    servicesSnap.docs.forEach((d) => {
      const s = d.data() || {};
      const businessId = Number(s.businessId);
      if (!Number.isFinite(businessId)) return;

      if (!grouped.has(businessId)) {
        grouped.set(businessId, []);
      }

      grouped.get(businessId).push({
        id: s.id ?? Number(d.id),
        businessId,
        name: s.name ?? "",
        type: s.type ?? "",
        duration: s.duration ?? null,
        price: s.price ?? null,
        category: s.category ?? "service",
        description: s.description ?? "",
        archived: s.archived ?? false,
        promotionTerms: s.promotionTerms ?? "",
        promotionValidUntil: s.promotionValidUntil ?? null,
        promotionValidIndefinite: s.promotionValidIndefinite ?? false,
      });
    });

    const businessIds = Array.from(grouped.keys()).sort((a, b) => a - b);
    const totalBusinesses = businessIds.length;
    const totalPages = totalBusinesses === 0 ? 1 : Math.ceil(totalBusinesses / safeLimit);
    const start = (safePage - 1) * safeLimit;
    const paginatedBusinessIds = businessIds.slice(start, start + safeLimit);

    const businessMap = new Map();
    if (paginatedBusinessIds.length > 0) {
      const chunks = [];
      for (let i = 0; i < paginatedBusinessIds.length; i += 10) {
        chunks.push(paginatedBusinessIds.slice(i, i + 10));
      }

      const businessSnaps = await Promise.all(
        chunks.map((chunk) =>
          db.collection("user-business").where("id", "in", chunk).get(),
        ),
      );

      businessSnaps.forEach((snap) => {
        snap.docs.forEach((doc) => {
          const b = doc.data() || {};
          const id = Number(b.id ?? doc.id);
          businessMap.set(id, {
            businessId: id,
            businessName: b.name ?? b.nombre ?? "",
            businessAvatar: b.avatar ?? null,
            businessBanner: b.banner ?? null,
          });
        });
      });
    }

    const staffByServiceKey = new Map();
    if (paginatedBusinessIds.length > 0) {
      const chunks = [];
      for (let i = 0; i < paginatedBusinessIds.length; i += 10) {
        chunks.push(paginatedBusinessIds.slice(i, i + 10));
      }
      const staffSnaps = await Promise.all(
        chunks.map((chunk) =>
          db.collection("staff").where("businessId", "in", chunk).get(),
        ),
      );
      staffSnaps.forEach((snap) => {
        snap.docs.forEach((doc) => {
          const data = doc.data() || {};
          const businessId = Number(data.businessId);
          const staffIdRaw = data.id ?? doc.id;
          const staffIdNum = Number(staffIdRaw);
          const staffId = Number.isFinite(staffIdNum)
            ? staffIdNum
            : String(staffIdRaw);
          const serviceIds = Array.isArray(data.staffServices)
            ? data.staffServices
            : [];
          serviceIds.forEach((sidRaw) => {
            const sid = Number(sidRaw);
            if (!Number.isFinite(sid)) return;
            const key = `${businessId}:${sid}`;
            if (!staffByServiceKey.has(key)) {
              staffByServiceKey.set(key, []);
            }
            staffByServiceKey.get(key).push(staffId);
          });
        });
      });
    }

    const businesses = paginatedBusinessIds.map((businessId) => {
      const info = businessMap.get(businessId) || {
        businessId,
        businessName: "",
        businessAvatar: null,
        businessBanner: null,
      };
      const services = (grouped.get(businessId) || []).map((service) => {
        const key = `${businessId}:${Number(service.id)}`;
        const staffIds = staffByServiceKey.has(key)
          ? Array.from(new Set(staffByServiceKey.get(key)))
          : [];
        return {
          ...service,
          staff: {
            ids: staffIds,
          },
        };
      });
      return {
        ...info,
        services,
        total: services.length,
      };
    });

    return {
      businesses,
      pagination: {
        page: safePage,
        limit: safeLimit,
        totalBusinesses,
        totalPages,
        hasNextPage: safePage < totalPages,
        hasPrevPage: safePage > 1,
      },
    };
  } catch (error) {
    console.error("Firestore error listando servicios generales:", error);
    throw new Error(error.message);
  }
};

export const getServiceTypesByBusiness = async (businessId) => {
  try {
    const bizIdNum = Number(businessId);
    const snap = await db
      .collection("services")
      .where("businessId", "==", bizIdNum)
      .get();
    const map = new Map();
    snap.docs.forEach((d) => {
      const s = d.data();
      const t = String(s.type ?? "").trim();
      if (!t) return;
      const list = map.get(t) || [];
      const sd = s.staffDuration;
      list.push({
        id: s.id ?? Number(d.id),
        name: s.name ?? "",
        duration: s.duration ?? null,
        staffDuration: sd !== undefined && sd !== null ? String(sd) : null,
      });
      map.set(t, list);
    });
    const result = Array.from(map.entries()).map(([type, services]) => ({
      type,
      services,
    }));
    return result;
  } catch (error) {
    console.error("Firestore error listando tipos de servicio:", error);
    throw new Error(error.message);
  }
};

export const setStaffServices = async (businessId, staffId, serviceIds) => {
  try {
    const bizIdNum = Number(businessId);
    const stid = String(staffId);
    if (!Number.isFinite(bizIdNum)) {
      throw new Error("businessId inválido");
    }
    if (!stid) {
      throw new Error("staffId requerido");
    }
    const staffRef = db.collection("staff").doc(stid);
    const staffDoc = await staffRef.get();
    if (!staffDoc.exists) {
      throw new Error("Staff not found");
    }
    const staffData = staffDoc.data();
    if (Number(staffData.businessId) !== bizIdNum) {
      throw new Error("Staff no pertenece al negocio");
    }
    const ids = Array.isArray(serviceIds) ? serviceIds : [serviceIds];
    const cleanIds = ids
      .map((x) => Number(x))
      .filter((n) => Number.isFinite(n));
    const unique = Array.from(new Set(cleanIds));
    const services = [];
    for (const sid of unique) {
      const sDoc = await db.collection("services").doc(String(sid)).get();
      if (!sDoc.exists) continue;
      const sData = sDoc.data();
      if (Number(sData.businessId) !== bizIdNum) continue;
      services.push({
        id: sData.id ?? Number(sDoc.id),
        name: sData.name ?? "",
      });
    }
    await staffRef.update({
      staffServices: services.map((s) => Number(s.id)),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { staffId: stid, businessId: bizIdNum, services };
  } catch (error) {
    console.error("Firestore error asignando servicios a staff:", error);
    throw new Error(error.message);
  }
};

export const updateBusinessPolicies = async (
  businessId,
  { cancellationAdvanceMinutes, minAdvanceBookingMinutes, reminderMinutes },
) => {
  try {
    const bizIdNum = Number(businessId);
    if (!Number.isFinite(bizIdNum)) {
      throw new Error("businessId inválido");
    }
    const ref = db.collection("user-business").doc(String(bizIdNum));
    const snap = await ref.get();
    if (!snap.exists) {
      throw new Error("Business not found");
    }
    const parseMinutes = (val, field) => {
      if (val === undefined) return undefined;
      if (val === null || String(val).toLowerCase() === "null") return null;
      const n = Number(val);
      if (!Number.isFinite(n) || n < 0) {
        throw new Error(`${field} debe ser un número no negativo o 'null'`);
      }
      return Math.floor(n);
    };
    const polPatch: any = {};
    const c = parseMinutes(
      cancellationAdvanceMinutes,
      "cancellationAdvanceMinutes",
    );
    const a = parseMinutes(
      minAdvanceBookingMinutes,
      "minAdvanceBookingMinutes",
    );
    const r = parseMinutes(reminderMinutes, "reminderMinutes");
    if (c !== undefined) polPatch["policies.cancellationAdvanceMinutes"] = c;
    if (a !== undefined) polPatch["policies.minAdvanceBookingMinutes"] = a;
    if (r !== undefined) polPatch["policies.reminderMinutes"] = r;
    polPatch.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    await ref.update(polPatch);
    const updated = await ref.get();
    const data = updated.data() || {};
    return {
      cancellationAdvanceMinutes:
        data?.policies?.cancellationAdvanceMinutes ?? null,
      minAdvanceBookingMinutes:
        data?.policies?.minAdvanceBookingMinutes ?? null,
      reminderMinutes: data?.policies?.reminderMinutes ?? null,
    };
  } catch (error) {
    console.error("Firestore error actualizando políticas de negocio:", error);
    throw new Error(error.message);
  }
};

export const getBusinessPolicies = async (businessId) => {
  try {
    const ref = db.collection("user-business").doc(String(businessId));
    const snap = await ref.get();
    if (!snap.exists) {
      throw new Error("Business not found");
    }
    const data = snap.data() || {};
    return {
      cancellationAdvanceMinutes:
        data?.policies?.cancellationAdvanceMinutes ?? null,
      minAdvanceBookingMinutes:
        data?.policies?.minAdvanceBookingMinutes ?? null,
      reminderMinutes: data?.policies?.reminderMinutes ?? null,
    };
  } catch (error) {
    console.error("Firestore error obteniendo políticas de negocio:", error);
    throw new Error(error.message);
  }
};

/** Categorías predefinidas de gastos (solo id y name para listado en Swagger/API) */
export const getExpenseCategories = () => {
  return [
    { id: 1, name: "Gastos" },
    { id: 2, name: "Pago de comisiones" },
    { id: 3, name: "Utilidades de servicios" },
    { id: 4, name: "Utilidades de productos" },
    { id: 6, name: "Valor de facturas del mes" },
  ];
};

export const getExpenseCategoryById = (categoryId) => {
  const categories = getExpenseCategories().reduce(
    (acc, c) => ({ ...acc, [c.id]: c }),
    {},
  );
  const category = categories[categoryId];
  if (!category) {
    throw new Error(
      "Categoría de gasto inválida. Use un id entre 1 y 7 (obtener listado desde GET /expense-categories)",
    );
  }
  return category;
};

export const createExpenseCategory = async (businessId, name) => {
  try {
    const bizIdNum = Number(businessId);
    if (!Number.isFinite(bizIdNum)) {
      throw new Error("businessId inválido");
    }
    const bq = await db
      .collection("user-business")
      .where("id", "==", bizIdNum)
      .get();
    if (bq.empty) {
      throw new Error("Business not found");
    }
    const n = String(name || "").trim();
    if (!n) {
      throw new Error("name requerido");
    }
    const newId = await getNextId("expenseCategoryId");
    const ref = db.collection("expense-categories").doc(String(newId));
    const doc = {
      id: newId,
      businessId: bizIdNum,
      name: n,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    await ref.set(doc);
    return doc;
  } catch (error) {
    console.error("Firestore error creando categoría de gasto:", error);
    throw new Error(error.message);
  }
};

export const getExpenseCategoriesByBusiness = async (businessId) => {
  try {
    const bizIdNum = Number(businessId);
    const snap = await db
      .collection("expense-categories")
      .where("businessId", "==", bizIdNum)
      .get();
    return snap.docs.map((d) => {
      const data = d.data() || {};
      return {
        id: data.id ?? Number(d.id),
        businessId: bizIdNum,
        name: data.name ?? "",
      };
    });
  } catch (error) {
    console.error("Firestore error listando categorías de gasto:", error);
    throw new Error(error.message);
  }
};

export const createExpense = async ({
  businessId,
  name,
  category,
  categoryId,
  paidAt,
  amount,
}) => {
  try {
    const bizIdNum = Number(businessId);
    if (!Number.isFinite(bizIdNum)) {
      throw new Error("businessId inválido");
    }
    const bq = await db
      .collection("user-business")
      .where("id", "==", bizIdNum)
      .get();
    if (bq.empty) {
      throw new Error("Business not found");
    }
    const nm = String(name || "").trim();
    if (!nm) throw new Error("name requerido");
    const amtNum = parseFloat(amount);
    if (!Number.isFinite(amtNum) || amtNum < 0) {
      throw new Error("amount debe ser un número no negativo");
    }
    const catIdNum =
      categoryId !== undefined && categoryId !== null
        ? Number(categoryId)
        : undefined;
    if (catIdNum === undefined || !Number.isFinite(catIdNum)) {
      throw new Error(
        "categoryId requerido (obtener listado desde GET /expense-categories)",
      );
    }
    let catName;
    const predefined = getExpenseCategories().find((c) => c.id === catIdNum);
    if (predefined) {
      catName = predefined.name;
    } else {
      const cdoc = await db
        .collection("expense-categories")
        .doc(String(catIdNum))
        .get();
      if (!cdoc.exists) throw new Error("Categoría no encontrada");
      const cdata = cdoc.data();
      if (Number(cdata.businessId) !== bizIdNum)
        throw new Error("Categoría no pertenece al negocio");
      catName = cdata.name ?? "";
    }
    const normalizeDate = (s) => {
      const str = String(s || "").trim();
      const m1 = /^([0-9]{2})\/([0-9]{2})\/([0-9]{4})$/.exec(str);
      if (m1) {
        const dd = Number(m1[1]);
        const mm = Number(m1[2]);
        const yyyy = Number(m1[3]);
        const dt = new Date(Date.UTC(yyyy, mm - 1, dd));
        const iso = `${yyyy.toString().padStart(4, "0")}-${mm.toString().padStart(2, "0")}-${dd.toString().padStart(2, "0")}`;
        return { date: dt, iso, display: `${m1[1]}/${m1[2]}/${m1[3]}` };
      }
      const m2 = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(str);
      if (m2) {
        const yyyy = Number(m2[1]);
        const mm = Number(m2[2]);
        const dd = Number(m2[3]);
        const dt = new Date(Date.UTC(yyyy, mm - 1, dd));
        const iso = `${yyyy.toString().padStart(4, "0")}-${mm.toString().padStart(2, "0")}-${dd.toString().padStart(2, "0")}`;
        return {
          date: dt,
          iso,
          display: `${dd.toString().padStart(2, "0")}/${mm.toString().padStart(2, "0")}/${yyyy}`,
        };
      }
      throw new Error("paidAt debe tener formato dd/MM/YYYY o YYYY-MM-DD");
    };
    const d = normalizeDate(paidAt);
    const calcISOWeek = (date) => {
      const tmp = new Date(
        Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
      );
      tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay() || 7));
      const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
      const weekNo = Math.ceil(
        ((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
      );
      const isoYear = tmp.getUTCFullYear();
      return { isoYear, isoWeek: weekNo };
    };
    const { isoYear, isoWeek } = calcISOWeek(d.date);
    const newId = await getNextId("expenseId");
    const ref = db.collection("expenses").doc(String(newId));
    const doc = {
      id: newId,
      businessId: bizIdNum,
      name: nm,
      categoryId: catIdNum ?? null,
      categoryName: catName ?? "",
      amount: amtNum,
      paidAt: d.display,
      paidAtISO: d.iso,
      paidAtTimestamp: admin.firestore.Timestamp.fromDate(
        new Date(d.date.getTime()),
      ),
      year: Number(d.display.slice(6, 10)),
      month: Number(d.display.slice(3, 5)),
      isoYear,
      isoWeek,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    await ref.set(doc);
    return {
      id: newId,
      businessId: bizIdNum,
      name: nm,
      categoryId: doc.categoryId,
      categoryName: doc.categoryName,
      amount: amtNum,
      paidAt: doc.paidAt,
      paidAtISO: doc.paidAtISO,
      isoYear,
      isoWeek,
    };
  } catch (error) {
    console.error("Firestore error creando gasto:", error);
    throw new Error(error.message);
  }
};

export const getExpensesByBusiness = async (
  businessId,
  { year, week }: any = {},
) => {
  try {
    const bizIdNum = Number(businessId);
    let q = db.collection("expenses").where("businessId", "==", bizIdNum);
    const snap = await q.get();
    const list = snap.docs.map((d) => {
      const data = d.data() || {};
      return {
        id: data.id ?? Number(d.id),
        businessId: bizIdNum,
        name: data.name ?? "",
        categoryId: data.categoryId ?? null,
        categoryName: data.categoryName ?? "",
        amount: data.amount ?? 0,
        paidAt: data.paidAt ?? null,
        paidAtISO: data.paidAtISO ?? null,
        isoYear: data.isoYear ?? null,
        isoWeek: data.isoWeek ?? null,
        year: data.year ?? null,
        month: data.month ?? null,
      };
    });
    if (typeof year === "number" && typeof week === "number") {
      return list.filter(
        (e) =>
          Number(e.isoYear) === Number(year) &&
          Number(e.isoWeek) === Number(week),
      );
    }
    if (typeof year === "number") {
      return list.filter((e) => Number(e.year) === Number(year));
    }
    return list;
  } catch (error) {
    console.error("Firestore error listando gastos:", error);
    throw new Error(error.message);
  }
};

export const getIncomeCategoryById = (categoryId) => {
  const categories = {
    1: { id: 1, name: "Venta de productos" },
    2: { id: 2, name: "Venta de servicios" },
  };

  const category = categories[categoryId];
  if (!category) {
    throw new Error(
      "Categoría de ingreso inválida. Solo se permite 1 (Venta de productos) o 2 (Venta de servicios)",
    );
  }

  return category;
};

export const getIncomeCategories = () => {
  return [
    { id: 1, name: "Venta de productos" },
    { id: 2, name: "Venta de servicios" },
  ];
};

export const createIncome = async ({
  businessId,
  name,
  categoryId,
  receivedAt,
  amount,
}) => {
  try {
    const bizIdNum = Number(businessId);
    if (!Number.isFinite(bizIdNum)) {
      throw new Error("businessId inválido");
    }
    const bq = await db
      .collection("user-business")
      .where("id", "==", bizIdNum)
      .get();
    if (bq.empty) {
      throw new Error("Business not found");
    }
    const nm = String(name || "").trim();
    if (!nm) throw new Error("name requerido");

    const catIdNum = Number(categoryId);
    if (!Number.isFinite(catIdNum)) {
      throw new Error("categoryId inválido");
    }

    const category = getIncomeCategoryById(catIdNum);

    const amtNum = parseFloat(amount);
    if (!Number.isFinite(amtNum) || amtNum < 0) {
      throw new Error("amount debe ser un número no negativo");
    }

    const normalizeDate = (s) => {
      const str = String(s || "").trim();
      const m1 = /^([0-9]{2})\/([0-9]{2})\/([0-9]{4})$/.exec(str);
      if (m1) {
        const dd = Number(m1[1]);
        const mm = Number(m1[2]);
        const yyyy = Number(m1[3]);
        const dt = new Date(Date.UTC(yyyy, mm - 1, dd));
        const iso = `${yyyy.toString().padStart(4, "0")}-${mm.toString().padStart(2, "0")}-${dd.toString().padStart(2, "0")}`;
        return { date: dt, iso, display: `${m1[1]}/${m1[2]}/${m1[3]}` };
      }
      const m2 = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(str);
      if (m2) {
        const yyyy = Number(m2[1]);
        const mm = Number(m2[2]);
        const dd = Number(m2[3]);
        const dt = new Date(Date.UTC(yyyy, mm - 1, dd));
        const iso = `${yyyy.toString().padStart(4, "0")}-${mm.toString().padStart(2, "0")}-${dd.toString().padStart(2, "0")}`;
        return {
          date: dt,
          iso,
          display: `${dd.toString().padStart(2, "0")}/${mm.toString().padStart(2, "0")}/${yyyy}`,
        };
      }
      throw new Error("receivedAt debe tener formato dd/MM/YYYY o YYYY-MM-DD");
    };
    const d = normalizeDate(receivedAt);
    const calcISOWeek = (date) => {
      const tmp = new Date(
        Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
      );
      tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay() || 7));
      const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
      const weekNo = Math.ceil(
        ((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
      );
      const isoYear = tmp.getUTCFullYear();
      return { isoYear, isoWeek: weekNo };
    };
    const { isoYear, isoWeek } = calcISOWeek(d.date);
    const newId = await getNextId("incomeId");
    const ref = db.collection("incomes").doc(String(newId));
    const doc = {
      id: newId,
      businessId: bizIdNum,
      name: nm,
      categoryId: category.id,
      categoryName: category.name,
      amount: amtNum,
      receivedAt: d.display,
      receivedAtISO: d.iso,
      receivedAtTimestamp: admin.firestore.Timestamp.fromDate(
        new Date(d.date.getTime()),
      ),
      year: Number(d.display.slice(6, 10)),
      month: Number(d.display.slice(3, 5)),
      isoYear,
      isoWeek,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    await ref.set(doc);
    return {
      id: newId,
      businessId: bizIdNum,
      name: nm,
      categoryId: doc.categoryId,
      categoryName: doc.categoryName,
      amount: amtNum,
      receivedAt: doc.receivedAt,
      receivedAtISO: doc.receivedAtISO,
      isoYear,
      isoWeek,
    };
  } catch (error) {
    console.error("Firestore error creando ingreso:", error);
    throw new Error(error.message);
  }
};

export const getIncomesByBusiness = async (businessId, { year, week }: any = {}) => {
  try {
    const bizIdNum = Number(businessId);
    let q = db.collection("incomes").where("businessId", "==", bizIdNum);
    const snap = await q.get();
    const list = snap.docs.map((d) => {
      const data = d.data() || {};
      return {
        id: data.id ?? Number(d.id),
        businessId: bizIdNum,
        name: data.name ?? "",
        categoryId: data.categoryId ?? null,
        categoryName: data.categoryName ?? "",
        amount: data.amount ?? 0,
        receivedAt: data.receivedAt ?? null,
        receivedAtISO: data.receivedAtISO ?? null,
        isoYear: data.isoYear ?? null,
        isoWeek: data.isoWeek ?? null,
        year: data.year ?? null,
        month: data.month ?? null,
      };
    });
    if (typeof year === "number" && typeof week === "number") {
      return list.filter(
        (e) =>
          Number(e.isoYear) === Number(year) &&
          Number(e.isoWeek) === Number(week),
      );
    }
    if (typeof year === "number") {
      return list.filter((e) => Number(e.year) === Number(year));
    }
    return list;
  } catch (error) {
    console.error("Firestore error listando ingresos:", error);
    throw new Error(error.message);
  }
};

export const updateIncome = async (
  id,
  { name, category, categoryId, receivedAt, amount },
) => {
  try {
    const idNum = Number(id);
    if (!Number.isFinite(idNum)) {
      throw new Error("ID inválido");
    }
    const docRef = db.collection("incomes").doc(String(idNum));
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      throw new Error("Ingreso no encontrado");
    }
    const data = docSnap.data();
    const updates: any = {};

    if (name !== undefined) {
      const nm = String(name).trim();
      if (!nm) throw new Error("name no puede estar vacío");
      updates.name = nm;
    }

    if (amount !== undefined) {
      const amtNum = parseFloat(amount);
      if (!Number.isFinite(amtNum) || amtNum < 0) {
        throw new Error("amount debe ser un número no negativo");
      }
      updates.amount = amtNum;
    }

    if (receivedAt !== undefined) {
      const normalizeDate = (s) => {
        const str = String(s || "").trim();
        const m1 = /^([0-9]{2})\/([0-9]{2})\/([0-9]{4})$/.exec(str);
        if (m1) {
          const dd = Number(m1[1]);
          const mm = Number(m1[2]);
          const yyyy = Number(m1[3]);
          const dt = new Date(Date.UTC(yyyy, mm - 1, dd));
          const iso = `${yyyy.toString().padStart(4, "0")}-${mm.toString().padStart(2, "0")}-${dd.toString().padStart(2, "0")}`;
          return { date: dt, iso, display: `${m1[1]}/${m1[2]}/${m1[3]}` };
        }
        const m2 = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(str);
        if (m2) {
          const yyyy = Number(m2[1]);
          const mm = Number(m2[2]);
          const dd = Number(m2[3]);
          const dt = new Date(Date.UTC(yyyy, mm - 1, dd));
          const iso = `${yyyy.toString().padStart(4, "0")}-${mm.toString().padStart(2, "0")}-${dd.toString().padStart(2, "0")}`;
          return {
            date: dt,
            iso,
            display: `${dd.toString().padStart(2, "0")}/${mm.toString().padStart(2, "0")}/${yyyy}`,
          };
        }
        throw new Error(
          "receivedAt debe tener formato dd/MM/YYYY o YYYY-MM-DD",
        );
      };
      const d = normalizeDate(receivedAt);
      const calcISOWeek = (date) => {
        const tmp = new Date(
          Date.UTC(
            date.getUTCFullYear(),
            date.getUTCMonth(),
            date.getUTCDate(),
          ),
        );
        tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay() || 7));
        const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
        const weekNo = Math.ceil(
          ((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
        );
        const isoYear = tmp.getUTCFullYear();
        return { isoYear, isoWeek: weekNo };
      };
      const { isoYear, isoWeek } = calcISOWeek(d.date);
      updates.receivedAt = d.display;
      updates.receivedAtISO = d.iso;
      updates.receivedAtTimestamp = admin.firestore.Timestamp.fromDate(
        new Date(d.date.getTime()),
      );
      updates.year = Number(d.display.slice(6, 10));
      updates.month = Number(d.display.slice(3, 5));
      updates.isoYear = isoYear;
      updates.isoWeek = isoWeek;
    }

    if (category !== undefined || categoryId !== undefined) {
      let catIdNum =
        categoryId !== undefined && categoryId !== null
          ? Number(categoryId)
          : undefined;
      let catName =
        category !== undefined && category !== null
          ? String(category).trim()
          : undefined;

      if (catIdNum !== undefined && !Number.isFinite(catIdNum)) {
        throw new Error("categoryId inválido");
      }

      if (catIdNum !== undefined) {
        const cdoc = await db
          .collection("income-categories")
          .doc(String(catIdNum))
          .get();
        if (!cdoc.exists) throw new Error("Categoría no encontrada");
        const cdata = cdoc.data();
        if (Number(cdata.businessId) !== Number(data.businessId))
          throw new Error("Categoría no pertenece al negocio");
        catName = cdata.name ?? (catName || "");
      }

      updates.categoryId = catIdNum ?? null;
      updates.categoryName = catName ?? "";
    }

    updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    await docRef.update(updates);

    const updatedDoc = await docRef.get();
    const updatedData = updatedDoc.data();

    return {
      id: idNum,
      businessId: updatedData.businessId,
      name: updatedData.name,
      categoryId: updatedData.categoryId,
      categoryName: updatedData.categoryName,
      amount: updatedData.amount,
      receivedAt: updatedData.receivedAt,
      receivedAtISO: updatedData.receivedAtISO,
      isoYear: updatedData.isoYear,
      isoWeek: updatedData.isoWeek,
    };
  } catch (error) {
    console.error("Firestore error actualizando ingreso:", error);
    throw new Error(error.message);
  }
};

export const deleteIncome = async (id) => {
  try {
    const idNum = Number(id);
    if (!Number.isFinite(idNum)) {
      throw new Error("ID inválido");
    }
    const docRef = db.collection("incomes").doc(String(idNum));
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      throw new Error("Ingreso no encontrado");
    }
    await docRef.delete();
    return { id: idNum, deleted: true };
  } catch (error) {
    console.error("Firestore error eliminando ingreso:", error);
    throw new Error(error.message);
  }
};

export const deleteExpense = async (id) => {
  try {
    const idNum = Number(id);
    if (!Number.isFinite(idNum)) {
      throw new Error("ID inválido");
    }
    const docRef = db.collection("expenses").doc(String(idNum));
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      throw new Error("Gasto no encontrado");
    }
    await docRef.delete();
    return { id: idNum, deleted: true };
  } catch (error) {
    console.error("Firestore error eliminando gasto:", error);
    throw new Error(error.message);
  }
};

export const getBusinessResults = async (
  businessId,
  { startDate, endDate, year, week }: any = {},
) => {
  try {
    const bizIdNum = Number(businessId);
    if (!Number.isFinite(bizIdNum)) {
      throw new Error("businessId inválido");
    }

    let expenses = await getExpensesByBusiness(businessId, { year, week });
    let incomes = await getIncomesByBusiness(businessId, { year, week });

    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      if (start && isNaN(start.getTime())) {
        throw new Error("startDate inválido");
      }
      if (end && isNaN(end.getTime())) {
        throw new Error("endDate inválido");
      }

      expenses = expenses.filter((expense) => {
        const expenseDate = new Date(expense.paidAtISO);
        if (start && expenseDate < start) return false;
        if (end && expenseDate > end) return false;
        return true;
      });

      incomes = incomes.filter((income) => {
        const incomeDate = new Date(income.receivedAtISO);
        if (start && incomeDate < start) return false;
        if (end && incomeDate > end) return false;
        return true;
      });
    }

    const totalExpenses = expenses.reduce(
      (sum, expense) => sum + Number(expense.amount),
      0,
    );
    const totalCat1 = expenses
      .filter((e) => e.categoryId === 1)
      .reduce((sum, e) => sum + Number(e.amount), 0);
    const totalCat2 = expenses
      .filter((e) => e.categoryId === 2)
      .reduce((sum, e) => sum + Number(e.amount), 0);
    const totalCat3 = expenses
      .filter((e) => e.categoryId === 3)
      .reduce((sum, e) => sum + Number(e.amount), 0);
    const totalCat4 = expenses
      .filter((e) => e.categoryId === 4)
      .reduce((sum, e) => sum + Number(e.amount), 0);
    const totalCat5 = expenses
      .filter((e) => e.categoryId === 5)
      .reduce((sum, e) => sum + Number(e.amount), 0);
    const totalCat6 = expenses
      .filter((e) => e.categoryId === 6)
      .reduce((sum, e) => sum + Number(e.amount), 0);
    const totalCat7 = expenses
      .filter((e) => e.categoryId === 7)
      .reduce((sum, e) => sum + Number(e.amount), 0);
    const totalIncomes = incomes.reduce(
      (sum, income) => sum + Number(income.amount),
      0,
    );
    const totalCatproduct = incomes
      .filter((i) => i.categoryId === 1)
      .reduce((sum, i) => sum + Number(i.amount), 0);
    const totalCatservice = incomes
      .filter((i) => i.categoryId === 2)
      .reduce((sum, i) => sum + Number(i.amount), 0);
    const netResult = totalIncomes - totalExpenses;

    const total = totalIncomes + totalExpenses;
    const expensePercentage = total > 0 ? (totalExpenses / total) * 100 : 0;
    const incomePercentage = total > 0 ? (totalIncomes / total) * 100 : 0;

    return {
      businessId: bizIdNum,
      filters: { startDate, endDate, year, week },
      summary: {
        totalExpenses,
        totalIncomes,
        netResult,
        expensePercentage: Math.round(expensePercentage * 100) / 100,
        incomePercentage: Math.round(incomePercentage * 100) / 100,
      },
      expenses: {
        items: expenses,
        count: expenses.length,
        total: totalExpenses,
        totalCat1,
        totalCat2,
        totalCat3,
        totalCat4,
        totalCat5,
        totalCat6,
        totalCat7,
      },
      incomes: {
        items: incomes,
        count: incomes.length,
        total: totalIncomes,
        totalCatproduct,
        totalCatservice,
      },
    };
  } catch (error) {
    console.error("Firestore error obteniendo resultados:", error);
    throw new Error(error.message);
  }
};

const getMostUsedNames = (items) => {
  const counts = new Map();

  items.forEach((item) => {
    const rawName = String(item?.name ?? "").trim();
    if (!rawName) return;
    const key = rawName.toLowerCase();
    const current = counts.get(key);
    if (current) {
      current.count += 1;
      return;
    }
    counts.set(key, { name: rawName, count: 1 });
  });

  if (counts.size === 0) {
    return [];
  }

  let maxCount = 0;
  counts.forEach((entry) => {
    if (entry.count > maxCount) {
      maxCount = entry.count;
    }
  });

  // Si no hay repetidos (todas las ocurrencias son 1), no retornar nombres.
  if (maxCount <= 1) {
    return [];
  }

  const mostUsed = [];
  counts.forEach((entry) => {
    if (entry.count === maxCount) {
      mostUsed.push(entry.name);
    }
  });
  return mostUsed;
};

export const getBusinessMostUsedTypes = async (businessId) => {
  try {
    const bizIdNum = Number(businessId);
    if (!Number.isFinite(bizIdNum)) {
      throw new Error("businessId inválido");
    }

    const expenses = await getExpensesByBusiness(businessId);
    const incomes = await getIncomesByBusiness(businessId);

    const mostUsedServicioType = getMostUsedNames(
      incomes.filter((income) => Number(income.categoryId) === 2),
    );
    const mostUsedProductoType = getMostUsedNames(
      incomes.filter((income) => Number(income.categoryId) === 1),
    );

    return {
      mostUsedServicioType,
      mostUsedProductoType,
    };
  } catch (error) {
    console.error("Firestore error obteniendo tipos más usados:", error);
    throw new Error(error.message);
  }
};

export const getAllPromotions = async () => {
  try {
    const snapshot = await db
      .collection("services")
      .where("category", "==", "promotion")
      .get();

    const promotions = [];
    const businessIds = new Set();

    snapshot.docs.forEach((d) => {
      const s = d.data() || {};
      promotions.push({
        id: s.id ?? Number(d.id),
        businessId: Number(s.businessId),
        name: s.name ?? "",
        type: s.type ?? "",
        duration: s.duration ?? null,
        price: s.price ?? null,
        category: s.category ?? "promotion",
        description: s.description ?? "",
        image: s.image ?? null,
        promotionTerms: s.promotionTerms ?? "",
        promotionValidUntil: s.promotionValidUntil ?? null,
        promotionValidIndefinite: s.promotionValidIndefinite ?? false,
        archived: s.archived ?? false,
        createdAt: s.createdAt?.toDate?.()?.toISOString() ?? null,
      });
      businessIds.add(Number(s.businessId));
    });

    // Obtener información de los negocios
    const businessMap = new Map();
    if (businessIds.size > 0) {
      const businessIdArray = Array.from(businessIds);
      const chunks = [];
      for (let i = 0; i < businessIdArray.length; i += 10) {
        chunks.push(businessIdArray.slice(i, i + 10));
      }

      const businessSnaps = await Promise.all(
        chunks.map((chunk) =>
          db.collection("user-business").where("id", "in", chunk).get(),
        ),
      );

      businessSnaps.forEach((snap) => {
        snap.docs.forEach((doc) => {
          const b = doc.data() || {};
          const id = Number(b.id ?? doc.id);
          businessMap.set(id, {
            id,
            name: b.name ?? b.nombre ?? "",
            avatar: b.avatar ?? null,
            banner: b.banner ?? null,
            direccion: b.direccion ?? null,
          });
        });
      });
    }

    // Agregar información del negocio a cada promoción
    const result = promotions
      .map((promo) => ({
        ...promo,
        business: businessMap.get(promo.businessId) ?? null,
      }))
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });

    return result;
  } catch (error) {
    console.error("Firestore error obteniendo promociones:", error);
    throw new Error(error.message);
  }
};

export const getPromotionById = async (promotionId) => {
  try {
    const sid = String(promotionId);
    const ref = db.collection("services").doc(sid);
    const doc = await ref.get();
    if (!doc.exists) {
      throw new Error("Promotion not found");
    }
    const s = doc.data() || {};
    if (s.category !== "promotion") {
      throw new Error("Service is not a promotion");
    }

    // Obtener información del negocio
    const bizId = Number(s.businessId);
    const bizDoc = await db.collection("clients").doc(String(bizId)).get();
    const bizData = bizDoc.exists ? bizDoc.data() : {};

    return {
      id: s.id ?? Number(sid),
      businessId: bizId,
      businessName: bizData.nombre ?? "",
      name: s.name ?? "",
      type: s.type ?? "",
      duration: s.duration ?? null,
      price: s.price ?? null,
      category: s.category ?? "promotion",
      description: s.description ?? "",
      image: s.image ?? null,
      promotionTerms: s.promotionTerms ?? "",
      promotionValidUntil: s.promotionValidUntil ?? null,
      promotionValidIndefinite: s.promotionValidIndefinite ?? false,
      archived: s.archived ?? false,
      createdAt: s.createdAt?.toDate?.()?.toISOString() ?? null,
    };
  } catch (error) {
    console.error("Firestore error obteniendo promoción:", error);
    throw new Error(error.message);
  }
};
