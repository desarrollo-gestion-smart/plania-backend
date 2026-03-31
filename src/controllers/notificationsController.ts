import admin from "firebase-admin";

const db = admin.firestore();

export const savePushToken = async (req, res) => {
  try {
    const { userId } = req.params;
    const { pushToken } = req.body;

    if (!pushToken) {
      return res.status(400).json({ error: "pushToken es requerido" });
    }

    await db.collection("users").doc(userId).set({ pushToken }, { merge: true });

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Error guardando push token:", error);
    return res.status(500).json({ error: "Error guardando push token" });
  }
};

export const saveBusinessPushToken = async (req, res) => {
  try {
    const { businessId } = req.params;
    const { pushToken } = req.body;

    if (!pushToken) {
      return res.status(400).json({ error: "pushToken es requerido" });
    }

    await db.collection("businesses").doc(businessId).set({ pushToken }, { merge: true });

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Error guardando push token del negocio:", error);
    return res.status(500).json({ error: "Error guardando push token" });
  }
};

export const sendAppointmentNotification = async (req, res) => {
  try {
    const { recipientId, message, businessName } = req.body;

    if (!recipientId || !message || !businessName) {
      return res.status(400).json({ error: "Faltan campos requeridos: recipientId, message, businessName" });
    }

    const doc = await db.collection("users").doc(String(recipientId)).get();

    const pushToken = doc.exists ? doc.data()?.pushToken : null;

    if (!pushToken) {
      return res.status(200).json({ success: false, reason: "no token" });
    }

    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: pushToken,
        title: businessName,
        body: message,
        data: { recipientId },
        sound: "default",
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Error de Expo Push API:", response.status, text);
      return res.status(500).json({ error: "Error enviando notificación" });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error enviando notificación de cita:", error);
    return res.status(500).json({ error: "Error enviando notificación de cita" });
  }
};

export const sendChatNotification = async (req, res) => {
  try {
    const { recipientId, recipientType, senderName, message, chatId } = req.body;

    if (!recipientId || !recipientType || !senderName || !message || !chatId) {
      return res.status(400).json({ error: "Faltan campos requeridos" });
    }

    const collection = recipientType === "business" ? "businesses" : "users";
    const doc = await db.collection(collection).doc(String(recipientId)).get();

    const pushToken = doc.exists ? doc.data()?.pushToken : null;

    if (!pushToken) {
      return res.status(200).json({ ok: false, reason: "no token" });
    }

    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: pushToken,
        title: senderName,
        body: message,
        data: { chatId, recipientType },
        sound: "default",
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Error de Expo Push API:", response.status, text);
      return res.status(500).json({ error: "Error enviando notificación" });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Error enviando notificación de chat:", error);
    return res.status(500).json({ error: "Error enviando notificación de chat" });
  }
};
