// Firebase Configuration
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCSJwQo56etpdDXPgoYfSgM6DoqKRlai-0",
  authDomain: "capston-44fda.firebaseapp.com",
  projectId: "capston-44fda",
  storageBucket: "capston-44fda.firebasestorage.app",
  messagingSenderId: "1097273700890",
  appId: "1:1097273700890:web:be44a778ba269404dcd7a3",
  measurementId: "G-G003PWE10H",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Export auth, storage, and analytics
export const auth = getAuth(app);
export const storage = getStorage(app);
export { analytics };
export default app;
