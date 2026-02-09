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

export const createAppointment = async ({ businessId, staffId, serviceType, date, horario, calificacion }) => {
  try {
    if (!businessId || !staffId || !serviceType || !date || !horario) {
      throw new Error("Campos requeridos: businessId, staffId, serviceType, date, horario");
    }

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
      serviceType: String(serviceType),
    };

    await appointmentRef.set(appointment);

    // Push summary to user-business appointments array
    const summary = {
      id: newId,
      staffId: String(staffId),
      serviceType: String(serviceType),
      date: String(date),
      horario: String(horario),
      calificacion: typeof calificacion === 'number' ? calificacion : null,
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

export const getAppointmentsByBusiness = async (businessId) => {
  try {
    const querySnap = await db.collection("appointments").where("businessId", "==", Number(businessId)).get();
    const staffSnap = await db.collection("staff").where("businessId", "==", Number(businessId)).get();
    const staffMap = new Map();
    staffSnap.docs.forEach(doc => {
      const data = doc.data();
      staffMap.set(String(doc.id), { nombre: data.nombre || '', apellido: data.apellido || '' });
    });

    const results = querySnap.docs.map(d => {
      const data = d.data();
      const staffId = String(data.staffAppoinments ?? data.staffId ?? "");
      const staffInfo = staffMap.get(staffId) || { nombre: '', apellido: '' };
      // Asegurar salida con los nombres solicitados
      return {
        businessId: Number(data.businessId ?? businessId),
        idappointment: Number(data.idappointment ?? Number(d.id)),
        staffdates: String(data.staffdates ?? data.date ?? ""),
        staffAppoinments: Number(data.staffAppoinments ?? data.staffId ?? 0),
        staffAppointmentsHour: String(data.staffAppointmentsHour ?? data.horario ?? ""),
        serviceType: String(data.serviceType ?? ""),
        staffNombre: staffInfo.nombre,
        staffApellido: staffInfo.apellido,
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
