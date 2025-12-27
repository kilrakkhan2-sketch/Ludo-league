import admin from 'firebase-admin';

if (!admin.apps.length) {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON_STRING) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON_STRING);
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
      });

    } catch (e: any) {
        console.error("Firebase admin initialization error from string parsing", e.stack);
    }
  } else {
      console.log("Firebase admin initialization skipped - no service account string");
  }
} 

export default admin;
