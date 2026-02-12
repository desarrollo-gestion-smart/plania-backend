import admin from 'firebase-admin';
import { readFileSync } from 'fs';
export const initFirebase = () => {
    if (admin.apps.length === 0) {
        const serviceAccount = JSON.parse(readFileSync('./firebase-service-account.json', 'utf8'));
        const bucketName = process.env.FIREBASE_STORAGE_BUCKET || `${serviceAccount.project_id}.appspot.com`;
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            storageBucket: bucketName,
        });
        // Ignorar valores undefined en escrituras de Firestore
        admin.firestore().settings({ ignoreUndefinedProperties: true });
        console.log('🔥 Firebase inicializado', { bucket: bucketName });
    }
};
//# sourceMappingURL=firebase.js.map