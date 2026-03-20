import { uploadImageToFirebase } from "../services/firebaseService.js";
import { updateUserAvatar } from "../services/firestoreService.js";
export const uploadImage = async (req, res) => {
    try {
        console.log('➡️ [upload] request received', {
            method: req.method,
            url: req.originalUrl,
            contentType: req.headers['content-type'],
            hasFile: !!req.file,
            file: req.file ? { name: req.file.originalname, size: req.file.size, type: req.file.mimetype } : null,
            bodyKeys: Object.keys(req.body || {}),
        });
        if (!req.file) {
            return res.status(400).json({ error: "No se ha enviado ningún archivo" });
        }
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ error: "userId es requerido" });
        }
        const imageUrl = await uploadImageToFirebase(req.file, userId);
        await updateUserAvatar(userId, imageUrl);
        res.status(200).json({ url: imageUrl, message: "Imagen subida y avatar actualizado" });
    }
    catch (error) {
        console.error("Error subiendo imagen:", error);
        const msg = String(error?.message || '');
        if (msg.includes('No document to update') || msg.includes('NOT_FOUND')) {
            return res.status(404).json({ error: "Usuario no encontrado", details: msg });
        }
        return res.status(500).json({ error: "Error subiendo imagen", details: msg });
    }
};
//# sourceMappingURL=uploadController.js.map