// Firebase Configuration
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyB1X_C6BJZaIi6EKw9kPuzUXSd_RC4P3Jg",
  authDomain: "finalyearproject-ad6e9.firebaseapp.com",
  projectId: "finalyearproject-ad6e9",
  storageBucket: "finalyearproject-ad6e9.firebasestorage.app",
  messagingSenderId: "920459289067",
  appId: "1:920459289067:web:79be2d94878112023d39ae",
  measurementId: "G-MDK6D139VY",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Export auth, storage, and analytics
export const auth = getAuth(app);
export const storage = getStorage(app);
export { analytics };
export default app;
