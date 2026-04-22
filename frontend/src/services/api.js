// API Service - Backend communication layer
import axios from "axios";
import { getIdToken } from "./auth";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

// Request interceptor: attach Firebase ID token to every request
api.interceptors.request.use(async (config) => {
  const token = await getIdToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle global errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

/**
 * Upload an image and get breed prediction
 */
export const predictBreed = async (imageFile) => {
  const formData = new FormData();
  formData.append("file", imageFile);
  const response = await api.post("/predict/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

/**
 * Send a base64 image frame for real-time prediction
 * @param {string} imageB64 - base64 data URI (data:image/jpeg;base64,...)
 */
export const realtimePredict = async (imageB64) => {
  const response = await api.post("/realtime-predict/", { image_b64: imageB64 });
  return response.data;
};

/**
 * Send a voice/text query to the AI assistant
 * @param {{ text, language, breed, confidence }} payload
 */
export const voiceQuery = async (payload) => {
  const response = await api.post("/voice-query/", payload);
  return response.data;
};

/**
 * Fetch prediction history for the current user
 */
export const getPredictionHistory = async () => {
  const response = await api.get("/history/");
  return response.data;
};

/**
 * Get a single prediction record by ID
 */
export const getPredictionById = async (id) => {
  const response = await api.get(`/history/${id}`);
  return response.data;
};

/**
 * Sync user data with the backend after login
 */
export const syncUser = async (user) => {
  const response = await api.post("/auth/sync", {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
  });
  return response.data;
};

/**
 * Delete a prediction record from history
 */
export const deletePrediction = async (id) => {
  await api.delete(`/history/${id}`);
};

/**
 * Fetch admin dashboard statistics (includes breed distribution + daily counts)
 */
export const getAdminStats = async () => {
  const response = await api.get("/admin/stats");
  return response.data;
};

/**
 * Fetch all users list (admin-only)
 */
export const getAdminUsers = async () => {
  const response = await api.get("/admin/users");
  return response.data;
};

export default api;

