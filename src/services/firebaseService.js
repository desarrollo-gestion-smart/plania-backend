import admin from "firebase-admin";
import { getStorage } from "firebase-admin/storage";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

dotenv.config();

const serviceAccountPath = path.resolve("./firebase-service-account.json"); // tu clave descargada

let bucket;
try {
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
  console.log("Firebase service account loaded successfully. Project ID:", serviceAccount.project_id);

  if (admin.apps.length === 0) {
    const bucketName = process.env.FIREBASE_STORAGE_BUCKET || `${serviceAccount.project_id}.appspot.com`;
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: bucketName,
    });
    console.log("🔥 Firebase initialized. Storage bucket:", bucketName);
  }

  // Inicializar la referencia al bucket explícitamente usando env o fallback
  const bucketNameForGet = process.env.FIREBASE_STORAGE_BUCKET || `${serviceAccount.project_id}.appspot.com`;
  bucket = getStorage().bucket(bucketNameForGet);
} catch (error) {
  console.error("Error loading Firebase service account:", error.message);
  throw error;
}

export const uploadImageToFirebase = async (file, userId = null) => {
  const prefix = userId ? `business/${userId}_` : `business/`;
  const fileName = `${prefix}${Date.now()}_${file.originalname}`;
  const fileUpload = bucket.file(fileName);

  await fileUpload.save(file.buffer, {
    metadata: { contentType: file.mimetype },
  });

  // Hacer el archivo público
  await fileUpload.makePublic();

  // Devolver la URL pública
  return `https://storage.googleapis.com/${bucket.name}/${fileName}`;
};

// Añadir soporte para subir imágenes desde base64
export const uploadBase64ToFirebase = async (base64, userId = null) => {
  try {
    let mime = "image/jpeg";
    let data = base64;
    const match = /^data:(.+?);base64,(.+)$/.exec(base64);
    if (match) {
      mime = match[1];
      data = match[2];
    }

    const buffer = Buffer.from(data, "base64");
    const ext = (mime.split("/")[1] || "jpg").split(";")[0];

    const prefix = userId ? `business/${userId}_` : `business/`;
    const fileName = `${prefix}${Date.now()}_base64.${ext}`;
    const fileUpload = bucket.file(fileName);

    await fileUpload.save(buffer, {
      metadata: { contentType: mime },
    });

    await fileUpload.makePublic();
    return `https://storage.googleapis.com/${bucket.name}/${fileName}`;
  } catch (error) {
    console.error("Error uploading base64 to Firebase:", error);
    throw new Error(`Error uploading base64 image: ${error.message}`);
  }
};

// Añadir soporte para subir imágenes desde una URL pública
export const uploadFromUrlToFirebase = async (url, userId = null) => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image from URL: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mime = response.headers.get("content-type") || "image/jpeg";

    let name = url.split("/").pop() || "image";
    if (!name.includes(".")) {
      const ext = (mime.split("/")[1] || "jpg").split(";")[0];
      name = `${name}.${ext}`;
    }

    const prefix = userId ? `business/${userId}_` : `business/`;
    const fileName = `${prefix}${Date.now()}_${name}`;
    const fileUpload = bucket.file(fileName);

    await fileUpload.save(buffer, {
      metadata: { contentType: mime },
    });

    await fileUpload.makePublic();
    return `https://storage.googleapis.com/${bucket.name}/${fileName}`;
  } catch (error) {
    console.error("Error uploading from URL to Firebase:", error);
    throw new Error(`Error uploading image from URL: ${error.message}`);
  }
};
