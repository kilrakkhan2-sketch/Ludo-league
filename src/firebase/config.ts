// IMPORTANT: REPLACE WITH YOUR FIREBASE CONFIG
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

export const firebaseConfig = {
  apiKey: "AIzaSyAHRqi6FiM0jjMIqX0j7Jwj91s0JLyAKak",
  authDomain: "studio-4431476254-c1156.firebaseapp.com",
  projectId: "studio-4431476254-c1156",
  storageBucket: "studio-4431476254-c1156.firebasestorage.app",
  messagingSenderId: "23513776021",
  appId: "1:23513776021:web:3e5b6870112641c0fac09c"
};

const app = initializeApp(firebaseConfig);

// Initialize App Check
const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('YOUR_RECAPTCHA_SITE_KEY'),
  isTokenAutoRefreshEnabled: true
});

export const db = getFirestore(app);
