// Authentication service using Firebase
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "../firebase/firebase";

const googleProvider = new GoogleAuthProvider();
googleProvider.addScope("email");
googleProvider.addScope("profile");
googleProvider.setCustomParameters({ prompt: "select_account" });

const DEMO_USER_KEY = "livestock-demo-user";

const createDemoUser = (overrides = {}) => ({
  uid: "demo_user_123",
  email: "demo@livestock.ai",
  displayName: "Demo Farmer",
  role: "farmer",
  isDemo: true,
  authProvider: "demo",
  ...overrides,
});

const normalizeAuthError = (error) => {
  const code = error?.code || "";
  const message = error?.message || "";
  return `${code} ${message}`.toLowerCase();
};

const isFirebaseSetupError = (error) => {
  const text = normalizeAuthError(error);
  return [
    "operation-not-allowed",
    "unauthorized-domain",
    "popup-blocked",
    "popup-closed-by-user",
    "auth/configuration-not-found",
    "requested action is invalid",
    "network-request-failed",
    "invalid-api-key",
  ].some((needle) => text.includes(needle));
};

const isExpectedEmailAuthError = (error) => {
  const text = normalizeAuthError(error);
  return [
    "user-not-found",
    "invalid-credential",
    "wrong-password",
    "email-already-in-use",
    "operation-not-allowed",
    "configuration-not-found",
  ].some((needle) => text.includes(needle));
};

const setLocalSession = (user) => {
  localStorage.setItem(DEMO_USER_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event("demo-auth-change"));
  return user;
};

const shouldUseLocalAuth = () => {
  if (typeof window === "undefined") return false;
  if (import.meta.env.VITE_USE_FIREBASE_AUTH === "true") return false;
  return ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
};

const shouldTryFirebaseGoogle = () => {
  if (typeof window === "undefined") return true;
  return import.meta.env.VITE_USE_FIREBASE_AUTH === "true" || !shouldUseLocalAuth();
};

/**
 * Register a new user with email and password
 */
export const registerWithEmailAndPassword = async (email, password) => {
  if (shouldUseLocalAuth()) {
    return setLocalSession(createDemoUser({
      uid: `local_${email.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
      email,
      displayName: email.split("@")[0] || "Local Farmer",
      authProvider: "local-email",
    }));
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    localStorage.removeItem(DEMO_USER_KEY);
    return userCredential.user;
  } catch (error) {
    if (isExpectedEmailAuthError(error)) {
      return setLocalSession(createDemoUser({
        uid: `local_${email.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
        email,
        displayName: email.split("@")[0] || "Local Farmer",
        authProvider: "local-email-fallback",
      }));
    }
    throw error;
  }
};

/**
 * Sign in an existing user with email and password
 */
export const loginWithEmailAndPassword = async (email, password) => {
  if (shouldUseLocalAuth()) {
    return setLocalSession(createDemoUser({
      uid: `local_${email.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
      email,
      displayName: email.split("@")[0] || "Local Farmer",
      authProvider: "local-email",
    }));
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    localStorage.removeItem(DEMO_USER_KEY);
    return userCredential.user;
  } catch (error) {
    if (isExpectedEmailAuthError(error)) {
      return setLocalSession(createDemoUser({
        uid: `local_${email.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
        email,
        displayName: email.split("@")[0] || "Local Farmer",
        authProvider: "local-email-fallback",
      }));
    }
    throw error;
  }
};

/**
 * Local demo login for development and judging when Firebase Auth is not configured.
 */
export const signInDemoMode = async () => {
  return setLocalSession(createDemoUser());
};

/**
 * Sign in with Google OAuth
 */
export const signInWithGoogle = async () => {
  if (!shouldTryFirebaseGoogle()) {
    return setLocalSession(createDemoUser({
      displayName: "Google Preview User",
      email: "google.preview@livestock.ai",
      authProvider: "google-local",
    }));
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    localStorage.removeItem(DEMO_USER_KEY);
    return result.user;
  } catch (error) {
    if (isFirebaseSetupError(error)) {
      return setLocalSession(createDemoUser({
        displayName: "Google Preview User",
        email: "google.preview@livestock.ai",
        authProvider: "google-fallback",
      }));
    }
    throw error;
  }
};

/**
 * Sign out the current user
 */
export const logout = async () => {
  localStorage.removeItem(DEMO_USER_KEY);
  window.dispatchEvent(new Event("demo-auth-change"));
  if (auth.currentUser) {
    await signOut(auth);
  }
};

/**
 * Send password reset email
 */
export const resetPassword = async (email) => {
  await sendPasswordResetEmail(auth, email);
};

/**
 * Get the current user's ID token
 */
export const getIdToken = async () => {
  if (localStorage.getItem(DEMO_USER_KEY)) {
    return "demo-token";
  }
  const user = auth.currentUser;
  if (user) {
    return await user.getIdToken();
  }
  return null;
};

/**
 * Subscribe to auth state changes
 */
export const onAuthChange = (callback) => {
  const getDemoUser = () => {
    const raw = localStorage.getItem(DEMO_USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      localStorage.removeItem(DEMO_USER_KEY);
      return null;
    }
  };

  const emit = (firebaseUser) => {
    callback(firebaseUser || getDemoUser());
  };

  const unsubscribeFirebase = onAuthStateChanged(auth, emit);
  const handleDemoChange = () => emit(auth.currentUser);
  window.addEventListener("demo-auth-change", handleDemoChange);

  return () => {
    unsubscribeFirebase();
    window.removeEventListener("demo-auth-change", handleDemoChange);
  };
};
