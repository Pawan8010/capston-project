// Firebase initialisation.
// Config comes from frontend/.env (VITE_* vars) so the same build can point at
// a different Firebase project without editing source.
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const missing = ["apiKey", "authDomain", "projectId", "appId"].filter(
  (key) => !firebaseConfig[key]
);

if (missing.length) {
  console.error(
    `Firebase config is incomplete (missing: ${missing.join(", ")}).\n` +
      "Copy frontend/.env.example to frontend/.env and fill in your project values, " +
      "then restart the dev server."
  );
}

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const storage = getStorage(app);

// Analytics needs a measurementId and a supported browser context. It throws in
// plain HTTP / SSR / some privacy modes, so it is loaded lazily and never blocks
// auth from initialising.
export let analytics = null;
if (firebaseConfig.measurementId && typeof window !== "undefined") {
  import("firebase/analytics")
    .then(({ getAnalytics, isSupported }) =>
      isSupported().then((ok) => {
        if (ok) analytics = getAnalytics(app);
      })
    )
    .catch(() => {
      /* analytics is optional - ignore */
    });
}

export default app;
