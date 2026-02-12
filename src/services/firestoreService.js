import admin from "firebase-admin";
import crypto from "crypto";
import bcrypt from "bcrypt";

const db = admin.firestore();

const hashCode = (code) => {
  return crypto.createHash('sha256').update(code).digest('hex');
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
    console.log('Attempting to create user:', { nombre, numero });
    const hashedCode = hashCode(verificationCode);
    const newId = await getNextId('userId');
    const userRef = db.collection("users").doc(newId.toString());
    await userRef.set({
      id: newId,
      nombre,
      numero,
      verificationCode: hashedCode,
      status: 'pending_verification',
      verificationAttempts: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log('User created successfully');
    return { id: newId, nombre, numero, status: 'pending_verification' };
  } catch (error) {
    console.error("Firestore error:", error);
    throw new Error(`Error creating user: ${error.message}`);
  }
};

export const updateUserAvatar = async (userId, avatarUrl) => {
  try {
    console.log('Updating user avatar:', { userId, avatarUrl });
    const userRef = db.collection("users").doc(userId);
    await userRef.update({
      avatar: avatarUrl,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log('User avatar updated successfully');
    return { id: userId, avatar: avatarUrl };
  } catch (error) {
    console.error("Firestore error updating avatar:", error);
    throw new Error(`Error updating user avatar: ${error.message}`);
  }
};

export const updateBusinessAvatar = async (businessId, avatarUrl) => {
  try {
    console.log('Updating business avatar:', { businessId, avatarUrl });
    const userRef = db.collection("user-business").doc(businessId);
    await userRef.update({
      avatar: avatarUrl,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log('Business avatar updated successfully');
    return { id: businessId, avatar: avatarUrl };
  } catch (error) {
    console.error("Firestore error updating business avatar:", error);
    throw new Error(`Error updating business avatar: ${error.message}`);
  }
};

export const updateBusinessBanner = async (businessId, bannerUrl) => {
  try {
    console.log('Updating business banner:', { businessId, bannerUrl });
    const userRef = db.collection("user-business").doc(businessId);
    await userRef.update({
      banner: bannerUrl,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log('Business banner updated successfully');
    return { id: businessId, banner: bannerUrl };
  } catch (error) {
    console.error("Firestore error updating business banner:", error);
    throw new Error(`Error updating business banner: ${error.message}`);
  }
};

export const updateStaffAvatar = async (staffId, avatarUrl) => {
  try {
    console.log('Updating staff avatar:', { staffId, avatarUrl });
    const staffRef = db.collection("staff").doc(staffId);
    await staffRef.update({
      avatar: avatarUrl,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log('Staff avatar updated successfully');
    return { id: staffId, avatar: avatarUrl };
  } catch (error) {
    console.error("Firestore error updating staff avatar:", error);
    throw new Error(`Error updating staff avatar: ${error.message}`);
  }
};

export const verifyUserCode = async (userId, code) => {
  try {
    console.log('Verifying user code:', { userId });
    const hashedCode = hashCode(code);
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      throw new Error('User not found');
    }
    const userData = userDoc.data();
    const now = admin.firestore.Timestamp.now().toMillis();
    const attempts = userData.verificationAttempts || 0;
    const lastAttempt = userData.lastVerificationAttempt ? userData.lastVerificationAttempt.toMillis() : 0;
    const oneHour = 60 * 60 * 1000;

    if (attempts >= 3 && (now - lastAttempt) < oneHour) {
      const remainingTime = Math.ceil((oneHour - (now - lastAttempt)) / 60000); // minutes
      throw new Error(`Demasiados intentos. Espera ${remainingTime} minutos.`);
    }

    // Increment attempts
    await userRef.update({
      verificationAttempts: attempts + 1,
      lastVerificationAttempt: admin.firestore.FieldValue.serverTimestamp(),
    });

    if (userData.verificationCode !== hashedCode) {
      throw new Error('Invalid verification code');
    }

    // Success, reset attempts and verify
    await userRef.update({
      status: 'verified',
      verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
      verificationAttempts: 0,
      // Optionally remove verificationCode
    });
    console.log('User verified successfully');
    return { id: userId, status: 'verified' };
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
      t.set(counterRef, { seq: 1, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
      return 1;
    }
    const current = typeof snapshot.data().seq === "number" ? snapshot.data().seq : 0;
    const next = current + 1;
    t.update(counterRef, { seq: next, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    return next;
  });
};

export const addStaff = async (businessId, nombre, numero, password, avatar = null, apellido = '', staffId = null) => {
  try {
    console.log('Adding staff:', { businessId, nombre, apellido, numero, staffId });

    // Check if phone already exists in staff (skip if empty)
    if (typeof numero === 'string' ? numero.trim() !== '' : !!numero) {
      const existingPhone = await db.collection("staff").where("numero", "==", numero).get();
      if (!existingPhone.empty) {
        throw new Error("El número de teléfono ya está registrado para un miembro del personal");
      }
    }

    // Hash password only if provided and non-empty
    let hashedPassword = null;
    const hasPassword = typeof password === 'string' ? password.trim() !== '' : !!password;
    if (hasPassword) {
      const saltRounds = 10;
      hashedPassword = await bcrypt.hash(password, saltRounds);
    }

    const finalStaffId = staffId ? String(staffId) : String(await getNextStaffId());
    const staffRef = db.collection("staff").doc(finalStaffId);
    await staffRef.set({
      id: staffRef.id,
      businessId,
      nombre,
      apellido: typeof apellido === 'string' ? apellido : '',
      numero,
      password: hashedPassword,
      avatar: avatar || null,
      staffdates: [],
      staffAppoinments: [],
      staffAppointmentsHour: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log('Staff added successfully with id:', staffRef.id);
    return { id: staffRef.id, businessId, nombre, apellido: typeof apellido === 'string' ? apellido : '', numero, avatar: avatar || null };
  } catch (error) {
    console.error("Firestore error adding staff:", error);
    throw new Error(`Error adding staff: ${error.message}`);
  }
};

export const getStaffByBusiness = async (businessId) => {
  try {
    console.log('Getting staff for business:', businessId);
    const staffQuery = await db.collection("staff").where("businessId", "==", businessId).get();
    const staff = staffQuery.docs.map(doc => {
      const data = doc.data();
      return {
        apellido: typeof data.apellido === 'string' ? data.apellido : '',
        avatar: data.avatar ?? null,
        businessId: data.businessId,
        createdAt: data.createdAt ?? null,
        id: doc.id,
        nombre: data.nombre ?? '',
        numero: data.numero ?? '',
        password: data.password ?? null,
        updatedAt: data.updatedAt ?? null,
        staffdates: Array.isArray(data.staffdates) ? data.staffdates : [],
        staffAppoinments: Array.isArray(data.staffAppoinments) ? data.staffAppoinments : [],
        staffAppointmentsHour: Array.isArray(data.staffAppointmentsHour) ? data.staffAppointmentsHour : [],
      };
    });
    console.log('Staff retrieved successfully');
    return staff;
  } catch (error) {
    console.error("Firestore error getting staff:", error);
    throw new Error(`Error getting staff: ${error.message}`);
  }
};

export const loginStaff = async (numero, password) => {
  try {
    console.log('Logging in staff:', { numero });
    const staffQuery = await db.collection("staff").where("numero", "==", numero).get();
    if (staffQuery.empty) {
      throw new Error("Credenciales incorrectas");
    }
    const staffDoc = staffQuery.docs[0];
    const staffData = staffDoc.data();

    // If staff has no password set or it's not a valid bcrypt hash, fail
    if (!staffData.password || typeof staffData.password !== 'string' || !staffData.password.startsWith('$2')) {
      throw new Error("Credenciales incorrectas");
    }

    const isPasswordValid = await bcrypt.compare(password, staffData.password);
    if (!isPasswordValid) {
      throw new Error("Credenciales incorrectas");
    }

    console.log('Staff logged in successfully');
    return { id: staffData.id, businessId: staffData.businessId, nombre: staffData.nombre, apellido: staffData.apellido || '', numero: staffData.numero, avatar: staffData.avatar };
  } catch (error) {
    console.error("Firestore error logging in staff:", error);
    throw new Error(error.message);
  }
};

export const findBusinessUser = async (nombre, numero) => {
  try {
    console.log('Finding business user:', { nombre, numero });
    const userQuery = await db.collection("user-business")
      .where("nombre", "==", nombre)
      .where("numero", "==", numero)
      .get();

    if (userQuery.empty) {
      throw new Error("credenciales incorrectas");
    }

    const userDoc = userQuery.docs[0];
    const userData = userDoc.data();
    console.log('Business user found');
    return { id: userData.id, nombre: userData.nombre, correo: userData.correo, numero: userData.numero, avatar: userData.avatar, banner: userData.banner };
  } catch (error) {
    console.error("Firestore error finding business user:", error);
    throw new Error(error.message);
  }
};

/** Busca un usuario de la app (colección users) por número. Si hay varios, devuelve el más reciente. */
export const getAppUserByNumero = async (numero) => {
  const numStr = String(numero).trim();
  const userQuery = await db.collection("users")
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
    const userQuery = await db.collection("user-business")
      .where("numero", "==", numStr)
      .get();
    if (userQuery.empty) {
      throw new Error("Credenciales incorrectas");
    }
    const userData = userQuery.docs[0].data();
    const setupFlag = typeof userData.isInitialSetupComplete === 'string' ? userData.isInitialSetupComplete.toLowerCase() === 'true' : Boolean(userData.isInitialSetupComplete);
    return { id: userData.id, nombre: userData.nombre, correo: userData.correo, numero: userData.numero, avatar: userData.avatar, banner: userData.banner, isInitialSetupComplete: setupFlag, type: "business" };
  } catch (error) {
    console.error("Firestore error getting business user by numero:", error);
    throw new Error(error.message);
  }
};

export const loginBusinessUser = async (numero, password) => {
  try {
    console.log('Logging in business user:', { numero });
    const numStr = String(numero).trim();
    const userQuery = await db.collection("user-business")
      .where("numero", "==", numStr)
      .get();
    console.log('User query docs count:', userQuery.docs.length);
    if (userQuery.empty) {
      throw new Error("Este número no está registrado");
    }

    // Check password against all matching users
    for (const userDoc of userQuery.docs) {
      const userData = userDoc.data();
      const isPasswordValid = await bcrypt.compare(password, userData.password);
      if (isPasswordValid) {
        console.log('Business user logged in successfully');
        const setupFlag = typeof userData.isInitialSetupComplete === 'string' ? userData.isInitialSetupComplete.toLowerCase() === 'true' : Boolean(userData.isInitialSetupComplete);
        return { id: userData.id, nombre: userData.nombre, correo: userData.correo, numero: userData.numero, avatar: userData.avatar, banner: userData.banner, isInitialSetupComplete: setupFlag };
      }
    }

    throw new Error("Error en las credenciales");
  } catch (error) {
    console.error("Firestore error logging in business user:", error);
    throw new Error(error.message);
  }
};

export const createBusinessUser = async (nombre, correo, numero, password, avatar = null) => {
  try {
    console.log('Attempting to create business user:', { nombre, correo, numero });

    // Check if email already exists
    const existingUser = await db.collection("user-business").where("correo", "==", correo).get();
    if (!existingUser.empty) {
      throw new Error("El correo electrónico ya está registrado. Inicie sesión.");
    }

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash password and code
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const hashedCode = hashCode(verificationCode);

    const newId = await getNextId('businessUserId');
    const userRef = db.collection("user-business").doc(newId.toString());
    await userRef.set({
      id: newId,
      nombre,
      correo,
      numero,
      password: hashedPassword,
      verificationCode: hashedCode,
      status: 'pending_verification',
      verificationAttempts: 0,
      avatar: avatar || null,
      banner: null,
      isInitialSetupComplete: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log('Business user created successfully');
    return { id: newId, nombre, correo, numero, verificationCode };
  } catch (error) {
    console.error("Firestore error creating business user:", error);
    throw new Error(`Error creando usuario de negocio: ${error.message}`);
  }
};

export const resendVerificationCode = async (userId) => {
  try {
    console.log('Reenvio de codigo por:', userId);

    return await db.runTransaction(async (transaction) => {
      const userRef = db.collection("users").doc(userId);
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists) throw new Error('Usuario no encontrado');

      const userData = userDoc.data();
      const now = Date.now(); // 🔹 usamos timestamp numérico local
      const createdAt = userData.createdAt?.toMillis
        ? userData.createdAt.toMillis()
        : now - 2 * 60 * 1000;

      const lastResend = typeof userData.lastResendRequest === 'number'
        ? userData.lastResendRequest
        : createdAt;

      const diff = now - lastResend;
      const oneMinute = 60 * 1000;

      console.log({
        now,
        lastResend,
        diff,
        hasLastResend: !!userData.lastResendRequest,
        hasCreatedAt: !!userData.createdAt
      });

      if (diff < oneMinute) {
        const remaining = Math.ceil((oneMinute - diff) / 1000);
        console.log(`⛔ Blocked resend: must wait ${remaining}s`);
        throw new Error(`Debes esperar ${remaining} segundos antes de reenviar.`);
      }

      const newCode = Math.floor(100000 + Math.random() * 900000).toString();
      const hashedCode = hashCode(newCode);

      transaction.update(userRef, {
        verificationCode: hashedCode,
        lastResendRequest: now, // 🔹 guardamos número, no serverTimestamp()
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
    console.error("🔥 Error en el reenvio de codigo:", error.message);
    throw new Error(error.message);
  }
};

export const verifyBusinessCode = async (id, code) => {
  try {
    if (!id || id.toString().trim() === '') {
      throw new Error('Invalid id');
    }
    console.log('Verifying business user code:', { id });
    const hashedCode = hashCode(code);
    const userQuery = await db.collection("user-business").where("id", "==", id).get();
    if (userQuery.empty) {
      throw new Error('Business user not found');
    }
    const userDoc = userQuery.docs[0];
    const userRef = userDoc.ref;
    const userData = userDoc.data();
    const now = admin.firestore.Timestamp.now().toMillis();
    const attempts = userData.verificationAttempts || 0;
    const lastAttempt = userData.lastVerificationAttempt ? userData.lastVerificationAttempt.toMillis() : 0;
    const oneHour = 60 * 60 * 1000;

    if (attempts >= 3 && (now - lastAttempt) < oneHour) {
      const remainingTime = Math.ceil((oneHour - (now - lastAttempt)) / 60000); // minutes
      throw new Error(`Demasiados intentos. Espera ${remainingTime} minutos.`);
    }

    // Increment attempts
    await userRef.update({
      verificationAttempts: attempts + 1,
      lastVerificationAttempt: admin.firestore.FieldValue.serverTimestamp(),
    });

    if (userData.verificationCode !== hashedCode) {
      throw new Error('Invalid verification code');
    }

    // Success, reset attempts and verify
    await userRef.update({
      status: 'verified',
      verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
      verificationAttempts: 0,
      // Optionally remove verificationCode
    });
    console.log('Business user verified successfully');
    return { id: id, status: 'verified' };
  } catch (error) {
    console.error("Firestore error verifying business code:", error);
    throw new Error(error.message);
  }
};

export const resendBusinessVerificationCode = async (id) => {
  try {
    console.log('Reenvio de codigo de negocio por:', id);

    return await db.runTransaction(async (transaction) => {
      const userQuery = await db.collection("user-business").where("id", "==", id).get();
      if (userQuery.empty) throw new Error('Usuario de negocio no encontrado');
      const userDoc = userQuery.docs[0];
      const userRef = userDoc.ref;

      const userData = userDoc.data();
      const now = Date.now(); // 🔹 usamos timestamp numérico local
      const createdAt = userData.createdAt?.toMillis
        ? userData.createdAt.toMillis()
        : now - 2 * 60 * 1000;

      const lastResend = typeof userData.lastResendRequest === 'number'
        ? userData.lastResendRequest
        : createdAt;

      const diff = now - lastResend;
      const oneMinute = 60 * 1000;

      console.log({
        now,
        lastResend,
        diff,
        hasLastResend: !!userData.lastResendRequest,
        hasCreatedAt: !!userData.createdAt
      });

      if (diff < oneMinute) {
        const remaining = Math.ceil((oneMinute - diff) / 1000);
        console.log(`⛔ Blocked resend: must wait ${remaining}s`);
        throw new Error(`Debes esperar ${remaining} segundos antes de reenviar.`);
      }

      const newCode = Math.floor(100000 + Math.random() * 900000).toString();
      const hashedCode = hashCode(newCode);

      transaction.update(userRef, {
        verificationCode: hashedCode,
        lastResendRequest: now, // 🔹 guardamos número, no serverTimestamp()
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
    console.error("🔥 Error en el reenvio de codigo de negocio:", error.message);
    throw new Error(error.message);
  }
};

export const updateStaffFields = async (staffId, { nombre, apellido, numero, password }) => {
  try {
    const staffRef = db.collection("staff").doc(String(staffId));
    const docSnap = await staffRef.get();
    if (!docSnap.exists) {
      throw new Error("No document to update");
    }

    const updateData = {};

    if (nombre !== undefined) updateData.nombre = nombre;
    if (apellido !== undefined) updateData.apellido = typeof apellido === 'string' ? apellido : '';

    if (numero !== undefined) {
      // Basic digit-only validation when provided
      if (typeof numero === 'string' && numero.trim() !== '' && !/^\d+$/.test(numero)) {
        throw new Error("Numero debe contener solo digitos");
      }
      updateData.numero = numero;
      // Uniqueness check when numero is non-empty and changed
      if (typeof numero === 'string' ? numero.trim() !== '' : !!numero) {
        const existingPhone = await db.collection("staff")
          .where("numero", "==", numero)
          .get();
        const conflict = existingPhone.docs.some(d => d.id !== String(staffId));
        if (conflict) {
          throw new Error("El número de teléfono ya está registrado para un miembro del personal");
        }
      }
    }

    if (password !== undefined) {
      let hashedPassword = null;
      const hasPassword = typeof password === 'string' ? password.trim() !== '' : !!password;
      if (hasPassword) {
        const saltRounds = 10;
        hashedPassword = await bcrypt.hash(password, saltRounds);
      }
      updateData.password = hashedPassword; // null if empty string provided
    }

    updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    await staffRef.update(updateData);

    const updatedSnap = await staffRef.get();
    const data = updatedSnap.data();
    return { id: updatedSnap.id, nombre: data.nombre, apellido: data.apellido || '', numero: data.numero };
  } catch (error) {
    console.error("Firestore error updating staff fields:", error);
    throw new Error(error.message);
  }
};

export const APPOINTMENT_STATES = ["pendiente", "confirmado", "cancelado", "completado"];

export const createAppointment = async ({ businessId, staffId, serviceId, serviceType, serviceDuration, date, horario, calificacion }) => {
  try {
    if (!businessId || !staffId || !date || !horario) {
      throw new Error("Campos requeridos: businessId, staffId, date, horario");
    }

    let finalDuration = typeof serviceDuration === 'number' ? serviceDuration : undefined;
    let finalType = typeof serviceType === 'string' ? String(serviceType) : undefined;

    // Validate business exists
    const businessQuery = await db.collection("user-business").where("id", "==", Number(businessId)).get();
    if (businessQuery.empty) {
      throw new Error("Business not found");
    }
    const businessRef = businessQuery.docs[0].ref;

    // Validate staff exists and belongs to business
    const staffDoc = await db.collection("staff").doc(String(staffId)).get();
    if (!staffDoc.exists) {
      throw new Error("Staff not found");
    }
    const staffData = staffDoc.data();
    if (Number(staffData.businessId) !== Number(businessId)) {
      throw new Error("Staff no pertenece al negocio");
    }

    // Validate date format dd/MM/YYYY and actual calendar date
    const match = /^([0-9]{2})\/([0-9]{2})\/([0-9]{4})$/.exec(String(date));
    if (!match) {
      throw new Error("Fecha inválida. Formato requerido dd/MM/YYYY");
    }
    const d = Number(match[1]);
    const m = Number(match[2]);
    const y = Number(match[3]);
    const jsDate = new Date(y, m - 1, d);
    if (jsDate.getFullYear() !== y || jsDate.getMonth() !== (m - 1) || jsDate.getDate() !== d) {
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
      if (finalDuration === undefined && typeof svcData.duration === 'number' && svcData.duration > 0) {
        finalDuration = svcData.duration;
      }
    } else if (finalDuration === undefined && finalType) {
      const svcSnap = await db.collection("services")
        .where("businessId", "==", Number(businessId))
        .where("type", "==", String(finalType))
        .get();
      if (!svcSnap.empty) {
        const svc = svcSnap.docs[0].data();
        if (typeof svc.duration === 'number' && svc.duration > 0) {
          finalDuration = svc.duration;
        }
      }
    }
    if (finalDuration !== undefined && (typeof finalDuration !== 'number' || finalDuration <= 0)) {
      throw new Error("serviceDuration debe ser un número positivo (minutos)");
    }

    // Generate appointment id
    const newId = await getNextId('appointmentId');
    const appointmentRef = db.collection("appointments").doc(String(newId));

    // Guardar únicamente los campos solicitados en appointments
    const appointment = {
      businessId: Number(businessId),
      idappointment: newId,
      staffdates: String(date),
      staffAppoinments: String(staffId),
      staffAppointmentsHour: String(horario),
      serviceId: serviceId !== undefined && serviceId !== null ? Number(serviceId) : null,
      serviceType: finalType ? String(finalType) : "",
      serviceDuration: typeof finalDuration === 'number' ? finalDuration : null,
      state: "pendiente",
    };

    await appointmentRef.set(appointment);

    // Push summary to user-business appointments array
    const summary = {
      id: newId,
      staffId: String(staffId),
      serviceId: appointment.serviceId,
      serviceType: appointment.serviceType,
      serviceDuration: typeof finalDuration === 'number' ? finalDuration : null,
      date: String(date),
      horario: String(horario),
      calificacion: typeof calificacion === 'number' ? calificacion : null,
      state: "pendiente",
    };
    await businessRef.update({
      appointments: admin.firestore.FieldValue.arrayUnion(summary),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Vincular al staff: agregar fecha, id y hora a sus arrays
    await db.collection("staff").doc(String(staffId)).update({
      staffdates: admin.firestore.FieldValue.arrayUnion(String(date)),
      staffAppoinments: admin.firestore.FieldValue.arrayUnion(String(newId)),
      staffAppointmentsHour: admin.firestore.FieldValue.arrayUnion(String(horario)),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return appointment;
  } catch (error) {
    console.error("Firestore error creando cita:", error);
    throw new Error(error.message);
  }
};

export const updateAppointmentState = async (appointmentId, newState) => {
  try {
    if (!APPOINTMENT_STATES.includes(newState)) {
      throw new Error(`Estado inválido. Valores permitidos: ${APPOINTMENT_STATES.join(", ")}`);
    }

    const docRef = db.collection("appointments").doc(String(appointmentId));
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new Error("Cita no encontrada");
    }

    const patch = {
      state: newState,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (newState === "confirmado") {
      const data = doc.data();
      const dateStr = String(data.staffdates ?? data.date ?? "");
      const hourStr = String(data.staffAppointmentsHour ?? data.horario ?? "");
      const m = /^([0-9]{2})\/([0-9]{2})\/([0-9]{4})$/.exec(dateStr);
      const hm = /^([0-9]{2}):([0-9]{2})$/.exec(hourStr);
      let durationMin = typeof data.serviceDuration === "number" ? data.serviceDuration : null;
      if (!durationMin || durationMin <= 0) {
        const svcId = data.serviceId ?? null;
        if (svcId != null) {
          const svcDoc = await db.collection("services").doc(String(svcId)).get();
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

export const getAppointmentsByBusiness = async (businessId) => {
  try {
    const querySnap = await db.collection("appointments").where("businessId", "==", Number(businessId)).get();
    const staffSnap = await db.collection("staff").where("businessId", "==", Number(businessId)).get();
    const svcSnap = await db.collection("services").where("businessId", "==", Number(businessId)).get();
    const staffMap = new Map();
    staffSnap.docs.forEach(doc => {
      const data = doc.data();
      staffMap.set(String(doc.id), { nombre: data.nombre || '', apellido: data.apellido || '' });
    });
    const svcMap = new Map();
    svcSnap.docs.forEach(doc => {
      const data = doc.data();
      svcMap.set(Number(data.id ?? Number(doc.id)), {
        id: Number(data.id ?? Number(doc.id)),
        name: data.name ?? "",
        type: data.type ?? "",
        duration: data.duration ?? null,
        price: data.price ?? null,
      });
    });

    const results = querySnap.docs.map(d => {
      const data = d.data();
      const staffId = String(data.staffAppoinments ?? data.staffId ?? "");
      const staffInfo = staffMap.get(staffId) || { nombre: '', apellido: '' };
      const serviceId = data.serviceId ?? null;
      const svcInfo = serviceId != null ? (svcMap.get(Number(serviceId)) || null) : null;
      // Asegurar salida con los nombres solicitados
      return {
        businessId: Number(data.businessId ?? businessId),
        idappointment: Number(data.idappointment ?? Number(d.id)),
        staffdates: String(data.staffdates ?? data.date ?? ""),
        staffAppoinments: Number(data.staffAppoinments ?? data.staffId ?? 0),
        staffAppointmentsHour: String(data.staffAppointmentsHour ?? data.horario ?? ""),
        serviceType: String(data.serviceType ?? ""),
        serviceDuration: data.serviceDuration ?? null,
        state: data.state ?? "pendiente",
        staffNombre: staffInfo.nombre,
        staffApellido: staffInfo.apellido,
        service: svcInfo,
      };
    });
    return results;
  } catch (error) {
    console.error("Firestore error obteniendo citas por negocio:", error);
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
      if (!date && data.day !== undefined && data.month !== undefined && data.year !== undefined) {
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

const allowedDays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
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
      if ((breakStart && !isValidTime(breakStart)) || (breakUntil && !isValidTime(breakUntil))) {
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
        if (bsH < sh || (bsH === sh && bsM < sm) || beH > eh || (beH === eh && beM > em)) {
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
    if (!payload.days || typeof payload.days !== "object") throw new Error("days requerido");
    const holidays = Boolean(payload.holidays);
    const daysObj = normalizeDays(payload.days);
    const userQuery = await db.collection("user-business").where("id", "==", bizIdNum).get();
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

export const updateBusinessSchedule = async (businessId, scheduleId, payload) => {
  try {
    const bizIdNum = Number(businessId);
    if (!bizIdNum) throw new Error("businessId requerido");
    const sid = String(scheduleId);
    const ref = db.collection("schedules").doc(sid);
    const snap = await ref.get();
    if (!snap.exists) throw new Error("Schedule not found");
    const data = snap.data();
    if (Number(data.businessId) !== bizIdNum) throw new Error("Schedule no pertenece al negocio");
    const patch = {};
    if (payload.days !== undefined) {
      if (!payload.days || typeof payload.days !== "object") throw new Error("days requerido");
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
    if (Number(data.businessId) !== bizIdNum) throw new Error("Schedule no pertenece al negocio");
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
    const snap = await db.collection("schedules").where("businessId", "==", bizIdNum).get();
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
    if (Number(sdata.businessId) !== bizIdNum) throw new Error("Staff no pertenece al negocio");
    if (!payload.days || typeof payload.days !== "object") throw new Error("days requerido");
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

export const updateStaffSchedule = async (businessId, staffId, scheduleId, payload) => {
  try {
    const bizIdNum = Number(businessId);
    const stid = String(staffId);
    const sid = String(scheduleId);
    if (!bizIdNum || !stid) throw new Error("businessId y staffId requeridos");
    const ref = db.collection("staff-schedules").doc(sid);
    const snap = await ref.get();
    if (!snap.exists) throw new Error("Schedule not found");
    const data = snap.data();
    if (Number(data.businessId) !== bizIdNum || String(data.staffId) !== stid) throw new Error("Schedule no pertenece al staff o negocio");
    const patch = {};
    if (payload.days !== undefined) {
      if (!payload.days || typeof payload.days !== "object") throw new Error("days requerido");
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
    if (Number(data.businessId) !== bizIdNum || String(data.staffId) !== stid) throw new Error("Schedule no pertenece al staff o negocio");
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
    const snap = await db.collection("staff-schedules").where("staffId", "==", stid).get();
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
    const staffSnap = await db.collection("staff").where("businessId", "==", id).get();
    const batch = db.batch();
    staffSnap.docs.forEach((d) => batch.delete(d.ref));

    // Borrar citas del negocio
    const appointmentsSnap = await db.collection("appointments").where("businessId", "==", id).get();
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
    const doc = await db.collection("user-business").doc(String(businessId)).get();
    if (!doc.exists) {
      throw new Error("Business not found");
    }
    const data = doc.data();
    // Return commonly used fields
    return {
      id: data.id ?? Number(doc.id),
      nombre: data.nombre ?? '',
      correo: data.correo ?? '',
      numero: data.numero ?? '',
      avatar: data.avatar ?? null,
      banner: data.banner ?? null,
      name: data.name ?? '',
      description: data.description ?? '',
      isInitialSetupComplete: !!data.isInitialSetupComplete,
    };
  } catch (error) {
    console.error("Firestore error obteniendo negocio por id:", error);
    throw new Error(error.message);
  }
};

export const getAllUsers = async () => {
  try {
    const snapshot = await db.collection("users").orderBy("createdAt", "desc").get();
    const users = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: data.id ?? doc.id,
        nombre: data.nombre ?? '',
        numero: data.numero ?? '',
        status: data.status ?? 'pending_verification',
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

export const createService = async (businessId, name, type, duration, price) => {
  try {
    const bizIdNum = Number(businessId);
    if (!Number.isFinite(bizIdNum)) {
      throw new Error("businessId inválido");
    }
    const bq = await db.collection("user-business").where("id", "==", bizIdNum).get();
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
    const newId = await getNextId("serviceId");
    const ref = db.collection("services").doc(String(newId));
    const doc = {
      id: newId,
      businessId: bizIdNum,
      name: String(name),
      type: String(type),
      duration: durNum,
      price: priceNum,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    await ref.set(doc);
    return doc;
  } catch (error) {
    console.error("Firestore error creando servicio:", error);
    throw new Error(error.message);
  }
};

export const updateService = async (businessId, serviceId, updateData) => {
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
    const patch = {};
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
    patch.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    await ref.update(patch);
    const updated = await ref.get();
    return updated.data();
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

export const getServicesByBusiness = async (businessId) => {
  try {
    const bizIdNum = Number(businessId);
    const snap = await db.collection("services").where("businessId", "==", bizIdNum).get();
    return snap.docs.map((d) => {
      const s = d.data();
      return {
        id: s.id ?? Number(d.id),
        businessId: bizIdNum,
        name: s.name ?? "",
        type: s.type ?? "",
        duration: s.duration ?? null,
        price: s.price ?? null,
      };
    });
  } catch (error) {
    console.error("Firestore error listando servicios:", error);
    throw new Error(error.message);
  }
};
